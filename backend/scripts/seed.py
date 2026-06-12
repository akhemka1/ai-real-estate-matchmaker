"""Seed a demo tenant with users, listings, and engagement signals.

Run: python scripts/seed.py

Creates:
  * a platform superuser  (admin@matchmaker.ai / Password123!)
  * a demo organization "Skyline Realty" on the growth plan
  * an owner/agent, a seller, and two buyers
  * sample listings + favorites/feedback so recommendations have a signal
"""

from app.db.session import SessionLocal, create_db_and_tables
from app.models.engagement import Favorite
from app.models.match import FeedbackValue, RecommendationFeedback
from app.models.organization import OrganizationStatus
from app.models.property import ListingType, Property, PropertyStatus, PropertyType
from app.models.user import OrgRole
from app.repositories.organizations import OrganizationRepository
from app.repositories.users import UserRepository
from app.schemas.user import UserCreate


def main() -> None:
    create_db_and_tables()
    db = SessionLocal()
    try:
        users = UserRepository(db)
        orgs = OrganizationRepository(db)

        # Platform superuser (no org needed).
        if not users.get_by_email("admin@matchmaker.ai"):
            users.create(
                UserCreate(
                    email="admin@matchmaker.ai",
                    password="Password123!",
                    first_name="Platform",
                    last_name="Admin",
                    role="admin",
                ),
                organization_id=None,
                org_role=OrgRole.owner,
                is_superuser=True,
            )

        org = orgs.get_by_slug("skyline-realty") or orgs.create(
            "Skyline Realty",
            plan_code="growth",
            billing_email="billing@skyline.example",
            status=OrganizationStatus.active,
        )

        def ensure(email, first, last, role, org_role=OrgRole.member):
            existing = users.get_by_email(email)
            if existing:
                return existing
            return users.create(
                UserCreate(
                    email=email,
                    password="Password123!",
                    first_name=first,
                    last_name=last,
                    role=role,
                ),
                organization_id=org.id,
                org_role=org_role,
            )

        agent = ensure("agent@example.com", "Jordan", "Lee", "agent", OrgRole.owner)
        seller = ensure("seller@example.com", "Maya", "Patel", "seller", OrgRole.member)
        buyer1 = ensure("buyer@example.com", "Alex", "Rivera", "buyer")
        buyer2 = ensure("buyer2@example.com", "Sam", "Cohen", "buyer")

        if db.query(Property).filter(Property.organization_id == org.id).count() == 0:
            prop1 = Property(
                organization_id=org.id,
                title="Modern Craftsman with Mountain Views",
                description="Open floor plan, chef kitchen, smart home systems, and mountain views.",
                price=875000,
                bedrooms=4,
                bathrooms=3,
                sqft=2850,
                property_type=PropertyType.house,
                listing_type=ListingType.sale,
                status=PropertyStatus.active,
                currency="USD",
                address={
                    "street": "1247 Pine Ridge Dr",
                    "city": "Denver",
                    "state": "CO",
                    "zip_code": "80202",
                    "country": "US",
                    "lat": 39.7392,
                    "lng": -104.9903,
                },
                images=["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
                amenities=["Garage", "Pool", "Smart Home", "Fireplace", "Garden"],
                year_built=2018,
                ai_price_estimate=862000,
                appreciation_forecast={"year1": 4.2, "year3": 12.8, "year5": 22.5, "year10": 48.3, "confidence": 87},
                image_tags=[{"label": "Modern Kitchen", "confidence": 0.94, "category": "room"}],
                agent_id=agent.id,
                seller_id=seller.id,
            )
            prop2 = Property(
                organization_id=org.id,
                title="Downtown Luxury Condo",
                description="Premium condo with floor-to-ceiling windows, rooftop access, and concierge service.",
                price=425000,
                bedrooms=2,
                bathrooms=2,
                sqft=1200,
                property_type=PropertyType.condo,
                listing_type=ListingType.sale,
                status=PropertyStatus.active,
                currency="USD",
                address={
                    "street": "890 Market St #2401",
                    "city": "San Francisco",
                    "state": "CA",
                    "zip_code": "94102",
                    "country": "US",
                    "lat": 37.7749,
                    "lng": -122.4194,
                },
                images=["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
                amenities=["Concierge", "Gym", "Rooftop", "Parking"],
                year_built=2020,
                ai_price_estimate=438000,
                agent_id=agent.id,
                seller_id=seller.id,
            )
            db.add_all([prop1, prop2])
            db.flush()

            # Engagement signals to power collaborative filtering and lead matching.
            db.add_all(
                [
                    Favorite(organization_id=org.id, user_id=buyer1.id, property_id=prop1.id),
                    Favorite(organization_id=org.id, user_id=buyer2.id, property_id=prop1.id),
                    RecommendationFeedback(
                        organization_id=org.id,
                        user_id=buyer1.id,
                        property_id=prop1.id,
                        feedback=FeedbackValue.relevant,
                        score=92,
                    ),
                ]
            )
            db.commit()
            print(f"Seeded organization '{org.name}' ({org.slug}) with 2 listings.")
        else:
            print(f"Organization '{org.name}' already seeded.")

        print("Login: agent@example.com / Password123!  (org owner)")
        print("Superuser: admin@matchmaker.ai / Password123!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
