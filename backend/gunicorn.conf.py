"""
Gunicorn configuration for Cerberus.

Tuned for a rate-limit service where low latency matters more than throughput.
Worker count should be kept modest — most of the heavy lifting is done by Redis,
so we're rarely CPU-bound.
"""

import multiprocessing
import os

# ---------------------------------------------------------------------------
# Server socket
# ---------------------------------------------------------------------------
bind = os.getenv("CERBERUS_BIND", "0.0.0.0:8000")
backlog = 2048

# ---------------------------------------------------------------------------
# Workers
# ---------------------------------------------------------------------------
# Rule of thumb: 2-4 workers per core for an I/O-bound service.
# In Kubernetes, set this via CERBERUS_WORKERS to match resource limits.
workers = int(os.getenv("CERBERUS_WORKERS", min(multiprocessing.cpu_count() * 2 + 1, 9)))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000

# ---------------------------------------------------------------------------
# Timeouts
# ---------------------------------------------------------------------------
timeout = 30
keepalive = 5
graceful_timeout = 15

# ---------------------------------------------------------------------------
# Logging — let structlog handle formatting, keep gunicorn quiet
# ---------------------------------------------------------------------------
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("CERBERUS_LOG_LEVEL", "info")

# ---------------------------------------------------------------------------
# Process naming
# ---------------------------------------------------------------------------
proc_name = "cerberus"

# ---------------------------------------------------------------------------
# Server mechanics
# ---------------------------------------------------------------------------
preload_app = True  # share memory across workers
max_requests = 10_000  # restart workers periodically to avoid memory leaks
max_requests_jitter = 1_000

# ---------------------------------------------------------------------------
# Hooks
# ---------------------------------------------------------------------------

def on_starting(server):  # noqa: ARG001
    """Called just before the master process is initialized."""
    pass


def post_fork(server, worker):  # noqa: ARG001
    """Called just after a worker has been forked — good place for per-worker init."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)
