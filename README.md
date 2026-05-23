# ElectoralLens AI

Plataforma de inteligencia electoral para Perú. Ingesta, transforma y analiza resultados públicos de la ONPE usando análisis geoespacial, regresión ecológica y visualizaciones interactivas.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, TypeScript, TailwindCSS, shadcn/ui, @nivo/sankey |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2, Pydantic v2 |
| Base de datos | PostgreSQL + Redis |
| ML / Estadística | pandas, scikit-learn, scipy (Goodman OLS) |
| Infra | Docker, docker-compose, Prometheus, Grafana |

## Inicio rápido

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && pnpm install && pnpm dev   # http://localhost:3000
```

---

## Dataset público — `data/processed/resultados_presidenciales_peru.csv`

**86,367 filas · 19 columnas · 13.4 MB**

Cubre las elecciones presidenciales peruanas de 2011, 2016, 2021 y 2026, primera y segunda vuelta, a nivel de distrito administrativo (ubigeo INEI).

### Cobertura

| Año | Vuelta | Nivel | Distritos | Candidatos | Fuente |
|-----|--------|-------|-----------|------------|--------|
| 2011 | P1 | distrito | 2,172 | 6 | ONPE datos abiertos (XLSX) |
| 2011 | P2 | distrito | 2,175 | 2 | ONPE datos abiertos (XLSX) |
| 2016 | P1 | distrito | 2,073 | 6 | ONPE datos abiertos (CSV) |
| 2016 | P2 | distrito | 2,071 | 2 | ONPE datos abiertos (CSV) |
| 2021 | P1 | distrito | 1,874 | 11 | jmcastagnetto / GitHub |
| 2021 | P2 | distrito | 1,874 | 2 | jmcastagnetto / GitHub |
| 2026 | P1 | distrito | 1,891 | 8 | ONPE REST API (`resultadoelectoral.onpe.gob.pe`) |

### Esquema

```
ubigeo           — Código INEI de 6 dígitos (ej. 150101 = Lima · Lima · Lima)
departamento     — Nombre del departamento
provincia        — Nombre de la provincia
distrito         — Nombre del distrito
nivel_geo        — "distrito" (o "nacional" para filas agregadas)
anio             — 2011 | 2016 | 2021 | 2026
vuelta           — "P1" | "P2"
fecha            — Fecha de la elección (YYYY-MM-DD)
partido          — Nombre del partido político
candidato        — Nombre corto del candidato
ideologia        — right | center-right | center | center-left | left
votos            — Votos válidos obtenidos
pct_validos      — Porcentaje sobre votos válidos del distrito
electores_habil  — Electores habilitados
votos_emitidos   — Total votos emitidos (válidos + nulos + blancos)
votos_validos    — Total votos válidos del distrito
votos_nulos      — Votos nulos
votos_blancos    — Votos en blanco
fuente           — URL de origen del dato
```

### Notas metodológicas

- **2026 P1**: datos scrapeados de la API REST de ONPE (`resultadoelectoral.onpe.gob.pe`, 100% actas contabilizadas, 2026-04-11). El total por distrito excluye las ~2,543 actas del extranjero (`idAmbitoGeografico=1`), por eso el agregado nacional queda ~2% por debajo del total oficial (16,738,039 votos válidos).
- **2021 P1**: el CSV "Versión PCM" de ONPE solo tenía 30 filas (nivel departamento); se reemplazó con los datos de [jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe](https://github.com/jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe) (1,874 distritos, ~95% de actas).
- **2021 P2 ubigeo**: la fuente jmcastagnetto no incluye códigos ubigeo; los distritos son identificables por `departamento + provincia + distrito`.
- **2011/2016**: filtro aplicado sobre actas con `DESCRIP_ESTADO_ACTA IN ('ACTA ELECTORAL NORMAL', 'ACTA ELECTORAL RESUELTA', 'CONTABILIZADA')`. Los totales quedan ~2–4% por debajo del oficial por el filtrado de actas observadas.

---

## Flujos de votos P1 → P2 (Sankey)

Los diagramas de Sankey para 2011, 2016 y 2021 muestran la transferencia estimada de votos entre candidatos eliminados y los dos finalistas usando **regresión ecológica de Goodman (OLS sin intercepto, coeficientes no negativos)**.

**Método:**

```
q_j[d] = Σ_i β_ij × p_i[d]
```

Donde `p_i[d]` = votos_i_P1 / electores_habilitados en el distrito `d`, y `q_j[d]` = votos_j_P2 / electores_habilitados. Los coeficientes `β_ij` estiman la fracción del electorado de cada candidato P1 que apoyó a cada finalista en P2.

**Datos:** resultados oficiales ONPE a nivel de mesa → agregados por distrito (~1,800 distritos por elección).  
**Script:** `scripts/compute_vote_transfers.py`

---

## Scripts ETL

| Script | Descripción |
|--------|-------------|
| `scripts/compute_vote_transfers.py` | Corre la regresión ecológica de Goodman sobre los datos ONPE por distrito. Genera las matrices de transferencia de votos para 2011, 2016 y 2021. |
| `scripts/build_master_csv.py` | Consolida P1+P2 de 2011–2021 y P1 de 2026 en el CSV público único. Lee de `data/raw/onpe/` y escribe a `data/processed/`. |
| `scripts/seed_elections.py` | Siembra la base de datos PostgreSQL con los ciclos electorales. |
| `scripts/seed_geo.py` | Siembra datos geográficos (departamentos, provincias, distritos). |

### Cómo obtener los datos crudos de 2026

Los datos de 2026 P1 por distrito se obtienen desde la API pública de ONPE:

```
GET https://resultadoelectoral.onpe.gob.pe/presentacion-backend/
  ubigeos/departamentos?idEleccion=10&idAmbitoGeografico=1
  ubigeos/provincias?idEleccion=10&idAmbitoGeografico=1&idUbigeoDepartamento={ubigeo_dept}
  ubigeos/distritos?idEleccion=10&idAmbitoGeografico=1&idUbigeoProvincia={ubigeo_prov}

  resumen-general/totales?idAmbitoGeografico=1&idEleccion=10
    &tipoFiltro=ubigeo_nivel_03
    &idUbigeoDepartamento={dept}&idUbigeoProvincia={prov}&idUbigeoDistrito={dist}

  eleccion-presidencial/participantes-ubicacion-geografica-nombre
    ?tipoFiltro=ubigeo_nivel_03&idAmbitoGeografico=1
    &ubigeoNivel1={dept}&ubigeoNivel2={prov}&ubigeoNivel3={dist}&idEleccion=10
```

`idEleccion=10` = Elección Presidencial EG2026. `idAmbitoGeografico=1` = Perú (excluye extranjero).

---

## Fuentes de datos

| Fuente | URL |
|--------|-----|
| ONPE datos abiertos (2011–2016) | https://www.datosabiertos.gob.pe |
| ONPE resultados 2021 (jmcastagnetto) | https://github.com/jmcastagnetto/2021-elecciones-generales-peru-datos-de-onpe |
| ONPE API resultados 2026 | https://resultadoelectoral.onpe.gob.pe |

---

## Neutralidad política

Todo análisis es estrictamente descriptivo. Las anomalías estadísticas se describen como "outlier estadístico", nunca como fraude o irregularidad. Las visualizaciones muestran datos; no emiten juicios políticos.
