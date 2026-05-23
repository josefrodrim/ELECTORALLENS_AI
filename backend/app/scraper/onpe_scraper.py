"""
Incremental ONPE scraper.

Usage:
    python -m app.scraper.onpe_scraper --election GP2021-P1 --level national
    python -m app.scraper.onpe_scraper --election GP2021-P1 --level department
    python -m app.scraper.onpe_scraper --election GP2021-P1  # all levels

Incremental behaviour:
    Tracks the last processed ubigeo in scraper_runs. On re-run, skips
    ubigeos already present in the results table for that election.
"""
import argparse
import asyncio
from datetime import UTC, datetime

import structlog
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import AsyncSessionLocal
from app.models import (
    Election,
    GeoUnit,
    Result,
    ScraperRun,
    ScraperStatus,
)
from app.scraper.normalizer import ResultPayload, normalize
from app.scraper.onpe_client import ONPEClient

log = structlog.get_logger(__name__)

# UBIGEO lists for each level
# Department codes (DD0000)
DEPARTMENT_UBIGEOS = [
    "010000", "020000", "030000", "040000", "050000",
    "060000", "070000", "080000", "090000", "100000",
    "110000", "120000", "130000", "140000", "150000",
    "160000", "170000", "180000", "190000", "200000",
    "210000", "220000", "230000", "240000", "250000",
]

LEVELS_ORDER = ["national", "department", "province", "district"]


async def get_election(session, election_code: str) -> Election | None:
    result = await session.execute(
        select(Election).where(Election.election_code == election_code)
    )
    return result.scalar_one_or_none()


async def get_processed_ubigeos(session, election_id: int) -> set[str]:
    rows = await session.execute(
        select(Result.ubigeo).where(Result.election_id == election_id)
    )
    return {r[0] for r in rows.fetchall()}


async def get_geo_ubigeos(session, level: str) -> list[str]:
    rows = await session.execute(
        select(GeoUnit.ubigeo).where(GeoUnit.level == level)
    )
    return [r[0] for r in rows.fetchall()]


async def upsert_result(
    session,
    election_id: int,
    payload: ResultPayload,
    raw_data: dict,
) -> None:
    stmt = pg_insert(Result).values(
        election_id=election_id,
        ubigeo=payload.ubigeo,
        level=payload.level,
        actas_total=payload.actas_total,
        actas_processed=payload.actas_processed,
        actas_pct=payload.actas_pct,
        registered_voters=payload.registered_voters,
        votes_cast=payload.votes_cast,
        valid_votes=payload.valid_votes,
        null_votes=payload.null_votes,
        blank_votes=payload.blank_votes,
        turnout_pct=payload.turnout_pct,
        null_pct=payload.null_pct,
        blank_pct=payload.blank_pct,
        winning_margin_pct=payload.winning_margin_pct,
        leading_candidate_code=payload.leading_candidate_code,
        raw_data=raw_data,
        scraped_at=datetime.now(UTC),
    ).on_conflict_do_update(
        index_elements=["election_id", "ubigeo"],
        set_={
            "actas_total": payload.actas_total,
            "actas_processed": payload.actas_processed,
            "actas_pct": payload.actas_pct,
            "votes_cast": payload.votes_cast,
            "valid_votes": payload.valid_votes,
            "null_votes": payload.null_votes,
            "blank_votes": payload.blank_votes,
            "turnout_pct": payload.turnout_pct,
            "null_pct": payload.null_pct,
            "blank_pct": payload.blank_pct,
            "winning_margin_pct": payload.winning_margin_pct,
            "leading_candidate_code": payload.leading_candidate_code,
            "raw_data": raw_data,
            "scraped_at": datetime.now(UTC),
        },
    )
    await session.execute(stmt)


async def scrape_level(
    session,
    client: ONPEClient,
    election: Election,
    level: str,
    scraper_run: ScraperRun,
    already_processed: set[str],
) -> int:
    ubigeos = await get_geo_ubigeos(session, level)
    if not ubigeos:
        log.warning("No geo_units found for level", level=level)
        return 0

    upserted = 0
    for ubigeo in ubigeos:
        if ubigeo in already_processed:
            log.debug("Skipping already-processed ubigeo", ubigeo=ubigeo)
            continue

        raw = await client.fetch_by_ubigeo(ubigeo, level)
        if not raw:
            log.warning("No data returned", ubigeo=ubigeo, level=level)
            continue

        await client.save_raw(raw, ubigeo)

        payload = normalize(raw, ubigeo, level, election.election_code)
        if not payload:
            log.warning("Normalization returned None", ubigeo=ubigeo)
            continue

        await upsert_result(session, election.id, payload, raw)
        scraper_run.last_ubigeo_processed = ubigeo
        scraper_run.records_upserted += 1
        upserted += 1
        await session.flush()

    return upserted


async def run_scraper(election_code: str, levels: list[str] | None = None) -> None:
    levels = levels or LEVELS_ORDER
    log.info("Starting scraper", election_code=election_code, levels=levels)

    async with AsyncSessionLocal() as session:
        election = await get_election(session, election_code)
        if not election:
            log.error("Election not found in DB", election_code=election_code)
            return

        scraper_run = ScraperRun(election_id=election.id)
        session.add(scraper_run)
        await session.flush()

        already_processed = await get_processed_ubigeos(session, election.id)
        log.info("Resuming from checkpoint", already_processed=len(already_processed))

        try:
            async with ONPEClient(election_code) as client:
                if "national" in levels:
                    raw = await client.fetch_national()
                    if raw:
                        await client.save_raw(raw, "000000")
                        payload = normalize(raw, "000000", "national", election_code)
                        if payload:
                            await upsert_result(session, election.id, payload, raw)
                            scraper_run.records_upserted += 1

                for level in [lv for lv in levels if lv != "national"]:
                    upserted = await scrape_level(
                        session, client, election, level, scraper_run, already_processed
                    )
                    log.info("Level complete", level=level, upserted=upserted)

            scraper_run.status = ScraperStatus.completed
        except Exception as exc:
            scraper_run.status = ScraperStatus.failed
            scraper_run.error_message = str(exc)
            log.exception("Scraper failed", error=exc)
            raise
        finally:
            scraper_run.completed_at = datetime.now(UTC)
            await session.commit()

    log.info("Scraper finished", total_upserted=scraper_run.records_upserted)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ONPE electoral results scraper")
    parser.add_argument("--election", required=True, help="Election code, e.g. GP2021-P1")
    parser.add_argument(
        "--level",
        choices=["national", "department", "province", "district"],
        help="Single level to scrape (default: all)",
    )
    args = parser.parse_args()
    levels = [args.level] if args.level else None
    asyncio.run(run_scraper(args.election, levels))
