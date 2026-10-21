from typing import List, Dict, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .security import SecurityException
from .extractor import extract_pdf_pages, DocumentExtractionResult
from .ollama_client import check_ollama_status, OllamaStatus
from .analyzer import analyze_document_with_ai, NoticeAnalysisResult, ActionStep

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

# In-memory document desk cache for active session
DOCUMENTS_STORE: Dict[str, DocumentExtractionResult] = {}
ANALYSIS_STORE: Dict[str, NoticeAnalysisResult] = {}

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

    try:
        result = extract_pdf_pages(content, file.filename)
        DOCUMENTS_STORE[result.document_id] = result
        return result
    except SecurityException as se:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(se)
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF safely: {str(e)}"
        )

@app.get("/api/documents", response_model=List[DocumentExtractionResult])
async def list_documents():
    """Returns all documents processed on desk blotter."""
    return list(DOCUMENTS_STORE.values())

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

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Removes a document from desk tray cache."""
    if document_id in DOCUMENTS_STORE:
        del DOCUMENTS_STORE[document_id]
    if document_id in ANALYSIS_STORE:
        del ANALYSIS_STORE[document_id]
    return {"deleted": True, "document_id": document_id}

@app.post("/api/documents/{document_id}/analyze", response_model=NoticeAnalysisResult)
async def analyze_document(document_id: str):
    """
    Produces structured 4-facet breakdown: Dates, Eligibility, Documents, Actions.
    Uses local Ollama with Gemma 2 if available; otherwise uses deterministic extractor.
    """
    doc = DOCUMENTS_STORE.get(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found. Please extract first."
        )

    analysis = await analyze_document_with_ai(doc)
    ANALYSIS_STORE[document_id] = analysis
    return analysis

@app.get("/api/documents/{document_id}/analysis", response_model=NoticeAnalysisResult)
async def get_document_analysis(document_id: str):
    """Retrieves analysis results for document."""
    analysis = ANALYSIS_STORE.get(document_id)
    if not analysis:
        # Generate on demand
        doc = DOCUMENTS_STORE.get(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document '{document_id}' not found."
            )
        analysis = await analyze_document_with_ai(doc)
        ANALYSIS_STORE[document_id] = analysis
    return analysis

@app.patch("/api/documents/{document_id}/actions/{step_number}")
async def toggle_action_step(document_id: str, step_number: int):
    """Toggles completion state of an action step."""
    analysis = ANALYSIS_STORE.get(document_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found for document."
        )

    for action in analysis.actions:
        if action.step_number == step_number:
            action.completed = not action.completed
            return action

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Action step {step_number} not found."
    )
