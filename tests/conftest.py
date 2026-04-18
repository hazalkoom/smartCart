import os
import subprocess
import time
from pathlib import Path

import pytest
import requests


BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
HEALTH_URL = "http://localhost:5000/api/v1/health"

_backend_process = None


def _autostart_enabled() -> bool:
    value = str(os.getenv("PYTEST_AUTOSTART_BACKEND", "1")).strip().lower()
    return value not in {"0", "false", "no", "off"}


def _backend_is_healthy() -> bool:
    try:
        response = requests.get(HEALTH_URL, timeout=2)
        return response.status_code == 200
    except requests.RequestException:
        return False


def _backend_executable() -> str:
    if os.name == "nt":
        return "npm.cmd"
    return "npm"


def _start_backend() -> subprocess.Popen:
    global _backend_process

    if _backend_process and _backend_process.poll() is None:
        return _backend_process

    env = os.environ.copy()
    env.setdefault("NODE_ENV", "development")

    _backend_process = subprocess.Popen(
        [_backend_executable(), "run", "start"],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    deadline = time.monotonic() + 90
    while time.monotonic() < deadline:
        if _backend_process.poll() is not None:
            raise RuntimeError(f"Backend exited early with code {_backend_process.returncode}")
        if _backend_is_healthy():
            return _backend_process
        time.sleep(1)

    _backend_process.terminate()
    raise RuntimeError("Backend did not become healthy within 90 seconds")


@pytest.fixture(scope="session", autouse=True)
def ensure_backend_running():
    if not _backend_is_healthy():
        if not _autostart_enabled():
            raise RuntimeError("Backend is not healthy and PYTEST_AUTOSTART_BACKEND is disabled")
        _start_backend()

    yield

    global _backend_process
    if _backend_process and _backend_process.poll() is None:
        _backend_process.terminate()
        try:
            _backend_process.wait(timeout=20)
        except subprocess.TimeoutExpired:
            _backend_process.kill()
            _backend_process.wait(timeout=10)


@pytest.fixture(autouse=True)
def recover_backend_if_needed():
    if _autostart_enabled() and not _backend_is_healthy():
        _start_backend()
