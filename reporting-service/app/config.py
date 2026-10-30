from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    backend_url: str = "http://backend:3001"
    http_timeout_seconds: float = 5.0
    host: str = "0.0.0.0"
    port: int = 8000


settings = Settings()
