import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.election import Election


class ScraperStatus(enum.StrEnum):
    running = "running"
    completed = "completed"
    failed = "failed"
    partial = "partial"


class ScraperRun(Base):
    """Tracks each incremental scraper execution for auditability and resumability."""
    __tablename__ = "scraper_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    election_id: Mapped[int] = mapped_column(ForeignKey("elections.id"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[ScraperStatus] = mapped_column(
        Enum(ScraperStatus), default=ScraperStatus.running, nullable=False
    )
    records_fetched: Mapped[int] = mapped_column(Integer, default=0)
    records_upserted: Mapped[int] = mapped_column(Integer, default=0)
    last_ubigeo_processed: Mapped[str | None] = mapped_column(String(6), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    election: Mapped["Election"] = relationship(back_populates="scraper_runs")
