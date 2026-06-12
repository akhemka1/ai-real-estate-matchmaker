import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import auth, credentials

from app.core.config import settings


class FirebaseNotConfiguredError(RuntimeError):
    pass


class FirebaseAuthService:
    def __init__(self) -> None:
        self._app = self._initialize_app()

    def is_configured(self) -> bool:
        return self._app is not None

    def verify_id_token(self, id_token: str) -> dict[str, Any]:
        if self._app is None:
            raise FirebaseNotConfiguredError("Firebase Admin credentials are not configured")
        # check_revoked=True rejects tokens for disabled/revoked Firebase users.
        return auth.verify_id_token(id_token, app=self._app, check_revoked=True)

    def _initialize_app(self):
        if firebase_admin._apps:
            return firebase_admin.get_app()

        credential = self._load_credential()
        if credential is None:
            return None

        options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None
        return firebase_admin.initialize_app(credential, options=options)

    def _load_credential(self):
        if settings.firebase_credentials_json:
            payload = json.loads(settings.firebase_credentials_json)
            return credentials.Certificate(payload)

        if settings.firebase_service_account_path:
            path = Path(settings.firebase_service_account_path)
            if path.exists():
                return credentials.Certificate(str(path))

        return None


@lru_cache
def get_firebase_auth_service() -> FirebaseAuthService:
    return FirebaseAuthService()
