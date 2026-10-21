"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  is_scanned?: boolean;
  security_warnings?: string[];
}

interface NoticeDate {
  title: string;
  date_str: string;
  is_deadline: boolean;
  source_page: number;
  context: string;
}

interface EligibilityItem {
  category: string;
  requirement: string;
  is_strict: boolean;
  source_page: number;
}

interface RequiredDocument {
  name: string;
  specification: string;
  is_mandatory: boolean;
  source_page: number;
}

interface ActionStep {
  step_number: number;
  title: string;
  description: string;
  deadline?: string;
  source_page: number;
  completed: boolean;
}

interface NoticeAnalysisResult {
  document_id: string;
  filename: string;
  purpose: string;
  summary: string;
  application_fee?: string;
  uncertainties: string[];
  dates: NoticeDate[];
  eligibility: EligibilityItem[];
  documents: RequiredDocument[];
  actions: ActionStep[];
  language: string;
  ai_engine: string;
  generated_at: string;
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
  const [activeTab, setActiveTab] = useState<"desk" | "analysis" | "actions" | "library">("desk");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [filterAction, setFilterAction] = useState<"all" | "pending" | "completed">("all");
  const [searchLibrary, setSearchLibrary] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | "mr">("en");

  // Core Data Stores
  const [documentResult, setDocumentResult] = useState<DocumentExtractionResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<NoticeAnalysisResult | null>(null);
  const [libraryDocs, setLibraryDocs] = useState<DocumentExtractionResult[]>([]);

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    connected: false,
    ollama_host: "http://localhost:11434",
    configured_model: "gemma2",
    model_available: false,
    installed_models: [],
    status_message: "localhost:11434 • checking...",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Check Ollama system connectivity
  const checkStatus = useCallback(async () => {
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

  // Load Library Documents
  const loadLibrary = useCallback(async () => {
    try {
      const res = await fetch(`${backendBase}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setLibraryDocs(data);
      }
    } catch {
      // Backend offline or error
    }
  }, [backendBase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkStatus();
      loadLibrary();
    }, 0);
    const interval = setInterval(checkStatus, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkStatus, loadLibrary]);

  const runAnalysis = async (docId: string, lang: "en" | "hi" | "mr") => {
    setLoading(true);
    setLoadingMessage(
      lang === "hi"
        ? "Gemma 2 से हिंदी में विश्लेषण किया जा रहा है..."
        : lang === "mr"
        ? "Gemma 2 द्वारे मराठीत विश्लेषण सुरू आहे..."
        : "Analyzing notice facets with Ollama Gemma 2..."
    );

    try {
      const analyzeRes = await fetch(`${backendBase}/api/documents/${docId}/analyze?language=${lang}`, {
        method: "POST",
      });
      if (analyzeRes.ok) {
        const aData: NoticeAnalysisResult = await analyzeRes.json();
        setAnalysisResult(aData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleLanguageChange = (lang: "en" | "hi" | "mr") => {
    setSelectedLanguage(lang);
    if (documentResult) {
      runAnalysis(documentResult.document_id, lang);
    }
  };

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

      const docData: DocumentExtractionResult = await res.json();
      setDocumentResult(docData);
      setSelectedPage(1);

      // Trigger automatic facet analysis with selected language
      await runAnalysis(docData.document_id, selectedLanguage);
      loadLibrary();
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

  const toggleAction = async (stepNumber: number) => {
    if (!documentResult || !analysisResult) return;

    try {
      const res = await fetch(
        `${backendBase}/api/documents/${documentResult.document_id}/actions/${stepNumber}`,
        { method: "PATCH" }
      );
      if (res.ok) {
        const updatedStep: ActionStep = await res.json();
        setAnalysisResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            actions: prev.actions.map((a) =>
              a.step_number === stepNumber ? updatedStep : a
            ),
          };
        });
      }
    } catch {
      // Local fallback toggle
      setAnalysisResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          actions: prev.actions.map((a) =>
            a.step_number === stepNumber ? { ...a, completed: !a.completed } : a
          ),
        };
      });
    }
  };

  const exportActionsMarkdown = () => {
    if (!analysisResult) return;
    let md = `# NoticeNap Action Checklist: ${analysisResult.filename}\n\n`;
    md += `*Generated locally on ${analysisResult.generated_at} via ${analysisResult.ai_engine}*\n`;
    md += `*Language: ${analysisResult.language}*\n\n`;
    md += `## Purpose\n${analysisResult.purpose}\n\n`;
    if (analysisResult.application_fee) {
      md += `## Application Fee\n${analysisResult.application_fee}\n\n`;
    }
    md += `## Critical Dates & Deadlines\n`;
    analysisResult.dates.forEach((d) => {
      md += `- **${d.title}**: ${d.date_str} *(Page ${d.source_page})*\n`;
    });
    md += `\n## Required Documents\n`;
    analysisResult.documents.forEach((doc) => {
      md += `- [ ] ${doc.specification} *(Page ${doc.source_page})*\n`;
    });
    md += `\n## Sequential Next Steps\n`;
    analysisResult.actions.forEach((a) => {
      const check = a.completed ? "[x]" : "[ ]";
      md += `- ${check} **Step ${a.step_number}: ${a.title}** — ${a.description} *(Page ${a.source_page})*\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${analysisResult.filename.replace(/\.pdf$/i, "")}_checklist.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCalendarICS = () => {
    if (!documentResult) return;
    const url = `${backendBase}/api/documents/${documentResult.document_id}/calendar.ics`;
    window.open(url, "_blank");
  };

  const resetDesk = () => {
    setDocumentResult(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = "";
  };

  const selectDocFromLibrary = async (doc: DocumentExtractionResult) => {
    setDocumentResult(doc);
    setSelectedPage(1);
    setActiveTab("analysis");
    try {
      const res = await fetch(`${backendBase}/api/documents/${doc.document_id}/analysis?language=${selectedLanguage}`);
      if (res.ok) {
        setAnalysisResult(await res.json());
      }
    } catch {
      // ignore
    }
  };

  const deleteDocFromLibrary = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${backendBase}/api/documents/${docId}`, { method: "DELETE" });
      if (documentResult?.document_id === docId) {
        resetDesk();
      }
      loadLibrary();
    } catch {
      // ignore
    }
  };

  // Calculations for action list progress
  const totalActions = analysisResult?.actions.length || 0;
  const completedActions = analysisResult?.actions.filter((a) => a.completed).length || 0;
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const filteredActions = analysisResult?.actions.filter((a) => {
    if (filterAction === "pending") return !a.completed;
    if (filterAction === "completed") return a.completed;
    return true;
  }) || [];

  return (
    <div className="flex min-h-screen bg-surface font-sans text-on-surface antialiased">
      {/* 1. DESKTOP LEFT NAVIGATION RAIL (Visible on md+) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-surface-container-low shadow-[1px_0_0_0_#e1e4d9] z-50 flex-col justify-between py-6 px-4">
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
              <span className="text-[14px]">The Calm Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analysis")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === "analysis"
                  ? "bg-secondary-container text-on-secondary-fixed font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              <span className="text-[14px]">Document Analysis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("actions")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === "actions"
                  ? "bg-secondary-container text-on-secondary-fixed font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">checklist</span>
              <span className="text-[14px]">My Action List</span>
              {totalActions > 0 && (
                <span className="ml-auto text-[11px] font-mono px-1.5 py-0.5 bg-surface-container-lowest rounded-full text-secondary">
                  {completedActions}/{totalActions}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("library");
                loadLibrary();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeTab === "library"
                  ? "bg-secondary-container text-on-secondary-fixed font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              <span className="text-[14px]">Document Library</span>
              {libraryDocs.length > 0 && (
                <span className="ml-auto text-[11px] font-mono px-1.5 py-0.5 bg-surface-container-lowest rounded-full text-secondary">
                  {libraryDocs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
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

      {/* 2. MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Desktop Top Header (md+) */}
        <header className="hidden md:flex fixed top-0 left-64 right-0 h-16 bg-surface/85 backdrop-blur-md shadow-[0_1px_0_0_#e1e4d9] z-40 px-8 items-center justify-between">
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
              {activeTab === "desk" && "Archival Workspace"}
              {activeTab === "analysis" && "Notice Analysis Split View"}
              {activeTab === "actions" && "My Action Checklist"}
              {activeTab === "library" && "Archived Document Library"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-[16px] text-secondary">translate</span>
              <button
                type="button"
                onClick={() => handleLanguageChange("en")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  selectedLanguage === "en" ? "bg-primary text-on-primary font-semibold" : "text-secondary hover:text-on-surface"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange("hi")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  selectedLanguage === "hi" ? "bg-primary text-on-primary font-semibold" : "text-secondary hover:text-on-surface"
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange("mr")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  selectedLanguage === "mr" ? "bg-primary text-on-primary font-semibold" : "text-secondary hover:text-on-surface"
                }`}
              >
                मराठी
              </button>
            </div>

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

        {/* Mobile Top Header (< md) Matching Screen 05 */}
        <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container">
              <Image
                src="/logo.png"
                alt="NoticeNap Logo"
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-[18px] font-semibold text-primary tracking-tight">NoticeNap</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/40">
              <span className={`w-1.5 h-1.5 rounded-full ${ollamaStatus.connected ? "bg-primary" : "bg-tertiary-fixed-dim"}`} />
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                {ollamaStatus.connected ? "Ollama · Ready" : "Ollama · Standby"}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="relative pt-20 md:pt-24 pb-24 md:pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full flex flex-col gap-8">
          {/* Global Error Banner */}
          {error && (
            <div className="p-4 rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-center gap-3 shadow-sm">
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

          {/* Scanned PDF Warning Banner if detected */}
          {documentResult?.is_scanned && (
            <div className="p-4 rounded-xl bg-tertiary-container/10 border border-tertiary/30 text-on-surface flex items-start gap-3">
              <span className="material-symbols-outlined text-[22px] text-tertiary shrink-0 mt-0.5">
                warning
              </span>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-[14px] font-semibold text-tertiary">
                  Scanned Notice Detected
                </h4>
                <p className="text-[13px] text-secondary leading-relaxed">
                  This document contains raster image pages without an embedded text layer. Please use an OCR-preprocessed notice for complete automated facet extraction.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: THE CALM DOCUMENT DESK (Screen 01 & Mobile Screen 05) */}
          {activeTab === "desk" && (
            <>
              {/* Header Title Section */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="flex flex-col gap-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="font-mono text-[11px] uppercase tracking-widest text-secondary font-medium">
                      Quiet Workspace · Local Provenance
                    </span>
                  </div>
                  <h1 className="font-serif text-[28px] md:text-[38px] leading-tight text-primary tracking-tight font-normal">
                    Give that notice <span className="italic text-secondary">a rest.</span>
                  </h1>
                  <p className="text-[15px] md:text-[16px] text-secondary leading-relaxed">
                    Turn a long PDF into the next few things you need to do without cloud processing.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-end text-secondary font-mono text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
                  <span>100% on device · Air-gapped</span>
                </div>
              </section>

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
                  className={`group relative rounded-xl bg-surface-container-lowest p-6 md:p-14 border transition-all duration-300 flex flex-col items-center text-center cursor-pointer shadow-sm ${
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
                      <h2 className="font-serif text-[22px] md:text-[24px] font-medium text-on-surface">
                        {loading ? loadingMessage : "Give that PDF a rest."}
                      </h2>
                      <p className="text-[13px] md:text-[14px] text-secondary">
                        Drop a scholarship, recruitment, academic, or examination notice here.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-container text-on-primary font-semibold text-[15px] hover:bg-primary transition-all duration-150 active:translate-y-[0.5px] shadow-sm disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Choose a PDF</span>
                      </button>
                      <span className="text-[12px] text-secondary hidden sm:inline">or drag document onto desk</span>
                    </div>

                    <p className="font-mono text-[11px] text-secondary pt-2">
                      PDF documents up to 50MB · Evaluated privately on localhost
                    </p>
                  </div>
                </div>
              </section>

              {/* Extraction Blotter Summary when active */}
              {documentResult && (
                <section className="rounded-xl bg-surface-container-lowest p-5 md:p-6 border border-outline-variant/70 shadow-sm flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                      </div>
                      <div>
                        <h3 className="font-serif text-[18px] md:text-[20px] font-semibold text-on-surface">
                          {documentResult.filename}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 font-mono text-[11px] text-secondary">
                          <span>{documentResult.page_count} Pages</span>
                          <span>•</span>
                          <span>{documentResult.total_words.toLocaleString()} Words</span>
                          <span>•</span>
                          <span>{(documentResult.file_size_bytes / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveTab("analysis")}
                        className="px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium flex items-center gap-1.5 shadow-sm hover:bg-primary-container"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Open Full Analysis
                      </button>
                      <button
                        type="button"
                        onClick={resetDesk}
                        className="px-3 py-2 text-[12px] rounded-lg border border-outline-variant/70 text-secondary hover:bg-surface-container-low transition-colors"
                      >
                        Clear Desk
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* 4 Automated Extraction Categories (2x2 on Mobile, 4-col on Desktop) */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-secondary">
                    Automated Extraction
                  </span>
                  <span className="font-mono text-[11px] text-secondary">4 Categories</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                  <div className="p-3 md:p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                    <span className="font-mono text-[10px] md:text-[11px] text-secondary">01 / Dates</span>
                    <h3 className="text-[14px] md:text-[16px] font-semibold text-on-surface">Deadlines</h3>
                    <p className="text-[11px] md:text-[12px] text-secondary leading-relaxed">
                      Cutoffs, exam windows &amp; schedules.
                    </p>
                  </div>

                  <div className="p-3 md:p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                    <span className="font-mono text-[10px] md:text-[11px] text-secondary">02 / Eligibility</span>
                    <h3 className="text-[14px] md:text-[16px] font-semibold text-on-surface">Eligibility</h3>
                    <p className="text-[11px] md:text-[12px] text-secondary leading-relaxed">
                      Age caps, marks &amp; conditions.
                    </p>
                  </div>

                  <div className="p-3 md:p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                    <span className="font-mono text-[10px] md:text-[11px] text-secondary">03 / Documents</span>
                    <h3 className="text-[14px] md:text-[16px] font-semibold text-on-surface">Documents</h3>
                    <p className="text-[11px] md:text-[12px] text-secondary leading-relaxed">
                      Certificates, formats &amp; file sizes.
                    </p>
                  </div>

                  <div className="p-3 md:p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                    <span className="font-mono text-[10px] md:text-[11px] text-secondary">04 / Actions</span>
                    <h3 className="text-[14px] md:text-[16px] font-semibold text-on-surface">Next Steps</h3>
                    <p className="text-[11px] md:text-[12px] text-secondary leading-relaxed">
                      Sequential roadmap &amp; portals.
                    </p>
                  </div>
                </div>
              </section>

              {/* Empty state with Sloth Mascot */}
              {!documentResult && (
                <section className="rounded-xl bg-surface-container-low p-6 md:p-10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-6 md:gap-12">
                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full">
                    <div className="shrink-0 w-20 h-20 md:w-28 md:h-28 flex items-center justify-center">
                      <Image
                        src="/sloth.png"
                        alt="NoticeNap Sleepy Sloth resting on desk paperwork"
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
                        <h3 className="font-serif text-[18px] md:text-[20px] font-semibold text-on-surface">
                          No paperwork processed yet.
                        </h3>
                        <p className="text-[13px] md:text-[14px] text-secondary max-w-xl">
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
                          <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                          Rhodes Scholarship 2025
                        </button>
                        <button
                          type="button"
                          onClick={() => loadSample("Civil_Services_Exam_Notice.pdf")}
                          className="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-secondary-container transition-colors text-on-surface font-mono text-[11px] border border-outline-variant/60 flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                          Civil Services Exam Notice
                        </button>
                        <button
                          type="button"
                          onClick={() => loadSample("Research_Fellowship_PDF.pdf")}
                          className="px-3 py-1 rounded-full bg-surface-container-lowest hover:bg-secondary-container transition-colors text-on-surface font-mono text-[11px] border border-outline-variant/60 flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                          Research Fellowship PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {/* TAB 2: DOCUMENT ANALYSIS (Screen 02) */}
          {activeTab === "analysis" && (
            <div className="flex flex-col gap-6">
              {!documentResult ? (
                <div className="p-8 md:p-12 text-center rounded-xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[28px]">search</span>
                  </div>
                  <h3 className="font-serif text-[20px] md:text-[22px] text-on-surface">No notice selected for analysis</h3>
                  <p className="text-[13px] md:text-[14px] text-secondary max-w-md">
                    Please upload a notice on the desk or choose an archived document from your library.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("desk")}
                    className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary text-[14px] font-semibold"
                  >
                    Go to Calm Desk
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                  {/* Left Column: Raw Document Page Viewer */}
                  <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20 md:top-24">
                    <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                          <span className="font-serif font-medium text-[15px] md:text-[16px] truncate max-w-[200px]">
                            {documentResult.filename}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-secondary">
                          Page {selectedPage} of {documentResult.page_count}
                        </span>
                      </div>

                      {/* Page Buttons */}
                      <div className="flex flex-wrap gap-1">
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

                      {/* Page Text Stream */}
                      <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono text-[12px] leading-relaxed text-on-surface whitespace-pre-wrap max-h-[350px] md:max-h-[500px] overflow-y-auto">
                        {documentResult.pages.find((p) => p.page_number === selectedPage)?.text ||
                          "No selectable text on this page."}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-secondary">
                        <span>SHA-256: {documentResult.sha256.slice(0, 8)}...</span>
                        <span>Air-gapped PyMuPDF</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Structured Facets */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Executive Purpose & Summary Card */}
                    <div className="p-5 md:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-secondary font-medium">
                          Analysis Overview · {analysisResult?.language.toUpperCase()}
                        </span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container-low text-primary">
                          {analysisResult?.ai_engine || "deterministic-extractor"}
                        </span>
                      </div>

                      <h3 className="font-serif text-[18px] font-semibold text-on-surface">
                        {analysisResult?.purpose || "Notice Summary"}
                      </h3>

                      <p className="text-[13px] md:text-[14px] text-secondary leading-relaxed">
                        {analysisResult?.summary}
                      </p>

                      {/* Application Fee if stated */}
                      {analysisResult?.application_fee && (
                        <div className="mt-1 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-secondary uppercase font-mono">
                            Application Fee:
                          </span>
                          <span className="text-[13px] font-medium text-on-surface">
                            {analysisResult.application_fee}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verification Notes / Uncertainties if any */}
                    {analysisResult && analysisResult.uncertainties.length > 0 && (
                      <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/50 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-tertiary">
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                            Verification Notes &amp; Caveats
                          </span>
                        </div>
                        {analysisResult.uncertainties.map((u, idx) => (
                          <p key={idx} className="text-[12px] text-on-surface-variant leading-relaxed">
                            • {u}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* 1. Dates Facet */}
                    <div className="p-5 md:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                        <h4 className="font-serif text-[18px] font-semibold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
                          Critical Dates &amp; Deadlines
                        </h4>
                        <span className="font-mono text-[11px] text-secondary">
                          {analysisResult?.dates.length || 0} Identified
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {analysisResult?.dates.map((d, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPage(d.source_page)}
                            className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between border border-outline-variant/30"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[13px] md:text-[14px] font-medium text-on-surface">
                                {d.title}
                              </span>
                              <span className="font-mono text-[11px] md:text-[12px] text-secondary">
                                {d.date_str}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] px-2 py-1 rounded bg-surface-container-lowest text-primary border border-outline-variant/40 shrink-0">
                              Page {d.source_page}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Eligibility Benchmarks */}
                    <div className="p-5 md:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                        <h4 className="font-serif text-[18px] font-semibold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
                          Eligibility Stipulations
                        </h4>
                        <span className="font-mono text-[11px] text-secondary">
                          {analysisResult?.eligibility.length || 0} Benchmarks
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {analysisResult?.eligibility.map((e, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPage(e.source_page)}
                            className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between border border-outline-variant/30"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                                check_circle
                              </span>
                              <span className="text-[13px] text-on-surface">{e.requirement}</span>
                            </div>
                            <span className="font-mono text-[11px] px-2 py-1 rounded bg-surface-container-lowest text-primary border border-outline-variant/40 shrink-0">
                              Page {e.source_page}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Required Documents */}
                    <div className="p-5 md:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                        <h4 className="font-serif text-[18px] font-semibold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">folder</span>
                          Required Documents Checklist
                        </h4>
                        <span className="font-mono text-[11px] text-secondary">
                          {analysisResult?.documents.length || 0} Items
                        </span>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {analysisResult?.documents.map((d, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPage(d.source_page)}
                            className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between border border-outline-variant/30"
                          >
                            <span className="text-[13px] text-on-surface">{d.specification}</span>
                            <span className="font-mono text-[11px] px-2 py-1 rounded bg-surface-container-lowest text-primary border border-outline-variant/40 shrink-0">
                              Page {d.source_page}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY ACTION LIST (Screen 03) */}
          {activeTab === "actions" && (
            <div className="flex flex-col gap-6">
              {!analysisResult ? (
                <div className="p-8 md:p-12 text-center rounded-xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[28px]">checklist</span>
                  </div>
                  <h3 className="font-serif text-[20px] md:text-[22px] text-on-surface">No action list generated yet</h3>
                  <p className="text-[13px] md:text-[14px] text-secondary max-w-md">
                    Process an official notice on the calm desk to generate your custom step-by-step checklist.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("desk")}
                    className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary text-[14px] font-semibold"
                  >
                    Go to Calm Desk
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Progress Header Card */}
                  <div className="p-5 md:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-mono text-[11px] text-secondary uppercase">
                          Action Checklist · {analysisResult.filename}
                        </span>
                        <h2 className="font-serif text-[22px] md:text-[24px] text-on-surface font-semibold">
                          Your Streamlined Next Steps
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={downloadCalendarICS}
                          className="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-secondary-container transition-colors text-primary font-mono text-[12px] flex items-center gap-1.5 border border-outline-variant/60"
                        >
                          <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                          Add to Calendar (.ics)
                        </button>
                        <button
                          type="button"
                          onClick={exportActionsMarkdown}
                          className="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-secondary-container transition-colors text-primary font-mono text-[12px] flex items-center gap-1.5 border border-outline-variant/60"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          Export Checklist (.md)
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1.5 pt-2">
                      <div className="flex items-center justify-between text-[12px] font-mono text-secondary">
                        <span>Progress: {completedActions} of {totalActions} tasks completed</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-low overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setFilterAction("all")}
                        className={`px-3 py-1 rounded text-[12px] font-mono transition-colors ${
                          filterAction === "all"
                            ? "bg-primary text-on-primary font-semibold"
                            : "bg-surface-container-low hover:bg-surface-container text-secondary"
                        }`}
                      >
                        All ({totalActions})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterAction("pending")}
                        className={`px-3 py-1 rounded text-[12px] font-mono transition-colors ${
                          filterAction === "pending"
                            ? "bg-primary text-on-primary font-semibold"
                            : "bg-surface-container-low hover:bg-surface-container text-secondary"
                        }`}
                      >
                        Pending ({totalActions - completedActions})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterAction("completed")}
                        className={`px-3 py-1 rounded text-[12px] font-mono transition-colors ${
                          filterAction === "completed"
                            ? "bg-primary text-on-primary font-semibold"
                            : "bg-surface-container-low hover:bg-surface-container text-secondary"
                        }`}
                      >
                        Completed ({completedActions})
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="flex flex-col gap-3">
                    {filteredActions.map((action) => (
                      <div
                        key={action.step_number}
                        onClick={() => toggleAction(action.step_number)}
                        className={`p-4 md:p-5 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                          action.completed
                            ? "bg-surface-container-low/60 border-outline-variant/40 opacity-75"
                            : "bg-surface-container-lowest border-outline-variant/70 shadow-sm hover:border-primary-container"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={action.completed}
                          onChange={() => {}}
                          className="mt-1 h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer accent-primary"
                        />

                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[14px] md:text-[15px] font-medium leading-snug ${
                                action.completed
                                  ? "line-through text-secondary"
                                  : "text-on-surface"
                              }`}
                            >
                              Step {action.step_number}: {action.title}
                            </span>
                            <span className="font-mono text-[10px] md:text-[11px] px-2 py-0.5 rounded bg-surface-container-low text-primary border border-outline-variant/40 shrink-0">
                              Page {action.source_page}
                            </span>
                          </div>
                          <p
                            className={`text-[12px] md:text-[13px] leading-relaxed ${
                              action.completed ? "text-secondary" : "text-secondary"
                            }`}
                          >
                            {action.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENT LIBRARY (Screen 04) */}
          {activeTab === "library" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/40">
                <div>
                  <h2 className="font-serif text-[24px] md:text-[28px] text-on-surface font-semibold">
                    Document Library
                  </h2>
                  <p className="text-[13px] md:text-[14px] text-secondary">
                    Your archival desk tray with historical notice breakdowns.
                  </p>
                </div>
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchLibrary}
                    onChange={(e) => setSearchLibrary(e.target.value)}
                    placeholder="Filter library notices..."
                    className="pl-9 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-[13px] text-on-surface focus:outline-none focus:border-primary w-full sm:w-64"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-secondary">
                    search
                  </span>
                </div>
              </div>

              {libraryDocs.length === 0 ? (
                <div className="p-8 md:p-12 text-center rounded-xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[28px]">folder_open</span>
                  </div>
                  <h3 className="font-serif text-[20px] md:text-[22px] text-on-surface">No documents archived yet</h3>
                  <p className="text-[13px] md:text-[14px] text-secondary max-w-md">
                    Notices extracted on the desk will automatically be archived in your private local library.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("desk")}
                    className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary text-[14px] font-semibold"
                  >
                    Process First Notice
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {libraryDocs
                    .filter((d) => d.filename.toLowerCase().includes(searchLibrary.toLowerCase()))
                    .map((doc) => (
                      <div
                        key={doc.document_id}
                        onClick={() => selectDocFromLibrary(doc)}
                        className="group p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 hover:border-primary shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-secondary uppercase">
                              {doc.page_count} Pages · {(doc.file_size_bytes / 1024).toFixed(0)} KB
                            </span>
                            <button
                              type="button"
                              onClick={(e) => deleteDocFromLibrary(doc.document_id, e)}
                              className="text-secondary hover:text-error transition-colors"
                              title="Delete notice"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                          <h3 className="font-serif text-[16px] md:text-[17px] font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                            {doc.filename}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                          <span className="font-mono text-[11px] text-secondary">
                            SHA: {doc.sha256.slice(0, 8)}...
                          </span>
                          <span className="text-[12px] text-primary font-medium flex items-center gap-1">
                            Inspect
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 5. TRUST AND TRACEABILITY BANNER */}
          <footer className="rounded-lg bg-surface-container-lowest p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-2 md:mb-6 border border-outline-variant/40">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">
                verified_user
              </span>
              <div className="flex flex-col">
                <h4 className="text-[15px] md:text-[16px] font-semibold text-on-surface">
                  Every fact verified with source page citations
                </h4>
                <p className="text-[12px] text-secondary">
                  Generated checklist points link directly to specific notice pages and clauses for inspection.
                </p>
              </div>
            </div>
            <span className="font-mono text-[11px] text-secondary shrink-0">
              Source-linked guarantee
            </span>
          </footer>
        </main>
      </div>

      {/* 3. MOBILE FIXED BOTTOM NAVIGATION BAR (< md) Matching Screen 05 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(37,41,34,0.03)] border-t border-outline-variant/40">
        <div className="flex items-center justify-around h-16 px-2">
          <button
            type="button"
            onClick={() => setActiveTab("desk")}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 transition-colors ${
              activeTab === "desk" ? "text-primary font-semibold" : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">manage_search</span>
            <span className="font-mono text-[11px]">The Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analysis")}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 transition-colors ${
              activeTab === "analysis" ? "text-primary font-semibold" : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">analytics</span>
            <span className="font-mono text-[11px]">Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("actions")}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 transition-colors ${
              activeTab === "actions" ? "text-primary font-semibold" : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">checklist</span>
            <span className="font-mono text-[11px]">Actions</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("library");
              loadLibrary();
            }}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 transition-colors ${
              activeTab === "library" ? "text-primary font-semibold" : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">folder_open</span>
            <span className="font-mono text-[11px]">Library</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-0.5 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[22px]">tune</span>
            <span className="font-mono text-[11px]">Settings</span>
          </button>
        </div>
      </nav>

      {/* 4. SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-xl border border-outline-variant/60 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">settings</span>
                <h3 className="font-serif text-[20px] font-semibold text-on-surface">
                  NoticeNap Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Language Preference */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-on-surface">
                  Preferred Analysis Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    className={`py-2 rounded-lg text-[12px] font-mono border transition-colors ${
                      selectedLanguage === "en"
                        ? "bg-primary text-on-primary border-primary font-semibold"
                        : "bg-surface-container-low border-outline-variant/60 text-secondary"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("hi")}
                    className={`py-2 rounded-lg text-[12px] font-mono border transition-colors ${
                      selectedLanguage === "hi"
                        ? "bg-primary text-on-primary border-primary font-semibold"
                        : "bg-surface-container-low border-outline-variant/60 text-secondary"
                    }`}
                  >
                    हिंदी (Hindi)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("mr")}
                    className={`py-2 rounded-lg text-[12px] font-mono border transition-colors ${
                      selectedLanguage === "mr"
                        ? "bg-primary text-on-primary border-primary font-semibold"
                        : "bg-surface-container-low border-outline-variant/60 text-secondary"
                    }`}
                  >
                    मराठी (Marathi)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-on-surface">
                  Local Ollama Host
                </label>
                <input
                  type="text"
                  readOnly
                  value={ollamaStatus.ollama_host}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/60 font-mono text-[13px] text-secondary cursor-not-allowed"
                />
                <span className="text-[11px] text-secondary">
                  Configured via NOTICENAP_OLLAMA_HOST in .env
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-on-surface">
                  Configured AI Model
                </label>
                <input
                  type="text"
                  readOnly
                  value={ollamaStatus.configured_model}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/60 font-mono text-[13px] text-secondary cursor-not-allowed"
                />
                <span className="text-[11px] text-secondary">
                  Active Model: Gemma 2 (5.4 GB on-device)
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-secondary uppercase font-medium">
                    Daemon Connectivity
                  </span>
                  <button
                    type="button"
                    onClick={checkStatus}
                    className="text-[11px] font-mono text-primary underline"
                  >
                    Test Probe
                  </button>
                </div>
                <div className="font-mono text-[12px] text-on-surface flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      ollamaStatus.connected ? "bg-primary" : "bg-tertiary-fixed-dim"
                    }`}
                  />
                  {ollamaStatus.status_message}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 flex items-start gap-2.5 text-secondary">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                  shield
                </span>
                <p className="text-[12px] leading-relaxed">
                  Air-Gapped Guarantee: NoticeNap never sends PDF bytes to cloud services. All analysis runs directly on your computer.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
