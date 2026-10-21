import io
import pymupdf
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.extractor import extract_pdf_pages
from backend.security import PDFSecurityGuard

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
        "3. Recent Passport Photograph (JPG, 50KB - 100KB)\n\n"
        "Next Steps:\n"
        "Step 1: Complete online registration on portal.\n"
        "Step 2: Upload verified documents.\n",
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

def test_pdf_security_guard_sanitization():
    unsafe_name = "../../etc/passwd/malicious.pdf\x00.exe"
    clean = PDFSecurityGuard.sanitize_filename(unsafe_name)
    assert ".." not in clean
    assert "/" not in clean
    assert clean.endswith(".pdf")

def test_extract_and_analyze_flow():
    pdf_bytes = create_sample_notice_pdf()
    files = {"file": ("fellowship_2026.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    
    # 1. Extract
    extract_resp = client.post("/api/documents/extract", files=files)
    assert extract_resp.status_code == 200
    doc_data = extract_resp.json()
    doc_id = doc_data["document_id"]
    assert doc_data["page_count"] == 2
    assert len(doc_data["pages"]) == 2
    assert doc_data["pages"][0]["page_number"] == 1

    # 2. Analyze
    analyze_resp = client.post(f"/api/documents/{doc_id}/analyze")
    assert analyze_resp.status_code == 200
    analysis = analyze_resp.json()
    assert len(analysis["dates"]) > 0
    assert len(analysis["eligibility"]) > 0
    assert len(analysis["documents"]) > 0
    assert len(analysis["actions"]) > 0
    
    # Verify page citation link
    assert analysis["dates"][0]["source_page"] in [1, 2]

    # 3. Toggle Action Item
    step_num = analysis["actions"][0]["step_number"]
    patch_resp = client.patch(f"/api/documents/{doc_id}/actions/{step_num}")
    assert patch_resp.status_code == 200
    assert patch_resp.json()["completed"] is True

    # 4. List Documents
    list_resp = client.get("/api/documents")
    assert list_resp.status_code == 200
    assert any(d["document_id"] == doc_id for d in list_resp.json())

    # 5. Delete Document
    del_resp = client.delete(f"/api/documents/{doc_id}")
    assert del_resp.status_code == 200
