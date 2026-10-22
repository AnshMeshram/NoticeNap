import os
from pydantic import BaseModel

class Settings(BaseModel):
    app_name: str = "NoticeNap Backend"
    version: str = "0.1.0"
    ollama_host: str = os.getenv("NOTICENAP_OLLAMA_HOST", "http://localhost:11434")
    ollama_model: str = os.getenv("NOTICENAP_OLLAMA_MODEL", "gemma2")
    max_upload_size_bytes: int = 50 * 1024 * 1024  # 50 MB
    allowed_mime_types: list[str] = ["application/pdf"]
    cors_origins: str = os.getenv("NOTICENAP_CORS_ORIGINS", "")

settings = Settings()
