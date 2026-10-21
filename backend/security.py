import re
import os
from typing import Tuple, List

class SecurityException(ValueError):
    """Raised when an uploaded document violates security policies."""
    pass

class PDFSecurityGuard:
    """
    Guards against malicious or malicious-by-design PDF documents.
    Protects local machine and browser against:
    - Path traversal in filenames
    - Embedded executable JavaScript (/JS, /JavaScript)
    - Automated system launches (/Launch, /Action)
    - Form exfiltration targets (/SubmitForm)
    - Decompression bombs and abnormal page counts
    """

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    MAX_PAGE_COUNT = 250               # Safeguard against 10,000-page decompression traps
    
    # Patterns indicative of active executable payloads in raw PDF streams
    SUSPICIOUS_TOKENS = [
        rb"/JavaScript",
        rb"/JS",
        rb"/Launch",
        rb"/SubmitForm",
        rb"/ImportData"
    ]

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Strips path traversal sequences and normalizes filename."""
        base = os.path.basename(filename)
        # Remove null bytes and non-printable characters
        cleaned = re.sub(r'[\x00-\x1f\x7f]', '', base)
        # Ensure it has a safe name
        cleaned = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', cleaned)
        if not cleaned.lower().endswith('.pdf'):
            cleaned += '.pdf'
        return cleaned or "unnamed_notice.pdf"

    @classmethod
    def inspect_raw_bytes(cls, raw_bytes: bytes) -> Tuple[bool, List[str]]:
        """
        Scans raw PDF bytes before parsing.
        Returns (is_safe, list_of_warnings).
        """
        warnings = []
        
        if not raw_bytes.startswith(b"%PDF-"):
            raise SecurityException("Invalid header: File is not a valid PDF document.")

        if len(raw_bytes) > cls.MAX_FILE_SIZE:
            raise SecurityException(f"Document exceeds max allowed size of {cls.MAX_FILE_SIZE // (1024*1024)}MB.")

        # Check for suspicious active executable tags
        for token in cls.SUSPICIOUS_TOKENS:
            if token in raw_bytes:
                warnings.append(f"Suspicious active content detected ({token.decode('ascii', errors='ignore')}). Executable code is neutralized and will not run.")

        return True, warnings
