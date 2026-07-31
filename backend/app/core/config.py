from typing import List, Optional
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

    @property
    def GROQ_API_KEY(self) -> str:
        return self.GROQ_API_KEY_DEFAULT or self.GROQ_API_KEY_COMPETITOR or self.GROQ_API_KEY_EMAIL or self.GROQ_API_KEY_RISK

    # Sync with new multi-key routing system
    GROQ_API_KEY_COMPETITOR: str = ""
    GROQ_API_KEY_EMAIL: str = ""
    GROQ_API_KEY_RISK: str = ""
    GROQ_API_KEY_DEFAULT: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-specdec"
    TAVILY_API_KEY: str
    VECTOR_DB_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    LLM_MODEL_NAME: str = "llama-3.1-8b-instant"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "InsightAgent"

    # ── Local Development Bypass ──────────────────────────────────────────
    # Set DEV_MODE=true in .env to skip real email delivery.
    # Any OTP input OR the MASTER_OTP value will be accepted.
    DEV_MODE: bool = False
    MASTER_OTP: Optional[str] = "000000"

settings = Settings()
