"""
Microsecond-precision time helpers.

Redis Lua scripts operate in microseconds to avoid floating-point drift
over long windows.  These helpers make it easy to stay consistent across
the Python side.
"""

from __future__ import annotations

import time


def now_microseconds() -> int:
    """Return the current wall-clock time in microseconds since the epoch."""
    return int(time.time() * 1_000_000)


def seconds_to_microseconds(seconds: int | float) -> int:
    """Convert seconds to microseconds."""
    return int(seconds * 1_000_000)


def microseconds_to_milliseconds(us: int) -> int:
    """Convert microseconds to whole milliseconds (ceiling)."""
    return -(-us // 1000)  # ceiling division without importing math


def milliseconds_to_seconds_ceil(ms: int) -> int:
    """Convert milliseconds to whole seconds (ceiling), used for Retry-After header."""
    return -(-ms // 1000)
