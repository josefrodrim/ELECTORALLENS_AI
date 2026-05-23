<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Frontend Agent Context — ElectoralLens AI

## Package manager
**pnpm only.** Never use npm or yarn.
```bash
pnpm dev          # dev server http://localhost:3000
pnpm build        # production build
pnpm add <pkg>    # install dependency
npx tsc --noEmit  # type check (use npx, not pnpm exec)
```

## Architecture

**App Router** (Next.js 16). Server components by default. Charts use `next/dynamic` + `ssr: false` via `ChartsSection.tsx` wrappers — never import Recharts or @nivo directly in server components.

```
src/
├── app/
│   ├── page.tsx              # Home — static election hub (no API dependency)
│   ├── 2011/page.tsx         # EG 2011 — uses ElectionCyclePage + CYCLES_BY_YEAR[2011]
│   ├── 2016/page.tsx         # EG 2016 — uses ElectionCyclePage + CYCLES_BY_YEAR[2016]
│   ├── 2021/page.tsx         # EG 2021 — uses ElectionCyclePage + CYCLES_BY_YEAR[2021]
│   ├── 2026/page.tsx         # EG 2026 — uses ElectionCyclePage + CYCLES_BY_YEAR[2026]
│   ├── keiko/page.tsx        # Patrón Keiko — historical analysis + 2026 P2 scenarios
│   ├── resultados/page.tsx   # Drill-down dept/province (API)
│   └── participacion/page.tsx # Turnout analysis (API)
├── components/
│   ├── CandidateAvatar.tsx         # Photo in circle with ideology-colored ring; initials fallback
│   ├── election/
│   │   └── ElectionCyclePage.tsx   # Shared component: renders P1 + Sankey + P2 for any cycle
│   ├── charts/
│   │   ├── ChartsSection.tsx       # All next/dynamic wrappers (always add new charts here)
│   │   ├── VoteFlowSankey.tsx      # @nivo/sankey — P1→P2 historical vote flow
│   │   ├── VoteFlow2026Sankey.tsx  # @nivo/sankey — 2026 P2 predicted flow (3 scenarios)
│   │   ├── KeikoTimeline.tsx       # Recharts BarChart — Keiko P1/P2 history
│   │   ├── VoteTransferBar.tsx     # Recharts BarChart — 2026 transfer scenarios
│   │   ├── CandidateBar.tsx        # Recharts — candidate results
│   │   ├── PolarizationMap.tsx     # Recharts ScatterChart — polarization
│   │   └── TurnoutRanking.tsx      # Recharts — turnout ranking
│   └── layout/
│       └── Header.tsx              # Nav: Resumen/EG2011/EG2016/EG2021/EG2026/Patrón Keiko
└── lib/
    ├── elections-data.ts    # CANONICAL data source — 4 election cycles, full types, KEIKO_TRAJECTORY
    ├── candidate-photos.ts  # Maps short_name → /candidates/filename.jpg (17 candidates)
    ├── vote-flows.ts        # Estimated P1→P2 flows for Sankey (2011/2016/2021)
    └── types.ts             # API types (ResultItem, CandidateResult)
```

## Canonical data: elections-data.ts

Single source of truth for all 4 election cycles. Use `CYCLES_BY_YEAR[year]` to get a cycle.

```typescript
ELECTION_CYCLES[]            // all 4 cycles ordered
CYCLES_BY_YEAR[2011|2016|2021|2026]
CYCLES_WITH_P2               // only cycles with completed P2
KEIKO_TRAJECTORY             // precomputed Keiko analysis array
```

Key types: `ElectionCycle`, `Round` (has `round_label: "Primera Vuelta"|"Segunda Vuelta"`), `Candidate` (has `votes`, `vote_pct`, `is_keiko`, `is_finalist`, `is_winner`, `ideology`).

**Vote counts:** Exact for 2026 P1 (ONPE API). Computed `round(pct/100 × valid)` for 2011/2016/2021.

## ElectionCyclePage component

`src/components/election/ElectionCyclePage.tsx` — renders a full election page. Accepts any `ElectionCycle`. Shows: page header → P1 round → Sankey (if flow data exists) → P2 round (or pending card for 2026). Adding a new year page is 4 lines.

## Adding a new chart

1. Write the chart component in `src/components/charts/MyChart.tsx` with `"use client"` at top
2. Add a `next/dynamic` import + export wrapper in `ChartsSection.tsx`
3. Use the wrapper in any server component

## Neutrality rule

Labels and copy must be descriptive only. No political framing. Anomalies = "outlier estadístico". Never use "fraude" or "irregularidad".

## What's pending

- Phase 3: Analytics — clustering, anomaly detection, polarization (backend FastAPI required)
- Phase 4: Qwen AI analyst via Ollama
- Phase 5: Docker + deploy
- `resultados/page.tsx` and `participacion/page.tsx` still need light-mode style update (currently API-only pages)
