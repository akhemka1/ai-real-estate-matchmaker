from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import OrgRole, User
from app.schemas.user import MemberInvite, UserCreate, UserUpdate


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email.lower()))

    def get_by_firebase_uid(self, firebase_uid: str) -> User | None:
        return self.db.scalar(select(User).where(User.firebase_uid == firebase_uid))

    def get_by_supabase_uid(self, supabase_uid: str) -> User | None:
        return self.db.scalar(select(User).where(User.supabase_uid == supabase_uid))

    def list_for_org(self, organization_id: str) -> list[User]:
        return list(
            self.db.scalars(
                select(User)
                .where(User.organization_id == organization_id)
                .order_by(User.created_at.asc())
            ).all()
        )

    def count_for_org(self, organization_id: str) -> int:
        return (
            self.db.scalar(
                select(func.count()).select_from(User).where(User.organization_id == organization_id)
            )
            or 0
        )

    def buyers_for_org(self, organization_id: str, limit: int = 1000) -> list[User]:
        return list(
            self.db.scalars(
                select(User)
                .where(
                    User.organization_id == organization_id,
                    User.role.in_(["buyer", "renter"]),
                    User.is_active.is_(True),
                )
                .limit(limit)
            ).all()
        )

    def create(
        self,
        payload: UserCreate | MemberInvite,
        *,
        organization_id: str | None,
        org_role: OrgRole = OrgRole.member,
        is_superuser: bool = False,
    ) -> User:
        user = User(
            organization_id=organization_id,
            email=payload.email.lower(),
            hashed_password=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            role=payload.role,
            org_role=getattr(payload, "org_role", None) or org_role,
            is_superuser=is_superuser,
            auth_provider="local",
            phone=payload.phone,
            avatar_url=payload.avatar_url,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_from_firebase(
        self,
        *,
        firebase_uid: str,
        email: str,
        first_name: str,
        last_name: str,
        organization_id: str | None,
        role: str = "buyer",
        org_role: OrgRole = OrgRole.member,
        avatar_url: str | None = None,
    ) -> User:
        user = User(
            organization_id=organization_id,
            email=email.lower(),
            firebase_uid=firebase_uid,
            hashed_password=hash_password(f"firebase:{firebase_uid}"),
            first_name=first_name,
            last_name=last_name,
            role=role,
            org_role=org_role,
            auth_provider="firebase",
            avatar_url=avatar_url,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def attach_firebase_uid(self, user: User, firebase_uid: str) -> User:
        user.firebase_uid = firebase_uid
        self.db.commit()
        self.db.refresh(user)
        return user

    def attach_supabase_uid(self, user: User, supabase_uid: str) -> User:
        user.supabase_uid = supabase_uid
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_from_supabase(
        self,
        *,
        supabase_uid: str,
        email: str,
        first_name: str,
        last_name: str,
        organization_id: str | None,
        role: str = "buyer",
        org_role: OrgRole = OrgRole.member,
        avatar_url: str | None = None,
    ) -> User:
        user = User(
            organization_id=organization_id,
            email=email.lower(),
            supabase_uid=supabase_uid,
            hashed_password=hash_password(f"supabase:{supabase_uid}"),
            first_name=first_name,
            last_name=last_name,
            role=role,
            org_role=org_role,
            auth_provider="supabase",
            avatar_url=avatar_url,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, payload: UserUpdate) -> User:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def touch_login(self, user: User) -> None:
        user.last_login_at = datetime.now(UTC)
        self.db.commit()

    def authenticate(self, email: str, password: str) -> User | None:
        user = self.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user
