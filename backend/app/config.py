from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    DATABASE_URL: str
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    NOMINATIM_BASE_URL: str = "https://nominatim.openstreetmap.org"
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    WIKIPEDIA_BASE_URL: str = "https://en.wikipedia.org/api/rest_v1"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
