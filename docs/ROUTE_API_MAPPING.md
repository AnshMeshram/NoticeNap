# NoticeNap — Application Route & API Mapping

This document specifies the exact mapping between the approved Stitch screens, Next.js frontend routes, and FastAPI backend endpoints.

---

## 1. Frontend Route Architecture (Next.js)

| Route | Approved Stitch Screen | Description |
|---|---|---|
| `/` | **Screen 01**: The Calm Document Desk (`d9bf8d7fd92d46ec8466ab1ae3279c6e`) | Main document workspace, PDF drop zone, system status card, recent notices empty state. |
| `/analysis/[id]` | **Screen 02**: Document Analysis (`95149c00f2b749528d5a0aa72e2aaedf`) | Split-pane view: left PDF viewer with clause highlights, right facet cards (Dates, Eligibility, Documents, Actions). |
| `/actions` | **Screen 03**: My Action List (`ed15fd037b6044eebfaecb162a62eabc`) | Prioritized checklist with source page citation links, status toggles, and filters. |
| `/library` | **Screen 04**: Document Library (`48c85fd03e954c4186d0179ee0abea83`) | Historical desk tray and document archive with search, filter chips, and status summaries. |
| *Responsive* | **Screen 05**: Mobile Experience (`eee916a541ac407292fe7a829c7831d5`) | Adaptive layouts for mobile viewports (< 768px): collapsible sidebar into top bar / drawer, stacked facets. |

---

## 2. Backend API Architecture (FastAPI)

Base URL: `http://localhost:8000/api`

### Health & System Status
- **`GET /api/health`**
  - Response: `{ status: "ok", timestamp: "..." }`
- **`GET /api/system/status`**
  - Verifies local Ollama daemon connectivity on configured host/port (default `http://localhost:11434`).
  - Queries `http://localhost:11434/api/tags` to list installed models and verifies if the configured model (e.g. `gemma2:latest`, `gemma2:9b`, `gemma2:2b`) is loaded/available.
  - Returns:
    ```json
    {
      "ollama_host": "http://localhost:11434",
      "connected": false,
      "configured_model": "gemma2",
      "model_available": false,
      "installed_models": [],
      "status_message": "localhost:11434 • offline"
    }
    ```

### Document Ingestion & Extraction (Slice 1 Core)
- **`POST /api/documents/extract`**
  - Ingests untrusted PDF file upload via `multipart/form-data`.
  - Enforces size limit (<= 50MB) and valid PDF magic bytes.
  - Uses `pymupdf` (`fitz`) to extract text locally on disk/memory per page without cloud calls.
  - Preserves exact page numbers (`page_number: 1, 2, ...`).
  - Calculates metadata: total pages, word count, character count, file hash.
  - Returns:
    ```json
    {
      "document_id": "doc_...",
      "filename": "sample_notice.pdf",
      "file_size": 1048576,
      "page_count": 3,
      "pages": [
        {
          "page_number": 1,
          "text": "...",
          "char_count": 1420
        }
      ]
    }
    ```

### Document Analysis & Extraction (Phase 3)
- **`POST /api/documents/{document_id}/analyze`**
  - Sends extracted page text to local Ollama inference using strictly bounded structured prompts.
  - Validates output using Pydantic models with page citation constraints.
  - Returns 4 structured facets: Dates, Eligibility, Documents, Actions.

### Checklists & Actions (Phase 4)
- **`GET /api/documents/{document_id}/actions`**
  - Fetches action items with page numbers, due dates, priority, and completion status.
- **`PATCH /api/actions/{action_id}`**
  - Toggles completion state or edits user notes.

### Document Library (Phase 5)
- **`GET /api/documents`**
  - Lists archived documents on desk tray with extraction summaries and action counts.
- **`DELETE /api/documents/{document_id}`**
  - Removes document and stored local metadata.
