"""
Seeds department-level Result and CandidateResult records for historical elections.

Data sources:
  EG2011-P1/P2: ONPE open data (datosabiertos.gob.pe) — Excel by polling station, aggregated
  EG2016-P1/P2: ONPE open data (datosabiertos.gob.pe) — CSV by polling station, aggregated
  EG2026-P1:    ONPE new portal (resultadoelectoral.onpe.gob.pe) mapa-calor API

Run after seed_geo.py and seed_elections.py:
    python scripts/seed_results_historical.py

GP2021 data not included — the ONPE historic portal is inaccessible in this environment.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import SyncSessionLocal
from app.models.election import Candidate, Election
from app.models.geo import GeoLevel
from app.models.result import CandidateResult, Result

# ── Department ubigeo → standard INEI 6-digit code ───────────────────────────
# All codes follow the INEI system (CALLAO=070000, LIMA=150000, etc.)

# ── EG2011-P1 ─────────────────────────────────────────────────────────────────
# F1=Humala(VOTOS_P1), F2=Fujimori(VOTOS_P3), F3=PPK(VOTOS_P6),
# F4=Toledo(VOTOS_P4), F5=Castañeda(VOTOS_P5), F6=Otros(rest)
# Source: 2011_EG2011_Presidencial.xlsx from datosabiertos.gob.pe
EG2011_P1 = [
    # (ubigeo,    F1,       F2,       F3,      F4,       F5,      F6)
    ("010000",  58275,   45738,    5830,   26938,    4607,     746),  # AMAZONAS
    ("020000", 160841,  108375,   56762,  156214,   33609,    4463),  # ANCASH
    ("030000",  76198,   38892,   10054,   17152,    3657,    1968),  # APURIMAC
    ("040000", 348717,   83179,  188867,   63548,   38791,    5375),  # AREQUIPA
    ("050000", 137663,   57462,   12820,   20774,    6017,    2441),  # AYACUCHO
    ("060000", 181247,  195586,   38577,  127781,   26405,    4766),  # CAJAMARCA
    ("070000", 112051,  113670,  148890,   86030,   54735,    5085),  # CALLAO
    ("080000", 346424,   60097,   67027,   44407,   29673,    5738),  # CUSCO
    ("090000",  84191,   28305,    6854,   26553,    3471,    2430),  # HUANCAVELICA
    ("100000", 123278,   59652,   25199,   57072,   11897,    2507),  # HUANUCO
    ("110000", 130689,  116872,   66107,   58795,   47556,    1704),  # ICA
    ("120000", 213959,  149561,   90010,   69449,   31847,    4155),  # JUNIN
    ("130000", 201029,  233152,  117648,  149451,  108012,    7774),  # LA LIBERTAD
    ("140000", 160078,  165048,   53306,   70462,  141073,    2587),  # LAMBAYEQUE
    ("150000",1134353, 1213857, 1434435,  825096,  693106,   34019),  # LIMA
    ("160000",  99744,   71506,   36473,  114841,   14996,    3218),  # LORETO
    ("170000",  26132,    7970,    4859,    9614,    2156,     250),  # MADRE DE DIOS
    ("180000",  46437,   11871,   19830,   12653,    5783,     576),  # MOQUEGUA
    ("190000",  34693,   35148,   14361,   22075,    6804,     876),  # PASCO
    ("200000", 249210,  256116,   91880,  127909,   69481,    4994),  # PIURA
    ("210000", 364235,   90749,   51566,   42442,   23775,    8084),  # PUNO
    ("220000", 111844,  106821,   23747,   49531,   15679,    2327),  # SAN MARTIN
    ("230000", 102307,   18248,   32600,   13044,   11688,     969),  # TACNA
    ("240000",  29500,   37623,    9456,   22961,    5924,     449),  # TUMBES
    ("250000",  70194,   55610,   16047,   28135,    7848,    1453),  # UCAYALI
]

# ── EG2011-P2 ─────────────────────────────────────────────────────────────────
# F1=Humala (VOTOS_P2 in CSV), F2=Fujimori (VOTOS_P1 in CSV)
# Source: 2011_SEP2011_Presidencial.xlsx from datosabiertos.gob.pe
EG2011_P2 = [
    # (ubigeo,    F1(Humala), F2(Fujimori))
    ("010000",  93845,   66244),  # AMAZONAS    → F1
    ("020000", 325261,  232417),  # ANCASH      → F1
    ("030000", 118072,   54540),  # APURIMAC    → F1
    ("040000", 487419,  252103),  # AREQUIPA    → F1
    ("050000", 192715,   74563),  # AYACUCHO    → F1
    ("060000", 332339,  317317),  # CAJAMARCA   → F1 (close)
    ("070000", 227252,  300928),  # CALLAO      → F2
    ("080000", 458048,  136074),  # CUSCO       → F1
    ("090000", 125646,   48319),  # HUANCAVELICA→ F1
    ("100000", 197661,  113797),  # HUANUCO     → F1
    ("110000", 218716,  217893),  # ICA         → F1 (very close)
    ("120000", 328556,  272568),  # JUNIN       → F1
    ("130000", 378404,  494774),  # LA LIBERTAD → F2
    ("140000", 295582,  320275),  # LAMBAYEQUE  → F2
    ("150000",2293241, 3107049),  # LIMA        → F2
    ("160000", 213444,  164113),  # LORETO      → F1
    ("170000",  37007,   18842),  # MADRE DE DIOS→F1
    ("180000",  66580,   33165),  # MOQUEGUA    → F1
    ("190000",  61895,   59413),  # PASCO       → F1 (close)
    ("200000", 417196,  458121),  # PIURA       → F2
    ("210000", 489930,  139029),  # PUNO        → F1
    ("220000", 184557,  169482),  # SAN MARTIN  → F1
    ("230000", 134927,   48747),  # TACNA       → F1
    ("240000",  51465,   60985),  # TUMBES      → F2
    ("250000", 107114,   90338),  # UCAYALI     → F1
]

# ── EG2016-P1 ─────────────────────────────────────────────────────────────────
# F1=Fujimori(VOTOS_P3), F2=PPK(VOTOS_P14), F3=Veronika(VOTOS_P6),
# F4=Barnechea(VOTOS_P7), F5=García(VOTOS_P4), F6=Otros(rest)
# Source: 2016_EG2016_Presidencial.csv from datosabiertos.gob.pe
EG2016_P1 = [
    # (ubigeo,    F1,       F2,      F3,      F4,      F5,      F6)
    ("010000",  62083,   17026,  31681,    8166,    5175,   19029),  # AMAZONAS
    ("020000", 216261,   80069, 109837,   27605,   30859,   42829),  # ANCASH
    ("030000",  50822,    9214,  82443,    8329,    3810,    9432),  # APURIMAC  → F3
    ("040000", 184918,  210224, 197452,   86428,   26603,   63563),  # AREQUIPA  → F2
    ("050000",  82138,   15741, 133899,    7306,    5861,    8773),  # AYACUCHO  → F3
    ("060000", 196086,   52002,  62205,   26239,   15715,  259024),  # CAJAMARCA → F6
    ("070000", 222171,  153850,  61765,   39187,   45823,   26272),  # CALLAO    → F1
    ("080000", 128818,   57386, 276143,   62621,   15657,   51356),  # CUSCO     → F3
    ("090000",  43029,   14110,  79295,    3872,    2765,    6366),  # HUANCAVELICA→F3
    ("100000", 112414,   40000,  86717,   17761,   10852,   20737),  # HUANUCO   → F1
    ("110000", 194463,   69137,  76457,   48776,   31322,   14529),  # ICA       → F1
    ("120000", 248217,  121109, 128257,   27481,   18561,   27769),  # JUNIN     → F1
    ("130000", 432443,  121283,  91024,   59338,  123725,   47119),  # LA LIBERTAD→F1
    ("140000", 313728,   98741,  67615,   46138,   60149,   34232),  # LAMBAYEQUE→F1
    ("150000",2305333, 1692811, 683653,  406137,  354441,  241604),  # LIMA      → F1
    ("160000", 136439,   81826,  51859,   24239,   19134,   17326),  # LORETO    → F1
    ("170000",  26656,    5623,  15050,    3912,    2943,    5935),  # MADRE DE DIOS→F1
    ("180000",  24310,   27853,  31382,    7386,    3659,    5153),  # MOQUEGUA  → F3
    ("190000",  48083,   24523,  22615,    5425,    5280,    4729),  # PASCO     → F1
    ("200000", 456685,  104844, 127952,   46595,   49037,   45253),  # PIURA     → F1
    ("210000", 135239,   50532, 227325,   24140,   11072,  141122),  # PUNO      → F3
    ("220000", 166236,   43550,  72618,   23300,   20188,   17096),  # SAN MARTIN→F1
    ("230000",  40071,   29859,  78500,   18455,    5929,   17629),  # TACNA     → F3
    ("240000",  70029,   13189,  11825,    4933,    4973,    3590),  # TUMBES    → F1
    ("250000", 105050,   29155,  33668,    8814,    7684,   14916),  # UCAYALI   → F1
]

# ── EG2016-P2 ─────────────────────────────────────────────────────────────────
# F1=PPK/Kuczynski (VOTOS_P1 in CSV), F2=Fujimori (VOTOS_P2 in CSV)
# Source: 2016_SEP2016_Presidencial.csv from datosabiertos.gob.pe
EG2016_P2 = [
    # (ubigeo,    F1(PPK),   F2(Keiko))
    ("010000",   78899,    87128),  # AMAZONAS    → F2
    ("020000",  291002,   304623),  # ANCASH      → F2
    ("030000",   95044,    87522),  # APURIMAC    → F1
    ("040000",  567834,   272361),  # AREQUIPA    → F1
    ("050000",  135228,   144102),  # AYACUCHO    → F2
    ("060000",  334694,   333682),  # CAJAMARCA   → F1 (very close)
    ("070000",  304353,   304954),  # CALLAO      → F2 (very close)
    ("080000",  418083,   225247),  # CUSCO       → F1
    ("090000",   96901,    73743),  # HUANCAVELICA→ F1
    ("100000",  165762,   172476),  # HUANUCO     → F2
    ("110000",  230177,   257271),  # ICA         → F2
    ("120000",  321704,   337248),  # JUNIN       → F2
    ("130000",  380850,   598031),  # LA LIBERTAD → F2
    ("140000",  285534,   408420),  # LAMBAYEQUE  → F2
    ("150000", 3128802,  3113703),  # LIMA        → F1 (close)
    ("160000",  218224,   186999),  # LORETO      → F1
    ("170000",   25476,    44755),  # MADRE DE DIOS→F2
    ("180000",   73294,    34587),  # MOQUEGUA    → F1
    ("190000",   64290,    64287),  # PASCO       → F1 (3 vote margin)
    ("200000",  378186,   592309),  # PIURA       → F2
    ("210000",  373206,   217951),  # PUNO        → F1
    ("220000",  180491,   227806),  # SAN MARTIN  → F2
    ("230000",  139164,    63243),  # TACNA       → F1
    ("240000",   36270,    87020),  # TUMBES      → F2
    ("250000",   95213,   144729),  # UCAYALI     → F2
]

# ── EG2026-P1 ─────────────────────────────────────────────────────────────────
# F1=Fujimori, F2=Sánchez (top two candidates; F3-F8 not seeded)
# Source: ONPE new portal mapa-calor API (resultadoelectoral.onpe.gob.pe)
EG2026_P1 = [
    # (ubigeo,    F1(Fujimori), F2(Sánchez))
    ("010000",   28403,    59302),  # AMAZONAS    → F2
    ("020000",   97743,    81477),  # ANCASH      → F1
    ("030000",   13861,    82531),  # APURIMAC    → F2
    ("040000",   64430,    88766),  # AREQUIPA    → F2
    ("050000",   23058,    89314),  # AYACUCHO    → F2
    ("060000",   89279,   268961),  # CAJAMARCA   → F2
    ("070000",  119476,    17377),  # CALLAO      → F1
    ("080000",   42553,   158426),  # CUSCO       → F2
    ("090000",   12238,    75063),  # HUANCAVELICA→ F2
    ("100000",   52987,   102366),  # HUANUCO     → F2
    ("110000",   98052,    37264),  # ICA         → F1
    ("120000",  108631,    78227),  # JUNIN       → F1
    ("130000",  188993,    88291),  # LA LIBERTAD → F1
    ("140000",  176103,    71644),  # LAMBAYEQUE  → F1
    ("150000", 1089534,   199439),  # LIMA        → F1
    ("160000",   96815,    33655),  # LORETO      → F1
    ("170000",   10948,    18948),  # MADRE DE DIOS→F2
    ("180000",    7569,    14719),  # MOQUEGUA    → F2
    ("190000",   21842,    21606),  # PASCO       → F1 (very close)
    ("200000",  246696,   100908),  # PIURA       → F1
    ("210000",   25389,   162460),  # PUNO        → F2
    ("220000",   90655,    93288),  # SAN MARTIN  → F2 (close)
    ("230000",   15125,    26302),  # TACNA       → F2
    ("240000",   37850,     7748),  # TUMBES      → F1
    ("250000",   66994,    29038),  # UCAYALI     → F1
]

# ── Seed logic ─────────────────────────────────────────────────────────────────

ELECTIONS_TO_SEED = {
    "EG2011-P1": {"data": EG2011_P1,  "codes": ["F1","F2","F3","F4","F5","F6"]},
    "EG2011-P2": {"data": EG2011_P2,  "codes": ["F1","F2"]},
    "EG2016-P1": {"data": EG2016_P1,  "codes": ["F1","F2","F3","F4","F5","F6"]},
    "EG2016-P2": {"data": EG2016_P2,  "codes": ["F1","F2"]},
    "EG2026-P1": {"data": EG2026_P1,  "codes": ["F1","F2"]},
}


def _leading(votes: dict) -> tuple[str | None, float | None]:
    """Return (leading_code, winning_margin_pct) from a {code: votes} dict."""
    sorted_v = sorted(votes.items(), key=lambda x: -x[1])
    total = sum(votes.values())
    if len(sorted_v) >= 2 and total > 0:
        margin = round((sorted_v[0][1] - sorted_v[1][1]) / total * 100, 4)
        return sorted_v[0][0], margin
    if sorted_v:
        return sorted_v[0][0], None
    return None, None


def seed(session) -> None:
    for election_code, cfg in ELECTIONS_TO_SEED.items():
        election = session.execute(
            select(Election).where(Election.election_code == election_code)
        ).scalar_one_or_none()
        if not election:
            print(f"  SKIP {election_code}: election not found in DB")
            continue

        # Build {candidate_code: Candidate} map
        cands_rows = session.execute(
            select(Candidate).where(Candidate.election_id == election.id)
        ).scalars().all()
        cands = {c.candidate_code: c for c in cands_rows}

        codes = cfg["codes"]
        seeded = 0
        for row in cfg["data"]:
            ubigeo = row[0]
            vote_counts = {codes[i]: row[i + 1] for i in range(len(codes))}
            total_valid = sum(vote_counts.values())
            leading_code, margin = _leading(vote_counts)

            # Upsert Result
            res_stmt = (
                pg_insert(Result)
                .values(
                    election_id=election.id,
                    ubigeo=ubigeo,
                    level=GeoLevel.department,
                    valid_votes=total_valid,
                    votes_cast=total_valid,
                    leading_candidate_code=leading_code,
                    winning_margin_pct=margin,
                    actas_pct=100.0,
                )
                .on_conflict_do_update(
                    index_elements=["election_id", "ubigeo"],
                    set_={
                        "valid_votes": total_valid,
                        "votes_cast": total_valid,
                        "leading_candidate_code": leading_code,
                        "winning_margin_pct": margin,
                        "actas_pct": 100.0,
                    },
                )
                .returning(Result.id)
            )
            result_id = session.execute(res_stmt).scalar_one()
            session.flush()

            # Upsert CandidateResult for each known candidate
            for code, votes in vote_counts.items():
                cand = cands.get(code)
                if not cand:
                    continue
                vote_pct = round(votes / total_valid * 100, 4) if total_valid > 0 else None
                cr_stmt = (
                    pg_insert(CandidateResult)
                    .values(
                        result_id=result_id,
                        candidate_id=cand.id,
                        votes=votes,
                        vote_pct=vote_pct,
                    )
                    .on_conflict_do_update(
                        index_elements=["result_id", "candidate_id"],
                        set_={"votes": votes, "vote_pct": vote_pct},
                    )
                )
                session.execute(cr_stmt)

            seeded += 1

        session.flush()
        print(f"  {election_code}: {seeded} departments seeded")

    session.commit()
    print("Historical results seed complete.")


if __name__ == "__main__":
    with SyncSessionLocal() as session:
        seed(session)
