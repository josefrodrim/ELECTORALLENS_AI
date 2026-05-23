from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.results import ElectionOut
from app.services import results_service
from app.utils.cache import cache_get, cache_set, make_key

router = APIRouter(prefix="/elections", tags=["elections"])


@router.get("", response_model=list[ElectionOut])
async def list_elections(db: AsyncSession = Depends(get_db)):
    key = make_key("elections")
    cached = await cache_get(key)
    if cached:
        return cached

    data = await results_service.list_elections(db)
    serialized = [e.model_dump(mode="json") for e in data]
    await cache_set(key, serialized)
    return data
