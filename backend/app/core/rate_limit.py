"""Fixed-window rate limiter.

Uses Redis (atomic INCR + EXPIRE) when available so limits are shared across all
API replicas. Falls back to an in-process window when Redis is unreachable,
which keeps local development and tests working without external services.
"""

import threading
import time

from app.core.logging import get_logger

logger = get_logger("rate_limit")


class _InMemoryWindow:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._buckets: dict[str, tuple[int, float]] = {}

    def incr(self, key: str, window_seconds: int) -> int:
        now = time.time()
        with self._lock:
            count, reset_at = self._buckets.get(key, (0, now + window_seconds))
            if now >= reset_at:
                count, reset_at = 0, now + window_seconds
            count += 1
            self._buckets[key] = (count, reset_at)
            return count


class RateLimiter:
    def __init__(self) -> None:
        self._memory = _InMemoryWindow()
        self._redis = None
        self._redis_checked = False

    def _get_redis(self):
        if self._redis_checked:
            return self._redis
        self._redis_checked = True
        try:
            from app.db.redis import get_redis

            client = get_redis()
            client.ping()
            self._redis = client
        except Exception:  # noqa: BLE001 - Redis is optional infrastructure
            logger.warning("rate_limiter_redis_unavailable_using_memory")
            self._redis = None
        return self._redis

    def hit(self, key: str, limit: int, window_seconds: int = 60) -> tuple[bool, int]:
        """Register a hit. Returns ``(allowed, current_count)``."""
        redis = self._get_redis()
        if redis is not None:
            try:
                pipe = redis.pipeline()
                pipe.incr(key)
                pipe.expire(key, window_seconds)
                count = int(pipe.execute()[0])
            except Exception:  # noqa: BLE001 - degrade to memory on transient errors
                count = self._memory.incr(key, window_seconds)
        else:
            count = self._memory.incr(key, window_seconds)
        return count <= limit, count


rate_limiter = RateLimiter()
