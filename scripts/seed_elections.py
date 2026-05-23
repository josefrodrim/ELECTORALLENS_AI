"""
Seed elections and candidates tables for EG2011, EG2016, GP2021, EG2026.

Run after seed_geo.py:
    python scripts/seed_elections.py
"""
import sys, os
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.db.session import SyncSessionLocal
from app.models.election import Election, Candidate, ElectionType

# ── EG 2011 ──────────────────────────────────────────────────────────────────

EG2011_P1_CANDIDATES = [
    ("F1", "HUMALA TASSO, OLLANTA MOISES",      "GANA PERU",                  "GP",  1),
    ("F2", "FUJIMORI HIGUCHI, KEIKO SOFIA",      "FUERZA 2011",                "F2",  2),
    ("F3", "KUCZYNSKI GODARD, PEDRO PABLO",      "ALIANZA POR EL GRAN CAMBIO", "AGC", 3),
    ("F4", "TOLEDO MANRIQUE, ALEJANDRO CELESTINO","PERU POSIBLE",              "PP",  4),
    ("F5", "CASTAÑEDA LOSSIO, LUIS ALBERTO",     "SOLIDARIDAD NACIONAL",       "SN",  5),
    ("F6", "OTROS CANDIDATOS",                   "VARIOS",                     "OT",  6),
]

EG2011_P2_CANDIDATES = [
    ("F1", "HUMALA TASSO, OLLANTA MOISES",  "GANA PERU",   "GP", 1),
    ("F2", "FUJIMORI HIGUCHI, KEIKO SOFIA", "FUERZA 2011", "F2", 2),
]

# ── EG 2016 ──────────────────────────────────────────────────────────────────

EG2016_P1_CANDIDATES = [
    ("F1", "FUJIMORI HIGUCHI, KEIKO SOFIA",  "FUERZA POPULAR",        "FP",  1),
    ("F2", "KUCZYNSKI GODARD, PEDRO PABLO",  "PERUANOS POR EL KAMBIO","PPK", 2),
    ("F3", "MENDOZA FRISCH, VERONIKA",        "FRENTE AMPLIO",         "FA",  3),
    ("F4", "BARNECHEA GARCIA, ALFREDO",       "ACCION POPULAR",        "AP",  4),
    ("F5", "GARCIA PEREZ, ALAN GABRIEL",      "PARTIDO APRISTA",       "APRA",5),
    ("F6", "OTROS CANDIDATOS",                "VARIOS",                "OT",  6),
]

EG2016_P2_CANDIDATES = [
    ("F1", "KUCZYNSKI GODARD, PEDRO PABLO", "PERUANOS POR EL KAMBIO", "PPK", 1),
    ("F2", "FUJIMORI HIGUCHI, KEIKO SOFIA", "FUERZA POPULAR",         "FP",  2),
]

# ── GP 2021 ──────────────────────────────────────────────────────────────────

GP2021_P1_CANDIDATES = [
    ("F1", "CASTILLO TERRONES, PEDRO JOSE",    "PERU LIBRE",               "PL",   1),
    ("F2", "FUJIMORI HIGUCHI, KEIKO SOFIA",    "FUERZA POPULAR",           "FP",   2),
    ("F3", "LOPEZ ALIAGA, RAFAEL SANTOS",      "RENOVACION POPULAR",       "RP",   3),
    ("F4", "FORSYTH MEJIA, GEORGE ANTONIO",    "AVANCEMOS",                "AV",   4),
    ("F5", "HERESI CHICOMA, JULIO SANTOS",     "PARTIDO MORADO",           "PM",   5),
    ("F6", "URRESTI ELERA, DANIEL BELIZARIO",  "PODEMOS PERU",             "PP",   6),
    ("F7", "DE SOTO POLAR, HERNANDO",          "AVANZA PAIS",              "AP",   7),
    ("F8", "ACUNA PERALTA, CESAR HUMBERTO",    "ALIANZA PARA EL PROGRESO", "APP",  8),
    ("F9", "SAGASTI HOCHHAUSLER, FRANCISCO",   "PARTIDO MORADO",           "PM",   9),
    ("F10","BARNECHEA GARCIA, ALFREDO",        "ACCION POPULAR",           "AC",  10),
    ("F11","GUTIERREZ GANOZA, CIRO ALFREDO",   "UNION POR EL PERU",        "UP",  11),
    ("F12","CERRON ROJAS, VLADIMIR",           "JUNTOS POR EL PERU",       "JP",  12),
]

GP2021_P2_CANDIDATES = [
    ("F1", "CASTILLO TERRONES, PEDRO JOSE", "PERU LIBRE",     "PL", 1),
    ("F2", "FUJIMORI HIGUCHI, KEIKO SOFIA", "FUERZA POPULAR", "FP", 2),
]

# ── EG 2026 ──────────────────────────────────────────────────────────────────

EG2026_P1_CANDIDATES = [
    ("F1", "FUJIMORI HIGUCHI, KEIKO SOFIA",            "FUERZA POPULAR",      "FP",  1),
    ("F2", "SANCHEZ PALOMINO, ROBERTO ANDRES AVELINO", "JUNTOS POR EL PERU",  "JP",  2),
    ("F3", "LOPEZ ALIAGA, RAFAEL",                     "RENOVACION POPULAR",  "RP",  3),
    ("F4", "NIETO MONTESINOS, JORGE MARIO",            "BUEN GOBIERNO",       "BG",  4),
    ("F5", "BELMONT CASSINELLI, RICARDO CARLOS",       "CIVICO OBRAS",        "CO",  5),
    ("F6", "ALVAREZ LOAYZA, CARLOS ENRIQUE",           "PAIS PARA TODOS",     "PPT", 6),
    ("F7", "LOPEZ CHAU, PABLO DAVID",                  "AHORA NACION",        "AN",  7),
    ("F8", "OTROS CANDIDATOS",                         "VARIOS",              "OT",  8),
]

EG2026_P2_CANDIDATES = [
    ("F1", "FUJIMORI HIGUCHI, KEIKO SOFIA",            "FUERZA POPULAR",     "FP", 1),
    ("F2", "SANCHEZ PALOMINO, ROBERTO ANDRES AVELINO", "JUNTOS POR EL PERU", "JP", 2),
]

# ── Election registry ─────────────────────────────────────────────────────────

ELECTIONS = [
    {
        "election_code": "EG2011-P1",
        "name": "Elecciones Generales 2011 — Primera Vuelta",
        "election_type": ElectionType.presidential,
        "round": 1,
        "election_date": date(2011, 4, 10),
        "candidates": EG2011_P1_CANDIDATES,
    },
    {
        "election_code": "EG2011-P2",
        "name": "Elecciones Generales 2011 — Segunda Vuelta",
        "election_type": ElectionType.presidential,
        "round": 2,
        "election_date": date(2011, 6, 5),
        "candidates": EG2011_P2_CANDIDATES,
    },
    {
        "election_code": "EG2016-P1",
        "name": "Elecciones Generales 2016 — Primera Vuelta",
        "election_type": ElectionType.presidential,
        "round": 1,
        "election_date": date(2016, 4, 10),
        "candidates": EG2016_P1_CANDIDATES,
    },
    {
        "election_code": "EG2016-P2",
        "name": "Elecciones Generales 2016 — Segunda Vuelta",
        "election_type": ElectionType.presidential,
        "round": 2,
        "election_date": date(2016, 6, 5),
        "candidates": EG2016_P2_CANDIDATES,
    },
    {
        "election_code": "GP2021-P1",
        "name": "Elecciones Generales 2021 — Primera Vuelta",
        "election_type": ElectionType.presidential,
        "round": 1,
        "election_date": date(2021, 4, 11),
        "candidates": GP2021_P1_CANDIDATES,
    },
    {
        "election_code": "GP2021-P2",
        "name": "Elecciones Generales 2021 — Segunda Vuelta",
        "election_type": ElectionType.presidential,
        "round": 2,
        "election_date": date(2021, 6, 6),
        "candidates": GP2021_P2_CANDIDATES,
    },
    {
        "election_code": "EG2026-P1",
        "name": "Elecciones Generales 2026 — Primera Vuelta",
        "election_type": ElectionType.presidential,
        "round": 1,
        "election_date": date(2026, 4, 11),
        "candidates": EG2026_P1_CANDIDATES,
    },
    {
        "election_code": "EG2026-P2",
        "name": "Elecciones Generales 2026 — Segunda Vuelta",
        "election_type": ElectionType.presidential,
        "round": 2,
        "election_date": date(2026, 6, 8),
        "candidates": EG2026_P2_CANDIDATES,
    },
]


def seed(session) -> None:
    for e in ELECTIONS:
        candidates = e["candidates"]
        election_values = {k: v for k, v in e.items() if k != "candidates"}
        stmt = pg_insert(Election).values(**election_values).on_conflict_do_update(
            index_elements=["election_code"],
            set_={"name": election_values["name"]},
        ).returning(Election.id)
        result = session.execute(stmt)
        election_id = result.scalar_one()
        session.flush()

        for code, name, party, party_code, pos in candidates:
            cstmt = pg_insert(Candidate).values(
                election_id=election_id,
                candidate_code=code,
                full_name=name,
                party_name=party,
                party_code=party_code,
                ballot_position=pos,
            ).on_conflict_do_nothing()
            session.execute(cstmt)

        print(f"  {e['election_code']}: {len(candidates)} candidates seeded")

    session.commit()
    print("Elections seed complete.")


if __name__ == "__main__":
    with SyncSessionLocal() as session:
        seed(session)
