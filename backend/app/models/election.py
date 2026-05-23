import enum
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.result import CandidateResult, Result
    from app.models.scraper import ScraperRun


class ElectionType(enum.StrEnum):
    presidential = "presidential"
    congressional = "congressional"
    regional = "regional"
    municipal = "municipal"
    referendum = "referendum"


class Election(Base, TimestampMixin):
    __tablename__ = "elections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    election_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    election_type: Mapped[ElectionType] = mapped_column(Enum(ElectionType), nullable=False)
    round: Mapped[int] = mapped_column(Integer, default=1)
    election_date: Mapped[date] = mapped_column(Date, nullable=False)

    candidates: Mapped[list["Candidate"]] = relationship(back_populates="election")
    results: Mapped[list["Result"]] = relationship(back_populates="election")
    scraper_runs: Mapped[list["ScraperRun"]] = relationship(back_populates="election")


class Candidate(Base, TimestampMixin):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    election_id: Mapped[int] = mapped_column(ForeignKey("elections.id"), nullable=False, index=True)
    candidate_code: Mapped[str] = mapped_column(String(20), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    party_name: Mapped[str] = mapped_column(String(200), nullable=False)
    party_code: Mapped[str] = mapped_column(String(20), nullable=True)
    ballot_position: Mapped[int] = mapped_column(Integer, nullable=True)

    election: Mapped["Election"] = relationship(back_populates="candidates")
    vote_results: Mapped[list["CandidateResult"]] = relationship(back_populates="candidate")
