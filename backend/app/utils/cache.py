"""
Redis cache utility.

Usage:
    from app.utils.cache import cache_get, cache_set, make_key

    key = make_key("results", election_code, level)
    data = await cache_get(key)
    if data is None:
        data = await expensive_query()
        await cache_set(key, data)
"""
import json
import logging

import redis.asyncio as aioredis

from app.core.config import settings

log = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def make_key(*parts: str) -> str:
    return "electorallens:" + ":".join(str(p) for p in parts)


async def cache_get(key: str) -> dict | list | None:
    try:
        r = await get_redis()
        raw = await r.get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        log.warning("Cache get failed key=%s: %s", key, e)
        return None


async def cache_set(key: str, value: dict | list, ttl: int | None = None) -> None:
    try:
        r = await get_redis()
        await r.set(key, json.dumps(value, default=str), ex=ttl or settings.cache_ttl_seconds)
    except Exception as e:
        log.warning("Cache set failed key=%s: %s", key, e)


async def cache_delete(key: str) -> None:
    try:
        r = await get_redis()
        await r.delete(key)
    except Exception as e:
        log.warning("Cache delete failed key=%s: %s", key, e)
