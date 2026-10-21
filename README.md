# NoticeNap 🦥

<p align="center">
  <img src="stitch-handoff/logo.png" alt="NoticeNap Logo" width="80" />
</p>

<p align="center">
  <strong><em>"Let the notice be long. Your to-do list shouldn't."</em></strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20On--Device-forestgreen.svg" alt="Privacy" />
  <img src="https://img.shields.io/badge/Next.js-16%20(React%2019)-black.svg" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688.svg" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Extractor-PyMuPDF-orange.svg" alt="PyMuPDF" />
  <img src="https://img.shields.io/badge/AI%20Engine-Ollama%20%7C%20Gemma%202-blue.svg" alt="Ollama" />
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen.svg" alt="Build" />
</p>

---

## 🌿 Overview

**NoticeNap** is an editorial, air-gapped archival desk application engineered to digest intimidating, multi-page public notices—scholarship announcements, civil service exams, recruitment circulars, and university ordinances—and extract unambiguous, source-cited action checklists directly on your local machine.

Designed in **Google Stitch Canvas** (Project ID: `14480156016592971476`), NoticeNap replaces stressful bureaucratic clutter with a warm, restorative paper aesthetic.

---

## ✨ Advanced System Features

### 1. 🛋️ The Calm Document Desk (`Screen 01`)
- Tactile, distraction-free PDF drop zone with drag-and-drop feedback and 50MB file validation.
- Live probe for local Ollama connectivity (`localhost:11434`) displaying real-time daemon and model readiness.
- Restorative empty desk tray featuring the NoticeNap sleepy sloth mascot resting on desk paperwork.
- Quick-launch sample notices (*Rhodes Scholarship 2025*, *Civil Services Exam Notice*, *Research Fellowship PDF*).

### 2. 🔍 Document Analysis Split View (`Screen 02`)
- Synchronized split view: left-hand air-gapped page stream alongside structured facet cards.
- **4 Key Breakdown Angles**:
  - **Important Dates**: Deadlines, exam windows, and interview dates with source-page badges.
  - **Eligibility Stipulations**: Age limits, educational benchmarks, and criteria classification.
  - **Required Documents**: File formats, certificate rules, and size stipulations.
  - **Sequential Next Steps**: Actionable chronological checklist.
- Page navigation buttons (`Page 1`, `Page 2`, ...) allow instant verification of extracted clauses.

### 3. ✅ My Action List (`Screen 03`)
- Interactive task checklist with individual checkbox toggles and reactive progress tracking bar (`% Completed`).
- Source page citation links on every action item for immediate auditability.
- Filter by **All**, **Pending**, and **Completed** tasks.
- One-click **Markdown Export** (`.md`) to integrate directly into Obsidian, Notion, or personal task managers.

### 4. 🗄️ Document Library (`Screen 04`)
- Local historical ledger storing all processed notices on the archival desk tray.
- Instant search filter by filename, SHA-256 fingerprint, page count, and file size.
- One-click re-inspection and removal from desk storage.

### 5. 🛡️ Hardened PDF Security Guard
- **In-Memory Parsing**: Safely parses documents via PyMuPDF without executing embedded JavaScript or macros.
- **Payload Neutralization**: Scans raw bytes for `/JS`, `/JavaScript`, `/Launch`, `/SubmitForm`, and `/ImportData`.
- **Path Traversal Protection**: Aggressively cleans filenames against directory traversal exploits (`../../`).
- **Decompression Trap Safeguard**: Enforces maximum page limits (250 pages) to guard against zip-bomb style attacks.

---

## 🎨 Approved Stitch Design Tokens

| Token | Hex / Spec | Role in Interface |
|:---|:---|:---|
| `surface` / `background` | `#f8fbef` | Calm warm paper desk background |
| `primary` | `#0a3626` | Deep forest green typography, titles, active chips |
| `primary-container` | `#244d3b` | Primary call-to-action buttons |
| `secondary-container` | `#dae3d0` | Soft sage active sidebar navigation pill |
| `surface-container-low` | `#f2f5ea` | Left rail navigation and empty state tray |
| `surface-container-lowest`| `#ffffff` | Primary document drop card and paper blotters |
| `outline-variant` | `#c1c8c2` | Subtle editorial hairline dividers |
| `tertiary-fixed-dim` | `#f0bf63` | Status standby amber dot |
| **Headline Font** | **Newsreader** | Editorial display headings and titles |
| **Body & Label Font** | **Manrope** | UI controls, labels, and paragraph copy |
| **Mono Font** | **JetBrains Mono**| Source citations, SHA-256 hashes, and status chips |

---

## 🏛️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 Web Dashboard                       │
│             React 19 • TypeScript • Tailwind CSS v4 • Icons            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         REST API (Localhost only)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         FastAPI Python Backend                         │
│            Config • Endpoints • Memory Cache • File Handlers           │
└─────────┬─────────────────────────┬─────────────────────────┬──────────┘
          │                         │                         │
          ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ PDFSecurityGuard │      │ PyMuPDF (fitz)   │      │   Local Ollama   │
│ - Sanitization   │      │ - Page stream    │      │ - Gemma 2 (9B)   │
│ - Threat check   │      │ - Word/Char ct   │      │ - Deterministic  │
│ - Page bounds    │      │ - Page indexing  │      │   fallback engine│
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v20+ (tested on v22.13.1)
- **Python**: v3.11+ (tested on v3.13.2)
- **Ollama** *(optional)*: Running on `http://localhost:11434` with `gemma2` model (`ollama run gemma2`)

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/AnshMeshram/NoticeNap.git
cd NoticeNap

# Install backend dependencies
pip install -r backend/requirements.txt

# Run backend unit tests
python -m pytest backend/test_backend.py -v

# Start the FastAPI backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Run the Next.js development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Generate Sample Notices
NoticeNap provides a built-in sample notice generator script:
```bash
python samples/generate_sample_notices.py
```
This produces three ready-to-test PDF files:
- `Rhodes_Scholarship_2025.pdf`
- `Civil_Services_Exam_Notice.pdf`
- `Research_Fellowship_PDF.pdf`

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` to customize settings:

```ini
# Backend configuration
NOTICENAP_OLLAMA_HOST=http://localhost:11434
NOTICENAP_OLLAMA_MODEL=gemma2

# Frontend configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 🧪 Quality & Test Verification

| Component | Test Suite | Result |
|:---|:---|:---|
| **Backend API & Security** | `pytest backend/test_backend.py -v` | **4/4 Tests Passed** |
| **Frontend Type Checking** | TypeScript Compiler (`tsc`) | **0 Errors** |
| **Frontend Code Quality** | ESLint (`npm run lint`) | **0 Errors, 0 Warnings** |
| **Production Bundle** | Next.js Build (`npm run build`) | **Compiled Successfully** |

---

## 🗺️ Project Roadmap

- [x] **Phase 0**: Google Stitch MCP connection, project audit (`14480156016592971476`), asset handoff.
- [x] **Phase 1**: Screen manifest, route & API mapping, sample notice generator.
- [x] **Phase 2**: Slice 1 — The Calm Document Desk (`Screen 01`), PyMuPDF local extractor, live Ollama daemon probe.
- [x] **Phase 3**: Hardened `PDFSecurityGuard` and Document Analysis split view (`Screen 02`).
- [x] **Phase 4**: Interactive Action List (`Screen 03`) with progress tracker and Markdown export.
- [x] **Phase 5**: Document Library (`Screen 04`) with historical desk tray ledger.
- [ ] **Phase 6**: Mobile native responsive gestures and camera PDF capture.

---

## 📄 License & Author

Created by **[Ansh Meshram](https://github.com/AnshMeshram)** for Hacktoberfest 2026.  
Licensed under the [MIT License](LICENSE).
