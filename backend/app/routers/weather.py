from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import WeatherQuery
from app.schemas import (
    SearchRequest,
    SearchResponse,
    QueryUpdate,
    QueryListResponse,
    MessageResponse,
)
from app.services.geocoding import geocode
from app.services.weather import get_weather_forecast, get_weather_range
from app.services.wikipedia import get_wiki_summary
from app.services.export import generate_pdf
from app.utils.validators import validate_date_range

router = APIRouter(prefix="/api/weather", tags=["weather"])


# ── Helper ───────────────────────────────────────────────────────────────────


def _query_to_response(q: WeatherQuery) -> SearchResponse:
    """Convert ORM object to response schema."""
    return SearchResponse(
        id=q.id,
        location_query=q.location_query,
        query_type=q.query_type,
        resolved_name=q.resolved_name,
        latitude=q.latitude,
        longitude=q.longitude,
        country=q.country,
        country_code=q.country_code,
        date_start=q.date_start,
        date_end=q.date_end,
        current_weather=q.current_weather,
        forecast=q.forecast_data,
        hourly=q.hourly_data,
        wikipedia={"title": None, "summary": q.wiki_summary, "url": q.wiki_thumbnail}
        if q.wiki_summary
        else None,
        created_at=q.created_at,
        updated_at=q.updated_at,
    )


async def _fetch_weather(req_query, date_start, date_end, geo):
    """Dispatch to Mode A or Mode B based on whether dates are provided."""
    if date_start and date_end:
        # Mode B — date range
        return await get_weather_range(geo["lat"], geo["lon"], date_start, date_end)
    else:
        # Mode A — quick 7-day forecast
        return await get_weather_forecast(geo["lat"], geo["lon"])


# ── Search ───────────────────────────────────────────────────────────────────


@router.post("/search", response_model=SearchResponse)
async def search_weather(req: SearchRequest, db: Session = Depends(get_db)):
    """
    Full search flow: geocode → weather → wikipedia → persist.
    Mode A (no dates): 7-day forecast with hourly data.
    Mode B (with dates): specific date range with hourly data.
    """
    # Validate date range if provided
    try:
        validate_date_range(req.date_start, req.date_end)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 1. Geocode
    try:
        geo = await geocode(req.query)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoding service error: {str(e)}")

    # 2. Fetch weather (auto-dispatches Mode A or B)
    try:
        weather = await _fetch_weather(req.query, req.date_start, req.date_end, geo)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather service error: {str(e)}")

    # 3. Fetch Wikipedia info (synchronous — uses Wikipedia-API package)
    wiki = await run_in_threadpool(get_wiki_summary, geo["display_name"])

    # 4. Persist to database
    record = WeatherQuery(
        location_query=req.query,
        query_type="free_form",
        resolved_name=geo["display_name"],
        latitude=geo["lat"],
        longitude=geo["lon"],
        country=geo["country"],
        country_code=geo["country_code"],
        date_start=req.date_start,
        date_end=req.date_end,
        current_weather=weather["current"],
        forecast_data=weather["forecast"],
        hourly_data=weather["hourly"],
        wiki_summary=wiki.get("summary"),
        wiki_thumbnail=wiki.get("url"),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _query_to_response(record)


# ── READ — List ──────────────────────────────────────────────────────────────


@router.get("/queries", response_model=QueryListResponse)
def list_queries(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all saved weather queries, paginated."""
    total = db.query(WeatherQuery).count()
    queries = (
        db.query(WeatherQuery)
        .order_by(WeatherQuery.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return QueryListResponse(
        total=total,
        page=page,
        per_page=per_page,
        queries=[_query_to_response(q) for q in queries],
    )


# ── READ — Single ───────────────────────────────────────────────────────────


@router.get("/queries/{query_id}", response_model=SearchResponse)
def get_query(query_id: int, db: Session = Depends(get_db)):
    """Get a single weather query by ID."""
    q = db.query(WeatherQuery).filter(WeatherQuery.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
    return _query_to_response(q)


# ── UPDATE ───────────────────────────────────────────────────────────────────


@router.put("/queries/{query_id}", response_model=SearchResponse)
async def update_query(
    query_id: int, update: QueryUpdate, db: Session = Depends(get_db)
):
    """
    Update a weather query. If location changes, re-geocode and re-fetch weather.
    """
    q = db.query(WeatherQuery).filter(WeatherQuery.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    # Validate new date range
    new_start = update.date_start if update.date_start is not None else q.date_start
    new_end = update.date_end if update.date_end is not None else q.date_end
    try:
        validate_date_range(new_start, new_end)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    location_changed = (
        update.location_query is not None
        and update.location_query != q.location_query
    )
    dates_changed = (
        update.date_start != q.date_start or update.date_end != q.date_end
    )

    if location_changed:
        # Re-geocode
        try:
            geo = await geocode(update.location_query)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=502, detail=f"Geocoding service error: {str(e)}"
            )

        q.location_query = update.location_query
        q.resolved_name = geo["display_name"]
        q.latitude = geo["lat"]
        q.longitude = geo["lon"]
        q.country = geo["country"]
        q.country_code = geo["country_code"]

        # Re-fetch weather
        try:
            weather = await _fetch_weather(
                update.location_query, new_start, new_end,
                {"lat": geo["lat"], "lon": geo["lon"]}
            )
            q.current_weather = weather["current"]
            q.forecast_data = weather["forecast"]
            q.hourly_data = weather["hourly"]
        except Exception as e:
            raise HTTPException(
                status_code=502, detail=f"Weather service error: {str(e)}"
            )

        # Re-fetch Wikipedia (synchronous package, requires threadpool)
        wiki = await run_in_threadpool(get_wiki_summary, geo["display_name"])
        q.wiki_summary = wiki.get("summary")
        q.wiki_thumbnail = wiki.get("url")

    elif dates_changed:
        # Same location, just re-fetch weather for new date range
        try:
            weather = await _fetch_weather(
                q.location_query, new_start, new_end,
                {"lat": q.latitude, "lon": q.longitude}
            )
            q.current_weather = weather["current"]
            q.forecast_data = weather["forecast"]
            q.hourly_data = weather["hourly"]
        except Exception as e:
            raise HTTPException(
                status_code=502, detail=f"Weather service error: {str(e)}"
            )

    # Update date fields
    if update.date_start is not None:
        q.date_start = update.date_start
    if update.date_end is not None:
        q.date_end = update.date_end

    db.commit()
    db.refresh(q)

    return _query_to_response(q)


# ── DELETE ───────────────────────────────────────────────────────────────────


@router.delete("/queries/{query_id}", response_model=MessageResponse)
def delete_query(query_id: int, db: Session = Depends(get_db)):
    """Delete a weather query by ID."""
    q = db.query(WeatherQuery).filter(WeatherQuery.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    db.delete(q)
    db.commit()
    return MessageResponse(message="Query deleted successfully", id=query_id)


# ── Export PDF — All ─────────────────────────────────────────────────────────


@router.get("/queries/export/pdf")
def export_all_pdf(db: Session = Depends(get_db)):
    """Export all queries as a PDF document."""
    queries = (
        db.query(WeatherQuery).order_by(WeatherQuery.created_at.desc()).all()
    )
    pdf_bytes = generate_pdf(queries)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=weather_queries.pdf"},
    )


# ── Export PDF — Single ──────────────────────────────────────────────────────


@router.get("/queries/{query_id}/export/pdf")
def export_single_pdf(query_id: int, db: Session = Depends(get_db)):
    """Export a single query as a PDF document."""
    q = db.query(WeatherQuery).filter(WeatherQuery.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    pdf_bytes = generate_pdf([q])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=weather_query_{query_id}.pdf"
        },
    )
