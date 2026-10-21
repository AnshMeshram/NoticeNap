# NoticeNap

> *"Let the notice be long. Your to-do list shouldn't."*

**NoticeNap** is a calm, editorial, privacy-first archival desk interface designed to transform complex, lengthy public notices—scholarships, competitive examinations, recruitment notifications, and bureaucratic circulars—into concise, source-cited action checklists entirely on your local machine.

No cloud uploads. No private PDFs leaving your device. No hallucinations without page references.

---

## 🌿 Approved Stitch Design System

NoticeNap was designed in **Google Stitch Canvas** (Project ID: `14480156016592971476` — *NoticeNap Workspace Interface*). The design aesthetic is calm, editorial, minimal, and useful:

- **Warm Paper Desk Background**: `#f8fbef`
- **Deep Forest Green**: `#0a3626` (Wordmark, typography, dark buttons)
- **Primary Container Fill**: `#244d3b`
- **Soft Sage & Muted Slate**: `#dae3d0`, `#586152`
- **Muted Amber Warning/Standby**: `#f0bf63`
- **Editorial Typography**:
  - Headings & Display: **Newsreader** (Serif)
  - Interface & Body: **Manrope** (Sans-serif)
  - Citations, Badges & Endpoints: **JetBrains Mono** (Monospace)
- **Restrained Mascot**: Sleepy sloth resting on desk paperwork.

---

## 📋 Approved Stitch Screen Manifest

| Screen # | Screen Title | Stitch ID | Viewport | Route | Status |
|:---|:---|:---|:---|:---|:---|
| **01** | **NoticeNap — The Calm Document Desk** | `d9bf8d7fd92d46ec8466ab1ae3279c6e` | 2560 × 3064 | `/` | **Implemented (Slice 1)** |
| **02** | **NoticeNap — 02 Document Analysis** | `95149c00f2b749528d5a0aa72e2aaedf` | 2560 × 3492 | `/analysis/[id]` | Mapped for Phase 3 |
| **03** | **NoticeNap — 03 My Action List** | `ed15fd037b6044eebfaecb162a62eabc` | 2560 × 5016 | `/actions` | Mapped for Phase 4 |
| **04** | **NoticeNap — 04 Document Library** | `48c85fd03e954c4186d0179ee0abea83` | 2560 × 3824 | `/library` | Mapped for Phase 5 |
| **05** | **NoticeNap — 05 Mobile Experience** | `eee916a541ac407292fe7a829c7831d5` | 780 × 2890 | Responsive Breakpoint | Responsive Layout |

Complete screen manifests and endpoint specifications are documented in:
- [`docs/SCREEN_MANIFEST.md`](docs/SCREEN_MANIFEST.md)
- [`docs/ROUTE_API_MAPPING.md`](docs/ROUTE_API_MAPPING.md)

---

## 🏛️ System Architecture

```
                                      ┌────────────────────────────────────┐
                                      │        Next.js 16 Frontend         │
                                      │   React 19 • Tailwind CSS • TS     │
                                      │        (http://localhost:3000)     │
                                      └─────────────────┬──────────────────┘
                                                        │
                              REST API (CORS)           │
                              multipart/form-data       ▼
                                      ┌────────────────────────────────────┐
                                      │          FastAPI Backend           │
                                      │        (http://localhost:8000)     │
                                      └───────┬────────────────────┬───────┘
                                              │                    │
                  Local In-Memory Extraction  │                    │ Health & Tags Check
                                              ▼                    ▼
                                      ┌───────────────┐    ┌───────────────┐
                                      │   PyMuPDF     │    │  Local Ollama │
                                      │ (fitz engine) │    │  Gemma 2 (9B) │
                                      └───────────────┘    └───────────────┘
```

---

## 🛡️ Core Engineering & Privacy Guarantees

1. **100% On-Device & Air-Gapped**: Private documents are never transmitted to any third-party or cloud AI provider.
2. **Untrusted Input Sanitation**: PDF files are treated as untrusted inputs and parsed safely in-memory using PyMuPDF. Embedded scripts and instructions are never executed.
3. **Exact Page Traceability**: Every extracted clause and fact is tagged with its original 1-indexed source page number (`Page 1`, `Page 2`, etc.).
4. **No Fabricated Data**: If local Ollama or the model is offline, the interface explicitly displays standby status rather than faking AI inference.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20+ (tested on v22.13.1) and npm
- **Python**: v3.11+ (tested on v3.13.2)
- **Ollama** *(optional for Phase 1)*: Running locally on `http://localhost:11434` with `gemma2` model.

### 1. Backend Setup (FastAPI)

```bash
# Navigate to project root
pip install fastapi uvicorn pymupdf pydantic httpx python-multipart pytest pytest-asyncio

# Run the test suite
python -m pytest backend/test_backend.py -v

# Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be accessible at `http://127.0.0.1:8000` with automatic docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the Calm Document Desk.

### 3. Generate Sample Notices

NoticeNap includes a built-in sample notice generator script:

```bash
python samples/generate_sample_notices.py
```

This generates three realistic sample notices in `samples/` and `frontend/public/samples/`:
- `Rhodes_Scholarship_2025.pdf`
- `Civil_Services_Exam_Notice.pdf`
- `Research_Fellowship_PDF.pdf`

Clicking any of these chips in the empty state tray loads and extracts them instantly.

---

## 🧪 Verification & Quality

- **Backend Tests**: 6 passing unit tests verifying PDF extraction, page indexing, status checks, and error handling.
- **Frontend Code Quality**:
  - `npm run lint`: 0 errors, 0 warnings.
  - `npm run build`: Production build verified with zero warnings.

---

## 🗺️ Implementation Roadmap

- [x] **Phase 0**: Verify Google Stitch MCP connection, audit project `14480156016592971476`, download approved screen assets.
- [x] **Phase 1**: Screen manifest, route & API mapping architecture, sample notice generator.
- [x] **Phase 2**: First working slice — The Calm Document Desk (Screen 01), PyMuPDF local page extractor, live Ollama daemon connectivity card, drag-and-drop file upload.
- [ ] **Phase 3**: Screen 02 (Document Analysis) — Two-column split viewer with structured extraction cards.
- [ ] **Phase 4**: Screen 03 (My Action List) — Prioritized checklist with page citation jumps.
- [ ] **Phase 5**: Screen 04 (Document Library) — Archival desk tray and local document storage.

---

## 📄 License & Credits

Created by [Ansh Meshram](https://github.com/AnshMeshram) for Hacktoberfest 2026.
Licensed under the [MIT License](LICENSE).
