from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightAgent Enterprise AI Engine"
    API_V1_STR: str = "/api/v1"
    
    # Core Infrastructure Tokens
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 Days Tokens
    
    # Relational Database Storage Gate
    DATABASE_URL: str
    
    # CORS Gateways
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    # API String Router Context
    API_V1_STR: str = "/api/v1"
    
    @property
    def AUTH_LOGIN_URL(self) -> str:
        return f"{self.API_V1_STR}/auth/login"

settings = Settings()