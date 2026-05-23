from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.geo import GeoLevel

if TYPE_CHECKING:
    from app.models.election import Candidate, Election
    from app.models.geo import GeoUnit


class Result(Base, TimestampMixin):
    """
    Aggregated electoral result for a geo unit in a given election.
    One row per (election, ubigeo) pair — upserted on each scraper run.
    """
    __tablename__ = "results"
    __table_args__ = (
        Index("ix_results_election_ubigeo", "election_id", "ubigeo", unique=True),
        Index("ix_results_level", "level"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    election_id: Mapped[int] = mapped_column(ForeignKey("elections.id"), nullable=False, index=True)
    ubigeo: Mapped[str] = mapped_column(ForeignKey("geo_units.ubigeo"), nullable=False, index=True)
    level: Mapped[GeoLevel] = mapped_column(nullable=False)

    # Actas (voting records)
    actas_total: Mapped[int] = mapped_column(Integer, nullable=True)
    actas_processed: Mapped[int] = mapped_column(Integer, nullable=True)
    actas_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Voters
    registered_voters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    votes_cast: Mapped[int | None] = mapped_column(Integer, nullable=True)
    valid_votes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    null_votes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blank_votes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Derived participation metrics (computed on insert/update)
    turnout_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    null_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    blank_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Winning margin between top two candidates (computed on insert/update)
    winning_margin_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    leading_candidate_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Raw ONPE JSON snapshot — kept for auditability
    raw_data: Mapped[dict] = mapped_column(JSONB, nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    election: Mapped["Election"] = relationship(back_populates="results")
    geo_unit: Mapped["GeoUnit"] = relationship(back_populates="results")
    candidate_results: Mapped[list["CandidateResult"]] = relationship(back_populates="result")


class CandidateResult(Base):
    """Per-candidate vote breakdown for a given result row."""
    __tablename__ = "candidate_results"
    __table_args__ = (
        Index("ix_candidate_results_result_candidate", "result_id", "candidate_id", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    result_id: Mapped[int] = mapped_column(ForeignKey("results.id"), nullable=False, index=True)
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id"), nullable=False, index=True
    )
    votes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    vote_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    result: Mapped["Result"] = relationship(back_populates="candidate_results")
    candidate: Mapped["Candidate"] = relationship(back_populates="vote_results")
