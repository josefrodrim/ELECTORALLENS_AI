from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_env: str = "development"
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql+asyncpg://electorallens:electorallens@localhost:5432/electorallens"
    database_url_sync: str = "postgresql+psycopg2://electorallens:electorallens@localhost:5432/electorallens"

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 300

    # ONPE scraper
    onpe_base_url: str = "https://resultados.onpe.gob.pe"
    onpe_request_delay_ms: int = 500
    onpe_max_retries: int = 3
    onpe_timeout_seconds: int = 30
    raw_data_path: str = "./data/raw"

    # AI
    ollama_base_url: str = "http://localhost:11434"
    qwen_model: str = "qwen3:8b"

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
