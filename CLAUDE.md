# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ElectoralLens AI is a production-grade electoral intelligence platform that ingests, transforms, and analyzes public ONPE (Peru's electoral authority) results using AI, geospatial analytics, clustering, anomaly detection, and LLM-generated neutral summaries via Qwen.

**Hard constraint**: All analysis must be politically neutral and strictly descriptive. Never imply fraud. Anomalies are described as "statistical outliers" only. Qwen outputs must cite statistics and avoid persuasive language.

---

## Repository Structure

```
ElectoralLens_AI/
├── frontend/          # Next.js + TypeScript + TailwindCSS + shadcn/ui
├── backend/           # FastAPI + Python 3.12
│   └── app/
│       ├── api/       # Route handlers (versioned under /api/v1/)
│       ├── core/      # Settings, config, security
│       ├── services/  # Business logic layer
│       ├── analytics/ # Polarization, participation, clustering, anomaly, timeline
│       ├── ai/        # Qwen integration, prompt templates
│       ├── scraper/   # ONPE scraper with retry/incremental logic
│       ├── models/    # SQLAlchemy ORM models
│       ├── db/        # Session, migrations (Alembic)
│       ├── schemas/   # Pydantic request/response schemas
│       └── utils/     # Shared helpers
├── data/              # Raw JSON from scraper, processed datasets
├── scripts/           # One-off ETL, seed, migration scripts
├── infrastructure/    # Docker, docker-compose, Prometheus, Grafana configs
└── docs/              # Architecture diagrams, API docs
```

---

## Common Commands

### Backend

```bash
# Install dependencies
cd backend && pip install -r requirements.txt

# Run dev server (hot reload)
uvicorn app.main:app --reload --port 8000

# Run all tests
pytest

# Run a single test file
pytest tests/test_analytics.py -v

# Run a single test by name
pytest tests/test_analytics.py::test_polarization_score -v

# Lint + format
ruff check . && ruff format .

# Type check
mypy app/

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Run scraper manually
python -m app.scraper.onpe_scraper --level national
python -m app.scraper.onpe_scraper --level department --id 15  # Lima
```

### Frontend

```bash
# Install dependencies
cd frontend && npm install

# Dev server
npm run dev        # http://localhost:3000

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

### Infrastructure

```bash
# Start full stack (PostgreSQL, Redis, backend, frontend, Prometheus, Grafana)
docker-compose up --build

# Start only dependencies (DB + Redis)
docker-compose up postgres redis

# Run Alembic inside Docker
docker-compose exec backend alembic upgrade head
```

---

## Architecture: Key Data Flows

### 1. Scraping → Storage
`app/scraper/` → raw JSON saved to `data/raw/` → normalized rows inserted into PostgreSQL via SQLAlchemy. The scraper is incremental: it tracks `last_processed_acta` and only fetches new records. Retries use exponential backoff.

### 2. ETL → Analytics
`scripts/etl.py` reads raw tables, computes derived fields (turnout %, winning margin, valid vote ratio), and writes to analytics tables. The five analytics modules live in `app/analytics/`:
- `polarization.py` — polarization score per region
- `participation.py` — turnout, null/blank vote ranking
- `clustering.py` — KMeans (default) or HDBSCAN over `[turnout, candidate_pct, null_pct, winning_margin]`
- `anomaly.py` — Isolation Forest + Z-score; output label is `outlier_behavior`, never "fraud"
- `timeline.py` — time-series of vote accumulation and leadership changes per acta batch

### 3. API → Frontend
FastAPI routes in `app/api/v1/` expose drill-down endpoints:
```
GET /api/v1/results/{level}          # level: national | department | province | district
GET /api/v1/analytics/clustering
GET /api/v1/analytics/anomalies
GET /api/v1/analytics/polarization
GET /api/v1/analytics/timeline
GET /api/v1/ai/summary                # Qwen-generated neutral summary
```
All responses are Pydantic-validated. Redis caches heavy analytics queries (TTL configurable in `app/core/config.py`).

### 4. AI Analyst (Qwen)
`app/ai/analyst.py` builds prompts from pre-approved templates in `app/ai/prompts/`. Templates enforce neutrality constraints. Qwen is called via the Qwen API (or local Ollama). Every AI response must include the statistics it references — no interpretation beyond what the data shows.

### 5. Geospatial
`geopandas` joins electoral results with GeoJSON shapefiles (stored in `data/geo/`) for choropleth rendering. The frontend uses Leaflet (default) or Mapbox for interactive maps with drill-down: Peru → Department → Province → District.

---

## Tech Stack Specifics

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, Recharts, Leaflet |
| Backend | FastAPI, Python 3.12, Pydantic v2, SQLAlchemy 2.x |
| Database | PostgreSQL |
| Cache | Redis |
| AI | Qwen (main), LangChain optional |
| ML | pandas, scikit-learn, geopandas, numpy, scipy |
| Infra | Docker, docker-compose |
| Observability | Prometheus + Grafana, structured logging middleware |
| Linting | ruff (Python), ESLint + Prettier (TS) |
| Testing | pytest (backend), Vitest or Jest (frontend) |
| Migrations | Alembic |

---

## Development Phases

The project is built in five phases. Always check which phase is active before adding features out of sequence:

- **Phase 1** — Scraper, DB schema, ETL, REST API
- **Phase 2** — Dashboard UI, maps, charts, filtering
- **Phase 3** — Clustering, anomaly detection, polarization metrics
- **Phase 4** — Qwen AI analyst, natural language summaries
- **Phase 5** — Observability, optimization, deployment, docs

---

## Neutrality Rules (enforced throughout)

- Anomaly detection output: use `"outlier_behavior"` or `"statistical anomaly"`, never `"fraud"` or `"irregularity"`
- Qwen prompts: must include a system message asserting neutrality; all outputs are descriptive, not prescriptive
- Frontend copy: no political framing; labels describe data only (e.g., "Candidate A received 34.2% of valid votes in Lima")
- Analytics: report what the data shows, not what it might mean politically
