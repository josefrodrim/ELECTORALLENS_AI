from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.geo import GeoLevel
from app.schemas.results import GeoChildrenOut, GeoUnitOut
from app.services import results_service
from app.utils.cache import cache_get, cache_set, make_key

router = APIRouter(prefix="/geo", tags=["geography"])


@router.get("/{level}", response_model=list[GeoUnitOut])
async def list_geo_units(level: GeoLevel, db: AsyncSession = Depends(get_db)):
    """List all geo units for a given level — used to populate map layers."""
    key = make_key("geo", level.value)
    cached = await cache_get(key)
    if cached:
        return cached

    data = await results_service.list_geo_by_level(db, level)
    await cache_set(key, [g.model_dump(mode="json") for g in data], ttl=3600)
    return data


@router.get("/{ubigeo}/children", response_model=GeoChildrenOut)
async def get_geo_children(ubigeo: str, db: AsyncSession = Depends(get_db)):
    """
    Returns direct children of a geo unit.
    Powers the drill-down: Peru (000000) → departments → provinces → districts.
    """
    key = make_key("geo_children", ubigeo)
    cached = await cache_get(key)
    if cached:
        return cached

    data = await results_service.get_geo_children(db, ubigeo)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Ubigeo '{ubigeo}' not found")

    await cache_set(key, data.model_dump(mode="json"), ttl=3600)
    return data
