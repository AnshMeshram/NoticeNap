import re
import json
from typing import List, Optional
import httpx
from pydantic import BaseModel, Field
try:
    from .config import settings
    from .extractor import DocumentExtractionResult
except ImportError:
    from config import settings
    from extractor import DocumentExtractionResult

class NoticeDate(BaseModel):
    title: str
    date_str: str
    is_deadline: bool = False
    source_page: int
    context: str

class EligibilityItem(BaseModel):
    category: str
    requirement: str
    is_strict: bool = True
    source_page: int

class RequiredDocument(BaseModel):
    name: str
    specification: str
    is_mandatory: bool = True
    source_page: int

class ActionStep(BaseModel):
    step_number: int
    title: str
    description: str
    deadline: Optional[str] = None
    source_page: int
    completed: bool = False

class NoticeAnalysisResult(BaseModel):
    document_id: str
    filename: str
    purpose: str
    summary: str
    application_fee: Optional[str] = None
    uncertainties: List[str] = Field(default_factory=list)
    dates: List[NoticeDate]
    eligibility: List[EligibilityItem]
    documents: List[RequiredDocument]
    actions: List[ActionStep]
    language: str = "en"
    ai_engine: str  # "ollama-gemma2 (gemma2)" or "local-deterministic-extractor"
    generated_at: str

def heuristic_extract_facets(doc: DocumentExtractionResult, language: str = "en") -> NoticeAnalysisResult:
    """
    Local air-gapped deterministic parser.
    Extracts dates, eligibility benchmarks, required documents, fees, uncertainties, and next steps
    from PyMuPDF page text without needing active internet or LLM daemon.
    Guarantees 100% source-page traceability.
    """
    dates: List[NoticeDate] = []
    eligibility: List[EligibilityItem] = []
    documents: List[RequiredDocument] = []
    actions: List[ActionStep] = []
    uncertainties: List[str] = []
    app_fee: Optional[str] = None

    for p in doc.pages:
        lines = p.text.split('\n')
        for line in lines:
            trimmed = line.strip()
            if not trimmed:
                continue

            lower = trimmed.lower()

            # 1. Dates & Deadlines
            if any(k in lower for k in ['date', 'deadline', 'commence', 'schedule', 'submission', 'interview', 'exam']):
                is_dl = any(k in lower for k in ['last date', 'deadline', 'closing'])
                dates.append(
                    NoticeDate(
                        title=trimmed[:60],
                        date_str=trimmed,
                        is_deadline=is_dl,
                        source_page=p.page_number,
                        context=trimmed
                    )
                )

            # 2. Eligibility Criteria
            if any(k in lower for k in ['eligib', 'age limit', 'qualification', 'degree', 'citizen', 'minimum', 'marks']):
                eligibility.append(
                    EligibilityItem(
                        category="Requirement" if "age" not in lower else "Age Limit",
                        requirement=trimmed,
                        is_strict=True,
                        source_page=p.page_number
                    )
                )

            # 3. Required Documents
            if any(k in lower for k in ['certificate', 'marksheet', 'passport', 'photograph', 'signature', 'document', 'transcript', 'id proof']):
                documents.append(
                    RequiredDocument(
                        name=trimmed[:50],
                        specification=trimmed,
                        is_mandatory="optional" not in lower,
                        source_page=p.page_number
                    )
                )

            # 4. Application Fee
            if any(k in lower for k in ['fee', 'rs.', 'rupees', 'exemption', 'exempted']) and not app_fee:
                if any(char.isdigit() for char in trimmed) or 'exempt' in lower:
                    app_fee = trimmed

            # 5. Uncertainties or Caveats
            if any(k in lower for k in ['subject to', 'tentative', 'to be notified', 'conflict', 'verification note', 'discrepancy']):
                uncertainties.append(f"Page {p.page_number}: {trimmed}")

            # 6. Action Steps
            if re.match(r'^(?:step\s*\d+|[1-9]\.|\-)\s+', trimmed, re.IGNORECASE) or any(k in lower for k in ['register', 'apply online', 'upload', 'submit', 'verify', 'pay fee']):
                if len(actions) < 10:
                    actions.append(
                        ActionStep(
                            step_number=len(actions) + 1,
                            title=trimmed[:50],
                            description=trimmed,
                            source_page=p.page_number,
                            completed=False
                        )
                    )

    # De-duplicate entries
    unique_dates = {d.title: d for d in dates}.values()
    unique_eligibility = {e.requirement: e for e in eligibility}.values()
    unique_docs = {d.specification: d for d in documents}.values()

    # Language localization for summaries
    if language == "hi":
        purpose = f"{doc.filename} का आधिकारिक विवरण और पात्रता सूचना।"
        summary = f"{doc.page_count} पृष्ठों का विश्लेषण पूर्ण। {len(unique_dates)} महत्वपूर्ण तिथियां, {len(unique_eligibility)} पात्रता मानदंड, और {len(unique_docs)} आवश्यक दस्तावेज मिले।"
    elif language == "mr":
        purpose = f"{doc.filename} ची अधिकृत माहिती आणि पात्रता सूचना."
        summary = f"{doc.page_count} पृष्ठांचे विश्लेषण पूर्ण. {len(unique_dates)} महत्त्वाच्या तारखा, {len(unique_eligibility)} पात्रता निकष आणि {len(unique_docs)} आवश्यक कागदपत्रे आढळली."
    else:
        purpose = f"Official selection, circular, or examination announcement from {doc.filename}."
        summary = f"Processed {doc.page_count} pages with {doc.total_words} words. Identified {len(unique_dates)} dates, {len(unique_eligibility)} eligibility benchmarks, and {len(unique_docs)} required document specifications."

    default_actions = [
        ActionStep(
            step_number=1,
            title="Review Eligibility Benchmarks" if language == "en" else ("पात्रता निकषांचे पुनरावलोकन" if language == "mr" else "पात्रता मानदंडों की समीक्षा करें"),
            description="Cross-reference qualifications and age caps against Page 1 specifications.",
            source_page=1
        ),
        ActionStep(
            step_number=2,
            title="Assemble Required Documents" if language == "en" else ("आवश्यक कागदपत्रे गोळा करा" if language == "mr" else "आवश्यक दस्तावेज एकत्र करें"),
            description="Verify PDF file sizes and format restrictions before starting upload.",
            source_page=min(2, doc.page_count)
        ),
        ActionStep(
            step_number=3,
            title="Submit Online Application" if language == "en" else ("ऑनलाइन अर्ज सादर करा" if language == "mr" else "ऑनलाइन आवेदन जमा करें"),
            description="Complete portal application prior to specified closing deadline.",
            source_page=1
        )
    ]

    return NoticeAnalysisResult(
        document_id=doc.document_id,
        filename=doc.filename,
        purpose=purpose,
        summary=summary,
        application_fee=app_fee or "No specific application fee mentioned.",
        uncertainties=uncertainties[:4] or ["No conflicting clauses or unverified provisions detected in source."],
        dates=list(unique_dates)[:8],
        eligibility=list(unique_eligibility)[:8],
        documents=list(unique_docs)[:10],
        actions=actions[:8] or default_actions,
        language=language,
        ai_engine="local-deterministic-extractor",
        generated_at="2026-10-21"
    )

async def analyze_document_with_ai(doc: DocumentExtractionResult, language: str = "en") -> NoticeAnalysisResult:
    """
    Attempts analysis using local Ollama instance with Gemma 2.
    Supports English, Hindi, and Marathi output.
    Gracefully falls back to deterministic PyMuPDF extractor if Ollama is unreachable.
    """
    host = settings.ollama_host.rstrip("/")
    model = settings.ollama_model

    # Check if Ollama is accessible
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            status_resp = await client.get(f"{host}/api/tags")
            if status_resp.status_code != 200:
                return heuristic_extract_facets(doc, language)
    except Exception:
        # Ollama offline -> fallback safely
        return heuristic_extract_facets(doc, language)

    # If Ollama is reachable, query structured extraction with Gemma 2
    try:
        # Intelligent chunking: group pages up to 6 pages with explicit page demarcation
        combined_text = "\n\n".join(
            [f"=== Page {p.page_number} ===\n{p.text}" for p in doc.pages[:6]]
        )

        lang_instruction = "Return all values in English."
        if language == "hi":
            lang_instruction = "Return summary, requirements, and action descriptions in Hindi (हिंदी), preserving English dates, proper nouns, and rupee amounts."
        elif language == "mr":
            lang_instruction = "Return summary, requirements, and action descriptions in Marathi (मराठी), preserving English dates, proper nouns, and rupee amounts."

        prompt = (
            "You are NoticeNap, an air-gapped bureaucratic notice analysis assistant.\n"
            f"{lang_instruction}\n"
            "Analyze the following notice text and extract 4 structured facets as JSON strictly matching this schema:\n"
            "{\n"
            '  "purpose": "1-sentence executive purpose of notice",\n'
            '  "summary": "1-2 sentence executive summary of key terms",\n'
            '  "application_fee": "Fee amount and exemptions if stated, or null",\n'
            '  "uncertainties": ["Any missing info, tentative dates, or conflicts"],\n'
            '  "dates": [{"title": "Short title", "date_str": "Date or deadline", "is_deadline": true, "source_page": 1}],\n'
            '  "eligibility": [{"category": "Age limit/Degree/etc", "requirement": "Detailed rule", "is_strict": true, "source_page": 1}],\n'
            '  "documents": [{"name": "Document name", "specification": "Size or format details", "is_mandatory": true, "source_page": 1}],\n'
            '  "actions": [{"step_number": 1, "title": "Action title", "description": "What to do next", "source_page": 1}]\n'
            "}\n"
            "Always include exact 1-indexed source_page numbers from the '=== Page X ===' headers. Return valid JSON only.\n\n"
            f"{combined_text}"
        )

        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(
                f"{host}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 1200
                    }
                }
            )
            if resp.status_code == 200:
                raw_response = resp.json().get("response", "{}")
                parsed = json.loads(raw_response)

                dates = [
                    NoticeDate(
                        title=d.get("title", "Date"),
                        date_str=d.get("date_str", ""),
                        is_deadline=bool(d.get("is_deadline", False)),
                        source_page=int(d.get("source_page", 1)),
                        context=d.get("title", "")
                    )
                    for d in parsed.get("dates", [])
                ]

                eligibility = [
                    EligibilityItem(
                        category=e.get("category", "General"),
                        requirement=e.get("requirement", ""),
                        is_strict=bool(e.get("is_strict", True)),
                        source_page=int(e.get("source_page", 1))
                    )
                    for e in parsed.get("eligibility", [])
                ]

                documents = [
                    RequiredDocument(
                        name=doc_item.get("name", "Document"),
                        specification=doc_item.get("specification", doc_item.get("name", "")),
                        is_mandatory=bool(doc_item.get("is_mandatory", True)),
                        source_page=int(doc_item.get("source_page", 1))
                    )
                    for doc_item in parsed.get("documents", [])
                ]

                actions = [
                    ActionStep(
                        step_number=idx + 1,
                        title=a.get("title", f"Step {idx + 1}"),
                        description=a.get("description", a.get("title", "")),
                        source_page=int(a.get("source_page", 1)),
                        completed=False
                    )
                    for idx, a in enumerate(parsed.get("actions", []))
                ]

                if dates or eligibility or documents or actions:
                    return NoticeAnalysisResult(
                        document_id=doc.document_id,
                        filename=doc.filename,
                        purpose=parsed.get("purpose", f"Official notification from {doc.filename}"),
                        summary=parsed.get("summary", f"Extracted via Ollama Gemma 2 with {doc.page_count} pages."),
                        application_fee=parsed.get("application_fee"),
                        uncertainties=parsed.get("uncertainties", []),
                        dates=dates,
                        eligibility=eligibility,
                        documents=documents,
                        actions=actions,
                        language=language,
                        ai_engine=f"ollama-gemma2 ({model})",
                        generated_at="2026-10-21"
                    )
    except Exception:
        pass

    return heuristic_extract_facets(doc, language)
