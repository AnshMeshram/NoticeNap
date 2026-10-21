from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .extractor import extract_pdf_pages, DocumentExtractionResult
from .ollama_client import check_ollama_status, OllamaStatus

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="NoticeNap local PDF extraction & quiet notice analysis engine"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document desk cache for the active session
DOCUMENTS_STORE: dict[str, DocumentExtractionResult] = {}

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.version
    }

@app.get("/api/system/status", response_model=OllamaStatus)
async def system_status():
    """Returns local Ollama inference daemon connectivity and loaded model status."""
    return await check_ollama_status()

@app.post("/api/documents/extract", response_model=DocumentExtractionResult)
async def extract_document(file: UploadFile = File(...)):
    """
    Ingests untrusted PDF notice and extracts text with page numbers locally via PyMuPDF.
    Ensures safe, air-gapped text extraction without sending document bytes to any cloud API.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported (.pdf)."
        )

    # Read contents into memory
    content = await file.read()
    
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.max_upload_size_bytes // (1024*1024)}MB."
        )

    try:
        result = extract_pdf_pages(content, file.filename)
        DOCUMENTS_STORE[result.document_id] = result
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF: {str(e)}"
        )

@app.get("/api/documents/{document_id}", response_model=DocumentExtractionResult)
async def get_document(document_id: str):
    """Retrieves previously extracted document by ID from current desk cache."""
    doc = DOCUMENTS_STORE.get(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found."
        )
    return doc
