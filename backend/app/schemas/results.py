from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.geo import GeoLevel


class CandidateResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    candidate_code: str
    full_name: str
    party_name: str
    votes: int
    vote_pct: float | None


class ResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ubigeo: str
    geo_name: str
    level: GeoLevel
    actas_total: int | None
    actas_processed: int | None
    actas_pct: float | None
    registered_voters: int | None
    votes_cast: int | None
    valid_votes: int | None
    null_votes: int | None
    blank_votes: int | None
    turnout_pct: float | None
    null_pct: float | None
    blank_pct: float | None
    winning_margin_pct: float | None
    leading_candidate_code: str | None
    scraped_at: datetime | None
    candidates: list[CandidateResultOut] = []


class ResultListOut(BaseModel):
    election_code: str
    election_name: str
    level: GeoLevel
    total: int
    items: list[ResultOut]


class ElectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    election_code: str
    name: str
    election_type: str
    round: int
    election_date: date


class GeoUnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ubigeo: str
    name: str
    level: GeoLevel
    parent_ubigeo: str | None


class GeoChildrenOut(BaseModel):
    ubigeo: str
    name: str
    level: GeoLevel
    children: list[GeoUnitOut]
