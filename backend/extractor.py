import hashlib
import uuid
from typing import List
import pymupdf
from pydantic import BaseModel, Field

class ExtractedPage(BaseModel):
    page_number: int = Field(..., description="1-indexed page number in the original PDF")
    text: str = Field(..., description="Raw text extracted cleanly from the page")
    char_count: int = Field(..., description="Character count for this page")
    word_count: int = Field(..., description="Word count for this page")

class DocumentExtractionResult(BaseModel):
    document_id: str
    filename: str
    sha256: str
    file_size_bytes: int
    page_count: int
    total_words: int
    pages: List[ExtractedPage]
    is_encrypted: bool = False

def extract_pdf_pages(file_bytes: bytes, filename: str) -> DocumentExtractionResult:
    """
    Extracts text from an untrusted PDF stream using PyMuPDF (fitz) strictly in-memory.
    Never executes JavaScript or embedded instructions.
    Preserves precise 1-indexed page numbers for traceability.
    """
    if not file_bytes:
        raise ValueError("Uploaded file is empty.")

    if not file_bytes.startswith(b"%PDF-"):
        raise ValueError("Invalid PDF format: Missing '%PDF-' header.")

    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"

    try:
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Could not parse PDF document: {str(e)}")

    try:
        if doc.is_encrypted:
            # Check if it can be opened without password
            if not doc.authenticate(""):
                return DocumentExtractionResult(
                    document_id=doc_id,
                    filename=filename,
                    sha256=sha256_hash,
                    file_size_bytes=len(file_bytes),
                    page_count=len(doc),
                    total_words=0,
                    pages=[],
                    is_encrypted=True
                )

        pages: List[ExtractedPage] = []
        total_words = 0

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            text = page.get_text("text") or ""
            cleaned_text = text.strip()
            words = len(cleaned_text.split()) if cleaned_text else 0
            total_words += words

            pages.append(
                ExtractedPage(
                    page_number=page_idx + 1,
                    text=cleaned_text,
                    char_count=len(cleaned_text),
                    word_count=words
                )
            )

        return DocumentExtractionResult(
            document_id=doc_id,
            filename=filename,
            sha256=sha256_hash,
            file_size_bytes=len(file_bytes),
            page_count=len(doc),
            total_words=total_words,
            pages=pages,
            is_encrypted=False
        )
    finally:
        doc.close()
