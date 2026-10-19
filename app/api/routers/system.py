from fastapi import APIRouter

from ...config import Settings
from ...pi_rpc import PiRuntimeManager
from ..contracts import HealthResponse


def create_router(settings: Settings, runtime: PiRuntimeManager) -> APIRouter:
    router = APIRouter(tags=["system"])

    @router.get("/api/health", response_model=HealthResponse)
    async def health():
        active_processes = sum(
            1
            for client in runtime.clients.values()
            if client.process and client.process.returncode is None
        )
        return {
            "ok": True,
            "active_processes": active_processes,
            "upload_limits": {
                "max_files": settings.max_upload_files,
                "max_bytes": settings.max_upload_bytes,
            },
        }

    return router
