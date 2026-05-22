import logging
import time
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Callable

from fastapi import FastAPI, Request, Response, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import init_db, close_db
from app.api import (
    auth,
    requisitions,
    documents,
    tenders,
    vendors,
    orders,
    post_orders,
    messages,
    admin,
    dashboard,
    public,
    workflow,
)

settings = get_settings()


def run_migrations():
    try:
        from alembic.config import Config
        from alembic import command
        import os

        alembic_cfg = Config(
            os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
        )
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations applied successfully")
    except Exception as e:
        logger.warning(f"Migration check: {e}")


logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.time()

        logger.info(
            f"Request started | ID: {request_id} | "
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )

        try:
            response = await call_next(request)

            duration = time.time() - start_time
            logger.info(
                f"Request completed | ID: {request_id} | "
                f"Method: {request.method} | "
                f"Path: {request.url.path} | "
                f"Status: {response.status_code} | "
                f"Duration: {duration:.3f}s"
            )

            response.headers["X-Request-ID"] = request_id
            return response

        except Exception as exc:
            duration = time.time() - start_time
            logger.error(
                f"Request failed | ID: {request_id} | "
                f"Method: {request.method} | "
                f"Path: {request.url.path} | "
                f"Error: {str(exc)} | "
                f"Duration: {duration:.3f}s"
            )
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{'=' * 50}")
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {'Development' if settings.debug else 'Production'}")
    logger.info(f"{'=' * 50}")

    try:
        if settings.debug:
            run_migrations()
        await init_db()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

    yield

    logger.info("Shutting down...")
    await close_db()
    logger.info("Database connections closed")
    logger.info(f"{settings.app_name} stopped")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Supply Chain Management Intranet API",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

app.add_middleware(
    RequestLoggingMiddleware,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"][1:] if isinstance(loc, str))
        errors.append(
            {
                "field": field or "body",
                "message": error["msg"],
                "type": error["type"],
            }
        )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Request validation failed",
            "details": errors,
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Database Error",
            "message": "A database operation failed",
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "message": exc.detail,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
        },
    )


app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(
    requisitions.router, prefix="/api/requisitions", tags=["Requisitions"]
)
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(tenders.router, prefix="/api/tenders", tags=["Tenders"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(post_orders.router, prefix="/api/post-orders", tags=["Post-Orders"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(public.router, prefix="/api/public", tags=["Public"])
app.include_router(workflow.router, prefix="/api/workflow", tags=["Workflow"])


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "timestamp": str(datetime.now(timezone.utc)),
    }


@app.get("/api/health/db")
async def db_health_check():
    from app.database import check_db_health

    is_healthy = await check_db_health()
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "database": "connected" if is_healthy else "disconnected",
        "timestamp": str(datetime.now(timezone.utc)),
    }


@app.get("/api/info")
async def app_info():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": "development" if settings.debug else "production",
        "features": {
            "docs": settings.debug,
            "debug_mode": settings.debug,
        },
    }
