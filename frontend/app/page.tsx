"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function DedicatedHomePage() {
  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* 1. TOP STICKY HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_6px_rgba(25,29,22,0.04)] border-b border-outline-variant/30">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-secondary-container transition-colors shrink-0">
                <Image
                  src="/sloth-icon.svg"
                  alt="NoticeNap Sloth Icon"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="font-serif text-[22px] text-primary tracking-tight font-semibold">
                NoticeNap
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <a
                href="#product"
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Product
              </a>
              <a
                href="#how-it-works"
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                How it works
              </a>
              <a
                href="#open-source-ai"
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Open-source AI
              </a>
              <a
                href="https://github.com/AnshMeshram/NoticeNap"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/40">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] text-secondary font-semibold uppercase tracking-wider">
                LOCAL ENGINE: ON-DEVICE
              </span>
            </div>

            <Link
              href="/desk"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-all duration-150 shadow-sm active:translate-y-[0.5px]"
            >
              Open NoticeNap
            </Link>

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN PAGE CONTENT */}
      <main className="w-full pt-16 bg-surface min-h-[calc(100vh-16rem)]">
        <div className="flex flex-col w-full">
          {/* Ambient Desk Glow */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-secondary-container/40 blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-48 left-12 w-80 h-80 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none -z-10" />

            {/* HERO SECTION */}
            <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-20 lg:pt-14 lg:pb-28">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                {/* Left Column: Editorial Value Proposition */}
                <div className="lg:col-span-7 flex flex-col items-start gap-4">
                  {/* Eyebrow Pill */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/50 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono text-[11px] text-primary font-semibold tracking-wider uppercase">
                      YOUR PAPERWORK, AT A SLOWER PACE · HACKTOBERFEST 2026
                    </span>
                  </div>

                  {/* Main Serif Headline */}
                  <h1 className="font-serif text-[42px] sm:text-[52px] lg:text-[58px] text-primary tracking-tight font-normal leading-[1.12]">
                    Long notice?<br />
                    <span className="italic font-light text-secondary">Take it slow.</span>
                  </h1>

                  {/* Body Copy */}
                  <p className="font-sans text-[16px] sm:text-[18px] text-on-surface-variant max-w-xl leading-relaxed mt-1">
                    Turn lengthy official PDFs into clear summaries, important deadlines, and a calm, sequential checklist of what to do next.
                  </p>

                  {/* Primary & Secondary CTAs */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                      href="/desk"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary font-sans text-[14px] font-semibold hover:bg-primary-container transition-all duration-150 shadow-sm active:translate-y-[0.5px]"
                    >
                      <span>Analyze a PDF</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                    <a
                      href="#how-it-works"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary-container text-on-secondary-fixed font-sans text-[14px] font-semibold hover:bg-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      <span>See how it works</span>
                    </a>
                  </div>

                  {/* Scope Note */}
                  <p className="font-sans text-[12px] text-secondary pt-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                    Designed for scholarship, internship, recruitment, and examination notices.
                  </p>

                  {/* Interactive Demo Pills */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-2">
                    <span className="font-mono text-[11px] text-secondary uppercase tracking-wider shrink-0">
                      Try Sample:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/desk?sample=rhodes"
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant font-mono text-[11px] shadow-sm hover:bg-secondary-container hover:text-primary transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-secondary group-hover:text-primary">
                          description
                        </span>
                        <span>sample-scholarship-notice.pdf</span>
                      </Link>
                      <Link
                        href="/desk?sample=civil"
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant font-mono text-[11px] shadow-sm hover:bg-secondary-container hover:text-primary transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-secondary group-hover:text-primary">
                          description
                        </span>
                        <span>sample-exam-guidelines.pdf</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right Column: Tactile Desk Composition */}
                <div className="lg:col-span-5 relative">
                  <div className="relative bg-surface-container-low rounded-2xl p-6 lg:p-7 shadow-md border border-outline-variant/50">
                    {/* Desk Header Bar */}
                    <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40 mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
                          <span className="material-symbols-outlined text-[18px]">menu_book</span>
                        </div>
                        <div>
                          <div className="font-sans text-[13px] font-semibold text-primary leading-tight">
                            Document Desk
                          </div>
                          <div className="font-mono text-[10px] text-secondary">
                            ACTIVE SESSION · 48 PAGES INDEXED
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-container font-mono text-[10px] font-semibold text-primary">
                        VERIFIED OCR
                      </span>
                    </div>

                    {/* Archival Document Mockup */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden border border-outline-variant/40">
                      {/* Top Gazette Stamp */}
                      <div className="flex items-center justify-between text-secondary">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-secondary">
                          DOC-REF: #GAZ-2026-B81
                        </span>
                        <span className="font-mono text-[10px] text-primary bg-surface-container px-2 py-0.5 rounded">
                          PARAGRAPH 14(B)
                        </span>
                      </div>

                      {/* Title inside document */}
                      <div>
                        <h4 className="font-serif text-[18px] text-on-surface leading-snug font-medium">
                          National Graduate Fellowship in Applied Sciences
                        </h4>
                        <p className="font-sans text-[12px] text-secondary mt-0.5">
                          Ministry of Higher Education · Official Notification
                        </p>
                      </div>

                      {/* Simulated Legal Text with Margin Annotation */}
                      <div className="p-3.5 rounded-lg bg-surface-container-low text-on-surface-variant font-sans text-[12px] leading-relaxed relative border-l-4 border-tertiary-fixed-dim">
                        “Applicants must hold a minimum 65% aggregate score. All certified transcripts must reach the Regional Directorate by{" "}
                        <mark className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold">
                          October 31, 2026 at 17:00 IST
                        </mark>
                        . Late postal dispatches shall stand summarily rejected without hearing.”
                      </div>

                      {/* Mascot Sloth Vignette Overlay */}
                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary shadow-sm relative overflow-hidden shrink-0 border border-outline-variant/50">
                            <Image
                              src="/images/brand/sloth-mascot.png"
                              alt="Barnaby the Sloth mascot"
                              width={48}
                              height={48}
                              className="w-10 h-10 object-contain"
                            />
                            <span className="absolute bottom-0 right-0 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                            </span>
                          </div>
                          <div>
                            <span className="font-sans text-[13px] font-semibold text-primary block">
                              Barnaby the Sloth
                            </span>
                            <span className="font-sans text-[11px] text-secondary">
                              Sifting through Section 4...
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[11px] font-semibold text-primary block">
                            3 Cutoffs Found
                          </span>
                          <span className="font-sans text-[11px] text-secondary">
                            0 Hallucinations
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Floating Stamp Card Overlapping */}
                    <div className="mt-4 p-3.5 rounded-xl bg-surface-container flex items-center justify-between shadow-sm border border-outline-variant/40">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-primary">fact_check</span>
                        <div>
                          <span className="font-sans text-[12px] font-semibold text-on-surface block">
                            100% Page-Referenced
                          </span>
                          <span className="font-sans text-[11px] text-secondary">
                            Every extracted deadline maps directly to physical page margins
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-primary font-bold px-2 py-1 rounded bg-surface-container-lowest shrink-0 border border-outline-variant/40">
                        Page 3, ¶ 4
                      </span>
                    </div>

                    {/* Editorial Accent Tag pinned below card */}
                    <div className="mt-3 flex items-center justify-between px-2 text-secondary font-mono text-[10px]">
                      <span>STATIONERY SPEC: 120GSM BLOTTER</span>
                      <span className="flex items-center gap-1 text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        ALL OCR EXECUTES LOCALLY
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 2. THE PROBLEM & SOLUTION SECTION */}
          <section className="w-full bg-surface-container-low py-20 lg:py-24 border-y border-outline-variant/40" id="product">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-12">
              <div className="max-w-2xl flex flex-col gap-3">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-semibold">
                  THE PROBLEM &amp; THE REMEDY
                </span>
                <h2 className="font-serif text-[32px] sm:text-[38px] text-on-surface font-normal tracking-tight">
                  From pages of fine print to a few clear next steps.
                </h2>
                <p className="font-sans text-[15px] text-secondary leading-relaxed">
                  Official documents are dense, legalistic, and stressful. NoticeNap distills what matters without losing source evidence or your sanity.
                </p>
              </div>

              {/* Three Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Card 1 */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/40 flex flex-col justify-between hover:border-primary/40 transition-all duration-200 group">
                  <div className="flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[22px]">calendar_clock</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-[20px] text-on-surface font-semibold mb-2">
                        Find important dates
                      </h3>
                      <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                        Pinpoints hard cutoffs, registration windows, and interview schedules with explicit timezone citations and page bookmarks.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 mt-4 border-t border-surface-container flex items-center justify-between text-secondary font-mono text-[11px]">
                    <span>NO SURPRISE DEADLINES</span>
                    <span className="text-primary font-bold">01</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/40 flex flex-col justify-between hover:border-primary/40 transition-all duration-200 group">
                  <div className="flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[22px]">rule</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-[20px] text-on-surface font-semibold mb-2">
                        Understand eligibility &amp; requirements
                      </h3>
                      <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                        Extracts age brackets, qualifying degrees, percentage cutoffs, domicile mandates, and compulsory certificates in plain terms.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 mt-4 border-t border-surface-container flex items-center justify-between text-secondary font-mono text-[11px]">
                    <span>QUALIFICATIONS FIRST</span>
                    <span className="text-primary font-bold">02</span>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/40 flex flex-col justify-between hover:border-primary/40 transition-all duration-200 group">
                  <div className="flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[22px]">checklist_rtl</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-[20px] text-on-surface font-semibold mb-2">
                        Build an actionable checklist
                      </h3>
                      <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                        Converts multi-clause paragraphs into clear, sequential tasks ordered by deadline urgency so you always know what to prepare today.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 mt-4 border-t border-surface-container flex items-center justify-between text-secondary font-mono text-[11px]">
                    <span>READY TO EXECUTE</span>
                    <span className="text-primary font-bold">03</span>
                  </div>
                </div>
              </div>

              {/* Desk Context Banner */}
              <div className="bg-surface-container rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">nature_people</span>
                  </div>
                  <p className="font-sans text-[14px] text-primary font-medium">
                    “We read the 72-page recruitment bulletin so your desk stays clutter-free and your evening stays calm.”
                  </p>
                </div>
                <Link
                  href="/desk"
                  className="font-sans text-[13px] text-primary hover:underline flex items-center gap-1 shrink-0 font-semibold"
                >
                  <span>Explore Working Desk</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Link>
              </div>
            </div>
          </section>

          {/* 3. HOW IT WORKS */}
          <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28" id="how-it-works">
            <div className="flex flex-col gap-14">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/40">
                <div className="max-w-xl">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-semibold block mb-2">
                    THREE SIMPLE STEPS
                  </span>
                  <h2 className="font-serif text-[32px] sm:text-[38px] text-on-surface font-normal tracking-tight">
                    How NoticeNap brings order to the desk.
                  </h2>
                </div>
                <p className="font-sans text-[14px] text-secondary max-w-sm">
                  A tranquil three-stage path from unwieldy administrative PDF to verifiable peace of mind.
                </p>
              </div>

              {/* Linear Step Sequence */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="flex flex-col gap-4 bg-surface-container-lowest p-7 rounded-2xl shadow-sm border border-outline-variant/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-primary bg-secondary-container px-2.5 py-1 rounded">
                      STEP 01
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[24px]">upload_file</span>
                  </div>
                  <h3 className="font-serif text-[20px] text-on-surface font-semibold pt-2">
                    Drop in a PDF
                  </h3>
                  <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                    Select or drag official government gazettes, scholarship announcements, tender documents, or exam instructions up to 50MB directly into the Document Desk.
                  </p>
                  <div className="mt-4 p-3 bg-surface-container-low rounded-xl flex items-center gap-3 border border-outline-variant/30">
                    <span className="material-symbols-outlined text-primary text-[20px]">picture_as_pdf</span>
                    <div className="flex flex-col truncate">
                      <span className="font-mono text-[11px] text-on-surface font-semibold truncate">
                        announcement_2026_final.pdf
                      </span>
                      <span className="font-mono text-[10px] text-secondary">3.4 MB · 42 Pages</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col gap-4 bg-surface-container-lowest p-7 rounded-2xl shadow-sm border border-outline-variant/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-primary bg-secondary-container px-2.5 py-1 rounded">
                      STEP 02
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[24px]">psychology</span>
                  </div>
                  <h3 className="font-serif text-[20px] text-on-surface font-semibold pt-2">
                    Local AI extracts &amp; organizes
                  </h3>
                  <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                    The configured open-source model parses structural clauses, categorizes eligibility criteria, isolates dates, and anchors every statement to source pages.
                  </p>
                  <div className="mt-4 p-3 bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="font-mono text-[11px] text-primary font-semibold">OLLAMA / GEMMA 2</span>
                    </div>
                    <span className="font-mono text-[10px] text-secondary">100% On-Device</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col gap-4 bg-surface-container-lowest p-7 rounded-2xl shadow-sm border border-outline-variant/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-primary bg-secondary-container px-2.5 py-1 rounded">
                      STEP 03
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[24px]">task_alt</span>
                  </div>
                  <h3 className="font-serif text-[20px] text-on-surface font-semibold pt-2">
                    Review evidence &amp; follow tasks
                  </h3>
                  <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                    Verify every claim against authentic PDF margins with a single click. Export your customized checklist to Markdown or download an iCal (.ics) schedule.
                  </p>
                  <div className="mt-4 p-3 bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/30">
                    <div className="flex items-center gap-2 text-primary font-mono text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>5 OF 5 CHECKS VERIFIED</span>
                    </div>
                    <span className="font-mono text-[10px] text-secondary">Export MD / iCal</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. OPEN-SOURCE AI & PROVENANCE */}
          <section className="w-full bg-surface-container py-20 lg:py-24 border-y border-outline-variant/40" id="open-source-ai">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-12">
              <div className="max-w-2xl flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 text-primary font-mono text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[16px]">code</span>
                  <span>TRANSPARENCY &amp; LOCAL FIRST ARCHITECTURE</span>
                </div>
                <h2 className="font-serif text-[32px] sm:text-[38px] text-on-surface font-normal tracking-tight">
                  Open by design. Clear about what runs where.
                </h2>
                <p className="font-sans text-[15px] text-secondary leading-relaxed">
                  NoticeNap is an open-source initiative built for honest, self-hosted utility. No mysterious cloud black-boxes, telemetry trackers, or vendor lock-in.
                </p>
              </div>

              {/* 3 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-lowest p-7 rounded-2xl shadow-sm border border-outline-variant/40 flex flex-col justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <span className="material-symbols-outlined text-[20px]">tune</span>
                      <span className="font-mono text-[11px] font-semibold uppercase">FLEXIBLE WEIGHTS</span>
                    </div>
                    <h3 className="font-serif text-[20px] text-on-surface font-semibold">
                      Model choice &amp; configuration
                    </h3>
                    <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                      Connects seamlessly with your local Ollama daemon running open models like Gemma 2 or Llama 3. No proprietary cloud API keys required.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between font-mono text-[11px] text-secondary">
                    <span>OPEN WEIGHTS</span>
                    <span className="text-primary font-semibold">OLLAMA / GEMMA 2</span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-7 rounded-2xl shadow-sm border border-outline-variant/40 flex flex-col justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <span className="material-symbols-outlined text-[20px]">pin_drop</span>
                      <span className="font-mono text-[11px] font-semibold uppercase">PAGE ANCHORING</span>
                    </div>
                    <h3 className="font-serif text-[20px] text-on-surface font-semibold">
                      Source-page evidence
                    </h3>
                    <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                      Eliminate hallucinations by design. Every single generated summary point, eligibility check, and deadline links directly back to its exact source page.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between font-mono text-[11px] text-secondary">
                    <span>ZERO GUESSWORK</span>
                    <span className="text-primary font-semibold">PYMUPDF CITATIONS</span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-7 rounded-2xl shadow-sm border border-outline-variant/40 flex flex-col justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <span className="material-symbols-outlined text-[20px]">security</span>
                      <span className="font-mono text-[11px] font-semibold uppercase">ZERO SURVEILLANCE</span>
                    </div>
                    <h3 className="font-serif text-[20px] text-on-surface font-semibold">
                      Local processing when self-hosted
                    </h3>
                    <p className="font-sans text-[14px] text-on-surface-variant leading-relaxed">
                      When run on your workstation, documents never leave your machine. Your private government filings and application forms stay strictly yours.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between font-mono text-[11px] text-secondary">
                    <span>LOCAL RUNTIME</span>
                    <span className="text-primary font-semibold">NO CLOUD LOGS</span>
                  </div>
                </div>
              </div>

              {/* Honest Transparency Callout */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface-variant font-sans text-[13px] flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">info</span>
                <span>
                  <strong>Honest deployment notice:</strong> For strict on-device data sovereignty and custom model inference, please run NoticeNap locally on your machine. A deployed remote preview cannot access your computer&apos;s <code className="font-mono text-[11px] bg-surface-container px-1 py-0.5 rounded">localhost:11434</code>.
                </span>
              </div>
            </div>
          </section>

          {/* 5. WORKSPACE INTEGRATION PREVIEW */}
          <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-semibold block mb-2">
                    WORKSPACE INTEGRATION
                  </span>
                  <h2 className="font-serif text-[32px] sm:text-[38px] text-on-surface font-normal tracking-tight">
                    From Desk to Analysis to Action List.
                  </h2>
                </div>
                <p className="font-sans text-[14px] text-secondary max-w-sm">
                  Everything in NoticeNap connects seamlessly across your research workflow.
                </p>
              </div>

              {/* 4 App Screen Links */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link
                  href="/desk?tab=desk"
                  className="group bg-surface-container-low p-5 rounded-2xl hover:bg-surface-container transition-all flex flex-col justify-between border border-outline-variant/40"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-primary font-bold">SCREEN 01</span>
                      <span className="material-symbols-outlined text-[20px] text-secondary group-hover:text-primary transition-colors">
                        arrow_outward
                      </span>
                    </div>
                    <h4 className="font-serif text-[18px] text-on-surface font-semibold">Document Desk</h4>
                    <p className="font-sans text-[12px] text-secondary">
                      Drag-and-drop workspace for uploading multi-page gazettes and triggering safe local extraction.
                    </p>
                  </div>
                  <span className="mt-4 font-mono text-[11px] text-primary font-medium group-hover:underline">
                    Launch Desk →
                  </span>
                </Link>

                <Link
                  href="/desk?tab=analysis"
                  className="group bg-surface-container-low p-5 rounded-2xl hover:bg-surface-container transition-all flex flex-col justify-between border border-outline-variant/40"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-primary font-bold">SCREEN 02</span>
                      <span className="material-symbols-outlined text-[20px] text-secondary group-hover:text-primary transition-colors">
                        arrow_outward
                      </span>
                    </div>
                    <h4 className="font-serif text-[18px] text-on-surface font-semibold">Analysis</h4>
                    <p className="font-sans text-[12px] text-secondary">
                      Side-by-side reading view with interactive citations, clause breakdown, and key metrics.
                    </p>
                  </div>
                  <span className="mt-4 font-mono text-[11px] text-primary font-medium group-hover:underline">
                    View Analysis →
                  </span>
                </Link>

                <Link
                  href="/desk?tab=actions"
                  className="group bg-surface-container-low p-5 rounded-2xl hover:bg-surface-container transition-all flex flex-col justify-between border border-outline-variant/40"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-primary font-bold">SCREEN 03</span>
                      <span className="material-symbols-outlined text-[20px] text-secondary group-hover:text-primary transition-colors">
                        arrow_outward
                      </span>
                    </div>
                    <h4 className="font-serif text-[18px] text-on-surface font-semibold">Action List</h4>
                    <p className="font-sans text-[12px] text-secondary">
                      Prioritized to-do list with interactive checkboxes, progress bar, and Markdown / iCal exports.
                    </p>
                  </div>
                  <span className="mt-4 font-mono text-[11px] text-primary font-medium group-hover:underline">
                    Check Actions →
                  </span>
                </Link>

                <Link
                  href="/desk?tab=library"
                  className="group bg-surface-container-low p-5 rounded-2xl hover:bg-surface-container transition-all flex flex-col justify-between border border-outline-variant/40"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-primary font-bold">SCREEN 04</span>
                      <span className="material-symbols-outlined text-[20px] text-secondary group-hover:text-primary transition-colors">
                        arrow_outward
                      </span>
                    </div>
                    <h4 className="font-serif text-[18px] text-on-surface font-semibold">Library</h4>
                    <p className="font-sans text-[12px] text-secondary">
                      Archival shelf preserving parsed notices, SHA-256 fingerprints, and past document sessions.
                    </p>
                  </div>
                  <span className="mt-4 font-mono text-[11px] text-primary font-medium group-hover:underline">
                    Open Library →
                  </span>
                </Link>
              </div>
            </div>
          </section>

          {/* 6. FINAL CALL TO ACTION */}
          <section className="w-full bg-secondary-container/40 py-20 lg:py-28 border-t border-outline-variant/40">
            <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm mb-2 overflow-hidden border border-outline-variant/60">
                <Image
                  src="/images/brand/sloth-mascot.png"
                  alt="Barnaby the Sloth emblem"
                  width={64}
                  height={64}
                  className="w-12 h-12 object-contain"
                />
              </div>

              <h2 className="font-serif text-[38px] sm:text-[46px] text-primary tracking-tight font-normal leading-tight">
                Let the sloth handle the reading.
              </h2>

              <p className="font-serif text-[20px] text-secondary italic max-w-xl font-normal">
                “Start with a notice. Finish with a plan.”
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Link
                  href="/desk"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-on-primary font-sans text-[14px] font-semibold hover:bg-primary-container transition-all duration-150 shadow-sm active:translate-y-[0.5px]"
                >
                  <span className="material-symbols-outlined text-[20px]">desk</span>
                  <span>Open the Document Desk</span>
                </Link>
                <a
                  href="https://github.com/AnshMeshram/NoticeNap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-sans text-[14px] font-semibold hover:bg-surface-container transition-colors shadow-sm border border-outline-variant/40"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">star</span>
                  <span>Star on GitHub (AnshMeshram/NoticeNap)</span>
                </a>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-secondary pt-4">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>MIT Open Source License · 100% Free · No sign-up required</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 7. FOOTER */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex flex-col gap-3 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <Image
                    src="/sloth-icon.svg"
                    alt="NoticeNap Logo"
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <span className="font-serif text-[20px] text-primary font-semibold">NoticeNap</span>
              </div>
              <p className="font-serif text-[14px] italic text-secondary leading-snug">
                “Let the notice be long. Your to-do list shouldn’t.”
              </p>
              <p className="font-sans text-[12px] text-on-surface-variant leading-relaxed">
                Thoughtful legal notice and bureaucratic analysis powered entirely within your computer&apos;s local environment.
              </p>
            </div>

            <div className="flex flex-wrap gap-8 sm:gap-12">
              <div className="flex flex-col gap-2">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  App Sections
                </span>
                <Link href="/desk?tab=desk" className="font-sans text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                  Document Desk
                </Link>
                <Link href="/desk?tab=analysis" className="font-sans text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                  Analysis
                </Link>
                <Link href="/desk?tab=actions" className="font-sans text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                  Action List
                </Link>
                <Link href="/desk?tab=library" className="font-sans text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                  Library
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Community &amp; Code
                </span>
                <a
                  href="https://github.com/AnshMeshram/NoticeNap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[13px] text-on-surface-variant hover:text-primary transition-colors"
                >
                  GitHub Repository
                </a>
                <a href="#open-source-ai" className="font-sans text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                  Model Weights
                </a>
                <a href="#open-source-ai" className="font-sans text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                  Zero-Telemetry Guarantee
                </a>
              </div>

              <div className="flex flex-col gap-2 max-w-xs">
                <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Recognition
                </span>
                <div className="p-3 rounded-xl bg-surface-container flex items-start gap-2.5 border border-outline-variant/40">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0">verified</span>
                  <div className="flex flex-col">
                    <span className="font-sans text-[12px] text-on-surface font-semibold">Hacktoberfest 2026</span>
                    <span className="font-sans text-[11px] text-secondary">Slow &amp; Steady Track Honoree</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div className="flex items-center gap-2 font-mono text-[10px] text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>All inference executes locally on device. Zero notice text or extracted mandates ever leave this machine.</span>
            </div>
            <div className="font-sans text-[11px] text-secondary">
              © 2026 NoticeNap. Released under the MIT License.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
