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
| **01** | NoticeNap — The Calm Document Desk | `d9bf8d7fd92d46ec8466ab1ae3279c6e` | Desktop | 2560 × 3064 (Canvas 1280 × 1642) | `/` (Main Workspace) | **Implementing (Slice 1)** |
| **02** | NoticeNap — 02 Document Analysis | `95149c00f2b749528d5a0aa72e2aaedf` | Desktop | 2560 × 3492 (Canvas 1280 × 1731) | `/analysis/[id]` | Mapped for Phase 3 |
| **03** | NoticeNap — 03 My Action List | `ed15fd037b6044eebfaecb162a62eabc` | Desktop | 2560 × 5016 (Canvas 1280 × 1942) | `/actions` | Mapped for Phase 4 |
| **04** | NoticeNap — 04 Document Library | `48c85fd03e954c4186d0179ee0abea83` | Desktop | 2560 × 3824 (Canvas 1280 × 1461) | `/library` | Mapped for Phase 5 |
| **05** | NoticeNap — 05 Mobile Experience | `eee916a541ac407292fe7a829c7831d5` | Mobile | 780 × 2890 (Canvas 390 × 1265) | Responsive breakpoint across all routes | Mapped for responsive layout |

---

## Screen Details & Component Breakdown

### Screen 01: The Calm Document Desk (`d9bf8d7fd92d46ec8466ab1ae3279c6e`)
- **Visual Role**: Primary drop zone and archival blotter.
- **Key Regions**:
  1. **Left Nav Rail**: Fixed 64-width sidebar with NoticeNap wordmark, tagline ("Let the notice be long."), navigation links (`New Analysis`, `Document Library`, `Saved Checklists`, `Settings`), and bottom Ollama connection status card (`localhost:11434 • offline / connected`).
  2. **Top Header**: Breadcrumb (`Desk Blotter / Archival Workspace`), live inference status chip (`INFERENCE: STANDBY / PROCESSING`), user profile avatar.
  3. **Quiet Workspace Header**: "One less thing to figure out." title, subhead, "Local Ollama · 100% on device" privacy badge.
  4. **Primary Drop Zone**: Tactile document drop area with hover/drag state, file picker trigger button, `.pdf` constraints (up to 50MB).
  5. **4 Key Facets**: Grid detailing Dates, Eligibility, Required Documents, and Next Steps.
  6. **Empty State / Recent Desk Tray**: Sloth mascot illustration resting on desk paperwork, "No paperwork processed yet.", sample notice chips (`Rhodes Scholarship 2025`, `Civil Services Exam Notice`, `Research Fellowship PDF`).
  7. **Trust & Traceability Banner**: "Every fact verified with source page citations" source-linked guarantee.

### Screen 02: Document Analysis (`95149c00f2b749528d5a0aa72e2aaedf`)
- **Visual Role**: Two-column split-view workspace.
- **Left Column**: PDF document viewer with extracted text, page navigator, and highlighted clauses.
- **Right Column**: Structured facet analysis cards:
  - Important dates & deadlines countdown.
  - Eligibility benchmark criteria (pass/conditional/unmatched).
  - Required document checklist with specification notes.
  - Source-cited clauses linked directly to PDF page numbers.

### Screen 03: My Action List (`ed15fd037b6044eebfaecb162a62eabc`)
- **Visual Role**: Prioritized, actionable checklist derived from analyzed notices.
- **Key Features**:
  - Filterable by urgency (Immediate, Before Deadline, Post-Submission).
  - Checkbox toggle with completion progress indicator.
  - "Jump to Page X" citation links on every action item.
  - Export to markdown / calendar reminder file.

### Screen 04: Document Library (`48c85fd03e954c4186d0179ee0abea83`)
- **Visual Role**: Archived notices desk tray and historical ledger.
- **Key Features**:
  - Filter cards (All, Active, Expired, Archived).
  - Notice cards showing title, issuing body, key deadline badge, completion status bar.
  - Quick actions: Re-open desk analysis, view checklist, delete notice.

### Screen 05: Mobile Experience (`eee916a541ac407292fe7a829c7831d5`)
- **Visual Role**: Compact 390px mobile layout.
- **Key Features**:
  - Collapsible drawer / bottom bar navigation.
  - Stacked cards for mobile touch interaction.
  - Quick camera or file upload for notices on mobile.

---

## Source Assets & References

- **Logo Wordmark**: `stitch-handoff/logo.png`
- **Sloth Mascot**: `stitch-handoff/sloth.png`
- **Design Tokens**: Material Theme JSON extracted directly from Stitch project metadata:
  - Primary: `#0a3626`
  - Primary Container: `#244d3b`
  - Secondary Container: `#dae3d0`
  - Background / Surface: `#f8fbef`
  - Surface Container Lowest: `#ffffff`
  - Surface Container Low: `#f2f5ea`
  - Surface Container: `#ecefe4`
  - Surface Container High: `#e6e9de`
  - Outline Variant: `#c1c8c2`
  - Typography: `Newsreader`, `Manrope`, `JetBrains Mono`
