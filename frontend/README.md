# ElectoralLens AI — Frontend

Next.js 16 · TypeScript · TailwindCSS · shadcn/ui

Electoral intelligence platform for Peruvian general elections (2011–2026). Ingests official ONPE results, runs ecological inference vote-transfer estimation, and renders interactive Sankey diagrams, choropleth maps, and participation analytics.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router, server components) |
| Language | TypeScript 5 |
| Styling | TailwindCSS v4 + shadcn/ui |
| Charts | @nivo/sankey · Recharts |
| Maps | Custom SVG choropleth (GeoJSON Peru) |
| Fonts | DM Serif Display (headings) · DM Sans (body) · Fira Code (mono/data) |
| Package manager | pnpm |

---

## Dev

```bash
pnpm install
pnpm dev          # http://localhost:3000
npx tsc --noEmit  # type check
pnpm lint
```

---

## Vote Transfer Methodology

The P1 → P2 Sankey diagrams show how voters of eliminated first-round candidates redistributed between the two finalists in the runoff.

### Primary method: King's Ecological Inference (EI)

**Model**: `pyei` — `RowByColumnEI`, Dirichlet-Multinomial likelihood, MCMC posterior sampling.

**Unit of analysis**: Electoral district (distrito). Each district contributes a marginal constraint:
- P1 vote share per candidate (observed)
- P2 vote share per finalist (observed)
- EI infers the unobserved transfer matrix β_ij = P(voted finalist j | voted candidate i in P1)

**Sample sizes**:
| Election | Districts (n) |
|---|---|
| EG 2011 P2 | 2,172 |
| EG 2016 P2 | 2,069 |
| EG 2021 P2 | 1,873 |

**Posterior**: 4,000 MCMC draws. Point estimates = posterior mean. Uncertainty bands (±1 SD) stored in audit JSON.

### Comparison: Goodman OLS

Non-negative OLS regression (no intercept) run in parallel as a simpler benchmark. Goodman assumes spatial homogeneity of transfer rates — an assumption EI relaxes.

**Goodman R² (in-sample fit)**:
| Election | R²(Candidate 1) | R²(Fujimori) |
|---|---|---|
| EG 2011 (Humala vs Fujimori) | 0.9434 | 0.8597 |
| EG 2016 (PPK vs Fujimori) | 0.7924 | 0.8926 |
| EG 2021 (Castillo vs Fujimori) | 0.7270 | 0.8750 |

EI is preferred because it enforces the [0,1] constraint on β_ij and allows district-level heterogeneity; Goodman can produce out-of-bounds estimates in polarized regions.

### Audit

Full transfer matrices and MCMC diagnostics: `data/processed/vote_transfers_ei.json`  
Script: `scripts/compute_vote_transfers.py --method ei`

### Data sources

- EG 2011, 2016, 2026: [datosabiertos.gob.pe](https://datosabiertos.gob.pe) — ONPE open data
- EG 2021: [jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe](https://github.com/jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe)
- All vote counts: Official ONPE final results (actas procesadas 100%)

---

## Static Data

Historical elections without a live backend use pre-aggregated TypeScript constants:

| File | Election | Source |
|---|---|---|
| `elections-2011-p2-static.ts` | EG 2011 P2 · dept level | xlsx mesa-level → aggregated |
| `elections-2016-p2-static.ts` | EG 2016 P2 · dept level | CSV mesa-level → aggregated |
| `elections-2021-p2-static.ts` | EG 2021 P2 · dept level | CSV 86,488 mesas → aggregated |
| `elections-2026-p1-static.ts` | EG 2026 P1 · dept level | CSV district-level ONPE |

Aggregation scripts: `scripts/aggregate_dept_results.py`

---

## Neutrality policy

Per CLAUDE.md: all analysis is strictly descriptive. Anomalies are labelled "outlier estadístico", never "fraude" or "irregularidad". Qwen AI summaries cite statistics only and include no political interpretation.
