# NoticeNap 🦥

<p align="center">
  <img src="frontend/public/logo.svg" alt="NoticeNap Logo" width="280" />
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

## 📱 Application Routes & Screen Inventory

All six approved Google Stitch screens are fully implemented and verified:

| Route | Approved Stitch Screen | Stitch ID | Purpose |
|:---|:---|:---|:---|
| **`/`** | **06 Dedicated Home** | `d64b931ac3a94df8a4a7616474dbbc9c` | Public landing page introducing the product, value proposition, tactile document desk preview, open-source model explanation, and direct "Analyze a PDF" launch button. |
| **`/desk`** | **01 The Calm Document Desk** | `d9bf8d7fd92d46ec8466ab1ae3279c6e` | Operational workspace with PDF drop zone, file validation, live Ollama daemon probe, empty desk blotter, and quick-launch sample notices. |
| **`/desk?tab=analysis`** | **02 Document Analysis** | `95149c00f2b749528d5a0aa72e2aaedf` | Split view: left-hand raw page stream with 1-indexed pagination alongside 4 structured facets (Dates, Eligibility, Documents, Next Steps), fee waivers, and uncertainty notices. |
| **`/desk?tab=actions`** | **03 My Action List** | `ed15fd037b6044eebfaecb162a62eabc` | Interactive task checklist with individual checkbox toggles, reactive progress tracking (`% Completed`), Markdown export (`.md`), and RFC-5545 iCalendar export (`.ics`). |
| **`/desk?tab=library`** | **04 Document Library** | `48c85fd03e954c4186d0179ee0abea83` | Historical ledger table of processed notices, SHA-256 fingerprints, page counts, word counts, and search filter with zero clipping. |
| **Responsive `< 768px`** | **05 Mobile Experience** | `eee916a541ac407292fe7a829c7831d5` | Mobile layout tested at 390 × 844 px with fixed bottom navigation bar: **The Desk**, **Analysis**, **Actions**, **Library**, and **Settings**. |
| **`/workspace`** | *Workspace Alias* | — | Automatically redirects to `/desk`. |

---

## 🦥 Sloth Brand Asset Family

NoticeNap features a cohesive, calm visual identity built around Barnaby the Sleepy Sloth:

1. **Vector Mascot Icon** ([`frontend/public/sloth-icon.svg`](file:///c:/Users/shrin/Desktop/Hactoberfest2026/NoticeNap/frontend/public/sloth-icon.svg)): Stylized, recognizable sloth-face mark inside a Forest Green badge with Soft Sage patches and a Muted Amber rest indicator.
2. **Combined Wordmark & Logo** ([`frontend/public/logo.svg`](file:///c:/Users/shrin/Desktop/Hactoberfest2026/NoticeNap/frontend/public/logo.svg)): Scalable SVG pairing the sloth emblem with Newsreader serif typography.
3. **Hero Illustration** ([`frontend/public/images/brand/sloth-mascot.png`](file:///c:/Users/shrin/Desktop/Hactoberfest2026/NoticeNap/frontend/public/images/brand/sloth-mascot.png)): The official sloth mascot resting peacefully on desk paperwork.
4. **App & PWA Icons**:
   - `frontend/public/icon-192.png` (192 × 192 px)
   - `frontend/public/icon-512.png` (512 × 512 px)
   - `frontend/app/apple-icon.png` and `frontend/public/apple-touch-icon.png` (180 × 180 px)
   - `frontend/app/icon.svg` & `frontend/app/icon.png` (32 × 32 px Favicon)
5. **Web App Manifest** ([`frontend/public/manifest.json`](file:///c:/Users/shrin/Desktop/Hactoberfest2026/NoticeNap/frontend/public/manifest.json)).

---

## 🛡️ Privacy & Local AI Execution Architecture

### Why Local Ollama (Gemma 2)?
A public cloud deployment (e.g., Vercel) **cannot** reach an end-user's `localhost:11434` directly due to browser cross-origin mixed-content and loopback networking policies. Furthermore, sending confidential public exam filings or scholarship documents to unapproved cloud APIs violates privacy.

NoticeNap is built on a **privacy-first, air-gapped architecture**:
1. The user runs NoticeNap locally.
2. The FastAPI backend extracts PDF text locally in memory via PyMuPDF.
3. The backend communicates locally with the user's running Ollama daemon (`http://localhost:11434`).
4. The selected open-weight model (`gemma2:latest`) runs fully offline on CPU/GPU.
5. Zero PDF bytes or extracted text leave your machine.
6. If Ollama is offline or uninstalled, NoticeNap automatically falls back to an offline pattern extractor so the app remains fully functional.

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
| **Backend API & Security** | `pytest backend/test_backend.py -v` | **5/5 Passed (100%) in 76.03s** |
| **Frontend Code Quality** | `npm run lint` (ESLint) | **0 Errors, 0 Warnings** |
| **Frontend Type Checking** | Next.js TypeScript Compiler | **0 Errors** |
| **Production Build** | `npm run build` | **Compiled Successfully (10 static pages/routes)** |

---

## 📄 License & Author

Created by **[Ansh Meshram](https://github.com/AnshMeshram)** for Hacktoberfest 2026.  
Licensed under the [MIT License](LICENSE).
