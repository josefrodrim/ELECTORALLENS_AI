#!/usr/bin/env python3
"""
Vote transfer matrix estimation.

PRIMARY   King's Ecological Inference (EI) — pyei RowByColumnEI
          King 1997; King, Rosen & Tanner 1999.
          Each district has its own β_ij drawn from a Dirichlet-Multinomial
          posterior. Bounds-enforced: β_ij ∈ [0,1], Σ_j β_ij = 1 per group.
          Corrects Goodman's spatial-homogeneity assumption.
          Requires: pip install pyei

COMPARISON  Goodman OLS (Goodman 1953, non-negative, no intercept).
            Always computed as fast baseline; kept in audit trail.

Notation
  β_ij  fraction of candidate i's P1 voters → finalist j in P2.
  Abs   P2 abstention + null + blank  (1 − Σ_j β_ij per group).

Both methods use registered voters as denominator so that abstention is
modelled as an explicit outcome column (not silently discarded).

Data
  2011/2016 : ONPE open data — datosabiertos.gob.pe (XLSX / CSV)
  2021      : jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe

Output
  stdout                               TypeScript constants for vote-flows.ts
  data/processed/vote_transfers_ei.json  audit trail (EI posteriors + Goodman)

Usage
  python scripts/compute_vote_transfers.py                   # King EI, defaults
  python scripts/compute_vote_transfers.py --method goodman  # fast, no pyei
  python scripts/compute_vote_transfers.py --draws 500 --tune 200 --chains 1
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

try:
    from pyei.r_by_c import RowByColumnEI
    HAS_PYEI = True
except ImportError:
    HAS_PYEI = False

BASE = Path("data/raw/onpe")


# ── Candidate / finalist column maps ──────────────────────────────────────
# Maps VOTOS_Px → short display name. None = grouped into "Otros".

CANDIDATES_2011_P1: dict[str, str | None] = {
    "VOTOS_P1": "Humala",
    "VOTOS_P2": None,
    "VOTOS_P3": "Fujimori",
    "VOTOS_P4": "Toledo",
    "VOTOS_P5": "Castañeda",
    "VOTOS_P6": "PPK",
    "VOTOS_P7": None,
    "VOTOS_P8": None,
    "VOTOS_P9": None,
    "VOTOS_P10": None,
    "VOTOS_P11": None,
}
FINALISTS_2011_P2: dict[str, str] = {
    "VOTOS_P1": "Fujimori",
    "VOTOS_P2": "Humala",
}
FINALIST_ORDER_2011 = ["Humala", "Fujimori"]

CANDIDATES_2016_P1: dict[str, str | None] = {
    "VOTOS_P1": None,
    "VOTOS_P2": None,
    "VOTOS_P3": "Fujimori",
    "VOTOS_P4": "García",
    "VOTOS_P5": None,
    "VOTOS_P6": "Mendoza",
    "VOTOS_P7": "Barnechea",
    "VOTOS_P8": None,
    "VOTOS_P9": None,
    "VOTOS_P10": None,
    "VOTOS_P11": None,
    "VOTOS_P12": None,
    "VOTOS_P13": None,
    "VOTOS_P14": "PPK",
}
FINALISTS_2016_P2: dict[str, str] = {
    "VOTOS_P1": "PPK",
    "VOTOS_P2": "Fujimori",
}
FINALIST_ORDER_2016 = ["PPK", "Fujimori"]

FINALIST_ORDER_2021 = ["Castillo", "Fujimori"]

PARTY_MAP_2021_P1: dict[str, str | None] = {
    "PARTIDO POLITICO NACIONAL PERU LIBRE":           "Castillo",
    "FUERZA POPULAR":                                 "Fujimori",
    "RENOVACION POPULAR":                             "López Aliaga",
    "AVANZA PAIS - PARTIDO DE INTEGRACION SOCIAL":    "De Soto",
    "ACCION POPULAR":                                 "Lescano",
    "PODEMOS PERU":                                   "Urresti",
    "VICTORIA NACIONAL":                              "Forsyth",
    "JUNTOS POR EL PERU":                             None,
    "ALIANZA PARA EL PROGRESO":                       None,
    "PARTIDO MORADO":                                 None,
    "PARTIDO POPULAR CRISTIANO - PPC":                None,
    "PARTIDO DEMOCRATICO SOMOS PERU":                 None,
    "UNION POR EL PERU":                              None,
    "RENACIMIENTO UNIDO NACIONAL":                    None,
    "DEMOCRACIA DIRECTA":                             None,
    "EL FRENTE AMPLIO POR JUSTICIA, VIDA Y LIBERTAD": None,
    "PARTIDO NACIONALISTA PERUANO":                   None,
    "PERU PATRIA SEGURA":                             None,
}


# ── Data loading ───────────────────────────────────────────────────────────

VALID_ACTA_STATUS = {
    "ACTA ELECTORAL NORMAL",
    "ACTA ELECTORAL RESUELTA",
    "CONTABILIZADA",
}


def _keep_cols(available: list[str], wanted: list[str]) -> list[str]:
    return [c for c in wanted if c in available]


def _filter_valid(df: pd.DataFrame) -> pd.DataFrame:
    col = df["DESCRIP_ESTADO_ACTA"]
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


# ── Shared: build named-group series from a column map ────────────────────

def _build_named_groups(
    dist_idx: pd.DataFrame,
    cand_map: dict[str, str | None],
) -> tuple[dict[str, pd.Series], list[str]]:
    named: dict[str, pd.Series] = {}
    otros: list[pd.Series] = []
    for col, name in cand_map.items():
        if col not in dist_idx.columns:
            continue
        s = dist_idx[col].fillna(0)
        if name is None:
            otros.append(s)
        else:
            named[name] = named.get(name, pd.Series(0.0, index=dist_idx.index)) + s
    if otros:
        named["Otros"] = sum(otros)
    return named, list(named.keys())


# ── Goodman OLS ────────────────────────────────────────────────────────────

def _build_X(dist: pd.DataFrame, cand_map: dict[str, str | None]) -> tuple[pd.DataFrame, list[str]]:
    """X matrix: votes/registered per candidate, indexed by UBIGEO."""
    dist = dist.set_index("UBIGEO")
    reg = dist["N_ELEC_HABIL"].replace(0, np.nan)
    named, cand_names = _build_named_groups(dist, cand_map)
    X = pd.DataFrame({n: s / reg for n, s in named.items()}).dropna()
    return X, cand_names


def _goodman_coef(X: pd.DataFrame, y: pd.Series) -> tuple[np.ndarray, float, int]:
    """OLS, no intercept, non-negative. Returns (coef, R², n_districts)."""
    common = X.index.intersection(y.dropna().index)
    n = len(common)
    if n < 10:
        print(f"  WARNING: only {n} districts in common", file=sys.stderr)
    reg = LinearRegression(fit_intercept=False, positive=True)
    Xc, yc = X.loc[common].values, y.loc[common].values
    reg.fit(Xc, yc)
    return reg.coef_, float(r2_score(yc, reg.predict(Xc))), n


def compute_goodman(
    p1_dist: pd.DataFrame,
    p2_dist: pd.DataFrame,
    cand_map_p1: dict[str, str | None],
    finalist_map_p2: dict[str, str],
    finalist_order: list[str],
) -> tuple[dict[str, list[float]], dict[str, float], int]:
    """Goodman OLS for 2011/2016. Returns (transfers, r2_per_finalist, n)."""
    X, cand_names = _build_X(p1_dist, cand_map_p1)
    p2_idx = p2_dist.set_index("UBIGEO")
    reg_p1 = p1_dist.set_index("UBIGEO")["N_ELEC_HABIL"].replace(0, np.nan)

    beta: dict[str, np.ndarray] = {}
    r2_scores: dict[str, float] = {}
    n_districts = 0
    for p2_col, finalist in finalist_map_p2.items():
        if p2_col not in p2_idx.columns:
            continue
        y = (p2_idx[p2_col] / reg_p1).reindex(X.index)
        coef, r2, n = _goodman_coef(X, y)
        beta[finalist] = coef
        r2_scores[finalist] = round(r2, 4)
        n_districts = n

    result: dict[str, list[float]] = {}
    for i, cand in enumerate(cand_names):
        row = [float(np.clip(beta.get(f, np.zeros(len(cand_names)))[i], 0, 1))
               for f in finalist_order]
        row.append(max(0.0, 1.0 - sum(row)))
        total = sum(row) or 1.0
        result[cand] = [round(v / total * 100, 1) for v in row]

    return result, r2_scores, n_districts


def compute_goodman_2021(
    p1_wide: pd.DataFrame,
    p2_wide: pd.DataFrame,
) -> tuple[dict[str, list[float]], dict[str, float], int]:
    """Goodman OLS for 2021 pre-pivoted DataFrames."""
    p1 = p1_wide.set_index("UBIGEO")
    p2 = p2_wide.set_index("UBIGEO")
    reg = p1["N_ELEC_HABIL"].replace(0, np.nan)
    cand_cols = [c for c in p1.columns if c != "N_ELEC_HABIL"]
    X = pd.DataFrame({c: p1[c] / reg for c in cand_cols}).dropna()

    betas: dict[str, np.ndarray] = {}
    r2_scores: dict[str, float] = {}
    n_districts = 0
    for finalist in FINALIST_ORDER_2021:
        if finalist not in p2.columns:
            continue
        y = (p2[finalist] / reg).reindex(X.index)
        coef, r2, n = _goodman_coef(X, y)
        betas[finalist] = coef
        r2_scores[finalist] = round(r2, 4)
        n_districts = n

    result: dict[str, list[float]] = {}
    for i, cand in enumerate(cand_cols):
        row = [float(np.clip(betas.get(f, np.zeros(len(cand_cols)))[i], 0, 1))
               for f in FINALIST_ORDER_2021]
        row.append(max(0.0, 1.0 - sum(row)))
        total = sum(row) or 1.0
        result[cand] = [round(v / total * 100, 1) for v in row]

    return result, r2_scores, n_districts


# ── King EI: array builders ────────────────────────────────────────────────

def _normalize_rows(arr: np.ndarray) -> np.ndarray:
    totals = arr.sum(axis=1, keepdims=True)
    totals = np.where(totals == 0, 1.0, totals)
    return np.clip(arr, 0.0, None) / totals


def build_ei_arrays(
    p1_dist: pd.DataFrame,
    p2_dist: pd.DataFrame,
    cand_map_p1: dict[str, str | None],
    finalist_map_p2: dict[str, str],
    finalist_order: list[str],
) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[str], list[str]]:
    """
    Build (group_fracs, vote_fracs, precinct_pops, group_names, outcome_names)
    for pyei RowByColumnEI — 2011/2016 data format.

    Denominator: registered voters (N_ELEC_HABIL from P1) for both P1 and P2,
    so that abstention is an explicit column and each row sums to exactly 1.

      group_fracs[d, i]  = votes_i_P1[d] / registered_P1[d]
      group_fracs[d, -1] = 1 − Σ_i  (P1 null / blank / abstention)
      vote_fracs[d, j]   = votes_j_P2[d] / registered_P1[d]
      vote_fracs[d, -1]  = 1 − Σ_j  (P2 null / blank / abstention)
    """
    p1_idx = p1_dist.set_index("UBIGEO")
    p2_idx = p2_dist.set_index("UBIGEO")
    reg = p1_idx["N_ELEC_HABIL"].replace(0, np.nan)

    named, cand_names = _build_named_groups(p1_idx, cand_map_p1)

    # Finalist P2 columns in the correct output order
    p2_cols_ordered: list[str] = []
    for finalist in finalist_order:
        for p2_col, fn in finalist_map_p2.items():
            if fn == finalist and p2_col in p2_idx.columns:
                p2_cols_ordered.append(p2_col)
                break

    # Intersect to districts present in all required series
    common = reg.dropna().index
    for s in named.values():
        common = common.intersection(s.index)
    for col in p2_cols_ordered:
        common = common.intersection(p2_idx[col].dropna().index)

    reg_c = reg.loc[common].values.astype(float)

    G_cands = np.column_stack([named[n].loc[common].values / reg_c for n in cand_names])
    G_abs = (1.0 - G_cands.sum(axis=1)).reshape(-1, 1)
    G = _normalize_rows(np.hstack([G_cands, G_abs]))
    group_names = cand_names + ["Abs P1"]

    V_fins = np.column_stack([
        p2_idx[col].fillna(0).loc[common].values / reg_c for col in p2_cols_ordered
    ])
    V_abs = (1.0 - V_fins.sum(axis=1)).reshape(-1, 1)
    V = _normalize_rows(np.hstack([V_fins, V_abs]))
    outcome_names = finalist_order + ["Abs/Nulo P2"]

    pops = reg.loc[common].astype(int).values
    return G, V, pops, group_names, outcome_names


def build_ei_arrays_2021(
    p1_wide: pd.DataFrame,
    p2_wide: pd.DataFrame,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[str], list[str]]:
    """Build EI arrays for 2021 pre-pivoted DataFrames."""
    p1 = p1_wide.set_index("UBIGEO")
    p2 = p2_wide.set_index("UBIGEO")
    reg = p1["N_ELEC_HABIL"].replace(0, np.nan)
    cand_cols = [c for c in p1.columns if c != "N_ELEC_HABIL"]

    common = reg.dropna().index
    for f in FINALIST_ORDER_2021:
        if f in p2.columns:
            common = common.intersection(p2[f].dropna().index)

    reg_c = reg.loc[common].values.astype(float)

    G_cands = np.column_stack([p1[c].fillna(0).loc[common].values / reg_c for c in cand_cols])
    G_abs = (1.0 - G_cands.sum(axis=1)).reshape(-1, 1)
    G = _normalize_rows(np.hstack([G_cands, G_abs]))
    group_names = cand_cols + ["Abs P1"]

    V_fins = np.column_stack([
        p2[f].fillna(0).loc[common].values / reg_c for f in FINALIST_ORDER_2021
    ])
    V_abs = (1.0 - V_fins.sum(axis=1)).reshape(-1, 1)
    V = _normalize_rows(np.hstack([V_fins, V_abs]))
    outcome_names = FINALIST_ORDER_2021 + ["Abs/Nulo P2"]

    pops = reg.loc[common].astype(int).values
    return G, V, pops, group_names, outcome_names


# ── King EI: fitting ───────────────────────────────────────────────────────

def king_ei_fit(
    group_fracs: np.ndarray,
    vote_fracs: np.ndarray,
    precinct_pops: np.ndarray,
    group_names: list[str],
    outcome_names: list[str],
    draws: int,
    tune: int,
    chains: int,
) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
    """
    Fit King EI RowByColumnEI (Dirichlet-Multinomial, MCMC via PyMC).
    Returns (beta_mean, beta_std, diagnostics).
    beta arrays shape: (n_groups, n_outcomes).
    """
    if not HAS_PYEI:
        raise RuntimeError("pyei is not installed. Run: pip install pyei")

    n = group_fracs.shape[0]
    print(f"  King EI: {n} districts, {draws} draws × {chains} chains + {tune} tune steps")
    print(f"  Groups: {group_names}")
    print(f"  Outcomes: {outcome_names}")

    ei = RowByColumnEI(model_name="multinomial-dirichlet")
    ei.fit(
        group_fracs,
        vote_fracs,
        precinct_pops,
        demographic_group_names=group_names,
        candidate_names=outcome_names,
        draws=draws,
        tune=tune,
        chains=chains,
        target_accept=0.9,
        progressbar=True,
    )

    # sampled_voting_prefs: pyei returns list[(n_samples, n_outcomes)] per group
    # or ndarray of shape (n_samples, n_groups, n_outcomes) depending on version
    raw = ei.sampled_voting_prefs
    if isinstance(raw, (list, tuple)):
        samples = np.stack([np.asarray(r) for r in raw], axis=1)
    else:
        samples = np.asarray(raw)
        if samples.ndim == 3 and samples.shape[0] == len(group_names):
            samples = samples.transpose(1, 0, 2)

    beta_mean = samples.mean(axis=0)   # (n_groups, n_outcomes)
    beta_std  = samples.std(axis=0)

    diagnostics: dict[str, Any] = {"n_samples": int(samples.shape[0])}
    try:
        import arviz as az
        rhat_data = az.rhat(ei.sim_trace)
        all_rhat = np.concatenate([
            np.asarray(v).flatten()
            for v in rhat_data.data_vars.values()
        ])
        rhat_max = float(np.nanmax(all_rhat))
        diagnostics["rhat_max"] = round(rhat_max, 4)
        diagnostics["converged"] = bool(rhat_max < 1.1)
    except Exception as exc:
        diagnostics["rhat_note"] = f"arviz unavailable: {exc}"

    return beta_mean, beta_std, diagnostics


def beta_to_transfers(
    beta_mean: np.ndarray,
    beta_std: np.ndarray,
    cand_names: list[str],
    finalist_order: list[str],
    group_names: list[str],
    outcome_names: list[str],
) -> tuple[dict[str, list[float]], dict[str, list[float]]]:
    """
    Extract transfer dicts from EI beta matrix.
    Drops the "Abs P1" group row (P1 abstainers — not a tracked group).
    Returns (transfers_mean_pct, transfers_std_pct).
    Each value: [pct_F1, pct_F2, pct_Abs/Nulo].
    """
    g_idx = {n: i for i, n in enumerate(group_names)}
    o_idx = {n: i for i, n in enumerate(outcome_names)}
    abs_col = o_idx.get("Abs/Nulo P2", len(outcome_names) - 1)

    means: dict[str, list[float]] = {}
    stds:  dict[str, list[float]] = {}
    for cand in cand_names:
        if cand not in g_idx:
            continue
        i = g_idx[cand]
        means[cand] = [round(float(beta_mean[i, o_idx[f]]) * 100, 1) for f in finalist_order]
        means[cand].append(round(float(beta_mean[i, abs_col]) * 100, 1))
        stds[cand]  = [round(float(beta_std[i, o_idx[f]]) * 100, 1) for f in finalist_order]
        stds[cand].append(round(float(beta_std[i, abs_col]) * 100, 1))

    return means, stds


# ── Output ─────────────────────────────────────────────────────────────────

def print_result(
    year: int,
    transfers: dict[str, list[float]],
    finalist_order: list[str],
    method: str,
    n_districts: int,
    r2_scores: dict[str, float] | None = None,
    diagnostics: dict[str, Any] | None = None,
    transfers_std: dict[str, list[float]] | None = None,
) -> None:
    f1, f2 = finalist_order
    print(f"\n{'═'*64}")
    print(f"  EG{year}  →  [{f1} P2,  {f2} P2,  Abs/Nulo]")
    print(f"  Method      : {method}")
    print(f"  n_districts : {n_districts}")
    if r2_scores:
        for f, r2 in r2_scores.items():
            print(f"  R²({f}) : {r2:.4f}")
    if diagnostics:
        if "rhat_max" in diagnostics:
            converged = "✓" if diagnostics.get("converged") else "✗"
            print(f"  R-hat max   : {diagnostics['rhat_max']:.4f}  {converged} (< 1.1 = converged)")
        if "n_samples" in diagnostics:
            print(f"  MCMC samples: {diagnostics['n_samples']}")
    print(f"{'═'*64}")
    print(f"const EG{year}_TRANSFERS: Record<string, [number, number, number]> = {{")
    comment = f"// [% → {f1} P2, % → {f2} P2, % → Abs/Nulo]"
    if transfers_std:
        comment += "  // ±1 SD (EI posterior)"
    print(f"  {comment}")
    for cand, rates in transfers.items():
        suffix = ""
        if transfers_std and cand in transfers_std:
            s = transfers_std[cand]
            suffix = f"  // ±[{s[0]}, {s[1]}, {s[2]}]"
        print(f'  "{cand}":      [{rates[0]}, {rates[1]}, {rates[2]}],{suffix}')
    print("}")


# ── 2021 data loader (jmcastagnetto) ──────────────────────────────────────

def load_2021_jmcast() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load 2021 P1 and P2 district-level data from jmcastagnetto GitHub extracts.
    Returns (p1_wide, p2_wide) DataFrames with UBIGEO + candidate columns + N_ELEC_HABIL.
    """
    p1_long = pd.read_csv(
        BASE / "2021_P1_distrito_jmcast.csv",
        dtype={"ubigeo": str, "ubigeo_inei": str},
    )
    p1_long["ubigeo"] = p1_long["ubigeo"].str.zfill(6)

    p1_reg = pd.read_csv(
        BASE / "2021_P1_resumen_jmcast.csv",
        dtype={"ubigeo": str},
        thousands=",",
    )
    p1_reg["ubigeo"] = p1_reg["ubigeo"].str.zfill(6)
    p1_reg = p1_reg[["ubigeo", "ELECTORES_HABIL"]].rename(
        columns={"ELECTORES_HABIL": "N_ELEC_HABIL"}
    )

    p1_long["cand"] = p1_long["partido"].map(PARTY_MAP_2021_P1).fillna("Otros")
    p1_wide = (
        p1_long.groupby(["ubigeo", "cand"])["total_votos"]
        .sum()
        .unstack(fill_value=0)
        .reset_index()
    )
    p1_wide = p1_wide.merge(p1_reg, on="ubigeo", how="inner")
    p1_wide = p1_wide.rename(columns={"ubigeo": "UBIGEO"})

    p2_long = pd.read_csv(BASE / "2021_P2_distrito_jmcast.csv")
    p2_fin_map = {
        "PARTIDO POLITICO NACIONAL PERU LIBRE": "Castillo",
        "FUERZA POPULAR": "Fujimori",
    }
    p2_long["cand"] = p2_long["AGRUPACION"].map(p2_fin_map)
    p2_long = p2_long.dropna(subset=["cand"])

    def make_key(df: pd.DataFrame) -> pd.Series:
        return (
            df["departamento"].str.strip().str.upper() + "|"
            + df["provincia"].str.strip().str.upper() + "|"
            + df["distrito"].str.strip().str.upper()
        )

    p2_long["_key"] = make_key(p2_long)
    p2_wide = (
        p2_long.groupby(["_key", "cand"])["TOTAL_VOTOS"]
        .sum()
        .unstack(fill_value=0)
        .reset_index()
    )

    p2_part = pd.read_csv(BASE / "2021_P2_participacion_jmcast.csv")
    p2_part["_key"] = make_key(p2_part)
    p2_part = p2_part[["_key", "ELECTORES_HABIL"]].rename(
        columns={"ELECTORES_HABIL": "N_ELEC_HABIL"}
    )
    p2_wide = p2_wide.merge(p2_part, on="_key", how="inner")

    p1_key_df = p1_long[["ubigeo", "departamento", "provincia", "distrito"]].drop_duplicates()
    p1_key_df["_key"] = (
        p1_key_df["departamento"].str.strip().str.upper() + "|"
        + p1_key_df["provincia"].str.strip().str.upper() + "|"
        + p1_key_df["distrito"].str.strip().str.upper()
    )
    key_to_ubigeo = p1_key_df.set_index("_key")["ubigeo"].to_dict()
    p2_wide["UBIGEO"] = p2_wide["_key"].map(key_to_ubigeo)
    p2_wide = p2_wide.dropna(subset=["UBIGEO"]).drop(columns=["_key"])

    return p1_wide, p2_wide


# ── Run per year ───────────────────────────────────────────────────────────

def _run_year(
    year: int,
    finalist_order: list[str],
    goodman_fn: Any,
    ei_arrays_fn: Any,
    method: str,
    draws: int,
    tune: int,
    chains: int,
) -> dict[str, Any]:
    result: dict[str, Any] = {"year": year, "finalists": finalist_order}

    t_g, r2_g, n_g = goodman_fn()
    result["goodman"] = {"n_districts": n_g, "r2": r2_g, "transfers": t_g}
    print(f"\n[EG{year}] Goodman baseline computed (n={n_g})")

    if method == "ei":
        G, V, pops, group_names, outcome_names = ei_arrays_fn()
        beta_mean, beta_std, diag = king_ei_fit(
            G, V, pops, group_names, outcome_names, draws, tune, chains
        )
        cand_names = [n for n in group_names if n != "Abs P1"]
        t_ei, t_ei_std = beta_to_transfers(
            beta_mean, beta_std, cand_names, finalist_order, group_names, outcome_names
        )
        result["ei"] = {
            "n_districts": int(len(pops)),
            "diagnostics": diag,
            "transfers": t_ei,
            "transfers_std": t_ei_std,
        }
        print_result(year, t_ei, finalist_order, "King EI (Dirichlet-Multinomial, MCMC)",
                     len(pops), diagnostics=diag, transfers_std=t_ei_std)
    else:
        print_result(year, t_g, finalist_order, "Goodman OLS (non-negative, no intercept)",
                     n_g, r2_scores=r2_g)

    return result


def run_2011(method: str, draws: int, tune: int, chains: int) -> dict[str, Any]:
    p1_cols = list(CANDIDATES_2011_P1.keys())
    p2_cols = list(FINALISTS_2011_P2.keys())
    p1 = aggregate_district(load_xlsx(
        BASE / "2011_EG2011_P1/2011_EG2011_Presidencial.xlsx", p1_cols))
    p2 = aggregate_district(load_xlsx(
        BASE / "2011_SEP2011_P2/2011_SEP2011_Presidencial.xlsx", p2_cols))

    return _run_year(
        2011, FINALIST_ORDER_2011,
        goodman_fn=lambda: compute_goodman(p1, p2, CANDIDATES_2011_P1, FINALISTS_2011_P2, FINALIST_ORDER_2011),
        ei_arrays_fn=lambda: build_ei_arrays(p1, p2, CANDIDATES_2011_P1, FINALISTS_2011_P2, FINALIST_ORDER_2011),
        method=method, draws=draws, tune=tune, chains=chains,
    )


def run_2016(method: str, draws: int, tune: int, chains: int) -> dict[str, Any]:
    p1_cols = list(CANDIDATES_2016_P1.keys())
    p2_cols = list(FINALISTS_2016_P2.keys())
    p1 = aggregate_district(load_csv(BASE / "2016_EG2016_Presidencial_v2.csv", p1_cols))
    p2 = aggregate_district(load_csv(BASE / "2016_SEP2016_Presidencial.csv", p2_cols))

    return _run_year(
        2016, FINALIST_ORDER_2016,
        goodman_fn=lambda: compute_goodman(p1, p2, CANDIDATES_2016_P1, FINALISTS_2016_P2, FINALIST_ORDER_2016),
        ei_arrays_fn=lambda: build_ei_arrays(p1, p2, CANDIDATES_2016_P1, FINALISTS_2016_P2, FINALIST_ORDER_2016),
        method=method, draws=draws, tune=tune, chains=chains,
    )


def run_2021(method: str, draws: int, tune: int, chains: int) -> dict[str, Any]:
    p1_wide, p2_wide = load_2021_jmcast()

    return _run_year(
        2021, FINALIST_ORDER_2021,
        goodman_fn=lambda: compute_goodman_2021(p1_wide, p2_wide),
        ei_arrays_fn=lambda: build_ei_arrays_2021(p1_wide, p2_wide),
        method=method, draws=draws, tune=tune, chains=chains,
    )


# ── Entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Estimate P1→P2 vote transfer matrices (King EI or Goodman OLS)"
    )
    parser.add_argument(
        "--method", choices=["ei", "goodman"], default="ei",
        help="Estimation method (default: ei). 'goodman' is fast; 'ei' requires pyei.",
    )
    parser.add_argument(
        "--draws", type=int, default=1000,
        help="MCMC posterior draws per chain (EI only, default: 1000)",
    )
    parser.add_argument(
        "--tune", type=int, default=500,
        help="MCMC tuning steps (EI only, default: 500)",
    )
    parser.add_argument(
        "--chains", type=int, default=2,
        help="MCMC chains (EI only, default: 2)",
    )
    args = parser.parse_args()

    if args.method == "ei" and not HAS_PYEI:
        print(
            "ERROR: pyei is not installed.\n"
            "Install with:  pip install pyei\n"
            "Or run Goodman only:  python scripts/compute_vote_transfers.py --method goodman",
            file=sys.stderr,
        )
        sys.exit(1)

    print("=" * 64)
    print(f"Vote transfer estimation  |  method: {args.method.upper()}")
    if args.method == "ei":
        print(f"MCMC: {args.draws} draws × {args.chains} chains + {args.tune} tune steps")
        print("Expected runtime: ~5–20 min per year on 2000+ districts")
        print("Tip: --draws 300 --tune 150 --chains 1  for a quick test run")
    print("=" * 64)

    results = [
        run_2011(args.method, args.draws, args.tune, args.chains),
        run_2016(args.method, args.draws, args.tune, args.chains),
        run_2021(args.method, args.draws, args.tune, args.chains),
    ]

    out_path = Path("data/processed/vote_transfers_ei.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    audit = {
        "generated": str(date.today()),
        "method_primary": (
            "King EI — pyei RowByColumnEI, multinomial-dirichlet (King 1997; King, Rosen & Tanner 1999)"
            if args.method == "ei"
            else "Goodman OLS (non-negative, no intercept)"
        ),
        "method_comparison": "Goodman OLS (non-negative, no intercept)" if args.method == "ei" else None,
        "denominator": "registered voters (N_ELEC_HABIL from P1); explicit abstention columns; rows sum to 1",
        "source": "ONPE mesa-level results (datosabiertos.gob.pe) + jmcastagnetto/2021-elecciones",
        "note": (
            "β_ij = fraction of candidate i's P1 voters who voted for finalist j in P2. "
            "Abs/Nulo P2 = abstention + null + blank."
        ),
        "elections": results,
    }
    out_path.write_text(json.dumps(audit, indent=2, ensure_ascii=False))
    print(f"\n✓ Audit trail → {out_path}")
    print("\nDone. Paste the TypeScript blocks above into frontend/src/lib/vote-flows.ts")
