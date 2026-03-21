import time
import httpx
import asyncio
from app.config import settings

# Nominatim requires a custom User-Agent and 1 req/sec rate limit.
_last_request_time = 0.0


async def geocode(query: str) -> dict:
    """
    Convert a free-form location string to coordinates via Nominatim.
    Returns dict with keys: lat, lon, display_name, country, country_code
    Raises ValueError if location not found.
    """
    global _last_request_time

    now = time.monotonic()
    elapsed = now - _last_request_time
    if elapsed < 1.0:
        await asyncio.sleep(1.0 - elapsed)
    _last_request_time = time.monotonic()

    url = f"{settings.NOMINATIM_BASE_URL}/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
    }
    headers = {"User-Agent": "WeatherApp/1.0 (PMAccelerator Technical Assessment)"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

    if not data:
        raise ValueError(f"Location not found: '{query}'")

    result = data[0]
    address = result.get("address", {})

    return {
        "lat": float(result["lat"]),
        "lon": float(result["lon"]),
        "display_name": result.get("display_name", query),
        "country": address.get("country", ""),
        "country_code": address.get("country_code", "").upper(),
    }
