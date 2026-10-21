import io
import pymupdf
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.extractor import extract_pdf_pages

client = TestClient(app)

def create_sample_notice_pdf() -> bytes:
    """Creates an in-memory 2-page sample PDF notice using PyMuPDF."""
    doc = pymupdf.open()
    
    # Page 1: Important Dates & Overview
    page1 = doc.new_page(width=595, height=842)
    page1.insert_text(
        pymupdf.Point(50, 72),
        "NATIONAL RESEARCH FELLOWSHIP NOTICE 2026\n\n"
        "Department of Higher Education & Research\n\n"
        "Important Dates:\n"
        "1. Application Commencement: 01 November 2026\n"
        "2. Last Date for Online Submission: 30 November 2026 (5:00 PM)\n"
        "3. Written Examination Date: 15 January 2027\n",
        fontsize=12
    )
    
    # Page 2: Eligibility & Document Checklist
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text(
        pymupdf.Point(50, 72),
        "ELIGIBILITY CRITERIA & REQUIRED DOCUMENTS\n\n"
        "Eligibility Stipulations:\n"
        "- Candidate must possess a Master's Degree with minimum 55% marks.\n"
        "- Upper age limit: 28 years as of 01 November 2026 (5 years relaxation for SC/ST).\n\n"
        "Required Documents:\n"
        "1. Degree Certificate & All Semester Marksheets (PDF, max 2MB)\n"
        "2. Category Certificate (if applicable)\n"
        "3. Recent Passport Photograph (JPG, 50KB - 100KB)\n",
        fontsize=12
    )
    
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_system_status_endpoint():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "ollama_host" in data
    assert "configured_model" in data
    assert "status_message" in data

def test_pdf_extraction_unit():
    pdf_bytes = create_sample_notice_pdf()
    result = extract_pdf_pages(pdf_bytes, "national_fellowship_notice_2026.pdf")
    
    assert result.page_count == 2
    assert len(result.pages) == 2
    assert result.pages[0].page_number == 1
    assert "NATIONAL RESEARCH FELLOWSHIP NOTICE 2026" in result.pages[0].text
    assert result.pages[1].page_number == 2
    assert "ELIGIBILITY CRITERIA & REQUIRED DOCUMENTS" in result.pages[1].text
    assert result.total_words > 0
    assert result.sha256 != ""

def test_extract_endpoint_success():
    pdf_bytes = create_sample_notice_pdf()
    files = {"file": ("sample_notice.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    response = client.post("/api/documents/extract", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "sample_notice.pdf"
    assert data["page_count"] == 2
    assert len(data["pages"]) == 2
    assert data["pages"][0]["page_number"] == 1
    assert "NATIONAL RESEARCH FELLOWSHIP" in data["pages"][0]["text"]
    
    # Test retrieving the cached document
    doc_id = data["document_id"]
    get_resp = client.get(f"/api/documents/{doc_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["document_id"] == doc_id

def test_extract_endpoint_invalid_file():
    files = {"file": ("invalid.txt", io.BytesIO(b"Hello world, not a pdf"), "text/plain")}
    response = client.post("/api/documents/extract", files=files)
    assert response.status_code == 400

def test_extract_endpoint_corrupted_pdf():
    files = {"file": ("corrupted.pdf", io.BytesIO(b"not a valid pdf header"), "application/pdf")}
    response = client.post("/api/documents/extract", files=files)
    assert response.status_code == 400
