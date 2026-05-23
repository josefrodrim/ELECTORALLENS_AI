import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.result import Result


class GeoLevel(enum.StrEnum):
    national = "national"
    department = "department"
    province = "province"
    district = "district"


class GeoUnit(Base, TimestampMixin):
    """
    Geographic unit tied to Peru's UBIGEO coding system.
    UBIGEO is a 6-digit code: DD PP DD (department-province-district).
    National level uses ubigeo='000000'.
    """
    __tablename__ = "geo_units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ubigeo: Mapped[str] = mapped_column(String(6), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    level: Mapped[GeoLevel] = mapped_column(Enum(GeoLevel), nullable=False, index=True)
    parent_ubigeo: Mapped[str | None] = mapped_column(
        String(6), ForeignKey("geo_units.ubigeo"), nullable=True, index=True
    )

    parent: Mapped["GeoUnit | None"] = relationship(
        "GeoUnit", remote_side="GeoUnit.ubigeo", foreign_keys=[parent_ubigeo]
    )
    children: Mapped[list["GeoUnit"]] = relationship(
        "GeoUnit", back_populates="parent", foreign_keys=[parent_ubigeo]
    )
    results: Mapped[list["Result"]] = relationship(back_populates="geo_unit")
