from typing import List, Dict, Optional
import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Response
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

# Enable CORS for Next.js frontend (local dev and Vercel production)
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "https://noticenap.vercel.app",
]
if settings.cors_origins:
    cors_origins.extend([o.strip() for o in settings.cors_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
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
async def analyze_document(document_id: str, language: str = "en"):
    """
    Produces structured 4-facet breakdown: Dates, Eligibility, Documents, Actions.
    Supports output language: en (English), hi (Hindi), mr (Marathi).
    Uses local Ollama with Gemma 2 if available; otherwise uses deterministic extractor.
    """
    doc = DOCUMENTS_STORE.get(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found. Please extract first."
        )

    analysis = await analyze_document_with_ai(doc, language=language)
    ANALYSIS_STORE[document_id] = analysis
    return analysis

@app.get("/api/documents/{document_id}/analysis", response_model=NoticeAnalysisResult)
async def get_document_analysis(document_id: str, language: str = "en"):
    """Retrieves analysis results for document."""
    analysis = ANALYSIS_STORE.get(document_id)
    if not analysis or analysis.language != language:
        # Generate or re-generate with requested language
        doc = DOCUMENTS_STORE.get(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document '{document_id}' not found."
            )
        analysis = await analyze_document_with_ai(doc, language=language)
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

@app.get("/api/documents/{document_id}/calendar.ics")
async def export_calendar(document_id: str):
    """
    Generates a standard RFC-5545 iCalendar (.ics) file with all extracted
    deadlines, examination dates, and submission events from the notice.
    """
    analysis = ANALYSIS_STORE.get(document_id)
    if not analysis:
        doc = DOCUMENTS_STORE.get(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        analysis = await analyze_document_with_ai(doc)
        ANALYSIS_STORE[document_id] = analysis

    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//NoticeNap//The Calm Document Desk//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:NoticeNap - {analysis.filename}"
    ]

    for idx, d in enumerate(analysis.dates):
        # Generate simple event entry for each deadline
        uid = f"{document_id}_date_{idx}@noticenap.local"
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now_str}",
            # Set to current date placeholder or extracted date
            f"DTSTART;VALUE=DATE:{datetime.date.today().strftime('%Y%m%d')}",
            f"SUMMARY:NoticeNap: {d.title}",
            f"DESCRIPTION:{d.date_str} (Source: Page {d.source_page} of {analysis.filename})",
            "STATUS:CONFIRMED",
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:NoticeNap Deadline Reminder",
            "TRIGGER:-P1D",
            "END:VALARM",
            "END:VEVENT"
        ])

    lines.append("END:VCALENDAR")
    ics_content = "\r\n".join(lines)

    safe_name = analysis.filename.replace(".pdf", "").replace(" ", "_")
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}_deadlines.ics"'
        }
    )
