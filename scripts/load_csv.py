"""
Loads official ONPE election results from CSV into the database.

ONPE publishes downloadable CSV files at:
  https://www.datosabiertos.gob.pe/dataset/resultados-de-elecciones-generales-2021

Expected CSV columns (ONPE standard format):
  UBIGEO, DEPARTAMENTO, PROVINCIA, DISTRITO,
  ELECTORES_HABILES, VOTOS_EMITIDOS, VOTOS_VALIDOS,
  VOTOS_NULOS, VOTOS_BLANCOS, ACTAS_TOTAL, ACTAS_PROCESADAS,
  <CANDIDATE_CODE_1>, <CANDIDATE_CODE_2>, ...

Run:
    python scripts/load_csv.py --file data/raw/GP2021-P2-resultados.csv --election GP2021-P2
"""
import argparse
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import SyncSessionLocal
from app.models.election import Candidate, Election
from app.models.geo import GeoLevel, GeoUnit
from app.models.result import CandidateResult, Result

# Map ONPE CSV column names → our schema fields
COLUMN_MAP = {
    "UBIGEO": "ubigeo",
    "ELECTORES_HABILES": "registered_voters",
    "VOTOS_EMITIDOS": "votes_cast",
    "VOTOS_VALIDOS": "valid_votes",
    "VOTOS_NULOS": "null_votes",
    "VOTOS_BLANCOS": "blank_votes",
    "ACTAS_TOTAL": "actas_total",
    "ACTAS_PROCESADAS": "actas_processed",
}


def detect_candidate_columns(df: pd.DataFrame, candidates: list[Candidate]) -> dict[str, str]:
    """Returns {csv_column_name: candidate_code} for columns that match candidate codes."""
    cand_codes = {c.candidate_code.upper(): c.candidate_code for c in candidates}
    mapping = {}
    for col in df.columns:
        upper = col.upper()
        if upper in cand_codes:
            mapping[col] = cand_codes[upper]
    return mapping


def load(csv_path: str, election_code: str) -> None:
    print(f"Loading {csv_path} → election={election_code}")
    df = pd.read_csv(csv_path, dtype={"UBIGEO": str}, encoding="utf-8")
    df.columns = [c.strip().upper() for c in df.columns]

    # Pad ubigeo to 6 digits
    df["UBIGEO"] = df["UBIGEO"].str.zfill(6)

    with SyncSessionLocal() as session:
        election = session.execute(
            select(Election).where(Election.election_code == election_code)
        ).scalar_one_or_none()
        if not election:
            print(f"Election '{election_code}' not found. Run seed_elections.py first.")
            return

        candidates = session.execute(
            select(Candidate).where(Candidate.election_id == election.id)
        ).scalars().all()
        cand_col_map = detect_candidate_columns(df, candidates)
        cand_by_code = {c.candidate_code: c for c in candidates}

        geo_map: dict[str, GeoUnit] = {
            g.ubigeo: g
            for g in session.execute(select(GeoUnit)).scalars()
        }

        inserted = skipped = 0

        for _, row in df.iterrows():
            ubigeo = row.get("UBIGEO", "")
            geo = geo_map.get(ubigeo)
            if geo is None:
                skipped += 1
                continue

            registered = int(row.get("ELECTORES_HABILES", 0) or 0)
            votes_cast = int(row.get("VOTOS_EMITIDOS", 0) or 0)
            valid_votes = int(row.get("VOTOS_VALIDOS", 0) or 0)
            null_votes = int(row.get("VOTOS_NULOS", 0) or 0)
            blank_votes = int(row.get("VOTOS_BLANCOS", 0) or 0)
            actas_total = int(row.get("ACTAS_TOTAL", 0) or 0)
            actas_processed = int(row.get("ACTAS_PROCESADAS", 0) or 0)

            turnout_pct = round(votes_cast / registered * 100, 4) if registered else None
            null_pct = round(null_votes / votes_cast * 100, 4) if votes_cast else None
            blank_pct = round(blank_votes / votes_cast * 100, 4) if votes_cast else None
            actas_pct = round(actas_processed / actas_total * 100, 4) if actas_total else None

            # Per-candidate votes
            cand_votes = []
            for col, code in cand_col_map.items():
                votes = int(row.get(col, 0) or 0)
                pct = round(votes / valid_votes * 100, 4) if valid_votes else 0.0
                cand_votes.append((code, votes, pct))

            leading = max(cand_votes, key=lambda x: x[1], default=(None, 0, 0))
            sorted_cands = sorted(cand_votes, key=lambda x: x[1], reverse=True)
            margin = None
            if len(sorted_cands) >= 2:
                margin = round(sorted_cands[0][2] - sorted_cands[1][2], 4)

            stmt = pg_insert(Result).values(
                election_id=election.id,
                ubigeo=ubigeo,
                level=geo.level,
                actas_total=actas_total,
                actas_processed=actas_processed,
                actas_pct=actas_pct,
                registered_voters=registered,
                votes_cast=votes_cast,
                valid_votes=valid_votes,
                null_votes=null_votes,
                blank_votes=blank_votes,
                turnout_pct=turnout_pct,
                null_pct=null_pct,
                blank_pct=blank_pct,
                winning_margin_pct=margin,
                leading_candidate_code=leading[0],
                raw_data={"source": "onpe_csv", "csv_file": os.path.basename(csv_path)},
            ).on_conflict_do_update(
                index_elements=["election_id", "ubigeo"],
                set_={
                    "votes_cast": votes_cast, "valid_votes": valid_votes,
                    "null_votes": null_votes, "blank_votes": blank_votes,
                    "turnout_pct": turnout_pct, "null_pct": null_pct,
                    "blank_pct": blank_pct, "winning_margin_pct": margin,
                    "leading_candidate_code": leading[0],
                },
            ).returning(Result.id)
            result_id = session.execute(stmt).scalar_one()

            for code, votes, pct in cand_votes:
                cand = cand_by_code.get(code)
                if not cand:
                    continue
                session.execute(
                    pg_insert(CandidateResult).values(
                        result_id=result_id, candidate_id=cand.id,
                        votes=votes, vote_pct=pct,
                    ).on_conflict_do_update(
                        index_elements=["result_id", "candidate_id"],
                        set_={"votes": votes, "vote_pct": pct},
                    )
                )
            inserted += 1

        session.commit()
        print(f"Done: {inserted} rows inserted/updated, {skipped} skipped (unknown ubigeo).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load ONPE official CSV into DB")
    parser.add_argument("--file", required=True, help="Path to ONPE CSV file")
    parser.add_argument("--election", required=True, help="Election code, e.g. GP2021-P2")
    args = parser.parse_args()
    load(args.file, args.election)
