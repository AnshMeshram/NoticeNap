"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ExtractedPage {
  page_number: number;
  text: string;
  char_count: number;
  word_count: number;
}

interface DocumentExtractionResult {
  document_id: string;
  filename: string;
  sha256: string;
  file_size_bytes: number;
  page_count: number;
  total_words: number;
  pages: ExtractedPage[];
  is_encrypted: boolean;
}

interface OllamaStatus {
  connected: boolean;
  ollama_host: string;
  configured_model: string;
  model_available: boolean;
  installed_models: string[];
  status_message: string;
}

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [documentResult, setDocumentResult] = useState<DocumentExtractionResult | null>(null);
  const [activeTab, setActiveTab] = useState("desk");
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    connected: false,
    ollama_host: "http://localhost:11434",
    configured_model: "gemma2",
    model_available: false,
    installed_models: [],
    status_message: "localhost:11434 • checking...",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Check Ollama system connectivity
  const checkStatus = React.useCallback(async () => {
    try {
      const res = await fetch(`${backendBase}/api/system/status`);
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus(data);
      } else {
        setOllamaStatus((prev) => ({
          ...prev,
          connected: false,
          status_message: "localhost:11434 • offline",
        }));
      }
    } catch {
      setOllamaStatus((prev) => ({
        ...prev,
        connected: false,
        status_message: "localhost:11434 • offline",
      }));
    }
  }, [backendBase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkStatus();
    }, 0);
    const interval = setInterval(checkStatus, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkStatus]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF documents are supported (.pdf).");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit.");
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingMessage(`Extracting "${file.name}" locally with PyMuPDF...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${backendBase}/api/documents/extract`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with HTTP ${res.status}`);
      }

      const data: DocumentExtractionResult = await res.json();
      setDocumentResult(data);
      setSelectedPage(1);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to extract PDF.";
      setError(`Extraction error: ${errMsg}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadSample = async (sampleFileName: string) => {
    setError(null);
    setLoading(true);
    setLoadingMessage(`Loading sample "${sampleFileName}"...`);

    try {
      const response = await fetch(`/samples/${sampleFileName}`);
      if (!response.ok) throw new Error("Could not find sample notice.");
      const blob = await response.blob();
      const file = new File([blob], sampleFileName.replace(/_/g, " "), { type: "application/pdf" });
      await handleFileUpload(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sample load failed.";
      setError(`Could not load sample: ${msg}`);
      setLoading(false);
    }
  };

  const resetDesk = () => {
    setDocumentResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex min-h-screen bg-surface font-sans text-on-surface antialiased">
      {/* 1. LEFT NAVIGATION RAIL */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low shadow-[1px_0_0_0_#e1e4d9] z-50 flex flex-col justify-between py-6 px-4">
        <div className="flex flex-col gap-6">
          {/* Logo and Wordmark */}
          <div className="px-2 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src="/logo.png"
                  alt="NoticeNap Wordmark & Logo Mark"
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
              <span className="font-serif text-[20px] font-semibold text-primary tracking-tight">
                NoticeNap
              </span>
            </div>
            <p className="font-serif text-[12px] italic text-secondary pl-0.5">
              Let the notice be long.
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("desk")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === "desk"
                  ? "bg-secondary-container text-on-secondary-fixed font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span className="text-[14px]">New Analysis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === "library"
                  ? "bg-secondary-container text-on-secondary-fixed font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              <span className="text-[14px]">Document Library</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("checklists")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === "checklists"
                  ? "bg-secondary-container text-on-secondary-fixed font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">checklist</span>
              <span className="text-[14px]">Saved Checklists</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === "settings"
                  ? "bg-secondary-container text-on-secondary-fixed font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="text-[14px]">Settings</span>
            </button>
          </nav>
        </div>

        {/* Ollama Daemon Status Card */}
        <div className="p-3 bg-surface-container rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col gap-2.5 border border-outline-variant/40 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus.connected ? "bg-primary" : "bg-tertiary-fixed-dim"
                }`}
              />
              <span className="font-mono text-[11px] text-on-surface-variant uppercase font-medium">
                {ollamaStatus.connected
                  ? `Ollama: Ready (${ollamaStatus.configured_model})`
                  : "Ollama: Unconnected"}
              </span>
            </div>
            <button
              type="button"
              onClick={checkStatus}
              className="font-mono text-[11px] text-primary underline underline-offset-2 hover:text-primary-container transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="font-mono text-[11px] text-secondary truncate">
            {ollamaStatus.status_message}
          </div>
        </div>
      </aside>

      {/* 2. MAIN DESK WORKSPACE */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface/85 backdrop-blur-md shadow-[0_1px_0_0_#e1e4d9] z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-6 w-6 shrink-0">
              <Image
                src="/logo.png"
                alt="NoticeNap Wordmark & Logo Mark"
                width={24}
                height={24}
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="text-[16px] text-primary font-semibold tracking-tight">
              Desk Blotter
            </span>
            <span className="text-outline-variant font-mono text-[11px]">/</span>
            <span className="font-mono text-[11px] text-secondary uppercase tracking-wider">
              Archival Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full shadow-[0_0_0_1px_#e1e4d9]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  loading ? "bg-tertiary animate-pulse" : "bg-secondary-fixed-dim"
                }`}
              />
              <span className="font-mono text-[11px] text-secondary tracking-wide">
                {loading ? "INFERENCE: EXTRACTING" : "INFERENCE: STANDBY"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative pt-24 pb-16 px-8 max-w-6xl mx-auto w-full flex flex-col gap-10">
          {/* Top Title Area */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-secondary font-medium">
                  Quiet Workspace
                </span>
              </div>
              <h1 className="font-serif text-[32px] md:text-[38px] leading-tight text-on-surface tracking-tight font-normal">
                One less thing to figure out.
              </h1>
              <p className="text-[16px] text-secondary leading-relaxed">
                Drop in an official notice. Extract dates, eligibility criteria, and next steps without cloud processing.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-end text-secondary font-mono text-[11px]">
              <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
              <span>Local Ollama · 100% on device</span>
            </div>
          </section>

          {/* Error Banner if any */}
          {error && (
            <div className="p-4 rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-error">error</span>
              <p className="text-[14px] flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-[12px] font-mono underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Primary Drop Zone */}
          <section className="relative w-full">
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() => {
                if (!documentResult && fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              className={`group relative rounded-xl bg-surface-container-lowest p-10 md:p-14 border transition-all duration-300 flex flex-col items-center text-center cursor-pointer shadow-sm ${
                isDragging
                  ? "border-primary bg-surface-container-high ring-2 ring-primary/20"
                  : "border-outline-variant/60 hover:border-primary-container/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center max-w-xl gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-1">
                  <span className="material-symbols-outlined text-[28px]">
                    {loading ? "sync" : "upload_file"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="font-serif text-[24px] font-medium text-on-surface">
                    {loading ? loadingMessage : "Give that PDF a rest."}
                  </h2>
                  <p className="text-[14px] text-secondary">
                    Drop a scholarship, recruitment, academic, or examination notice here.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-primary-container text-on-primary font-semibold text-[15px] hover:bg-primary transition-all duration-150 active:translate-y-[0.5px] shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Choose a PDF</span>
                  </button>
                  <span className="text-[12px] text-secondary">or drag document onto desk</span>
                </div>

                <p className="font-mono text-[11px] text-secondary pt-2">
                  PDF documents up to 50MB · Evaluated privately on localhost
                </p>
              </div>
            </div>
          </section>

          {/* ACTIVE EXTRACTION RESULT BLOTTER (When document processed) */}
          {documentResult && (
            <section className="rounded-xl bg-surface-container-lowest p-6 md:p-8 border border-outline-variant/70 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-[20px] font-semibold text-on-surface">
                      {documentResult.filename}
                    </h3>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-secondary">
                      <span>{documentResult.page_count} Pages</span>
                      <span>•</span>
                      <span>{documentResult.total_words.toLocaleString()} Words</span>
                      <span>•</span>
                      <span>{(documentResult.file_size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-secondary uppercase bg-surface-container-low px-2.5 py-1 rounded">
                    SHA-256: {documentResult.sha256.slice(0, 10)}...
                  </span>
                  <button
                    type="button"
                    onClick={resetDesk}
                    className="px-3 py-1 text-[12px] rounded border border-outline-variant/70 text-secondary hover:bg-surface-container-low transition-colors"
                  >
                    Clear Desk
                  </button>
                </div>
              </div>

              {/* Page Navigator & Extracted Text Preview */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-secondary font-medium">
                    PyMuPDF Local Text Stream (Air-gapped)
                  </span>
                  {/* Page selector buttons */}
                  <div className="flex items-center gap-1">
                    {documentResult.pages.map((p) => (
                      <button
                        key={p.page_number}
                        type="button"
                        onClick={() => setSelectedPage(p.page_number)}
                        className={`px-3 py-1 rounded text-[12px] font-mono transition-colors ${
                          selectedPage === p.page_number
                            ? "bg-primary text-on-primary font-semibold"
                            : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                        }`}
                      >
                        Page {p.page_number}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Content Display */}
                {documentResult.pages.length > 0 && (
                  <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono text-[13px] leading-relaxed text-on-surface whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {documentResult.pages.find((p) => p.page_number === selectedPage)?.text ||
                      "No selectable text found on this page."}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 3. WHAT NOTICE NAP WILL EXTRACT (4 Key Facets) */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-secondary">
                Notice breakdown angles
              </span>
              <span className="font-mono text-[11px] text-secondary">4 Key Facets</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-2">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] text-secondary">01 / Dates</span>
                <h3 className="text-[16px] font-semibold text-on-surface">Important Dates</h3>
                <p className="text-[12px] text-secondary leading-relaxed">
                  Deadlines, examination windows, and interview schedules extracted cleanly.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] text-secondary">02 / Eligibility</span>
                <h3 className="text-[16px] font-semibold text-on-surface">Eligibility</h3>
                <p className="text-[12px] text-secondary leading-relaxed">
                  Age caps, degree benchmarks, percentage rules, and category stipulations.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] text-secondary">03 / Documents</span>
                <h3 className="text-[16px] font-semibold text-on-surface">Required Documents</h3>
                <p className="text-[12px] text-secondary leading-relaxed">
                  Certificates, size specifications, format limitations, and attestations.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] text-secondary">04 / Actions</span>
                <h3 className="text-[16px] font-semibold text-on-surface">Next Steps</h3>
                <p className="text-[12px] text-secondary leading-relaxed">
                  Sequential submission roadmap, registration portals, and fees.
                </p>
              </div>
            </div>
          </section>

          {/* 4. RECENT WORK EMPTY STATE (With Sloth Illustration) */}
          {!documentResult && (
            <section className="rounded-xl bg-surface-container-low p-8 md:p-10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 w-full">
                <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
                  <Image
                    src="/sloth.png"
                    alt="NoticeNap Sleepy Sloth Resting on Desk Paperwork"
                    width={112}
                    height={112}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex flex-col gap-3 text-center md:text-left flex-1">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] text-secondary uppercase font-medium">
                      Desk Tray · Empty
                    </span>
                    <h3 className="font-serif text-[20px] font-semibold text-on-surface">
                      No paperwork processed yet.
                    </h3>
                    <p className="text-[14px] text-secondary max-w-xl">
                      Your actionable checklist and deadline reminders will appear here as soon as you analyze a document.
                    </p>
                  </div>

                  {/* Sample Notices Quick Chips */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-secondary">Sample notices:</span>
                    <button
                      type="button"
                      onClick={() => loadSample("Rhodes_Scholarship_2025.pdf")}
                      className="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-secondary-container transition-colors text-on-surface font-mono text-[11px] border border-outline-variant/60 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        description
                      </span>
                      Rhodes Scholarship 2025
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSample("Civil_Services_Exam_Notice.pdf")}
                      className="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-secondary-container transition-colors text-on-surface font-mono text-[11px] border border-outline-variant/60 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        description
                      </span>
                      Civil Services Exam Notice
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSample("Research_Fellowship_PDF.pdf")}
                      className="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-secondary-container transition-colors text-on-surface font-mono text-[11px] border border-outline-variant/60 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        description
                      </span>
                      Research Fellowship PDF
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 5. TRUST AND TRACEABILITY BANNER */}
          <footer className="rounded-lg bg-surface-container-lowest p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 mb-6 border border-outline-variant/40">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">
                menu_book
              </span>
              <div className="flex flex-col">
                <h4 className="text-[16px] font-semibold text-on-surface">
                  Every fact verified with source page citations
                </h4>
                <p className="text-[12px] text-secondary">
                  Generated checklist points link directly to specific notice pages and clauses for inspection.
                </p>
              </div>
            </div>
            <span className="font-mono text-[11px] text-secondary">
              Source-linked guarantee
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
