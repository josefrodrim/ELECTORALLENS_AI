#!/usr/bin/env python3
"""
Build a single public CSV with all Peruvian presidential election results.

Coverage:
  EG 2011 P1 + P2  — district level  — ONPE via datosabiertos.gob.pe
  EG 2016 P1 + P2  — district level  — ONPE via datosabiertos.gob.pe
  EG 2021 P1 + P2  — district level  — jmcastagnetto/2021-elecciones-generales-peru (GitHub)
  EG 2026 P1       — department level — ONPE resultados.eleccionesgenerales2026.pe

Output:
  data/processed/resultados_presidenciales_peru.csv

Schema (long format — one row per district × year × round × candidate):
  ubigeo            : 6-digit INEI/RENIEC code (000000 = nacional, 010000 = dept, 010101 = dist)
  departamento      : department name
  provincia         : province name (empty for dept/national rows)
  distrito          : district name (empty for dept/national rows)
  nivel_geo         : 'distrito' | 'departamento' | 'nacional'
  anio              : 2011 | 2016 | 2021 | 2026
  vuelta            : 'P1' | 'P2'
  fecha             : ISO date of the election
  partido           : official party name
  candidato         : candidate full short name
  ideologia         : 'izquierda' | 'centro-izquierda' | 'centro' | 'centro-derecha' | 'derecha' | ''
  votos             : absolute vote count
  pct_validos       : % of valid votes in that district-round
  electores_habil   : registered voters in district-round
  votos_emitidos    : total ballots cast
  votos_validos     : valid votes
  votos_nulos       : null votes
  votos_blancos     : blank votes
  fuente            : data source URL
"""

from __future__ import annotations

import warnings
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", category=UserWarning)

BASE = Path("data/raw/onpe")
OUT  = Path("data/processed")
OUT.mkdir(parents=True, exist_ok=True)

# ── Ideology map ──────────────────────────────────────────────────────────────

IDEOLOGY: dict[str, str] = {
    # 2011
    "Humala":    "izquierda",
    "Fujimori":  "derecha",
    "PPK":       "centro-derecha",
    "Toledo":    "centro",
    "Castañeda": "centro-derecha",
    # 2016
    "Mendoza":   "izquierda",
    "Barnechea": "centro",
    "García":    "centro",
    # 2021
    "Castillo":      "izquierda",
    "De Soto":       "derecha",
    "López Aliaga":  "derecha",
    "Forsyth":       "centro-derecha",
    "Lescano":       "centro-izquierda",
    "Urresti":       "centro",
    # 2026
    "Sánchez":       "centro-izquierda",
    "Nieto":         "centro",
    "Belmont":       "centro",
    "Álvarez":       "centro-izquierda",
    "López Chau":    "centro",
    "Otros":         "",
}

# ── Candidate column maps (ONPE VOTOS_Px → short name) ───────────────────────

CMAP_2011_P1: dict[str, str | None] = {
    "VOTOS_P1": "Humala",
    "VOTOS_P2": None,
    "VOTOS_P3": "Fujimori",
    "VOTOS_P4": "Toledo",
    "VOTOS_P5": "Castañeda",
    "VOTOS_P6": "PPK",
    "VOTOS_P7": None, "VOTOS_P8": None, "VOTOS_P9": None,
    "VOTOS_P10": None, "VOTOS_P11": None,
}
CMAP_2011_P2: dict[str, str] = {"VOTOS_P1": "Fujimori", "VOTOS_P2": "Humala"}

CMAP_2016_P1: dict[str, str | None] = {
    "VOTOS_P1": None, "VOTOS_P2": None,
    "VOTOS_P3": "Fujimori",
    "VOTOS_P4": "García",
    "VOTOS_P5": None,
    "VOTOS_P6": "Mendoza",
    "VOTOS_P7": "Barnechea",
    "VOTOS_P8": None, "VOTOS_P9": None, "VOTOS_P10": None,
    "VOTOS_P11": None, "VOTOS_P12": None, "VOTOS_P13": None,
    "VOTOS_P14": "PPK",
}
CMAP_2016_P2: dict[str, str] = {"VOTOS_P1": "PPK", "VOTOS_P2": "Fujimori"}

PARTY_MAP_2021_P1: dict[str, str] = {
    "PARTIDO POLITICO NACIONAL PERU LIBRE":          "Castillo",
    "FUERZA POPULAR":                                "Fujimori",
    "RENOVACION POPULAR":                            "López Aliaga",
    "AVANZA PAIS - PARTIDO DE INTEGRACION SOCIAL":   "De Soto",
    "ACCION POPULAR":                                "Lescano",
    "PODEMOS PERU":                                  "Urresti",
    "VICTORIA NACIONAL":                             "Forsyth",
    "JUNTOS POR EL PERU":                            "Mendoza",
    "ALIANZA PARA EL PROGRESO":                      "Acuña",
    "PARTIDO MORADO":                                "Guzmán",
}
PARTY_MAP_2021_P2: dict[str, str] = {
    "PARTIDO POLITICO NACIONAL PERU LIBRE": "Castillo",
    "FUERZA POPULAR":                       "Fujimori",
}

PARTY_FULL: dict[str, str] = {
    "Humala":      "GANA PERU",
    "Fujimori":    "FUERZA POPULAR",
    "PPK":         "PERUANOS POR EL KAMBIO",
    "Toledo":      "PERU POSIBLE",
    "Castañeda":   "ALIANZA SOLIDARIDAD NACIONAL",
    "Mendoza":     "EL FRENTE AMPLIO POR JUSTICIA, VIDA Y LIBERTAD",
    "Barnechea":   "ACCION POPULAR",
    "García":      "ALIANZA POPULAR",
    "Castillo":    "PARTIDO POLITICO NACIONAL PERU LIBRE",
    "De Soto":     "AVANZA PAIS",
    "López Aliaga":"RENOVACION POPULAR",
    "Forsyth":     "VICTORIA NACIONAL",
    "Lescano":     "ACCION POPULAR",
    "Urresti":     "PODEMOS PERU",
    "Sánchez":     "JUNTOS POR EL PERU",
    "Nieto":       "BUEN GOBIERNO",
    "Belmont":     "CIVICO OBRAS",
    "Álvarez":     "PAIS PARA TODOS",
    "López Chau":  "AHORA NACION",
    "Acuña":       "ALIANZA PARA EL PROGRESO",
    "Guzmán":      "PARTIDO MORADO",
    "Otros":       "OTROS",
}

VALID_STATUSES = {"ACTA ELECTORAL NORMAL", "ACTA ELECTORAL RESUELTA", "CONTABILIZADA"}


# ── Loaders ───────────────────────────────────────────────────────────────────

def _filter(df: pd.DataFrame) -> pd.DataFrame:
    col = df["DESCRIP_ESTADO_ACTA"]
    if col.isna().all():
        return df.copy()
    return df[col.astype(str).str.strip().isin(VALID_STATUSES)].copy()


def load_onpe_xlsx(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name=0, dtype={"UBIGEO": str})
    df.columns = [c.strip().upper() for c in df.columns]
    df["UBIGEO"] = df["UBIGEO"].astype(str).str.zfill(6)
    return _filter(df)


def load_onpe_csv(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, sep=";", dtype={"UBIGEO": str}, low_memory=False, encoding="latin-1")
    df.columns = [c.strip().upper() for c in df.columns]
    df["UBIGEO"] = df["UBIGEO"].astype(str).str.zfill(6)
    return _filter(df)


# ── ONPE mesa → district long format ─────────────────────────────────────────

def onpe_to_long(
    df: pd.DataFrame,
    cand_map: dict[str, str | None],
    anio: int,
    vuelta: str,
    fecha: str,
    fuente: str,
) -> pd.DataFrame:
    """
    Aggregate mesa-level ONPE data to district, then melt to long format.
    Minor candidates (None in cand_map) are summed into 'Otros'.
    """
    named   = {k: v for k, v in cand_map.items() if v is not None}
    otros_c = [k for k, v in cand_map.items() if v is None]

    vote_cols = list(cand_map.keys())
    # Handle column name variant: 2011 P2 uses NELEC_HABIL (no underscore)
    elec_habil_col = "N_ELEC_HABIL" if "N_ELEC_HABIL" in df.columns else "NELEC_HABIL"
    totals_needed = [elec_habil_col, "VOTOS_VB", "VOTOS_VN", "VOTOS_VI"]
    geo_cols = ["UBIGEO", "DEPARTAMENTO", "PROVINCIA", "DISTRITO"]

    keep = geo_cols + [c for c in vote_cols + totals_needed if c in df.columns]
    df = df[keep].copy()
    for c in vote_cols + totals_needed:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    dist = df.groupby(geo_cols, as_index=False).sum(numeric_only=True)

    # Compute emitidos and validos
    valid_vote_cols = [c for c in vote_cols if c in dist.columns]
    blank_col  = "VOTOS_VB" if "VOTOS_VB" in dist.columns else None
    null_col   = "VOTOS_VN" if "VOTOS_VN" in dist.columns else None
    impu_col   = "VOTOS_VI" if "VOTOS_VI" in dist.columns else None

    dist["votos_validos"]  = dist[valid_vote_cols].sum(axis=1)
    dist["votos_blancos"]  = dist[blank_col]  if blank_col  else 0
    dist["votos_nulos"]    = dist[null_col]   if null_col   else 0
    dist["votos_impug"]    = dist[impu_col]   if impu_col   else 0
    dist["votos_emitidos"] = dist["votos_validos"] + dist["votos_blancos"] + dist["votos_nulos"] + dist["votos_impug"]
    dist["electores_habil"] = dist[elec_habil_col]

    # Build candidate columns (named + Otros)
    for col, name in named.items():
        if col not in dist.columns:
            dist[col] = 0
    if otros_c:
        dist["_Otros"] = dist[[c for c in otros_c if c in dist.columns]].sum(axis=1)
    else:
        dist["_Otros"] = 0

    rows = []
    for _, row in dist.iterrows():
        base = {
            "ubigeo":         row["UBIGEO"],
            "departamento":   row["DEPARTAMENTO"].strip().title(),
            "provincia":      row["PROVINCIA"].strip().title(),
            "distrito":       row["DISTRITO"].strip().title(),
            "nivel_geo":      "distrito",
            "anio":           anio,
            "vuelta":         vuelta,
            "fecha":          fecha,
            "electores_habil": int(row["electores_habil"]),
            "votos_emitidos":  int(row["votos_emitidos"]),
            "votos_validos":   int(row["votos_validos"]),
            "votos_nulos":     int(row["votos_nulos"]),
            "votos_blancos":   int(row["votos_blancos"]),
            "fuente":          fuente,
        }
        valid = int(row["votos_validos"]) or 1
        for col, cand in named.items():
            if col not in dist.columns:
                continue
            v = int(row[col])
            rows.append({**base, "candidato": cand,
                         "partido": PARTY_FULL.get(cand, ""),
                         "ideologia": IDEOLOGY.get(cand, ""),
                         "votos": v,
                         "pct_validos": round(v / valid * 100, 4)})
        otros_v = int(row["_Otros"])
        if otros_v > 0:
            rows.append({**base, "candidato": "Otros",
                         "partido": "OTROS",
                         "ideologia": "",
                         "votos": otros_v,
                         "pct_validos": round(otros_v / valid * 100, 4)})
    return pd.DataFrame(rows)


# ── 2021 jmcastagnetto → long format ─────────────────────────────────────────

def build_2021_p1() -> pd.DataFrame:
    long = pd.read_csv(BASE / "2021_P1_distrito_jmcast.csv", dtype={"ubigeo": str})
    long["ubigeo"] = long["ubigeo"].str.zfill(6)

    res = pd.read_csv(BASE / "2021_P1_resumen_jmcast.csv", dtype={"ubigeo": str}, thousands=",")
    res["ubigeo"] = res["ubigeo"].str.zfill(6)

    totals = res[["ubigeo", "ELECTORES_HABIL", "TOT_CIUDADANOS_VOTARON"]].rename(columns={
        "ELECTORES_HABIL": "electores_habil",
        "TOT_CIUDADANOS_VOTARON": "votos_emitidos",
    })
    totals["electores_habil"] = pd.to_numeric(totals["electores_habil"], errors="coerce").fillna(0).astype(int)
    totals["votos_emitidos"]  = pd.to_numeric(totals["votos_emitidos"],  errors="coerce").fillna(0).astype(int)

    # Compute votos_validos per district
    valid_by_dist = long.groupby("ubigeo")["total_votos"].sum().reset_index().rename(
        columns={"total_votos": "votos_validos"})

    totals = totals.merge(valid_by_dist, on="ubigeo", how="left")
    totals["votos_nulos"]   = totals["votos_emitidos"] - totals["votos_validos"]
    totals["votos_blancos"] = 0

    geo = long[["ubigeo", "departamento", "provincia", "distrito"]].drop_duplicates("ubigeo")
    geo["departamento"] = geo["departamento"].str.strip().str.title()
    geo["provincia"]    = geo["provincia"].str.strip().str.title()
    geo["distrito"]     = geo["distrito"].str.strip().str.title()

    rows = []
    for _, r in long.iterrows():
        ub  = r["ubigeo"]
        t   = totals[totals["ubigeo"] == ub].iloc[0] if (totals["ubigeo"] == ub).any() else None
        g   = geo[geo["ubigeo"] == ub].iloc[0] if (geo["ubigeo"] == ub).any() else None
        cand = PARTY_MAP_2021_P1.get(r["partido"], "Otros")
        rows.append({
            "ubigeo":          ub,
            "departamento":    g["departamento"] if g is not None else "",
            "provincia":       g["provincia"]    if g is not None else "",
            "distrito":        g["distrito"]     if g is not None else "",
            "nivel_geo":       "distrito",
            "anio":            2021,
            "vuelta":          "P1",
            "fecha":           "2021-04-11",
            "partido":         r["partido"],
            "candidato":       cand,
            "ideologia":       IDEOLOGY.get(cand, ""),
            "votos":           int(r["total_votos"]),
            "pct_validos":     round(float(r["pct_validos"]), 4),
            "electores_habil": int(t["electores_habil"]) if t is not None else 0,
            "votos_emitidos":  int(t["votos_emitidos"])  if t is not None else 0,
            "votos_validos":   int(t["votos_validos"])   if t is not None else 0,
            "votos_nulos":     int(t["votos_nulos"])     if t is not None else 0,
            "votos_blancos":   0,
            "fuente":          "https://github.com/jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe",
        })
    return pd.DataFrame(rows)


def build_2021_p2() -> pd.DataFrame:
    res  = pd.read_csv(BASE / "2021_P2_distrito_jmcast.csv")
    part = pd.read_csv(BASE / "2021_P2_participacion_jmcast.csv")

    def key(df: pd.DataFrame) -> pd.Series:
        return (df["departamento"].str.strip().str.upper() + "|"
                + df["provincia"].str.strip().str.upper() + "|"
                + df["distrito"].str.strip().str.upper())

    res["_key"]  = key(res)
    part["_key"] = key(part)

    part = part[["_key", "ELECTORES_HABIL", "TOT_CIUDADANOS_VOTARON"]].rename(columns={
        "ELECTORES_HABIL": "electores_habil",
        "TOT_CIUDADANOS_VOTARON": "votos_emitidos",
    })

    valid_per_key = res.groupby("_key")["TOTAL_VOTOS"].sum().reset_index().rename(
        columns={"TOTAL_VOTOS": "votos_validos"})

    part = part.merge(valid_per_key, on="_key", how="left")
    part["votos_nulos"]   = (part["votos_emitidos"] - part["votos_validos"]).clip(lower=0)
    part["votos_blancos"] = 0

    rows = []
    for _, r in res.iterrows():
        k    = r["_key"]
        pt   = part[part["_key"] == k].iloc[0] if (part["_key"] == k).any() else None
        cand = PARTY_MAP_2021_P2.get(r["AGRUPACION"], "Otros")
        rows.append({
            "ubigeo":          "",
            "departamento":    r["departamento"].strip().title(),
            "provincia":       r["provincia"].strip().title(),
            "distrito":        r["distrito"].strip().title(),
            "nivel_geo":       "distrito",
            "anio":            2021,
            "vuelta":          "P2",
            "fecha":           "2021-06-06",
            "partido":         r["AGRUPACION"],
            "candidato":       cand,
            "ideologia":       IDEOLOGY.get(cand, ""),
            "votos":           int(r["TOTAL_VOTOS"]),
            "pct_validos":     round(float(r["POR_VALIDOS"]), 4),
            "electores_habil": int(pt["electores_habil"]) if pt is not None else 0,
            "votos_emitidos":  int(pt["votos_emitidos"])  if pt is not None else 0,
            "votos_validos":   int(pt["votos_validos"])   if pt is not None else 0,
            "votos_nulos":     int(pt["votos_nulos"])     if pt is not None else 0,
            "votos_blancos":   0,
            "fuente":          "https://github.com/jmcastagnetto/2021-segunda-vuelta-eleccion-presidencial-peru",
        })
    return pd.DataFrame(rows)


# ── 2026 P1 — district level ──────────────────────────────────────────────────
# Scraped from resultadoelectoral.onpe.gob.pe REST API (100% actas, 2026-04-11)
# ~2% below official national totals because idAmbitoGeografico=1 (PERÚ) excludes
# foreign votes (EXTRANJERO, ~2,543 actas). votos_blancos/nulos from API.

PARTY_MAP_2026: dict[str, str] = {
    "FUERZA POPULAR":          "Fujimori",
    "JUNTOS POR EL PERÚ":      "Sánchez",
    "RENOVACIÓN POPULAR":      "López Aliaga",
    "PARTIDO DEL BUEN GOBIERNO": "Nieto",
    "PARTIDO CÍVICO OBRAS":    "Belmont",
    "PARTIDO PAÍS PARA TODOS": "Álvarez",
    "AHORA NACIÓN - AN":       "López Chau",
}


def build_2026_p1() -> pd.DataFrame:
    src = BASE / "2026_EG2026_P1_distritos_v2.csv"
    raw = pd.read_csv(src, dtype={"ubigeo": str})

    rows = []
    for _, r in raw.iterrows():
        cand = str(r["candidato"])
        rows.append({
            "ubigeo":          str(r["ubigeo"]).zfill(6),
            "departamento":    str(r["departamento"]).strip().title(),
            "provincia":       str(r["provincia"]).strip().title(),
            "distrito":        str(r["distrito"]).strip().title(),
            "nivel_geo":       "distrito",
            "anio":            2026,
            "vuelta":          "P1",
            "fecha":           "2026-04-11",
            "partido":         PARTY_MAP_2026.get(cand, cand),
            "candidato":       cand,
            "ideologia":       IDEOLOGY.get(cand, ""),
            "votos":           int(r["votos"]),
            "pct_validos":     round(float(r["pct_validos"]), 4),
            "electores_habil": int(r["electores_habil"]),
            "votos_emitidos":  int(r["votos_emitidos"]),
            "votos_validos":   int(r["votos_validos"]),
            "votos_nulos":     int(r["votos_nulos"]),
            "votos_blancos":   int(r["votos_blancos"]),
            "fuente":          "https://resultadoelectoral.onpe.gob.pe/",
        })
    return pd.DataFrame(rows)


# ── Main ──────────────────────────────────────────────────────────────────────

ONPE_SOURCE = "https://www.datosabiertos.gob.pe (ONPE datos abiertos)"

def main() -> None:
    parts: list[pd.DataFrame] = []

    # 2011
    print("Processing 2011 P1...")
    raw = load_onpe_xlsx(BASE / "2011_EG2011_P1/2011_EG2011_Presidencial.xlsx")
    parts.append(onpe_to_long(raw, CMAP_2011_P1, 2011, "P1", "2011-04-10", ONPE_SOURCE))

    print("Processing 2011 P2...")
    raw = load_onpe_xlsx(BASE / "2011_SEP2011_P2/2011_SEP2011_Presidencial.xlsx")
    parts.append(onpe_to_long(raw, CMAP_2011_P2, 2011, "P2", "2011-06-05", ONPE_SOURCE))

    # 2016
    print("Processing 2016 P1...")
    raw = load_onpe_csv(BASE / "2016_EG2016_Presidencial_v2.csv")
    parts.append(onpe_to_long(raw, CMAP_2016_P1, 2016, "P1", "2016-04-10", ONPE_SOURCE))

    print("Processing 2016 P2...")
    raw = load_onpe_csv(BASE / "2016_SEP2016_Presidencial.csv")
    parts.append(onpe_to_long(raw, CMAP_2016_P2, 2016, "P2", "2016-06-05", ONPE_SOURCE))

    # 2021
    print("Processing 2021 P1...")
    parts.append(build_2021_p1())

    print("Processing 2021 P2...")
    parts.append(build_2021_p2())

    # 2026
    print("Processing 2026 P1 (national level)...")
    parts.append(build_2026_p1())

    df = pd.concat(parts, ignore_index=True)

    # Normalize ubigeo: pad to 6 digits, use "" for missing (2021 P2 / national rows)
    def fmt_ubigeo(v: object) -> str:
        if pd.isna(v) or v == "" or v == "000000":
            return str(v) if isinstance(v, str) else ""
        try:
            return str(int(float(v))).zfill(6)
        except (ValueError, TypeError):
            return str(v)

    df["ubigeo"] = df["ubigeo"].apply(fmt_ubigeo)

    # Column order
    cols = [
        "ubigeo", "departamento", "provincia", "distrito", "nivel_geo",
        "anio", "vuelta", "fecha",
        "partido", "candidato", "ideologia",
        "votos", "pct_validos",
        "electores_habil", "votos_emitidos", "votos_validos",
        "votos_nulos", "votos_blancos",
        "fuente",
    ]
    df = df[cols]

    out = OUT / "resultados_presidenciales_peru.csv"
    df.to_csv(out, index=False, encoding="utf-8")

    print(f"\n✓ Saved → {out}")
    print(f"  Rows    : {len(df):,}")
    print(f"  Coverage:")
    # Use dept+prov+dist key so empty-ubigeo rows (2021 P2 jmcast) count correctly
    df["_geo_key"] = df["departamento"] + "|" + df["provincia"] + "|" + df["distrito"]
    summary = df.groupby(["anio", "vuelta", "nivel_geo"]).agg(
        distritos=("_geo_key", "nunique"),
        candidatos=("candidato", "nunique"),
        votos_total=("votos", "sum"),
    ).reset_index()
    df.drop(columns=["_geo_key"], inplace=True)
    print(summary.to_string(index=False))


if __name__ == "__main__":
    main()
