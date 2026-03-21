from sqlalchemy import Column, Integer, String, Float, Date, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class WeatherQuery(Base):
    """Stores each weather search with its results."""

    __tablename__ = "weather_queries"

    id = Column(Integer, primary_key=True, index=True)
    location_query = Column(String(500), nullable=False, index=True)
    query_type = Column(String(20), nullable=False, default="free_form")
    resolved_name = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    country = Column(String(100))
    country_code = Column(String(10))
    date_start = Column(Date, nullable=True)
    date_end = Column(Date, nullable=True)
    current_weather = Column(JSON)
    forecast_data = Column(JSON)
    hourly_data = Column(JSON)
    wiki_summary = Column(Text)
    wiki_thumbnail = Column(String(1000))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<WeatherQuery(id={self.id}, location='{self.location_query}')>"
