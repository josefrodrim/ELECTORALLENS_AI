from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.geo import GeoLevel
from app.schemas.results import ResultListOut, ResultOut
from app.services import results_service
from app.utils.cache import cache_get, cache_set, make_key

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/{level}", response_model=ResultListOut)
async def get_results_by_level(
    level: GeoLevel,
    election: str = Query(..., description="Election code, e.g. GP2021-P1"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns all results for a geographic level in a given election.
    Use for overview maps and comparison tables.
    """
    key = make_key("results", election, level.value)
    cached = await cache_get(key)
    if cached:
        return cached

    data = await results_service.get_results_by_level(db, election, level)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Election '{election}' not found")

    serialized = data.model_dump(mode="json")
    await cache_set(key, serialized)
    return data


@router.get("/ubigeo/{ubigeo}", response_model=ResultOut)
async def get_result_by_ubigeo(
    ubigeo: str,
    election: str = Query(..., description="Election code, e.g. GP2021-P1"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the result for a specific geographic unit.
    Powers drill-down navigation: click a region → fetch its ubigeo result.
    """
    key = make_key("result", election, ubigeo)
    cached = await cache_get(key)
    if cached:
        return cached

    data = await results_service.get_result_by_ubigeo(db, election, ubigeo)
    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"No result found for ubigeo='{ubigeo}' in election='{election}'",
        )

    serialized = data.model_dump(mode="json")
    await cache_set(key, serialized)
    return data
