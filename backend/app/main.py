import logging

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1 import elections, geo, results
from app.core.config import settings

logging.basicConfig(level=settings.log_level)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
log = structlog.get_logger(__name__)

app = FastAPI(
    title="ElectoralLens AI",
    description="Electoral intelligence platform — ONPE data analytics API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "version": "0.1.0"}


app.include_router(elections.router, prefix="/api/v1")
app.include_router(results.router, prefix="/api/v1")
app.include_router(geo.router, prefix="/api/v1")
