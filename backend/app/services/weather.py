import httpx
from datetime import date
from app.config import settings

# WMO Weather interpretation codes → human-readable descriptions
WMO_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}

# Shared variable lists
_CURRENT_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
]
_HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "precipitation_probability",
    "precipitation",
]
_DAILY_VARS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "apparent_temperature_max",
    "apparent_temperature_min",
    "precipitation_probability_max",
    "precipitation_sum",
    "weather_code",
]


def _describe_code(code: int) -> str:
    return WMO_CODES.get(code, f"Unknown ({code})")


def _parse_current(data: dict) -> dict:
    """Parse current weather block from Open-Meteo response."""
    raw = data.get("current", {})
    return {
        "temperature": raw.get("temperature_2m"),
        "apparent_temperature": raw.get("apparent_temperature"),
        "humidity": raw.get("relative_humidity_2m"),
        "precipitation": raw.get("precipitation"),
        "weather_code": raw.get("weather_code"),
        "weather_description": _describe_code(raw.get("weather_code", -1)),
        "windspeed": raw.get("wind_speed_10m"),
    }


def _parse_daily(data: dict) -> list:
    """Parse daily forecast block from Open-Meteo response."""
    daily = data.get("daily", {})
    dates = daily.get("time", [])
    max_temps = daily.get("temperature_2m_max", [])
    min_temps = daily.get("temperature_2m_min", [])
    app_max = daily.get("apparent_temperature_max", [])
    app_min = daily.get("apparent_temperature_min", [])
    precip_prob = daily.get("precipitation_probability_max", [])
    precip_sum = daily.get("precipitation_sum", [])
    codes = daily.get("weather_code", [])

    forecast = []
    for i in range(len(dates)):
        code = codes[i] if i < len(codes) else None
        forecast.append({
            "date": dates[i],
            "temp_max": max_temps[i] if i < len(max_temps) else None,
            "temp_min": min_temps[i] if i < len(min_temps) else None,
            "apparent_temp_max": app_max[i] if i < len(app_max) else None,
            "apparent_temp_min": app_min[i] if i < len(app_min) else None,
            "precipitation_probability": precip_prob[i] if i < len(precip_prob) else None,
            "precipitation_sum": precip_sum[i] if i < len(precip_sum) else None,
            "weather_code": code,
            "weather_description": _describe_code(code) if code is not None else None,
        })
    return forecast


def _parse_hourly(data: dict) -> list:
    """Parse hourly data block from Open-Meteo response for chart plotting."""
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    humidity = hourly.get("relative_humidity_2m", [])
    apparent = hourly.get("apparent_temperature", [])
    precip_prob = hourly.get("precipitation_probability", [])
    precip = hourly.get("precipitation", [])

    result = []
    for i in range(len(times)):
        result.append({
            "time": times[i],
            "temperature": temps[i] if i < len(temps) else None,
            "apparent_temperature": apparent[i] if i < len(apparent) else None,
            "humidity": humidity[i] if i < len(humidity) else None,
            "precipitation_probability": precip_prob[i] if i < len(precip_prob) else None,
            "precipitation": precip[i] if i < len(precip) else None,
        })
    return result


# ═══════════════════════════════════════════════════════════════════════════
# Mode A — Quick Forecast (no dates specified)
# ═══════════════════════════════════════════════════════════════════════════


async def get_weather_forecast(lat: float, lon: float) -> dict:
    """
    Mode A: Fetch 7-day forecast with current + daily + hourly data.
    No start_date / end_date — uses forecast_days only.

    Returns dict with 'current', 'forecast' (daily), and 'hourly' keys.
    """
    url = f"{settings.OPEN_METEO_BASE_URL}/forecast"

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ",".join(_CURRENT_VARS),
        "hourly": ",".join(_HOURLY_VARS),
        "daily": ",".join(_DAILY_VARS),
        "timezone": "auto",
        "forecast_days": 7,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    return {
        "current": _parse_current(data),
        "forecast": _parse_daily(data),
        "hourly": _parse_hourly(data),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Mode B — Date Range (start_date + end_date specified)
# ═══════════════════════════════════════════════════════════════════════════


async def get_weather_range(
    lat: float, lon: float, date_start: date, date_end: date
) -> dict:
    """
    Mode B: Fetch weather for a specific date range (historical or future).
    Uses start_date / end_date — NO forecast_days to avoid 400 errors.

    Returns dict with 'current', 'forecast' (daily), and 'hourly' keys.
    """
    url = f"{settings.OPEN_METEO_BASE_URL}/forecast"

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ",".join(_CURRENT_VARS),
        "hourly": ",".join(_HOURLY_VARS),
        "daily": ",".join(_DAILY_VARS),
        "timezone": "auto",
        "start_date": date_start.isoformat(),
        "end_date": date_end.isoformat(),
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    return {
        "current": _parse_current(data),
        "forecast": _parse_daily(data),
        "hourly": _parse_hourly(data),
    }
