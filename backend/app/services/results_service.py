"""
Service layer for electoral results queries.
All DB access goes through here; routers only call these functions.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.election import Election
from app.models.geo import GeoLevel, GeoUnit
from app.models.result import CandidateResult, Result
from app.schemas.results import (
    CandidateResultOut,
    ElectionOut,
    GeoChildrenOut,
    GeoUnitOut,
    ResultListOut,
    ResultOut,
)


async def list_elections(db: AsyncSession) -> list[ElectionOut]:
    rows = await db.execute(select(Election).order_by(Election.election_date))
    return [ElectionOut.model_validate(e) for e in rows.scalars()]


async def get_election_by_code(db: AsyncSession, election_code: str) -> Election | None:
    result = await db.execute(
        select(Election).where(Election.election_code == election_code)
    )
    return result.scalar_one_or_none()


async def get_results_by_level(
    db: AsyncSession,
    election_code: str,
    level: GeoLevel,
) -> ResultListOut | None:
    election = await get_election_by_code(db, election_code)
    if not election:
        return None

    rows = await db.execute(
        select(Result, GeoUnit)
        .join(GeoUnit, Result.ubigeo == GeoUnit.ubigeo)
        .where(Result.election_id == election.id, Result.level == level)
        .options(selectinload(Result.candidate_results).selectinload(CandidateResult.candidate))
        .order_by(GeoUnit.name)
    )
    pairs = rows.all()

    items = [_build_result_out(result, geo) for result, geo in pairs]
    return ResultListOut(
        election_code=election.election_code,
        election_name=election.name,
        level=level,
        total=len(items),
        items=items,
    )


async def get_result_by_ubigeo(
    db: AsyncSession,
    election_code: str,
    ubigeo: str,
) -> ResultOut | None:
    election = await get_election_by_code(db, election_code)
    if not election:
        return None

    row = await db.execute(
        select(Result, GeoUnit)
        .join(GeoUnit, Result.ubigeo == GeoUnit.ubigeo)
        .where(Result.election_id == election.id, Result.ubigeo == ubigeo)
        .options(selectinload(Result.candidate_results).selectinload(CandidateResult.candidate))
    )
    pair = row.first()
    if not pair:
        return None

    return _build_result_out(pair[0], pair[1])


async def get_geo_children(db: AsyncSession, ubigeo: str) -> GeoChildrenOut | None:
    parent = await db.execute(
        select(GeoUnit).where(GeoUnit.ubigeo == ubigeo)
    )
    parent_unit = parent.scalar_one_or_none()
    if not parent_unit:
        return None

    children_rows = await db.execute(
        select(GeoUnit)
        .where(GeoUnit.parent_ubigeo == ubigeo)
        .order_by(GeoUnit.name)
    )
    children = [GeoUnitOut.model_validate(c) for c in children_rows.scalars()]
    return GeoChildrenOut(
        ubigeo=parent_unit.ubigeo,
        name=parent_unit.name,
        level=parent_unit.level,
        children=children,
    )


async def list_geo_by_level(db: AsyncSession, level: GeoLevel) -> list[GeoUnitOut]:
    rows = await db.execute(
        select(GeoUnit).where(GeoUnit.level == level).order_by(GeoUnit.name)
    )
    return [GeoUnitOut.model_validate(g) for g in rows.scalars()]


def _build_result_out(result: Result, geo: GeoUnit) -> ResultOut:
    candidates = sorted(
        [
            CandidateResultOut(
                candidate_code=cr.candidate.candidate_code,
                full_name=cr.candidate.full_name,
                party_name=cr.candidate.party_name,
                votes=cr.votes,
                vote_pct=cr.vote_pct,
            )
            for cr in result.candidate_results
        ],
        key=lambda c: c.votes,
        reverse=True,
    )
    return ResultOut(
        ubigeo=result.ubigeo,
        geo_name=geo.name,
        level=result.level,
        actas_total=result.actas_total,
        actas_processed=result.actas_processed,
        actas_pct=result.actas_pct,
        registered_voters=result.registered_voters,
        votes_cast=result.votes_cast,
        valid_votes=result.valid_votes,
        null_votes=result.null_votes,
        blank_votes=result.blank_votes,
        turnout_pct=result.turnout_pct,
        null_pct=result.null_pct,
        blank_pct=result.blank_pct,
        winning_margin_pct=result.winning_margin_pct,
        leading_candidate_code=result.leading_candidate_code,
        scraped_at=result.scraped_at,
        candidates=candidates,
    )
