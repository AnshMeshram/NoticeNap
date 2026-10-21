# NoticeNap 🦥

<p align="center">
  <img src="stitch-handoff/logo.png" alt="NoticeNap Logo" width="80" />
</p>

<p align="center">
  <strong><em>"Let the notice be long. Your to-do list shouldn't."</em></strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hacktoberfest-2026%20Week%203-orange.svg" alt="Hacktoberfest 2026" />
  <img src="https://img.shields.io/badge/Theme-Slow%20and%20Steady-darkgreen.svg" alt="Theme" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20On--Device-forestgreen.svg" alt="Privacy" />
  <img src="https://img.shields.io/badge/Next.js-16%20(Turbopack)-black.svg" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688.svg" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Extractor-PyMuPDF%20(fitz)-orange.svg" alt="PyMuPDF" />
  <img src="https://img.shields.io/badge/AI%20Engine-Ollama%20%7C%20Gemma%202-blue.svg" alt="Ollama" />
  <img src="https://img.shields.io/badge/Tests-5%2F5%20Passing-brightgreen.svg" alt="Tests" />
</p>

---

## 🌿 Overview

**NoticeNap** is an editorial, air-gapped archival desk application engineered to digest intimidating, multi-page public notices—scholarship announcements, civil service exams, recruitment circulars, and university ordinances—and extract unambiguous, source-cited action checklists directly on your local machine.

Designed in **Google Stitch Canvas** (Project ID: `14480156016592971476`), NoticeNap replaces stressful bureaucratic clutter with a warm, restorative paper aesthetic that honors the Hacktoberfest 2026 Week 3 theme: **"Slow and Steady"**.

---

## 📱 Complete Multi-Screen Implementation

All five approved Google Stitch screens are fully implemented and verified:

### 1. 🛋️ The Calm Document Desk (`Screen 01` — `d9bf8d7fd92d46ec8466ab1ae3279c6e`)
- Tactile, distraction-free PDF drop zone with drag-and-drop feedback and 50MB file validation.
- Live probe for local Ollama connectivity (`localhost:11434`) displaying real-time daemon and model readiness (`gemma2:latest`).
- Restorative empty desk tray featuring the NoticeNap sleepy sloth mascot resting on paperwork.
- Quick-launch sample notices (*Rhodes Scholarship 2025*, *Civil Services Exam Notice*, *Research Fellowship PDF*).
- 4-facet automated breakdown overview cards (Deadlines, Eligibility, Documents, Next Steps).

### 2. 🔍 Document Analysis Split View (`Screen 02` — `95149c00f2b749528d5a0aa72e2aaedf`)
- Synchronized split view: left-hand air-gapped page stream alongside structured facet cards.
- **4 Key Breakdown Angles**:
  - **Important Dates**: Deadlines, exam windows, and interview dates with source-page badges.
  - **Eligibility Stipulations**: Age limits, educational benchmarks, and criteria classification.
  - **Required Documents**: File formats, certificate rules, and size stipulations.
  - **Sequential Next Steps**: Actionable chronological checklist.
- Page navigation buttons (`Page 1`, `Page 2`, ...) allow instant verification of extracted clauses.
- **Application Fees & Exemptions**: Highlights fee waivers (e.g. SC/ST/PwBD) and payment cutoffs.
- **Uncertainty & Caveat Notices**: Surfaces ambiguous clauses, missing dates, or conditions requiring human verification.
- **Scanned PDF Guard**: Identifies rasterized/image-only PDFs and warns when OCR is needed.

### 3. ✅ My Action List (`Screen 03` — `ed15fd037b6044eebfaecb162a62eabc`)
- Interactive task checklist with individual checkbox toggles and reactive progress tracking bar (`% Completed`).
- Task counters dynamically derived from real checklist items (no stale mock counters).
- Source page citation links on every action item for immediate auditability.
- Filter by **All**, **Pending**, and **Completed** tasks.
- **One-click Markdown Export** (`.md`) to integrate directly into Obsidian, Notion, or personal task managers.
- **One-click Calendar Export** (`.ics` / RFC-5545) with embedded alarms for exam windows and cutoff dates.

### 4. 🗄️ Document Library (`Screen 04` — `48c85fd03e954c4186d0179ee0abea83`)
- Local historical ledger storing all processed notices on the archival desk tray.
- Instant search filter by filename, SHA-256 fingerprint, page count, and file size.
- One-click re-inspection and removal from desk storage.
- Horizontal clipping resolved with responsive table layout and fixed badge widths.

### 5. 📱 Mobile Experience (`Screen 05` — `eee916a541ac407292fe7a829c7831d5`)
- Designed and tested for mobile viewports (390 × 844 px).
- Fixed ergonomic bottom navigation bar: **The Desk**, **Analysis**, **Actions**, **Library**, and **Settings**.
- Touch-friendly tap targets (minimum 44px height), responsive typography, and wrapped badge containers.
- Zero horizontal overflow.

---

## 🌐 Multi-Language Support

NoticeNap supports multi-lingual notice extraction:
- **English (`en`)**: Primary baseline extraction.
- **Hindi (`hi` — हिंदी)**: Devanagari translation preserving technical benchmarks, dates, and proper nouns.
- **Marathi (`mr` — मराठी)**: Regional notification extraction preserving amounts, reservation categories, and deadlines.

Language switcher is available in the top bar across all views.

---

## 🛡️ Privacy & Local AI Execution Architecture

### Why Local Ollama (Gemma 2)?
A public cloud frontend (e.g., Vercel) **cannot** reach an end-user's `localhost:11434` directly due to browser cross-origin mixed-content and loopback networking policies. Furthermore, sending confidential public exam filings or scholarship documents to unapproved cloud APIs violates privacy.

NoticeNap is built on a **privacy-first, air-gapped architecture**:
1. The user runs NoticeNap locally.
2. The FastAPI backend extracts PDF text locally in memory via PyMuPDF.
3. The backend communicates locally with the user's running Ollama daemon (`http://localhost:11434`).
4. The selected open-weight model (`gemma2:latest`) runs fully offline on CPU/GPU.
5. Zero PDF bytes or extracted text leave your machine.

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

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v20+ (tested on v22.13.1)
- **Python**: v3.11+ (tested on v3.13.2)
- **Ollama**: [Download Ollama](https://ollama.ai) and pull Gemma 2:
  ```bash
  ollama pull gemma2
  ollama serve
  ```

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/AnshMeshram/NoticeNap.git
cd NoticeNap

# Install backend dependencies
pip install -r backend/requirements.txt

# Run backend unit tests (includes live Gemma 2 inference)
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

## 🧪 Quality & Test Verification

| Component | Test Command | Result |
|:---|:---|:---|
| **Backend API & Security** | `pytest backend/test_backend.py -v` | **5/5 Passed (100%)** |
| **Frontend Code Quality** | `npm run lint` (ESLint) | **0 Errors, 0 Warnings** |
| **Frontend Type Checking** | Next.js TypeScript Compiler | **0 Errors** |
| **Production Build** | `npm run build` | **Compiled Successfully** |

---

## 📄 License & Author

Created by **[Ansh Meshram](https://github.com/AnshMeshram)** for Hacktoberfest 2026.  
Licensed under the [MIT License](LICENSE).
