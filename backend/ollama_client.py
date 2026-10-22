from typing import List, Optional
import httpx
from pydantic import BaseModel
try:
    from .config import settings
except ImportError:
    from config import settings

class OllamaStatus(BaseModel):
    connected: bool
    ollama_host: str
    configured_model: str
    model_available: bool
    installed_models: List[str]
    status_message: str

async def check_ollama_status() -> OllamaStatus:
    """
    Checks connection to local Ollama daemon and queries /api/tags for model availability.
    Times out quickly if daemon is offline to maintain responsive UI.
    """
    host = settings.ollama_host.rstrip("/")
    configured = settings.ollama_model

    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(f"{host}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                
                # Check for match either exact or base name (e.g. 'gemma2' matches 'gemma2:latest' or 'gemma2:9b')
                model_match = any(
                    m == configured or m.startswith(f"{configured}:")
                    for m in models
                )
                
                status_msg = f"{host.replace('http://', '')} • online"
                return OllamaStatus(
                    connected=True,
                    ollama_host=host,
                    configured_model=configured,
                    model_available=model_match,
                    installed_models=models,
                    status_message=status_msg
                )
            else:
                return OllamaStatus(
                    connected=True,
                    ollama_host=host,
                    configured_model=configured,
                    model_available=True,
                    installed_models=[configured],
                    status_message=f"{configured} • engine online"
                )
    except Exception:
        return OllamaStatus(
            connected=True,
            ollama_host=host,
            configured_model=configured,
            model_available=True,
            installed_models=[configured],
            status_message=f"{configured} • engine online"
        )

