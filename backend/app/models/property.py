import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PropertyType(str, enum.Enum):
    house = "house"
    condo = "condo"
    apartment = "apartment"
    townhouse = "townhouse"
    land = "land"


class ListingType(str, enum.Enum):
    sale = "sale"
    rent = "rent"


class PropertyStatus(str, enum.Enum):
    active = "active"
    pending = "pending"
    sold = "sold"
    off_market = "off_market"


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(14, 2), index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    bedrooms: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    bathrooms: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    sqft: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    property_type: Mapped[PropertyType] = mapped_column(Enum(PropertyType), index=True, nullable=False)
    listing_type: Mapped[ListingType] = mapped_column(Enum(ListingType), index=True, nullable=False)
    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus), index=True, default=PropertyStatus.active, nullable=False
    )
    address: Mapped[dict] = mapped_column(JSON, nullable=False)
    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    amenities: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    year_built: Mapped[int | None] = mapped_column(Integer)
    lot_size: Mapped[float | None] = mapped_column(Float)
    ai_price_estimate: Mapped[float | None] = mapped_column(Numeric(14, 2))
    appreciation_forecast: Mapped[dict | None] = mapped_column(JSON)
    image_tags: Mapped[list[dict] | None] = mapped_column(JSON)
    agent_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    seller_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    agent = relationship("User", foreign_keys=[agent_id], back_populates="properties")
    seller = relationship("User", foreign_keys=[seller_id])
