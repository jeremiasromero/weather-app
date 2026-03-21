from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import date, datetime


# ── Request Schemas ──────────────────────────────────────────────────────────


class SearchRequest(BaseModel):
    """Body for POST /api/weather/search — free-form query only."""

    query: str = Field(..., max_length=500)
    date_start: Optional[date] = None
    date_end: Optional[date] = None

    @field_validator("query")
    @classmethod
    def query_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Location query cannot be empty")
        return v.strip()

    @field_validator("date_end")
    @classmethod
    def end_after_start(cls, v: Optional[date], info) -> Optional[date]:
        start = info.data.get("date_start")
        if v and start and v < start:
            raise ValueError("date_end must be on or after date_start")
        return v


class QueryUpdate(BaseModel):
    """Body for PUT /api/weather/queries/{id}"""

    location_query: Optional[str] = Field(None, max_length=500)
    date_start: Optional[date] = None
    date_end: Optional[date] = None

    @field_validator("location_query")
    @classmethod
    def query_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Location query cannot be empty")
        return v.strip() if v else v

    @field_validator("date_end")
    @classmethod
    def end_after_start(cls, v: Optional[date], info) -> Optional[date]:
        start = info.data.get("date_start")
        if v and start and v < start:
            raise ValueError("date_end must be on or after date_start")
        return v


# ── Response Schemas ─────────────────────────────────────────────────────────


class SearchResponse(BaseModel):
    id: int
    location_query: str
    query_type: str
    resolved_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    current_weather: Optional[Any] = None
    forecast: Optional[List[Any]] = None
    hourly: Optional[List[Any]] = None
    wikipedia: Optional[Any] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QueryListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    queries: List[SearchResponse]


class MessageResponse(BaseModel):
    message: str
    id: Optional[int] = None
