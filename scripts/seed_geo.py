"""
Seed geo_units table with Peru's official UBIGEO hierarchy.

UBIGEO structure (INEI standard):
  National  → 000000
  Department → DD0000  (e.g. 150000 = Lima)
  Province   → DDPP00  (e.g. 150100 = Lima Province)
  District   → DDPPDD  (e.g. 150101 = Lima District)

Run:
    python scripts/seed_geo.py

The script is idempotent — safe to re-run.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.db.session import SyncSessionLocal
from app.models.geo import GeoUnit, GeoLevel

# ── National ──────────────────────────────────────────────────────────────────
NATIONAL = [
    ("000000", "PERU", None),
]

# ── Departments (25) ─────────────────────────────────────────────────────────
DEPARTMENTS = [
    ("010000", "AMAZONAS",      "000000"),
    ("020000", "ANCASH",        "000000"),
    ("030000", "APURIMAC",      "000000"),
    ("040000", "AREQUIPA",      "000000"),
    ("050000", "AYACUCHO",      "000000"),
    ("060000", "CAJAMARCA",     "000000"),
    ("070000", "CALLAO",        "000000"),
    ("080000", "CUSCO",         "000000"),
    ("090000", "HUANCAVELICA",  "000000"),
    ("100000", "HUANUCO",       "000000"),
    ("110000", "ICA",           "000000"),
    ("120000", "JUNIN",         "000000"),
    ("130000", "LA LIBERTAD",   "000000"),
    ("140000", "LAMBAYEQUE",    "000000"),
    ("150000", "LIMA",          "000000"),
    ("160000", "LORETO",        "000000"),
    ("170000", "MADRE DE DIOS", "000000"),
    ("180000", "MOQUEGUA",      "000000"),
    ("190000", "PASCO",         "000000"),
    ("200000", "PIURA",         "000000"),
    ("210000", "PUNO",          "000000"),
    ("220000", "SAN MARTIN",    "000000"),
    ("230000", "TACNA",         "000000"),
    ("240000", "TUMBES",        "000000"),
    ("250000", "UCAYALI",       "000000"),
]

# ── Provinces (sample — Lima department complete + major provinces) ───────────
# Full dataset should be loaded from INEI shapefile (data/geo/ubigeo.csv)
# This seed covers enough to test the drill-down for Phase 1.
PROVINCES = [
    # Lima (15)
    ("150100", "LIMA",          "150000"),
    ("150200", "BARRANCA",      "150000"),
    ("150300", "CAJATAMBO",     "150000"),
    ("150400", "CANTA",         "150000"),
    ("150500", "CAÑETE",        "150000"),
    ("150600", "HUARAL",        "150000"),
    ("150700", "HUAROCHIRI",    "150000"),
    ("150800", "HUAURA",        "150000"),
    ("150900", "OYON",          "150000"),
    ("151000", "YAUYOS",        "150000"),
    # Arequipa (04)
    ("040100", "AREQUIPA",      "040000"),
    ("040200", "CAMANA",        "040000"),
    ("040300", "CARAVELI",      "040000"),
    # Cusco (08)
    ("080100", "CUSCO",         "080000"),
    ("080200", "ACOMAYO",       "080000"),
    # Piura (20)
    ("200100", "PIURA",         "200000"),
    ("200200", "AYABACA",       "200000"),
    # Callao (07) — single province
    ("070100", "CALLAO",        "070000"),
    # Cajamarca (06)
    ("060100", "CAJAMARCA",     "060000"),
    # La Libertad (13)
    ("130100", "TRUJILLO",      "130000"),
    # Lambayeque (14)
    ("140100", "CHICLAYO",      "140000"),
    # Puno (21)
    ("210100", "PUNO",          "210000"),
    # Ayacucho (05)
    ("050100", "HUAMANGA",      "050000"),
    # Loreto (16)
    ("160100", "MAYNAS",        "160000"),
    # Junin (12)
    ("120100", "HUANCAYO",      "120000"),
    # Ancash (02)
    ("020100", "HUARAZ",        "020000"),
    # San Martin (22)
    ("220100", "MOYOBAMBA",     "220000"),
    # Ica (11)
    ("110100", "ICA",           "110000"),
]

# ── Districts (Lima Province sample — complete for testing) ──────────────────
DISTRICTS = [
    ("150101", "LIMA",                  "150100"),
    ("150102", "ANCON",                 "150100"),
    ("150103", "ATE",                   "150100"),
    ("150104", "BARRANCO",              "150100"),
    ("150105", "BREÑA",                 "150100"),
    ("150106", "CARABAYLLO",            "150100"),
    ("150107", "CHACLACAYO",            "150100"),
    ("150108", "CHORRILLOS",            "150100"),
    ("150109", "CIENEGUILLA",           "150100"),
    ("150110", "COMAS",                 "150100"),
    ("150111", "EL AGUSTINO",           "150100"),
    ("150112", "INDEPENDENCIA",         "150100"),
    ("150113", "JESUS MARIA",           "150100"),
    ("150114", "LA MOLINA",             "150100"),
    ("150115", "LA VICTORIA",           "150100"),
    ("150116", "LINCE",                 "150100"),
    ("150117", "LOS OLIVOS",            "150100"),
    ("150118", "LURIGANCHO",            "150100"),
    ("150119", "LURIN",                 "150100"),
    ("150120", "MAGDALENA DEL MAR",     "150100"),
    ("150121", "PUEBLO LIBRE",          "150100"),
    ("150122", "MIRAFLORES",            "150100"),
    ("150123", "PACHACAMAC",            "150100"),
    ("150124", "PUCUSANA",              "150100"),
    ("150125", "PUENTE PIEDRA",         "150100"),
    ("150126", "PUNTA HERMOSA",         "150100"),
    ("150127", "PUNTA NEGRA",           "150100"),
    ("150128", "RIMAC",                 "150100"),
    ("150129", "SAN BARTOLO",           "150100"),
    ("150130", "SAN BORJA",             "150100"),
    ("150131", "SAN ISIDRO",            "150100"),
    ("150132", "SAN JUAN DE LURIGANCHO","150100"),
    ("150133", "SAN JUAN DE MIRAFLORES","150100"),
    ("150134", "SAN LUIS",              "150100"),
    ("150135", "SAN MARTIN DE PORRES",  "150100"),
    ("150136", "SAN MIGUEL",            "150100"),
    ("150137", "SANTA ANITA",           "150100"),
    ("150138", "SANTA MARIA DEL MAR",   "150100"),
    ("150139", "SANTA ROSA",            "150100"),
    ("150140", "SANTIAGO DE SURCO",     "150100"),
    ("150141", "SURQUILLO",             "150100"),
    ("150142", "VILLA EL SALVADOR",     "150100"),
    ("150143", "VILLA MARIA DEL TRIUNFO","150100"),
    # Callao districts
    ("070101", "CALLAO",                "070100"),
    ("070102", "BELLAVISTA",            "070100"),
    ("070103", "CARMEN DE LA LEGUA",    "070100"),
    ("070104", "LA PERLA",              "070100"),
    ("070105", "LA PUNTA",              "070100"),
    ("070106", "MI PERU",               "070100"),
    ("070107", "VENTANILLA",            "070100"),
]


def seed(session) -> None:
    def upsert_batch(rows: list[tuple], level: GeoLevel) -> int:
        if not rows:
            return 0
        values = [
            {"ubigeo": r[0], "name": r[1], "level": level, "parent_ubigeo": r[2]}
            for r in rows
        ]
        stmt = pg_insert(GeoUnit).values(values).on_conflict_do_update(
            index_elements=["ubigeo"],
            set_={"name": pg_insert(GeoUnit).excluded.name},
        )
        session.execute(stmt)
        return len(values)

    total = 0
    total += upsert_batch(NATIONAL,    GeoLevel.national)
    total += upsert_batch(DEPARTMENTS, GeoLevel.department)
    total += upsert_batch(PROVINCES,   GeoLevel.province)
    total += upsert_batch(DISTRICTS,   GeoLevel.district)
    session.commit()
    print(f"Seeded {total} geo_units (national={len(NATIONAL)}, departments={len(DEPARTMENTS)}, "
          f"provinces={len(PROVINCES)}, districts={len(DISTRICTS)})")


if __name__ == "__main__":
    with SyncSessionLocal() as session:
        seed(session)
