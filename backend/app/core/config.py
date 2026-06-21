from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightAgent Enterprise AI Engine"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 
    
    DATABASE_URL: str 
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ] 

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    @property
    def AUTH_LOGIN_URL(self) -> str:
        return f"{self.API_V1_STR}/auth/login"

    GROQ_API_KEY: str
    TAVILY_API_KEY: str
    VECTOR_DB_URL: str = "http://localhost:6333"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    LLM_MODEL_NAME: str = "llama-3.1-8b-instant"

    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str

settings = Settings()