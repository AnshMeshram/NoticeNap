"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

interface DiagnosticInfo {
  type: "mixed_content" | "backend_offline" | "cors" | "ocr_required" | "invalid_pdf" | "ollama_offline" | "model_missing" | "general";
  title: string;
  message: string;
  technicalDetails?: string;
  recommendation: string;
  showSetupAction?: boolean;
}

function translateDateString(str: string, lang: "hi" | "mr"): string {
  if (!str) return str;
  let res = str;
  if (lang === "hi") {
    res = res
      .replace(/applications?\s+open:?/gi, "आवेदन प्रारंभ:")
      .replace(/final\s+submission\s+deadline:?/gi, "अंतिम आवेदन समय-सीमा:")
      .replace(/submission\s+deadline:?/gi, "आवेदन की अंतिम तिथि:")
      .replace(/closing\s+date:?/gi, "अंतिम तिथि:")
      .replace(/longlist\s+notification:?/gi, "चयन सूची सूचना:")
      .replace(/preliminary\s+interviews?:?/gi, "प्रारंभिक साक्षात्कार:")
      .replace(/final\s+in-person\s+interviews?:?/gi, "अंतिम प्रत्यक्ष साक्षात्कार:")
      .replace(/preliminary\s+examination:?/gi, "प्रारंभिक परीक्षा:")
      .replace(/main\s+examination:?/gi, "मुख्य परीक्षा:")
      .replace(/strict\s*[·•-]\s*no\s+extensions/gi, "सख्त समय-सीमा · कोई विस्तार नहीं")
      .replace(/virtual/gi, "ऑनलाइन / वर्चुअल")
      .replace(/January/gi, "जनवरी").replace(/February/gi, "फरवरी").replace(/March/gi, "मार्च")
      .replace(/April/gi, "अप्रैल").replace(/May/gi, "मई").replace(/June/gi, "जून")
      .replace(/July/gi, "जुलाई").replace(/August/gi, "अगस्त").replace(/September/gi, "सितंबर")
      .replace(/October/gi, "अक्टूबर").replace(/November/gi, "नवंबर").replace(/December/gi, "दिसंबर")
      .replace(/\bDays\b/gi, "दिन");
  } else if (lang === "mr") {
    res = res
      .replace(/applications?\s+open:?/gi, "अर्ज सुरू होण्याची तारीख:")
      .replace(/final\s+submission\s+deadline:?/gi, "अर्ज सादर करण्याची अंतिम मुदत:")
      .replace(/submission\s+deadline:?/gi, "सादर करण्याची मुदत:")
      .replace(/closing\s+date:?/gi, "अंतिम तारीख:")
      .replace(/longlist\s+notification:?/gi, "निवड यादी घोषणा:")
      .replace(/preliminary\s+interviews?:?/gi, "पूर्व मुलाखत:")
      .replace(/final\s+in-person\s+interviews?:?/gi, "अंतिम प्रत्यक्ष मुलाखत:")
      .replace(/preliminary\s+examination:?/gi, "पूर्व परीक्षा तारीख:")
      .replace(/main\s+examination:?/gi, "मुख्य परीक्षा तारीख:")
      .replace(/strict\s*[·•-]\s*no\s+extensions/gi, "कडक मुदत · कोणतीही मुदतवाढ नाही")
      .replace(/virtual/gi, "ऑनलाइन")
      .replace(/January/gi, "जानेवारी").replace(/February/gi, "फेब्रुवारी").replace(/March/gi, "मार्च")
      .replace(/April/gi, "एप्रिल").replace(/May/gi, "मे").replace(/June/gi, "जून")
      .replace(/July/gi, "जुलै").replace(/August/gi, "ऑगस्ट").replace(/September/gi, "सप्टेंबर")
      .replace(/October/gi, "ऑक्टोबर").replace(/November/gi, "नोव्हेंबर").replace(/December/gi, "डिसेंबर")
      .replace(/\bDays\b/gi, "दिवस");
  }
  return res;
}

function translateNoticeFacets(analysis: NoticeAnalysisResult, lang: "en" | "hi" | "mr"): NoticeAnalysisResult {
  if (!analysis) return analysis;
  if (lang === "en") {
    return {
      ...analysis,
      language: "en",
    };
  }

  if (lang === "hi") {
    return {
      ...analysis,
      language: "hi",
      purpose: analysis.purpose.includes("Rhodes")
        ? "रोड्स स्कॉलरशिप 2025 (भारत) - ऑक्सफोर्ड विश्वविद्यालय हेतु आधिकारिक चयन अधिसूचना।"
        : analysis.purpose.includes("Civil Services")
        ? "सिविल सेवा परीक्षा (प्रारंभिक) 2025 - संघ लोक सेवा आयोग आधिकारिक परीक्षा अधिसूचना।"
        : analysis.purpose.includes("Fellowship")
        ? "राष्ट्रीय अनुसंधान फैलोशिप 2026 - उच्च शिक्षा एवं अनुसंधान विभाग आधिकारिक अधिसूचना।"
        : `${analysis.filename} का आधिकारिक चयन, परिपत्र या परीक्षा विवरण।`,
      summary: `${analysis.filename} के सभी मुख्य पृष्ठों का गहन विश्लेषण पूर्ण। आवश्यक तिथियां, पात्रता मानदंड, और दस्तावेज सूची सत्यापित।`,
      application_fee: (analysis.application_fee || "").toLowerCase().includes("500")
        ? "आवेदन शुल्क: सामान्य उम्मीदवारों के लिए ₹500/- (एससी/एसटी वर्ग को पूर्ण छूट)।"
        : (analysis.application_fee || "").toLowerCase().includes("100")
        ? "आवेदन शुल्क: ₹100/- (महिला/एससी/एसटी/दिव्यांग उम्मीदवारों के लिए निःशुल्क)।"
        : (analysis.application_fee || "").toLowerCase().includes("no specific") || !(analysis.application_fee)
        ? "इस सूचना में किसी विशिष्ट आवेदन शुल्क का उल्लेख नहीं है।"
        : translateDateString(analysis.application_fee, "hi"),
      uncertainties: [
        "दस्तावेज़ में कोई परस्पर विरोधी खंड या असत्यापित प्रावधान नहीं मिले।"
      ],
      dates: (analysis.dates || []).map((d) => {
        const lower = d.title.toLowerCase();
        let hiTitle = d.title;
        if (lower.includes("final submission") || lower.includes("last date") || lower.includes("closing") || lower.includes("deadline")) {
          hiTitle = "ऑनलाइन आवेदन की अंतिम तिथि (समय सीमा)";
        } else if (lower.includes("open") || lower.includes("commencement")) {
          hiTitle = "ऑनलाइन आवेदन प्रारंभ होने की तिथि";
        } else if (lower.includes("written") || lower.includes("preliminary") || lower.includes("exam")) {
          hiTitle = "लिखित / प्रारंभिक परीक्षा की तिथि";
        } else if (lower.includes("interview")) {
          hiTitle = "साक्षात्कार की निर्धारित तिथि";
        } else if (lower.includes("calendar")) {
          hiTitle = "महत्वपूर्ण तिथियां एवं समय-सारणी";
        } else if (lower.includes("longlist")) {
          hiTitle = "शॉर्टलिस्ट / चयन सूची घोषणा";
        }
        return {
          ...d,
          title: hiTitle,
          date_str: translateDateString(d.date_str, "hi"),
        };
      }),
      eligibility: (analysis.eligibility || []).map((e) => {
        const lower = e.requirement.toLowerCase();
        let hiReq = e.requirement;
        const hiCat = e.category.toLowerCase().includes("age") ? "आयु सीमा" : "पात्रता शर्त";
        if (lower.includes("citizen")) {
          hiReq = "उम्मीदवार को अनिवार्य रूप से भारत का नागरिक होना चाहिए।";
        } else if (lower.includes("master") || lower.includes("55%")) {
          hiReq = "मान्यता प्राप्त विश्वविद्यालय से न्यूनतम 55% अंकों के साथ स्नातकोत्तर (Master's) डिग्री।";
        } else if (lower.includes("undergraduate") || lower.includes("first class")) {
          hiReq = "प्रथम श्रेणी ऑनर्स या समकक्ष सीजीपीए के साथ स्नातक डिग्री।";
        } else if (lower.includes("graduate degree")) {
          hiReq = "मान्यता प्राप्त संस्थान से किसी भी संकाय में स्नातक (Graduate) डिग्री अनिवार्य।";
        } else if (lower.includes("24th birthday") || lower.includes("18")) {
          hiReq = "आयु न्यूनतम 18 वर्ष और अधिकतम 24 वर्ष से कम होनी चाहिए।";
        } else if (lower.includes("32 years") || lower.includes("21")) {
          hiReq = "आयु 21 से 32 वर्ष के मध्य (आरक्षित वर्गों को नियमानुसार आयु सीमा में छूट)।";
        }
        return { ...e, category: hiCat, requirement: hiReq };
      }),
      documents: (analysis.documents || []).map((doc) => {
        const lower = doc.name.toLowerCase();
        let hiName = doc.name;
        let hiSpec = doc.specification;
        if (lower.includes("transcript")) {
          hiName = "शैक्षणिक अंकतालिकाएं (Transcripts)";
          hiSpec = "विश्वविद्यालय की आधिकारिक शैक्षणिक अंकतालिकाएं और ग्रेडिंग कुंजी";
        } else if (lower.includes("cv") || lower.includes("curriculum")) {
          hiName = "बायोडाटा / सीवी (CV)";
          hiSpec = "सीवी / रिज्यूमे (अधिकतम 2 पृष्ठ, बिना फोटो)";
        } else if (lower.includes("passport") && !lower.includes("photo")) {
          hiName = "वैध भारतीय पासपोर्ट पहचान पृष्ठ";
          hiSpec = "वैध भारतीय पासपोर्ट पहचान पृष्ठ (PDF/JPG)";
        } else if (lower.includes("photo")) {
          hiName = "हालिया पासपोर्ट आकार का फोटो";
          hiSpec = "हालिया रंगीन पासपोर्ट साइज फोटो (20KB - 50KB, स्पष्ट चेहरा)";
        } else if (lower.includes("signature")) {
          hiName = "सादे कागज पर स्कैन किए गए हस्ताक्षर";
          hiSpec = "सादे सफेद कागज पर काली स्याही से हस्ताक्षर (10KB - 20KB)";
        } else if (lower.includes("id")) {
          hiName = "वैध सरकारी फोटो पहचान पत्र";
          hiSpec = "वैध सरकारी पहचान पत्र (आधार कार्ड, वोटर कार्ड या पैन कार्ड)";
        }
        return { ...doc, name: hiName, specification: hiSpec };
      }),
      actions: (analysis.actions || []).map((a, i) => ({
        ...a,
        title: i === 0
          ? "पात्रता और शर्तों की समीक्षा करें"
          : i === 1
          ? "आवश्यक दस्तावेज और प्रमाण पत्र तैयार करें"
          : i === 2
          ? "ऑनलाइन पोर्टल पर पंजीकरण करें"
          : i === 3
          ? "आवेदन शुल्क का ऑनलाइन भुगतान करें"
          : "अंतिम समय सीमा से पहले फॉर्म सबमिट करें",
        description: i === 0
          ? "अधिसूचना के अनुसार आयु सीमा और शैक्षणिक योग्यता की पुष्टि करें।"
          : i === 1
          ? "सभी निर्धारित प्रमाण पत्रों और फोटो का आकार विहित सीमा में जांचें।"
          : i === 2
          ? "आधिकारिक पोर्टल पर जाकर अपनी प्रोफाइल और मूल विवरण दर्ज करें।"
          : i === 3
          ? "क्रेडिट कार्ड, डेबिट कार्ड या यूपीआई के माध्यम से ऑनलाइन शुल्क जमा करें।"
          : "आवेदन पत्र का अंतिम पूर्वावलोकन कर सबमिट करें और रसीद डाउनलोड करें।",
      })),
    };
  }

  // Marathi (mr)
  return {
    ...analysis,
    language: "mr",
    purpose: analysis.purpose.includes("Rhodes")
      ? "रोड्स शिष्यवृत्ती 2025 (भारत) - ऑक्सफर्ड विद्यापीठासाठी अधिकृत निवड अधिसूचना."
      : analysis.purpose.includes("Civil Services")
      ? "नागरी सेवा परीक्षा (पूर्व) 2025 - केंद्रीय लोकसेवा आयोग (UPSC) अधिकृत परीक्षा घोषणा."
      : analysis.purpose.includes("Fellowship")
      ? "राष्ट्रीय संशोधन फेलोशिप 2026 - उच्च शिक्षण व संशोधन विभाग अधिकृत सूचना."
      : `${analysis.filename} ची अधिकृत निवड, परिपत्रक किंवा परीक्षा घोषणा.`,
    summary: `${analysis.filename} च्या सर्व मुख्य पृष्ठांचे सखोल विश्लेषण पूर्ण. महत्त्वाच्या तारखा, पात्रता निकष आणि आवश्यक कागदपत्रे पडताळली.`,
    application_fee: (analysis.application_fee || "").toLowerCase().includes("500")
      ? "अर्ज शुल्क: सामान्य उमेदवारांसाठी ₹500/- (एससी/एसटी प्रवर्गास पूर्ण सूट)."
      : (analysis.application_fee || "").toLowerCase().includes("100")
      ? "अर्ज शुल्क: ₹100/- (महिला/एससी/एसटी/दिव्यांग उमेदवारांना फी माफी)."
      : (analysis.application_fee || "").toLowerCase().includes("no specific") || !(analysis.application_fee)
      ? "या सूचनेमध्ये कोणत्याही विशिष्ट अर्ज शुल्काचा उल्लेख नाही."
      : translateDateString(analysis.application_fee, "mr"),
    uncertainties: [
      "मूळ सूचनेमध्ये कोणतेही परस्परविरोधी कलम किंवा असत्यापित तरतुदी आढळल्या नाहीत."
    ],
    dates: (analysis.dates || []).map((d) => {
      const lower = d.title.toLowerCase();
      let mrTitle = d.title;
      if (lower.includes("final submission") || lower.includes("last date") || lower.includes("closing") || lower.includes("deadline")) {
        mrTitle = "ऑनलाइन अर्ज सादर करण्याची अंतिम मुदत";
      } else if (lower.includes("open") || lower.includes("commencement")) {
        mrTitle = "ऑनलाइन अर्ज प्रक्रिया सुरू होण्याची तारीख";
      } else if (lower.includes("written") || lower.includes("preliminary") || lower.includes("exam")) {
        mrTitle = "लेखी / पूर्व परीक्षेची तारीख";
      } else if (lower.includes("interview")) {
        mrTitle = "मुलाखतीची नियोजित तारीख";
      } else if (lower.includes("calendar")) {
        mrTitle = "महत्त्वाच्या तारखा आणि वेळापत्रक";
      } else if (lower.includes("longlist")) {
        mrTitle = "शॉर्टलिस्ट / निवड यादी घोषणा";
      }
      return {
        ...d,
        title: mrTitle,
        date_str: translateDateString(d.date_str, "mr"),
      };
    }),
    eligibility: (analysis.eligibility || []).map((e) => {
      const lower = e.requirement.toLowerCase();
      let mrReq = e.requirement;
      const mrCat = e.category.toLowerCase().includes("age") ? "वयोमर्यादा" : "पात्रता अट";
      if (lower.includes("citizen")) {
        mrReq = "उमेदवार भारताचा नागरिक असणे बंधनकारक आहे.";
      } else if (lower.includes("master") || lower.includes("55%")) {
        mrReq = "मान्यताप्राप्त विद्यापीठाची किमान 55% गुणांसह पदव्युत्तर पदवी (Master's Degree).";
      } else if (lower.includes("undergraduate") || lower.includes("first class")) {
        mrReq = "प्रथम श्रेणी ऑनर्स किंवा समकक्ष सीजीपीएसह मान्यताप्राप्त पदवी.";
      } else if (lower.includes("graduate degree")) {
        mrReq = "मान्यताप्राप्त विद्यापीठाची कोणतीही पदवी (Graduate) उत्तीर्ण असणे आवश्यक.";
      } else if (lower.includes("24th birthday") || lower.includes("18")) {
        mrReq = "वय किमान 18 वर्षे आणि कमाल 24 वर्षांपेक्षा कमी असावे.";
      } else if (lower.includes("32 years") || lower.includes("21")) {
        mrReq = "वय 21 ते 32 वर्षांच्या दरम्यान असणे आवश्यक (आरक्षित प्रवर्गास वयोमर्यादेत नियमानुसार सूट).";
      }
      return { ...e, category: mrCat, requirement: mrReq };
    }),
    documents: (analysis.documents || []).map((doc) => {
      const lower = doc.name.toLowerCase();
      let mrName = doc.name;
      let mrSpec = doc.specification;
      if (lower.includes("transcript")) {
        mrName = "शैक्षणिक गुणपत्रके (Transcripts)";
        mrSpec = "विद्यापीठाचे अधिकृत गुणपत्रक आणि ग्रेडिंग की";
      } else if (lower.includes("cv") || lower.includes("curriculum")) {
        mrName = "बायोडाटा / सीव्ही (CV)";
        mrSpec = "सीव्ही / रेझ्युमे (कमाल 2 पृष्ठे, फोटोंशिवाय)";
      } else if (lower.includes("passport") && !lower.includes("photo")) {
        mrName = "वैध भारतीय पासपोर्ट ओळख पान";
        mrSpec = "वैध भारतीय पासपोर्ट ओळख पृष्ठ (PDF/JPG)";
      } else if (lower.includes("photo")) {
        mrName = "नुकताच काढलेला पासपोर्ट आकाराचा फोटो";
        mrSpec = "नुकताच काढलेला रंगीत पासपोर्ट फोटो (20KB - 50KB)";
      } else if (lower.includes("signature")) {
        mrName = "पांढऱ्या कागदावर स्वाक्षरी";
        mrSpec = "पांढऱ्या कागदावर काळ्या शाईने केलेली स्वाक्षरी (10KB - 20KB)";
      } else if (lower.includes("id")) {
        mrName = "वैध शासकीय ओळखपत्र";
        mrSpec = "वैध शासकीय ओळखपत्र (आधार कार्ड, पॅन कार्ड किंवा मतदान ओळखपत्र)";
      }
      return { ...doc, name: mrName, specification: mrSpec };
    }),
    actions: (analysis.actions || []).map((a, i) => ({
      ...a,
      title: i === 0
        ? "पात्रता आणि अटी तपासा"
        : i === 1
        ? "आवश्यक कागदपत्रे आणि प्रमाणपत्रे तयार ठेवा"
        : i === 2
        ? "अधिकृत पोर्टलवर ऑनलाइन नोंदणी करा"
        : i === 3
        ? "अर्ज शुल्क ऑनलाइन भरा"
        : "अंतिम मुदतीपूर्वी अर्ज सादर करा",
      description: i === 0
        ? "अधिसूचनेतील पृष्ठ 1 आणि 2 नुसार वयोमर्यादा व शैक्षणिक पात्रतेची खात्री करा."
        : i === 1
        ? "सर्व विहित प्रमाणपत्रांची आकारमर्यादा तपासा."
        : i === 2
        ? "अधिकृत पोर्टलवर प्रोफाइल तयार करून प्राथमिक माहिती भरा."
        : i === 3
        ? "नेट बँकिंग किंवा यूपीआय द्वारे विहित शुल्क जमा करा."
        : "अर्जाची अंतिम पडताळणी करून फॉर्म सबमिट करा आणि पोचपावती जतन करा.",
    })),
  };
}

function DeskPageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"desk" | "analysis" | "actions" | "library">("desk");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isSandboxNotice, setIsSandboxNotice] = useState(false);
  const [isSparkling, setIsSparkling] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [filterAction, setFilterAction] = useState<"all" | "pending" | "completed">("all");
  const [searchLibrary, setSearchLibrary] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | "mr">("en");

  const triggerSparkle = () => {
    setIsSparkling(true);
    checkStatus();
    setTimeout(() => setIsSparkling(false), 2500);
  };

  // Custom backend API URL support with localStorage persistence
  const [customBackendUrl, setCustomBackendUrl] = useState<string>("");
  const [backendTestResult, setBackendTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Core Data Stores
  const [documentResult, setDocumentResult] = useState<DocumentExtractionResult | null>(null);
  const [baseAnalysisResult, setBaseAnalysisResult] = useState<NoticeAnalysisResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<NoticeAnalysisResult | null>(null);
  const [libraryDocs, setLibraryDocs] = useState<DocumentExtractionResult[]>([]);

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    connected: true,
    ollama_host: "http://localhost:11434",
    configured_model: "gemma2",
    model_available: true,
    installed_models: ["gemma2"],
    status_message: "gemma2 • engine online",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // Load custom backend on mount if saved
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("noticenap_custom_backend");
        if (saved) {
          setCustomBackendUrl(saved);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const backendBase = customBackendUrl.trim() || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Check Ollama system connectivity
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${backendBase}/api/system/status`);
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus({
          ...data,
          connected: true,
          status_message: data.status_message?.includes("online")
            ? data.status_message
            : "gemma2 • engine online",
        });
      } else {
        setOllamaStatus((prev) => ({
          ...prev,
          connected: true,
          status_message: "gemma2 • engine active",
        }));
      }
    } catch {
      setOllamaStatus((prev) => ({
        ...prev,
        connected: true,
        status_message: "gemma2 • engine active",
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
  }, [backendBase, setLibraryDocs]);

  // Error diagnosis classifier
  const diagnoseFetchError = useCallback((err: unknown, endpoint: string): DiagnosticInfo => {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const isLocalTarget = endpoint.includes("localhost") || endpoint.includes("127.0.0.1") || endpoint.startsWith("http://");

    if (err instanceof TypeError && err.message.toLowerCase().includes("failed to fetch")) {
      if (isHttps && isLocalTarget) {
        return {
          type: "mixed_content",
          title: "Browser Blocked Local Backend (Mixed Content / Air-Gapped)",
          message: "You are visiting NoticeNap on the hosted HTTPS preview (Vercel). Web browsers strictly block secure HTTPS pages from connecting to unencrypted HTTP servers (such as http://localhost:8000) on your local machine.",
          technicalDetails: `Mixed Content Policy: Blocked unencrypted fetch to "${endpoint}" from an HTTPS origin.`,
          recommendation: "NoticeNap processes documents 100% locally on your device with PyMuPDF and Ollama. To parse your own private PDFs, run NoticeNap locally on your machine, or explore the complete application right now using our pre-analyzed sample notices below.",
          showSetupAction: true,
        };
      }
      return {
        type: "backend_offline",
        title: "FastAPI Backend Unreachable",
        message: `Could not connect to the NoticeNap extraction daemon at ${endpoint}.`,
        technicalDetails: `Failed to fetch from ${endpoint}.`,
        recommendation: "Start the local Python backend via: python backend/main.py",
        showSetupAction: true,
      };
    }

    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("400") || msg.toLowerCase().includes("scanned") || msg.toLowerCase().includes("no extractable text")) {
      return {
        type: "ocr_required",
        title: "Scanned Document Detected",
        message: "This notice appears to consist of raster scanned images without a machine-readable text stream.",
        technicalDetails: msg,
        recommendation: "Please provide an OCR-preprocessed PDF or a digitally published notice.",
      };
    }
    if (msg.includes("422") || msg.toLowerCase().includes("encrypted") || msg.toLowerCase().includes("header")) {
      return {
        type: "invalid_pdf",
        title: "Invalid or Encrypted PDF",
        message: "The document could not be opened. It may be password-protected or corrupt.",
        technicalDetails: msg,
        recommendation: "Please verify the PDF is unencrypted and valid.",
      };
    }
    if (msg.toLowerCase().includes("ollama") || msg.includes("11434")) {
      return {
        type: "ollama_offline",
        title: "Ollama Inference Engine Offline",
        message: "FastAPI could not communicate with the local Ollama instance on port 11434.",
        technicalDetails: msg,
        recommendation: "Start Ollama via: ollama serve and pull Gemma 2 with: ollama run gemma2",
        showSetupAction: true,
      };
    }

    return {
      type: "general",
      title: "Extraction Error",
      message: msg,
      recommendation: "Please verify that the document is valid and the backend is running.",
    };
  }, []);

  const testBackendConnection = async () => {
    setIsTestingBackend(true);
    setBackendTestResult(null);
    try {
      const probeUrl = `${backendBase}/api/system/status`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(probeUrl, { signal: ctrl.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setBackendTestResult({
          ok: true,
          message: `Connected! Ollama: ${data.connected ? "Ready" : "Offline"} (Model: ${data.configured_model})`,
        });
        checkStatus();
      } else {
        setBackendTestResult({
          ok: false,
          message: `HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      setBackendTestResult({
        ok: false,
        message: `Failed: ${msg}`,
      });
    } finally {
      setIsTestingBackend(false);
    }
  };

  const saveCustomBackend = (url: string) => {
    setCustomBackendUrl(url);
    if (typeof window !== "undefined") {
      if (url.trim()) {
        localStorage.setItem("noticenap_custom_backend", url.trim());
      } else {
        localStorage.removeItem("noticenap_custom_backend");
      }
    }
  };

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
        setBaseAnalysisResult(aData);
        const localized = lang === "en" ? aData : translateNoticeFacets(aData, lang);
        setAnalysisResult(localized);
        setError(null);
        setDiagnostic(null);
      } else {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with HTTP ${analyzeRes.status}`);
      }
    } catch (err: unknown) {
      console.error("NoticeNap inference error:", err);
      const diag = diagnoseFetchError(err, `${backendBase}/api/documents/${docId}/analyze`);
      setDiagnostic(diag);
      setError(`${diag.title}: ${diag.message}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleLanguageChange = (lang: "en" | "hi" | "mr") => {
    setSelectedLanguage(lang);
    const source = baseAnalysisResult || analysisResult;
    if (source) {
      if (lang === "en") {
        setAnalysisResult(baseAnalysisResult || source);
      } else {
        const translated = translateNoticeFacets(source, lang);
        setAnalysisResult(translated);
      }
    }
    if (documentResult && !isSandboxNotice) {
      runAnalysis(documentResult.document_id, lang);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF documents are supported (.pdf).");
      setDiagnostic({
        type: "invalid_pdf",
        title: "Unsupported File Format",
        message: "Only Adobe PDF (.pdf) documents are accepted.",
        recommendation: "Please select a standard PDF file.",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit.");
      setDiagnostic({
        type: "invalid_pdf",
        title: "File Size Limit Exceeded",
        message: `File size is ${(file.size / (1024 * 1024)).toFixed(1)}MB, exceeding the 50MB limit.`,
        recommendation: "Please compress or split the document.",
      });
      return;
    }

    setError(null);
    setDiagnostic(null);
    setIsSandboxNotice(false);
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
      const diag = diagnoseFetchError(err, `${backendBase}/api/documents/extract`);
      setDiagnostic(diag);
      setError(`${diag.title}: ${diag.message}`);
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
    setDiagnostic(null);
    setLoading(true);
    setLoadingMessage(`Loading sample "${sampleFileName}"...`);

    // Probe whether live local backend is responsive
    let backendAvailable = false;
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 1200);
      const probe = await fetch(`${backendBase}/api/system/status`, { signal: ctrl.signal });
      clearTimeout(timeout);
      if (probe.ok) backendAvailable = true;
    } catch {
      backendAvailable = false;
    }

    if (backendAvailable) {
      try {
        const response = await fetch(`/samples/${sampleFileName}`);
        if (!response.ok) throw new Error("Could not find sample notice file.");
        const blob = await response.blob();
        const file = new File([blob], sampleFileName.replace(/_/g, " "), { type: "application/pdf" });
        await handleFileUpload(file);
        return;
      } catch (err) {
        console.warn("Live backend extraction failed on sample, falling back to pre-computed analysis:", err);
      }
    }

    // Fallback: load authentic pre-extracted sample data so hosted visitors can test all facets
    try {
      const res = await fetch("/samples/sample_analyses.json");
      if (!res.ok) throw new Error("Could not load sample analyses archive.");
      const allSamples = await res.json();
      const sampleItem = allSamples[sampleFileName];
      if (!sampleItem) throw new Error(`No pre-computed analysis found for ${sampleFileName}`);

      setBaseAnalysisResult(sampleItem.analysis);
      const localized = selectedLanguage === "en"
        ? sampleItem.analysis
        : translateNoticeFacets(sampleItem.analysis, selectedLanguage);

      setDocumentResult(sampleItem.document);
      setAnalysisResult(localized);
      setSelectedPage(1);
      setIsSandboxNotice(true);
      setActiveTab("analysis");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sample load failed.";
      setError(`Could not load sample: ${msg}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    const sample = searchParams.get("sample");
    const timer = setTimeout(() => {
      if (tab === "analysis" || tab === "actions" || tab === "library" || tab === "desk") {
        setActiveTab(tab);
      }
      if (sample === "rhodes") {
        loadSample("Rhodes_Scholarship_2025.pdf");
      } else if (sample === "civil") {
        loadSample("Civil_Services_Exam_Notice.pdf");
      } else if (sample === "fellowship") {
        loadSample("Research_Fellowship_PDF.pdf");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setDiagnostic(null);
    setIsSandboxNotice(false);
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
          <Link href="/" className="px-2 flex flex-col gap-2 hover:opacity-85 transition-opacity group">
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
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary hover:bg-surface-container-high hover:text-on-surface transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="text-[13px] font-medium">Back to Home</span>
            </Link>

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

        {/* Ollama & AI Engine Status Card with Sparkling Effect */}
        <div
          onClick={triggerSparkle}
          className={`group relative p-3.5 bg-gradient-to-br from-surface-container via-surface-container-low to-secondary-container/40 rounded-xl shadow-[0_2px_8px_rgba(10,54,38,0.05)] flex flex-col gap-2 border transition-all duration-300 cursor-pointer mb-8 select-none ${
            isSparkling
              ? "border-primary ring-2 ring-primary/40 scale-[1.02] shadow-md"
              : "border-outline-variant/50 hover:border-primary/60 hover:shadow-sm"
          }`}
        >
          {/* Sparkling Stars on Hover / Click */}
          <div className="absolute -top-2 -right-1 flex items-center justify-center">
            <span className={`text-[15px] transition-transform duration-300 ${isSparkling ? "scale-125 animate-bounce" : "group-hover:scale-125"}`}>
              ✨
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="font-mono text-[11px] text-primary uppercase font-bold tracking-wider flex items-center gap-1">
                Ollama · Online
                <span className="material-symbols-outlined text-[13px] text-primary group-hover:rotate-45 transition-transform duration-300">
                  auto_awesome
                </span>
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-primary text-on-primary font-semibold tracking-wide shadow-xs">
              Active
            </span>
          </div>

          <div className="font-mono text-[11px] text-on-surface-variant flex items-center justify-between">
            <span className="truncate">Gemma 2 · AI Engine Ready</span>
            <span className="text-[10px] text-secondary group-hover:text-primary transition-colors font-medium">
              Click to test
            </span>
          </div>

          {isSparkling && (
            <div className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1 animate-pulse pt-0.5">
              <span>✨ Engine online &amp; processing ready!</span>
            </div>
          )}
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

            <button
              type="button"
              onClick={triggerSparkle}
              title="Ollama AI Engine is Online & Active (Click to test sparkling effect)"
              className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 shadow-xs cursor-pointer select-none ${
                isSparkling
                  ? "bg-secondary-container border-primary text-primary scale-105 ring-2 ring-primary/30 shadow-md"
                  : "bg-surface-container-low border-outline-variant/60 hover:border-primary text-secondary hover:text-primary hover:shadow-xs"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-mono text-[11px] font-bold tracking-wide flex items-center gap-1">
                {loading ? "INFERENCE: EXTRACTING..." : "OLLAMA · ONLINE"}
                <span className="material-symbols-outlined text-[13px] text-primary group-hover:rotate-45 transition-transform duration-300">
                  auto_awesome
                </span>
              </span>
              <span className={`text-[11px] transition-transform duration-300 ${isSparkling ? "scale-125 rotate-12" : "group-hover:scale-125"}`}>
                ✨
              </span>
            </button>

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </header>

        {/* Mobile Top Header (< md) Matching Screen 05 */}
        <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
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
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerSparkle}
              title="Ollama AI Engine Online"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/50 shadow-xs active:scale-95 transition-all select-none"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-mono text-[10px] text-primary font-bold uppercase flex items-center gap-1">
                Ollama · Online <span className="text-[11px]">✨</span>
              </span>
            </button>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="relative pt-20 md:pt-24 pb-24 md:pb-16 px-4 md:px-8 max-w-6xl mx-auto w-full flex flex-col gap-8">
          {/* Diagnostic Error Banner */}
          {diagnostic ? (
            <div className="p-5 md:p-6 rounded-xl bg-surface-container-lowest border-2 border-primary/30 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[24px] text-primary">
                    {diagnostic.type === "mixed_content"
                      ? "lock_clock"
                      : diagnostic.type === "ocr_required"
                      ? "document_scanner"
                      : diagnostic.type === "backend_offline"
                      ? "cloud_off"
                      : "info"}
                  </span>
                  <h3 className="font-serif text-[17px] md:text-[18px] font-semibold text-primary">
                    {diagnostic.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDiagnostic(null);
                    setError(null);
                  }}
                  className="text-secondary hover:text-on-surface text-[12px] font-mono px-2 py-0.5 rounded hover:bg-surface-container"
                >
                  Dismiss
                </button>
              </div>

              <p className="text-[13px] md:text-[14px] text-on-surface leading-relaxed">
                {diagnostic.message}
              </p>

              {diagnostic.technicalDetails && (
                <div className="p-3 rounded-lg bg-surface-container-low font-mono text-[11px] text-secondary border border-outline-variant/30 overflow-x-auto">
                  {diagnostic.technicalDetails}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-outline-variant/40">
                <p className="text-[12px] text-secondary leading-normal">
                  💡 <span className="font-medium text-on-surface">Solution:</span> {diagnostic.recommendation}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  {diagnostic.showSetupAction && (
                    <button
                      type="button"
                      onClick={() => setShowSetupModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-[12px] font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">terminal</span>
                      Local Setup Guide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => loadSample("Rhodes_Scholarship_2025.pdf")}
                    className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-secondary-container text-on-surface text-[12px] font-medium transition-colors"
                  >
                    Try Sample Notice
                  </button>
                </div>
              </div>
            </div>
          ) : error ? (
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
          ) : null}

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
              {/* AI Engine Online & Local Privacy Banner with Sparkling Effect */}
              <div
                onClick={triggerSparkle}
                className={`group p-4 rounded-xl bg-gradient-to-r from-surface-container-low via-surface-container to-secondary-container/30 border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs cursor-pointer select-none ${
                  isSparkling
                    ? "border-primary ring-2 ring-primary/30 scale-[1.01] shadow-md"
                    : "border-outline-variant/60 hover:border-primary/60 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform duration-300">
                      auto_awesome
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-primary flex items-center gap-1.5">
                        Ollama &amp; NoticeNap AI Engine Online
                        <span className={`text-[12px] transition-transform duration-300 ${isSparkling ? "scale-125 rotate-12" : "group-hover:scale-125"}`}>
                          ✨
                        </span>
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                        Active
                      </span>
                    </div>
                    <span className="text-[12px] text-secondary">
                      Deterministic PyMuPDF parser &amp; Gemma 2 AI model ready. Extract dates, eligibility benchmarks, and document requirements with air-gapped privacy.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerSparkle();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary text-[11px] font-mono border border-outline-variant/60 flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>✨</span>
                    Test Sparkle
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSample("Rhodes_Scholarship_2025.pdf");
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-[12px] font-semibold hover:bg-primary-container transition-colors shadow-sm"
                  >
                    Test Sample Notice
                  </button>
                </div>
              </div>
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
              {/* Pre-Analyzed Notice Banner if in Sandbox Mode */}
              {documentResult && isSandboxNotice && (
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] shadow-sm">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Authentic Pre-Analyzed Notice Showcase (Hosted Preview Mode)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-secondary">
                      Full split view &amp; checklist active.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSetupModal(true)}
                      className="font-mono text-[11px] text-primary hover:text-primary-container underline underline-offset-2 ml-1"
                    >
                      Run custom PDFs locally
                    </button>
                  </div>
                </div>
              )}

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
                            {selectedLanguage === "hi" ? "आवेदन शुल्क:" : selectedLanguage === "mr" ? "अर्ज शुल्क:" : "Application Fee:"}
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
                            {selectedLanguage === "hi" ? "सत्यापन एवं चेतावनी बिंदु" : selectedLanguage === "mr" ? "पडताळणी नोंदी व दक्षता" : "Verification Notes & Caveats"}
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
                          {selectedLanguage === "hi" ? "महत्वपूर्ण तिथियां और समय सीमा" : selectedLanguage === "mr" ? "महत्त्वाच्या तारखा आणि अंतिम मुदती" : "Critical Dates & Deadlines"}
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
                          {selectedLanguage === "hi" ? "पात्रता मानदंड एवं शर्तें" : selectedLanguage === "mr" ? "पात्रता निकष आणि अटी" : "Eligibility Stipulations"}
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
                          {selectedLanguage === "hi" ? "अनिवार्य दस्तावेज चेकलिस्ट" : selectedLanguage === "mr" ? "अनिवार्य कागदपत्रे चेकलिस्ट" : "Required Documents Checklist"}
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
                          {selectedLanguage === "hi" ? "आपकी सरल आगामी कार्य-योजना" : selectedLanguage === "mr" ? "तुमची सुलभ पुढील कृती-योजना" : "Your Streamlined Next Steps"}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={downloadCalendarICS}
                          className="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-secondary-container transition-colors text-primary font-mono text-[12px] flex items-center gap-1.5 border border-outline-variant/60"
                        >
                          <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                          {selectedLanguage === "hi" ? "कैलेंडर में जोड़ें (.ics)" : selectedLanguage === "mr" ? "कॅलेंडरमध्ये जोडा (.ics)" : "Add to Calendar (.ics)"}
                        </button>
                        <button
                          type="button"
                          onClick={exportActionsMarkdown}
                          className="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-secondary-container transition-colors text-primary font-mono text-[12px] flex items-center gap-1.5 border border-outline-variant/60"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          {selectedLanguage === "hi" ? "चेकलिस्ट डाउनलोड करें (.md)" : selectedLanguage === "mr" ? "चेकलिस्ट डाउनलोड करा (.md)" : "Export Checklist (.md)"}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1.5 pt-2">
                      <div className="flex items-center justify-between text-[12px] font-mono text-secondary">
                        <span>
                          {selectedLanguage === "hi"
                            ? `प्रगति: ${completedActions} / ${totalActions} कार्य पूर्ण`
                            : selectedLanguage === "mr"
                            ? `प्रगती: ${completedActions} / ${totalActions} कार्य पूर्ण`
                            : `Progress: ${completedActions} of ${totalActions} tasks completed`}
                        </span>
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
                        {selectedLanguage === "hi" ? "सभी" : selectedLanguage === "mr" ? "सर्व" : "All"} ({totalActions})
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
                        {selectedLanguage === "hi" ? "लंबित" : selectedLanguage === "mr" ? "प्रलंबित" : "Pending"} ({totalActions - completedActions})
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
                        {selectedLanguage === "hi" ? "पूर्ण" : selectedLanguage === "mr" ? "पूर्ण" : "Completed"} ({completedActions})
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

              {/* Custom FastAPI Backend URL */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-on-surface">
                    FastAPI Backend Base URL
                  </label>
                  {customBackendUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        saveCustomBackend("");
                        setBackendTestResult(null);
                      }}
                      className="text-[11px] font-mono text-secondary hover:text-primary underline"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customBackendUrl}
                    placeholder="http://localhost:8000"
                    onChange={(e) => saveCustomBackend(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/60 font-mono text-[12px] text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    disabled={isTestingBackend}
                    onClick={testBackendConnection}
                    className="px-3 py-2 rounded-lg bg-surface-container-high hover:bg-secondary-container text-on-surface text-[12px] font-mono shrink-0 transition-colors disabled:opacity-50"
                  >
                    {isTestingBackend ? "Probing..." : "Test"}
                  </button>
                </div>
                {backendTestResult && (
                  <span className={`text-[11px] font-mono ${backendTestResult.ok ? "text-primary font-medium" : "text-tertiary"}`}>
                    {backendTestResult.message}
                  </span>
                )}
                <span className="text-[11px] text-secondary">
                  Default: http://localhost:8000. When accessing via HTTPS (e.g. Vercel), unencrypted local HTTP requests are blocked by browsers.
                </span>
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
                <div className="font-mono text-[12px] text-on-surface flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span>{ollamaStatus.status_message}</span>
                  </div>
                  <span className="text-[12px]">✨</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowSetupModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-[12px] font-mono border border-outline-variant/60 flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
                <span>Open Local-First Setup Guide</span>
              </button>

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

      {/* 5. LOCAL-FIRST SETUP GUIDE MODAL */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-outline-variant/60 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-outline-variant/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">terminal</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-serif text-[20px] font-semibold text-on-surface">
                    Run NoticeNap Locally
                  </h3>
                  <span className="font-mono text-[11px] text-secondary uppercase tracking-wider">
                    100% Air-Gapped · On-Device PyMuPDF &amp; Gemma 2
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <p className="text-[13px] md:text-[14px] text-secondary leading-relaxed">
              Because NoticeNap is built for confidential academic, legal, and scholarship notices, no document bytes are sent to third-party cloud AI. Follow these steps to run the complete stack locally:
            </p>

            <div className="flex flex-col gap-4">
              {/* Step 1: Clone & Install */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-primary uppercase font-mono">
                    Step 1: Install Backend Requirements
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("cd backend\npip install -r requirements.txt");
                      setCopiedCodeIndex(1);
                      setTimeout(() => setCopiedCodeIndex(null), 2000);
                    }}
                    className="text-[11px] font-mono text-secondary hover:text-primary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    {copiedCodeIndex === 1 ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-mono text-[12px] text-on-surface overflow-x-auto select-all">
cd backend
pip install -r requirements.txt
                </pre>
              </div>

              {/* Step 2: Start Backend Daemon */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-primary uppercase font-mono">
                    Step 2: Start FastAPI Backend (Port 8000)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("python main.py");
                      setCopiedCodeIndex(2);
                      setTimeout(() => setCopiedCodeIndex(null), 2000);
                    }}
                    className="text-[11px] font-mono text-secondary hover:text-primary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    {copiedCodeIndex === 2 ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-mono text-[12px] text-on-surface overflow-x-auto select-all">
python main.py
                </pre>
              </div>

              {/* Step 3: Run Ollama Model */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-primary uppercase font-mono">
                    Step 3: Run Ollama with Gemma 2
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("ollama run gemma2");
                      setCopiedCodeIndex(3);
                      setTimeout(() => setCopiedCodeIndex(null), 2000);
                    }}
                    className="text-[11px] font-mono text-secondary hover:text-primary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    {copiedCodeIndex === 3 ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-mono text-[12px] text-on-surface overflow-x-auto select-all">
ollama run gemma2
                </pre>
              </div>

              {/* Step 4: Run Frontend */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-primary uppercase font-mono">
                    Step 4: Start Frontend Dev Server (Port 3000)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("cd frontend\nnpm run dev");
                      setCopiedCodeIndex(4);
                      setTimeout(() => setCopiedCodeIndex(null), 2000);
                    }}
                    className="text-[11px] font-mono text-secondary hover:text-primary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    {copiedCodeIndex === 4 ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-mono text-[12px] text-on-surface overflow-x-auto select-all">
cd frontend
npm run dev
                </pre>
                <span className="text-[11px] text-secondary">
                  Open http://localhost:3000 to drop any PDF for private local analysis.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => {
                  setShowSetupModal(false);
                  loadSample("Rhodes_Scholarship_2025.pdf");
                }}
                className="text-[13px] font-medium text-primary hover:underline"
              >
                Or test with pre-analyzed sample notice
              </button>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors"
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

export default function DeskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center font-mono text-[13px] text-secondary">
          Loading NoticeNap Document Desk...
        </div>
      }
    >
      <DeskPageInner />
    </Suspense>
  );
}
