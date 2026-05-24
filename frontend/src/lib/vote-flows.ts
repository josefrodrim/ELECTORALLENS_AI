// P1 → P2 vote transfer flows — King's Ecological Inference (King 1997).
//
// HOW THESE NUMBERS WERE PRODUCED
// ─────────────────────────────────
// Script  : scripts/compute_vote_transfers.py  (--method ei)
// Audit   : data/processed/vote_transfers_ei.json
//
// Primary : King EI — pyei RowByColumnEI, Dirichlet-Multinomial posterior (MCMC).
//           King 1997; King, Rosen & Tanner 1999.
//           Each district has its own β_ij[d] from a shared posterior distribution.
//           β_ij ∈ [0,1], Σ_j β_ij = 1 — bounds-enforced by construction.
//           Corrects Goodman's spatial-homogeneity assumption.
//
// Comparison: Goodman OLS (non-negative, no intercept) — stored in audit JSON.
//             Goodman R² (historical, n ≈ 1800–2200 distritos):
//               EG2011 · R²(Humala)=0.9434 · R²(Fujimori)=0.8597
//               EG2016 · R²(PPK)=0.7924    · R²(Fujimori)=0.8926
//               EG2021 · R²(Castillo)=0.7270 · R²(Fujimori)=0.8750
//
// Denominator: registered voters (N_ELEC_HABIL from P1) for both P1 and P2.
//              β_ij = fraction of candidate i's P1 voters → finalist j in P2.
//              Abs  = P2 abstention + null + blank (1 − Σ_j β_ij).
//
// Data    : ONPE official mesa-level results aggregated to district level.
//           2011 / 2016 : datosabiertos.gob.pe (ONPE open data, XLSX/CSV)
//           2021        : jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe

export interface FlowNode {
  id: string
  label: string
  color: string
  round: "p1" | "p2" | "abs"
}

export interface FlowLink {
  source: string
  target: string
  value: number  // absolute votes
}

export interface VoteFlow {
  year: number
  nodes: FlowNode[]
  links: FlowLink[]
  note: string
}

// ─── color palette ────────────────────────────────────────────────────────────
const C = {
  fujimori: "#f97316",   // orange
  winner:   "#22c55e",   // green
  runnerup: "#f97316",   // orange (Fujimori is usually runner-up)
  left:     "#818cf8",   // indigo
  right:    "#ef4444",   // red
  center:   "#a1a1aa",   // zinc
  abs:      "#3f3f46",   // dark zinc
} as const

function v(pct: number, total: number) {
  return Math.round((pct / 100) * total)
}

// ─── EG 2011 ──────────────────────────────────────────────────────────────────
// P1 valid: 14,966,101  |  P2 valid: 15,232,513
// Humala: 51.45% (+19.73 pp from P1)  |  Fujimori: 48.55%
// Goodman OLS · n=2,172 distritos · R²(Humala)=0.9434 · R²(Fujimori)=0.8597
const P1_2011 = 14_966_101

const EG2011_TRANSFERS: Record<string, [number, number, number]> = {
  // [% → Humala P2, % → Fujimori P2, % → Abs/Nulo]
  PPK:       [ 4.4, 73.8, 21.8],
  Toledo:    [61.4, 38.6,  0.0],
  Castañeda: [31.2, 48.8, 20.0],
  Otros:     [59.5, 40.5,  0.0],
}

function buildFlow2011(): VoteFlow {
  const nodes: FlowNode[] = [
    { id: "Humala-p1",    label: "Humala P1",    color: C.left,     round: "p1" },
    { id: "Fujimori-p1",  label: "Fujimori P1",  color: C.fujimori, round: "p1" },
    { id: "PPK-p1",       label: "PPK P1",        color: C.center,   round: "p1" },
    { id: "Toledo-p1",    label: "Toledo P1",     color: C.center,   round: "p1" },
    { id: "Castañeda-p1", label: "Castañeda P1",  color: C.center,   round: "p1" },
    { id: "Otros-p1",     label: "Otros P1",      color: C.abs,      round: "p1" },
    { id: "Humala-p2",    label: "Humala (ganó)", color: C.winner,   round: "p2" },
    { id: "Fujimori-p2",  label: "Fujimori",      color: C.fujimori, round: "p2" },
    { id: "abs",          label: "Nulo / Abs",    color: C.abs,      round: "abs" },
  ]

  const p1_votes: Record<string, number> = {
    Humala:    v(31.72, P1_2011),
    Fujimori:  v(23.55, P1_2011),
    PPK:       v(18.52, P1_2011),
    Toledo:    v(15.64, P1_2011),
    Castañeda: v(9.84,  P1_2011),
    Otros:     v(0.73,  P1_2011),
  }

  const links: FlowLink[] = [
    // Finalists keep their own P1 votes
    { source: "Humala-p1",   target: "Humala-p2",   value: p1_votes.Humala   },
    { source: "Fujimori-p1", target: "Fujimori-p2", value: p1_votes.Fujimori },
  ]

  for (const [cand, [toH, toF, toA]] of Object.entries(EG2011_TRANSFERS)) {
    const total = p1_votes[cand]
    links.push({ source: `${cand}-p1`, target: "Humala-p2",   value: v(toH, total) })
    links.push({ source: `${cand}-p1`, target: "Fujimori-p2", value: v(toF, total) })
    links.push({ source: `${cand}-p1`, target: "abs",          value: v(toA, total) })
  }

  return {
    year: 2011,
    nodes,
    links: links.filter((l) => l.value > 0),
    note: "King EI (Dirichlet-Multinomial, MCMC). Goodman OLS comparación: R²(Humala)=0.94, R²(Fujimori)=0.86. Fuente: ONPE datos abiertos (datosabiertos.gob.pe). Auditoría: vote_transfers_ei.json.",
  }
}

// ─── EG 2016 ──────────────────────────────────────────────────────────────────
// P1 valid: 15,966,062  |  P2 valid: 16,749,025
// PPK ganó: 50.12%  |  Fujimori: 49.88%
// King EI · n=2,069 distritos · Goodman R²(PPK)=0.7924 · R²(Fujimori)=0.8926
const P1_2016 = 15_966_062

const EG2016_TRANSFERS: Record<string, [number, number, number]> = {
  // [% → PPK P2, % → Fujimori P2, % → Abs/Nulo]
  Mendoza:   [ 79.8, 20.2, 0.0],
  Barnechea: [100.0,  0.0, 0.0],
  García:    [ 88.2, 11.8, 0.0],
  Otros:     [ 73.0, 23.6, 3.4],
}

function buildFlow2016(): VoteFlow {
  const nodes: FlowNode[] = [
    { id: "Fujimori-p1", label: "Fujimori P1", color: C.fujimori, round: "p1" },
    { id: "PPK-p1",      label: "PPK P1",       color: C.center,   round: "p1" },
    { id: "Mendoza-p1",  label: "Mendoza P1",   color: C.left,     round: "p1" },
    { id: "Barnechea-p1",label: "Barnechea P1", color: C.center,   round: "p1" },
    { id: "García-p1",   label: "García P1",    color: C.center,   round: "p1" },
    { id: "Otros-p1",    label: "Otros P1",     color: C.abs,      round: "p1" },
    { id: "PPK-p2",      label: "PPK (ganó)",   color: C.winner,   round: "p2" },
    { id: "Fujimori-p2", label: "Fujimori",     color: C.fujimori, round: "p2" },
    { id: "abs",         label: "Nulo / Abs",   color: C.abs,      round: "abs" },
  ]

  const p1_votes: Record<string, number> = {
    Fujimori:  v(39.86, P1_2016),
    PPK:       v(21.05, P1_2016),
    Mendoza:   v(19.94, P1_2016),
    Barnechea: v(7.24,  P1_2016),
    García:    v(5.83,  P1_2016),
    Otros:     v(6.08,  P1_2016),
  }

  const links: FlowLink[] = [
    { source: "Fujimori-p1", target: "Fujimori-p2", value: p1_votes.Fujimori },
    { source: "PPK-p1",      target: "PPK-p2",       value: p1_votes.PPK      },
  ]

  for (const [cand, [toPPK, toF, toA]] of Object.entries(EG2016_TRANSFERS)) {
    const total = p1_votes[cand]
    links.push({ source: `${cand}-p1`, target: "PPK-p2",      value: v(toPPK, total) })
    links.push({ source: `${cand}-p1`, target: "Fujimori-p2", value: v(toF,   total) })
    links.push({ source: `${cand}-p1`, target: "abs",          value: v(toA,   total) })
  }

  return {
    year: 2016,
    nodes,
    links: links.filter((l) => l.value > 0),
    note: "King EI (Dirichlet-Multinomial, MCMC). Goodman OLS comparación: R²(PPK)=0.79, R²(Fujimori)=0.89. Fuente: ONPE datos abiertos (datosabiertos.gob.pe). Auditoría: vote_transfers_ei.json.",
  }
}

// ─── EG 2021 ──────────────────────────────────────────────────────────────────
// P1 valid: 15,597,232  |  P2 valid: 16,597,223
// Castillo: 50.13%  |  Fujimori: 49.87%
// King EI · n=1,873 distritos · Goodman R²(Castillo)=0.7270 · R²(Fujimori)=0.8750
// Array order: [Fujimori P2, Castillo P2, Abs/Nulo]
const P1_2021 = 15_597_232

const EG2021_TRANSFERS: Record<string, [number, number, number]> = {
  // [% → Fujimori P2, % → Castillo P2, % → Abs/Nulo]
  "De Soto":      [ 96.8,  0.0,  3.2],
  "López Aliaga": [100.0,  0.0,  0.0],
  Forsyth:        [ 83.7,  0.0, 16.3],
  Lescano:        [  0.0, 96.8,  3.2],
  Urresti:        [ 32.9, 37.4, 29.7],
  Otros:          [ 16.7, 83.3,  0.0],
}

function buildFlow2021(): VoteFlow {
  const nodes: FlowNode[] = [
    { id: "Castillo-p1",     label: "Castillo P1",      color: C.left,     round: "p1" },
    { id: "Fujimori-p1",     label: "Fujimori P1",      color: C.fujimori, round: "p1" },
    { id: "De Soto-p1",      label: "De Soto P1",       color: C.right,    round: "p1" },
    { id: "López Aliaga-p1", label: "López Aliaga P1",  color: C.right,    round: "p1" },
    { id: "Forsyth-p1",      label: "Forsyth P1",       color: C.center,   round: "p1" },
    { id: "Lescano-p1",      label: "Lescano P1",       color: C.center,   round: "p1" },
    { id: "Urresti-p1",      label: "Urresti P1",       color: C.center,   round: "p1" },
    { id: "Otros-p1",        label: "Otros P1",         color: C.abs,      round: "p1" },
    { id: "Castillo-p2",     label: "Castillo (ganó)",  color: C.winner,   round: "p2" },
    { id: "Fujimori-p2",     label: "Fujimori",         color: C.fujimori, round: "p2" },
    { id: "abs",             label: "Nulo / Abs",       color: C.abs,      round: "abs" },
  ]

  const p1_votes: Record<string, number> = {
    Castillo:      v(18.92, P1_2021),
    Fujimori:      v(13.41, P1_2021),
    "De Soto":     v(11.62, P1_2021),
    "López Aliaga":v(11.08, P1_2021),
    Forsyth:       v(10.40, P1_2021),
    Lescano:       v(9.14,  P1_2021),
    Urresti:       v(7.97,  P1_2021),
    Otros:         v(17.46, P1_2021),
  }

  const links: FlowLink[] = [
    { source: "Castillo-p1", target: "Castillo-p2",  value: p1_votes.Castillo  },
    { source: "Fujimori-p1", target: "Fujimori-p2",  value: p1_votes.Fujimori  },
  ]

  for (const [cand, [toF, toC, toA]] of Object.entries(EG2021_TRANSFERS)) {
    const total = p1_votes[cand]
    links.push({ source: `${cand}-p1`, target: "Fujimori-p2", value: v(toF, total) })
    links.push({ source: `${cand}-p1`, target: "Castillo-p2", value: v(toC, total) })
    links.push({ source: `${cand}-p1`, target: "abs",          value: v(toA, total) })
  }

  return {
    year: 2021,
    nodes,
    links: links.filter((l) => l.value > 0),
    note: "King EI (Dirichlet-Multinomial, MCMC). Goodman OLS comparación: R²(Castillo)=0.73, R²(Fujimori)=0.88. Fuente: jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe. Auditoría: vote_transfers_ei.json.",
  }
}

export const VOTE_FLOWS: Record<number, VoteFlow> = {
  2011: buildFlow2011(),
  2016: buildFlow2016(),
  2021: buildFlow2021(),
}
