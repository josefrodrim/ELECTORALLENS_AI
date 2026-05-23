#!/usr/bin/env python3
"""
Ecological regression (Goodman's method) to estimate P1→P2 vote transfer matrices.

Data source: ONPE official results by polling table (mesa de votación)
Downloaded from: https://www.datosabiertos.gob.pe (ONPE open data)

Method: OLS without intercept, non-negative constraint (Goodman 1953)
  For each district d:
    q_j[d] = Σ_i β_ij × p_i[d] + ε[d]
  where:
    p_i[d] = votes_i_P1[d] / registered_voters_P1[d]
    q_j[d] = votes_j_P2[d] / registered_voters_P1[d]
    β_ij   = estimated proportion of candidate i's P1 voters who voted for finalist j

  β_ij ≥ 0 enforced; Σ_j β_ij ≤ 1 (remainder = abstention/null/blank in P2)

Output: Transfer matrices in TypeScript format ready to replace hardcoded
        estimates in frontend/src/lib/vote-flows.ts
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

BASE = Path("data/raw/onpe")


# ── Candidate column mappings ──────────────────────────────────────────────
# Maps VOTOS_Px → short display name. None = grouped into "Otros".

CANDIDATES_2011_P1: dict[str, str | None] = {
    "VOTOS_P1": "Humala",      # GANA PERU
    "VOTOS_P2": None,          # DESPERTAR NACIONAL (minor)
    "VOTOS_P3": "Fujimori",    # FUERZA 2011
    "VOTOS_P4": "Toledo",      # PERU POSIBLE
    "VOTOS_P5": "Castañeda",   # ALIANZA SOLIDARIDAD NACIONAL
    "VOTOS_P6": "PPK",         # ALIANZA POR EL GRAN CAMBIO
    "VOTOS_P7": None,
    "VOTOS_P8": None,
    "VOTOS_P9": None,
    "VOTOS_P10": None,
    "VOTOS_P11": None,
}
FINALISTS_2011_P2: dict[str, str] = {
    "VOTOS_P1": "Fujimori",    # FUERZA 2011 drew ballot position 1
    "VOTOS_P2": "Humala",      # GANA PERU
}
FINALIST_ORDER_2011 = ["Humala", "Fujimori"]  # winner first

CANDIDATES_2016_P1: dict[str, str | None] = {
    "VOTOS_P1": None,          # FRENTE ESPERANZA
    "VOTOS_P2": None,          # SOLIDARIDAD NACIONAL - UPP (excluded per JNE)
    "VOTOS_P3": "Fujimori",    # FUERZA POPULAR
    "VOTOS_P4": "García",      # ALIANZA POPULAR (APRA)
    "VOTOS_P5": None,          # PERU LIBERTARIO (excluded per JNE)
    "VOTOS_P6": "Mendoza",     # FRENTE AMPLIO
    "VOTOS_P7": "Barnechea",   # ACCION POPULAR
    "VOTOS_P8": None,
    "VOTOS_P9": None,
    "VOTOS_P10": None,
    "VOTOS_P11": None,
    "VOTOS_P12": None,
    "VOTOS_P13": None,
    "VOTOS_P14": "PPK",        # PERUANOS POR EL KAMBIO
}
FINALISTS_2016_P2: dict[str, str] = {
    "VOTOS_P1": "PPK",
    "VOTOS_P2": "Fujimori",
}
FINALIST_ORDER_2016 = ["PPK", "Fujimori"]

FINALIST_ORDER_2021 = ["Castillo", "Fujimori"]

# jmcastagnetto district-level data (2021 P1 + P2) — partido name → short name
# None = grouped into "Otros"
PARTY_MAP_2021_P1: dict[str, str | None] = {
    "PARTIDO POLITICO NACIONAL PERU LIBRE":          "Castillo",
    "FUERZA POPULAR":                                "Fujimori",
    "RENOVACION POPULAR":                            "López Aliaga",
    "AVANZA PAIS - PARTIDO DE INTEGRACION SOCIAL":   "De Soto",
    "ACCION POPULAR":                                "Lescano",
    "PODEMOS PERU":                                  "Urresti",
    "VICTORIA NACIONAL":                             "Forsyth",
    # Grouped into Otros
    "JUNTOS POR EL PERU":                            None,
    "ALIANZA PARA EL PROGRESO":                      None,
    "PARTIDO MORADO":                                None,
    "PARTIDO POPULAR CRISTIANO - PPC":               None,
    "PARTIDO DEMOCRATICO SOMOS PERU":                None,
    "UNION POR EL PERU":                             None,
    "RENACIMIENTO UNIDO NACIONAL":                   None,
    "DEMOCRACIA DIRECTA":                            None,
    "EL FRENTE AMPLIO POR JUSTICIA, VIDA Y LIBERTAD": None,
    "PARTIDO NACIONALISTA PERUANO":                  None,
    "PERU PATRIA SEGURA":                            None,
}


# ── Data loading ───────────────────────────────────────────────────────────

# ONPE changed the status label across election years:
#   2011/2016: "ACTA ELECTORAL NORMAL" | "ACTA ELECTORAL RESUELTA"
#   2021:      "CONTABILIZADA"
VALID_ACTA_STATUS = {
    "ACTA ELECTORAL NORMAL",
    "ACTA ELECTORAL RESUELTA",
    "CONTABILIZADA",
}


def _keep_cols(available: list[str], wanted: list[str]) -> list[str]:
    return [c for c in wanted if c in available]


def _filter_valid(df: pd.DataFrame) -> pd.DataFrame:
    col = df["DESCRIP_ESTADO_ACTA"]
    # If the status column is all-NaN (some ONPE CSV versions omit it), keep all rows
    if col.isna().all():
        return df.copy()
    return df[col.astype(str).str.strip().isin(VALID_ACTA_STATUS)].copy()


def load_xlsx(path: Path, vote_cols: list[str]) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name=0, dtype={"UBIGEO": str})
    df.columns = [c.strip().upper() for c in df.columns]
    df["UBIGEO"] = df["UBIGEO"].astype(str).str.zfill(6)
    df = _filter_valid(df)
    keep = _keep_cols(list(df.columns), ["UBIGEO", "N_ELEC_HABIL"] + vote_cols)
    return df[keep].copy()


def load_csv(path: Path, vote_cols: list[str], encoding: str = "latin-1") -> pd.DataFrame:
    df = pd.read_csv(path, sep=";", dtype={"UBIGEO": str}, low_memory=False, encoding=encoding)
    df.columns = [c.strip().upper() for c in df.columns]
    df["UBIGEO"] = df["UBIGEO"].astype(str).str.zfill(6)
    df = _filter_valid(df)
    keep = _keep_cols(list(df.columns), ["UBIGEO", "N_ELEC_HABIL"] + vote_cols)
    return df[keep].copy()


def aggregate_district(df: pd.DataFrame) -> pd.DataFrame:
    return df.groupby("UBIGEO", as_index=False).sum(numeric_only=True)


# ── Feature matrix ─────────────────────────────────────────────────────────

def build_X(dist: pd.DataFrame, cand_map: dict[str, str | None]) -> tuple[pd.DataFrame, list[str]]:
    """
    Build feature matrix X indexed by UBIGEO.
    Columns = named candidates + 'Otros'.
    Values = votes / registered_voters_P1.
    """
    dist = dist.set_index("UBIGEO")
    reg = dist["N_ELEC_HABIL"].replace(0, np.nan)

    named_groups: dict[str, pd.Series] = {}
    otros_series: list[pd.Series] = []

    for col, name in cand_map.items():
        if col not in dist.columns:
            continue
        series = dist[col].fillna(0)
        if name is None:
            otros_series.append(series)
        else:
            named_groups[name] = named_groups.get(name, pd.Series(0, index=dist.index)) + series

    groups = dict(named_groups)
    if otros_series:
        groups["Otros"] = sum(otros_series)

    X = pd.DataFrame({name: s / reg for name, s in groups.items()})
    X = X.dropna()
    return X, list(groups.keys())


# ── Goodman OLS regression ─────────────────────────────────────────────────

def goodman_coef(X: pd.DataFrame, y: pd.Series) -> np.ndarray:
    """
    OLS without intercept, non-negative coefficients.
    Requires scikit-learn >= 0.24.
    """
    common = X.index.intersection(y.dropna().index)
    if len(common) < 10:
        print(f"  WARNING: only {len(common)} districts in common", file=sys.stderr)
    reg = LinearRegression(fit_intercept=False, positive=True)
    reg.fit(X.loc[common].values, y.loc[common].values)
    return reg.coef_


def compute_transfers(
    p1_dist: pd.DataFrame,
    p2_dist: pd.DataFrame,
    cand_map_p1: dict[str, str | None],
    finalist_map_p2: dict[str, str],
    finalist_order: list[str],
) -> dict[str, list[float]]:
    """
    Returns {candidate: [pct_F1, pct_F2, pct_Abs]} where each row sums to 100.
    """
    X, cand_names = build_X(p1_dist, cand_map_p1)

    p2_indexed = p2_dist.set_index("UBIGEO")
    p1_indexed = p1_dist.set_index("UBIGEO")
    reg_p1 = p1_indexed["N_ELEC_HABIL"].replace(0, np.nan)

    # For each finalist, run regression to get transfer coefficients
    beta: dict[str, np.ndarray] = {}
    for p2_col, finalist in finalist_map_p2.items():
        if p2_col not in p2_indexed.columns:
            continue
        y = p2_indexed[p2_col] / reg_p1
        y = y.reindex(X.index)
        beta[finalist] = goodman_coef(X, y)

    # Assemble result table
    result: dict[str, list[float]] = {}
    for i, cand in enumerate(cand_names):
        row_raw = [float(np.clip(beta.get(f, np.zeros(len(cand_names)))[i], 0, 1))
                   for f in finalist_order]
        abs_rate = max(0.0, 1.0 - sum(row_raw))
        row_raw.append(abs_rate)
        total = sum(row_raw) or 1.0
        result[cand] = [round(v / total * 100, 1) for v in row_raw]

    return result


# ── Pretty-print ───────────────────────────────────────────────────────────

def print_result(year: int, transfers: dict[str, list[float]], finalist_order: list[str]) -> None:
    f1, f2 = finalist_order
    print(f"\n{'═'*60}")
    print(f"  EG{year}  →  [{f1} P2,  {f2} P2,  Abs/Nulo]")
    print(f"  Source: ONPE official mesa-level results → district aggregation")
    print(f"  Method: Goodman OLS (non-negative, no intercept)")
    print(f"{'═'*60}")
    print(f"const EG{year}_TRANSFERS: Record<string, [number, number, number]> = {{")
    print(f"  // [% → {f1} P2, % → {f2} P2, % → Abs/Nulo]")
    for cand, rates in transfers.items():
        print(f'  "{cand}":      [{rates[0]}, {rates[1]}, {rates[2]}],')
    print("}")


# ── Run all years ──────────────────────────────────────────────────────────

def run_2011() -> None:
    p1_cols = list(CANDIDATES_2011_P1.keys())
    p2_cols = list(FINALISTS_2011_P2.keys())

    p1 = aggregate_district(load_xlsx(
        BASE / "2011_EG2011_P1/2011_EG2011_Presidencial.xlsx", p1_cols))
    p2 = aggregate_district(load_xlsx(
        BASE / "2011_SEP2011_P2/2011_SEP2011_Presidencial.xlsx", p2_cols))

    t = compute_transfers(p1, p2, CANDIDATES_2011_P1, FINALISTS_2011_P2, FINALIST_ORDER_2011)
    print_result(2011, t, FINALIST_ORDER_2011)


def run_2016() -> None:
    p1_cols = list(CANDIDATES_2016_P1.keys())
    p2_cols = list(FINALISTS_2016_P2.keys())

    p1 = aggregate_district(load_csv(BASE / "2016_EG2016_Presidencial_v2.csv", p1_cols))
    p2 = aggregate_district(load_csv(BASE / "2016_SEP2016_Presidencial.csv", p2_cols))

    t = compute_transfers(p1, p2, CANDIDATES_2016_P1, FINALISTS_2016_P2, FINALIST_ORDER_2016)
    print_result(2016, t, FINALIST_ORDER_2016)


def load_2021_jmcast() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load 2021 P1 and P2 district-level data from jmcastagnetto GitHub extracts.
    Returns (p1_wide, p2_wide) DataFrames indexed by UBIGEO (6-digit string).
    Both have N_ELEC_HABIL column plus candidate vote columns.
    """
    # ── P1: long → wide ───────────────────────────────────────────────────
    p1_long = pd.read_csv(
        BASE / "2021_P1_distrito_jmcast.csv",
        dtype={"ubigeo": str, "ubigeo_inei": str},
    )
    p1_long["ubigeo"] = p1_long["ubigeo"].str.zfill(6)

    # Registered voters from summary file
    p1_reg = pd.read_csv(
        BASE / "2021_P1_resumen_jmcast.csv",
        dtype={"ubigeo": str},
        thousands=",",
    )
    p1_reg["ubigeo"] = p1_reg["ubigeo"].str.zfill(6)
    p1_reg = p1_reg[["ubigeo", "ELECTORES_HABIL"]].rename(columns={"ELECTORES_HABIL": "N_ELEC_HABIL"})

    # Pivot: one row per district, one column per candidate name
    p1_long["cand"] = p1_long["partido"].map(PARTY_MAP_2021_P1).fillna("Otros")
    p1_wide = (
        p1_long.groupby(["ubigeo", "cand"])["total_votos"]
        .sum()
        .unstack(fill_value=0)
        .reset_index()
    )
    p1_wide = p1_wide.merge(p1_reg, on="ubigeo", how="inner")
    p1_wide = p1_wide.rename(columns={"ubigeo": "UBIGEO"})

    # ── P2: long → wide ───────────────────────────────────────────────────
    p2_long = pd.read_csv(BASE / "2021_P2_distrito_jmcast.csv")

    p2_fin_map = {
        "PARTIDO POLITICO NACIONAL PERU LIBRE": "Castillo",
        "FUERZA POPULAR": "Fujimori",
    }
    p2_long["cand"] = p2_long["AGRUPACION"].map(p2_fin_map)
    p2_long = p2_long.dropna(subset=["cand"])

    # Build composite key for matching since P2 has no ubigeo
    def make_key(df: pd.DataFrame) -> pd.Series:
        return (df["departamento"].str.strip().str.upper() + "|"
                + df["provincia"].str.strip().str.upper() + "|"
                + df["distrito"].str.strip().str.upper())

    p2_long["_key"] = make_key(p2_long)
    p2_wide = (
        p2_long.groupby(["_key", "cand"])["TOTAL_VOTOS"]
        .sum()
        .unstack(fill_value=0)
        .reset_index()
    )

    # Add registered voters from P2 participation file
    p2_part = pd.read_csv(BASE / "2021_P2_participacion_jmcast.csv")
    p2_part["_key"] = make_key(p2_part)
    p2_part = p2_part[["_key", "ELECTORES_HABIL"]].rename(columns={"ELECTORES_HABIL": "N_ELEC_HABIL"})
    p2_wide = p2_wide.merge(p2_part, on="_key", how="inner")

    # Build ubigeo → _key mapping from P1 resumen
    p1_key_df = p1_long[["ubigeo", "departamento", "provincia", "distrito"]].drop_duplicates()
    p1_key_df["_key"] = (
        p1_key_df["departamento"].str.strip().str.upper() + "|"
        + p1_key_df["provincia"].str.strip().str.upper() + "|"
        + p1_key_df["distrito"].str.strip().str.upper()
    )
    key_to_ubigeo = p1_key_df.set_index("_key")["ubigeo"].to_dict()
    p2_wide["UBIGEO"] = p2_wide["_key"].map(key_to_ubigeo)
    p2_wide = p2_wide.dropna(subset=["UBIGEO"])
    p2_wide = p2_wide.drop(columns=["_key"])

    return p1_wide, p2_wide


def compute_transfers_2021(
    p1_wide: pd.DataFrame,
    p2_wide: pd.DataFrame,
) -> dict[str, list[float]]:
    """Goodman regression for 2021 using pre-pivoted wide DataFrames."""
    p1 = p1_wide.set_index("UBIGEO")
    p2 = p2_wide.set_index("UBIGEO")

    reg = p1["N_ELEC_HABIL"].replace(0, np.nan)

    cand_cols = [c for c in p1.columns if c != "N_ELEC_HABIL"]
    X = pd.DataFrame({c: p1[c] / reg for c in cand_cols}).dropna()

    result: dict[str, list[float]] = {}
    betas: dict[str, np.ndarray] = {}
    for finalist in FINALIST_ORDER_2021:
        if finalist not in p2.columns:
            continue
        y = (p2[finalist] / reg).reindex(X.index)
        betas[finalist] = goodman_coef(X, y)

    for i, cand in enumerate(cand_cols):
        row = [float(np.clip(betas.get(f, np.zeros(len(cand_cols)))[i], 0, 1))
               for f in FINALIST_ORDER_2021]
        abs_rate = max(0.0, 1.0 - sum(row))
        row.append(abs_rate)
        total = sum(row) or 1.0
        result[cand] = [round(v / total * 100, 1) for v in row]

    return result


def run_2021() -> None:
    p1_wide, p2_wide = load_2021_jmcast()
    t = compute_transfers_2021(p1_wide, p2_wide)
    print_result(2021, t, FINALIST_ORDER_2021)


if __name__ == "__main__":
    print("Computing vote transfer matrices via ecological regression...")
    print("Data: ONPE official results by polling table (mesa de votación)")

    run_2011()
    run_2016()
    run_2021()

    print("\n\nDone. Paste the blocks above into frontend/src/lib/vote-flows.ts")
