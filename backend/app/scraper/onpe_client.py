"""
Low-level async HTTP client for ONPE results API.

ONPE publishes election results at resultados.onpe.gob.pe.
Endpoint patterns vary per election; configure via ONPE_BASE_URL + election_code.

Rate limiting: ONPE_REQUEST_DELAY_MS between requests (default 500ms).
Retries: exponential backoff via tenacity (default 3 attempts).
"""
import asyncio
import json
import logging
from pathlib import Path

import httpx
from tenacity import (
    RetryError,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings

log = logging.getLogger(__name__)

# ONPE API paths per election (keyed by election_code)
def _endpoints(year: int, round_name: str) -> dict:
    base = f"/EleccionesGeneral/Presidente{year}{round_name}/json/Resultados"
    return {
        "national": f"{base}/ONPENacional.json",
        "department": f"{base}/ONPE{{ubigeo}}.json",
        "province": f"{base}/ONPE{{ubigeo}}.json",
        "district": f"{base}/ONPE{{ubigeo}}.json",
    }


ONPE_ENDPOINTS: dict[str, dict] = {
    "EG2011-P1": _endpoints(2011, "Primera"),
    "EG2011-P2": _endpoints(2011, "Segunda"),
    "EG2016-P1": _endpoints(2016, "Primera"),
    "EG2016-P2": _endpoints(2016, "Segunda"),
    "GP2021-P1": _endpoints(2021, "Primera"),
    "GP2021-P2": _endpoints(2021, "Segunda"),
    "EG2026-P1": _endpoints(2026, "Primera"),
    "EG2026-P2": _endpoints(2026, "Segunda"),
}


class ONPEClient:
    def __init__(self, election_code: str):
        if election_code not in ONPE_ENDPOINTS:
            available = list(ONPE_ENDPOINTS)
            raise ValueError(f"Unknown election_code '{election_code}'. Available: {available}")
        self._election_code = election_code
        self._endpoints = ONPE_ENDPOINTS[election_code]
        self._client = httpx.AsyncClient(
            base_url=settings.onpe_base_url,
            timeout=settings.onpe_timeout_seconds,
            headers={"User-Agent": "ElectoralLens-AI/1.0 (public-data-research)"},
            follow_redirects=True,
        )
        self._delay = settings.onpe_request_delay_ms / 1000.0

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self._client.aclose()

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        stop=stop_after_attempt(settings.onpe_max_retries),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        reraise=True,
    )
    async def _get_json(self, path: str) -> dict:
        await asyncio.sleep(self._delay)
        response = await self._client.get(path)
        response.raise_for_status()
        return response.json()

    async def fetch_national(self) -> dict | None:
        path = self._endpoints["national"]
        try:
            return await self._get_json(path)
        except (httpx.HTTPStatusError, RetryError) as e:
            log.error("Failed to fetch national results: %s", e)
            return None

    async def fetch_by_ubigeo(self, ubigeo: str, level: str) -> dict | None:
        template = self._endpoints.get(level)
        if not template:
            raise ValueError(f"No endpoint configured for level '{level}'")
        path = template.format(ubigeo=ubigeo)
        try:
            return await self._get_json(path)
        except (httpx.HTTPStatusError, RetryError) as e:
            log.warning("Failed to fetch ubigeo=%s level=%s: %s", ubigeo, level, e)
            return None

    async def save_raw(self, data: dict, ubigeo: str) -> Path:
        """Persist raw JSON to disk for auditability."""
        raw_dir = Path(settings.raw_data_path) / self._election_code
        raw_dir.mkdir(parents=True, exist_ok=True)
        out_path = raw_dir / f"{ubigeo}.json"
        out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
        return out_path
