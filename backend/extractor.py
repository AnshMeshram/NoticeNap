import hashlib
import uuid
from typing import List
import pymupdf
from pydantic import BaseModel, Field
from .security import PDFSecurityGuard, SecurityException

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
    security_warnings: List[str] = Field(default_factory=list)

def extract_pdf_pages(file_bytes: bytes, raw_filename: str) -> DocumentExtractionResult:
    """
    Extracts text from an untrusted PDF stream using PyMuPDF (fitz) strictly in-memory.
    Never executes JavaScript or embedded instructions.
    Preserves precise 1-indexed page numbers for traceability.
    """
    if not file_bytes:
        raise SecurityException("Uploaded file is empty.")

    # 1. Sanitize filename against path-traversal attacks
    safe_filename = PDFSecurityGuard.sanitize_filename(raw_filename)

    # 2. Inspect raw bytes for header verification and dangerous executable tags
    _, warnings = PDFSecurityGuard.inspect_raw_bytes(file_bytes)

    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"

    try:
        # Open in memory strictly as data
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Could not parse PDF document safely: {str(e)}")

    try:
        if len(doc) > PDFSecurityGuard.MAX_PAGE_COUNT:
            raise SecurityException(
                f"Notice exceeds page limit ({len(doc)} pages > {PDFSecurityGuard.MAX_PAGE_COUNT})."
            )

        if doc.is_encrypted:
            # Check if it can be opened without password
            if not doc.authenticate(""):
                return DocumentExtractionResult(
                    document_id=doc_id,
                    filename=safe_filename,
                    sha256=sha256_hash,
                    file_size_bytes=len(file_bytes),
                    page_count=len(doc),
                    total_words=0,
                    pages=[],
                    is_encrypted=True,
                    security_warnings=warnings + ["Document is password protected."]
                )

        pages: List[ExtractedPage] = []
        total_words = 0

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            # get_text("text") strips fonts, embedded scripts, and macros
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
            filename=safe_filename,
            sha256=sha256_hash,
            file_size_bytes=len(file_bytes),
            page_count=len(doc),
            total_words=total_words,
            pages=pages,
            is_encrypted=False,
            security_warnings=warnings
        )
    finally:
        doc.close()
