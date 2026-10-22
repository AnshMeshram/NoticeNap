# NoticeNap — Approved Stitch Screen Manifest

**Project Name**: `NoticeNap Workspace Interface`  
**Stitch Project ID**: `14480156016592971476` (`projects/14480156016592971476`)  
**Design Origin**: Google Stitch Canvas  
**Audited & Verified**: 2026-10-21  
**Tagline**: *"Let the notice be long. Your to-do list shouldn't."*  
**Visual Language**: Warm paper background (`#f8fbef`), deep forest green (`#0a3626`, `#244d3b`), soft sage (`#dae3d0`, `#586152`), muted amber accents (`#dbac53`), Newsreader serif headings, Manrope body/interface text, JetBrains Mono metadata/status badges, restrained sloth mascot.

---

## Screen Inventory

| Screen # | Screen Title | Stitch Screen ID | Device Type | Viewport Dimensions | Intended App Route | Status |
|---|---|---|---|---|---|---|
| **06** | **NoticeNap — 06 Dedicated Home** | `d64b931ac3a94df8a4a7616474dbbc9c` | Desktop/Mobile | 2560 × 9100 | `/` (Public Landing Page) | **Implemented & Verified** |
| **01** | **NoticeNap — The Calm Document Desk** | `d9bf8d7fd92d46ec8466ab1ae3279c6e` | Desktop | 2560 × 3064 | `/desk` | **Implemented & Verified** |
| **02** | **NoticeNap — 02 Document Analysis** | `95149c00f2b749528d5a0aa72e2aaedf` | Desktop | 2560 × 3492 | `/desk?tab=analysis` | **Implemented & Verified** |
| **03** | **NoticeNap — 03 My Action List** | `ed15fd037b6044eebfaecb162a62eabc` | Desktop | 2560 × 5016 | `/desk?tab=actions` | **Implemented & Verified** |
| **04** | **NoticeNap — 04 Document Library** | `48c85fd03e954c4186d0179ee0abea83` | Desktop | 2560 × 3824 | `/desk?tab=library` | **Implemented & Verified** |
| **05** | **NoticeNap — 05 Mobile Experience** | `eee916a541ac407292fe7a829c7831d5` | Mobile | 780 × 2890 | `< 768px` Responsive Bottom Bar | **Implemented & Verified** |

---

## Screen Details & Component Breakdown

### Screen 06: Dedicated Home (`d64b931ac3a94df8a4a7616474dbbc9c`)
- **Visual Role**: Public landing page and product presentation.
- **Key Sections**:
  1. **Sticky Header**: NoticeNap wordmark, Sloth vector mark, Product/How It Works/Open-Source AI/GitHub links, `LOCAL ENGINE: ON-DEVICE` status chip, `Open NoticeNap` CTA.
  2. **Hero Section**: Eyebrow pill ("YOUR PAPERWORK, AT A SLOWER PACE · HACKTOBERFEST 2026"), "Long notice? Take it slow." headline, "Analyze a PDF" primary button, sample notice pills (`sample-scholarship-notice.pdf`, `sample-exam-guidelines.pdf`).
  3. **Tactile Desk Composition**: Gazette mockup (`#GAZ-2026-B81`), legal quote highlight, Barnaby the Sloth mascot vignette, "100% Page-Referenced" floating stamp.
  4. **The Problem & The Remedy**: 3 cards detailing Important Dates, Eligibility & Requirements, Actionable Checklist.
  5. **Three Simple Steps**: Step 1 (Drop in a PDF), Step 2 (Local AI extracts & organizes), Step 3 (Review evidence & follow tasks).
  6. **Open-Source AI & Provenance**: Model choice (Ollama / Gemma 2), source-page citations, zero surveillance guarantee.
  7. **Workspace Integration**: Direct links to Screen 01 (Desk), Screen 02 (Analysis), Screen 03 (Action List), Screen 04 (Library).
  8. **Final CTA**: "Let the sloth handle the reading." with direct launch button to `/desk`.

### Screen 01: The Calm Document Desk (`d9bf8d7fd92d46ec8466ab1ae3279c6e`)
- **Route**: `/desk` (and `/workspace`)
- **Visual Role**: Primary operational drop zone and archival blotter.
- **Key Regions**:
  1. **Left Nav Rail**: Fixed 64-width sidebar with "Back to Home" link, NoticeNap wordmark, navigation tabs, and live Ollama connection status card.
  2. **Top Header**: Breadcrumb, inference status chip, language selector (`EN`, `हिंदी`, `मराठी`).
  3. **Quiet Workspace Header**: "Give that notice a rest." title, subhead, "Local Ollama · 100% on device" privacy badge.
  4. **Primary Drop Zone**: Tactile document drop area with hover/drag state, file picker, 50MB size guard.
  5. **4 Key Facets**: Dates, Eligibility, Documents, Next Steps.
  6. **Empty State / Recent Desk Tray**: Sloth mascot illustration, sample notice chips.

### Screen 02: Document Analysis (`95149c00f2b749528d5a0aa72e2aaedf`)
- **Route**: `/desk?tab=analysis`
- **Visual Role**: Two-column split-view workspace.
- **Left Column**: PDF raw page stream with 1-indexed pagination (`Page 1`, `Page 2`, ...).
- **Right Column**: Structured facet analysis cards:
  - Important dates & deadlines with source page citations.
  - Eligibility benchmark criteria (age, degrees, percentages).
  - Required document checklist with specification notes.
  - Application fees & waiver conditions.
  - Uncertainty notices & caveats requiring human verification.
  - Scanned PDF warning alert when OCR is needed.

### Screen 03: My Action List (`ed15fd037b6044eebfaecb162a62eabc`)
- **Route**: `/desk?tab=actions`
- **Visual Role**: Prioritized, actionable checklist derived from analyzed notices.
- **Key Features**:
  - Filterable by urgency (All, Pending, Completed).
  - Checkbox toggles with reactive progress bar (`% Completed`).
  - Source-page citation badges on every action item.
  - One-click Markdown Export (`.md`).
  - One-click RFC-5545 iCalendar Export (`.ics`).

### Screen 04: Document Library (`48c85fd03e954c4186d0179ee0abea83`)
- **Route**: `/desk?tab=library`
- **Visual Role**: Archived notices desk tray and historical ledger.
- **Key Features**:
  - Live search filter by filename, SHA-256 fingerprint, page count, and file size.
  - Quick actions: Re-open desk analysis, view checklist, delete notice from memory desk tray.
  - Zero horizontal clipping with responsive table layout.

### Screen 05: Mobile Experience (`eee916a541ac407292fe7a829c7831d5`)
- **Route**: Responsive viewport (`< 768px`) across all pages
- **Key Features**:
  - Tested at 390 × 844 px.
  - Fixed ergonomic bottom navigation bar: **The Desk**, **Analysis**, **Actions**, **Library**, and **Settings**.
  - Touch-friendly tap targets (minimum 44px height), responsive typography, zero horizontal overflow.
