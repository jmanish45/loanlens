"""Local regex-based parsing for PAN and Aadhaar from PyMuPDF-extracted text.

No AI/Gemini calls — intended for digital PDFs with a native text layer.
"""

import re
import logging
from typing import Optional

from schemas.identity import PanCardData, AadhaarCardData

logger = logging.getLogger(__name__)

PAN_PATTERN = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")
AADHAAR_PATTERN = re.compile(r"\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b")
DOB_PATTERN = re.compile(r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b")
YOB_PATTERN = re.compile(r"\b(19|20)\d{2}\b")
GENDER_PATTERN = re.compile(r"\b(Male|Female|Transgender|MALE|FEMALE|TRANSGENDER|M|F)\b", re.IGNORECASE)

PAN_LABELS = {
    "name": re.compile(r"(?:name|नाम)\s*[:\-]?\s*(.+)", re.IGNORECASE),
    "fathers_name": re.compile(
        r"(?:father(?:'?s)?\s*name|pita\s*ka\s*naam|पिता\s*का\s*नाम)\s*[:\-]?\s*(.+)",
        re.IGNORECASE,
    ),
    "date_of_birth": re.compile(
        r"(?:date\s*of\s*birth|d\.?\s*o\.?\s*b\.?|जन्म\s*तिथि)\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})",
        re.IGNORECASE,
    ),
}

AADHAAR_LABELS = {
    "name": re.compile(r"(?:name|नाम)\s*[:\-]?\s*(.+)", re.IGNORECASE),
    "date_of_birth": re.compile(
        r"(?:date\s*of\s*birth|d\.?\s*o\.?\s*b\.?|year\s*of\s*birth|y\.?\s*o\.?\s*b\.?|जन्म\s*तिथि)\s*[:\-]?\s*(\S.+)",
        re.IGNORECASE,
    ),
    "gender": re.compile(r"(?:gender|sex|लिंग)\s*[:\-]?\s*(Male|Female|Transgender|M|F)", re.IGNORECASE),
    "address": re.compile(r"(?:address|पता)\s*[:\-]?\s*(.+)", re.IGNORECASE),
}


def _normalize_pan(value: str) -> str:
    return value.strip().upper()


def _normalize_aadhaar(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    return digits if len(digits) == 12 else value.strip()


def _clean_line(value: str) -> str:
    cleaned = value.strip()
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.rstrip(",.;")


def _find_labeled_value(text: str, pattern: re.Pattern) -> Optional[str]:
    for line in text.splitlines():
        match = pattern.search(line.strip())
        if match:
            return _clean_line(match.group(1))
    return None


def _find_pan_number(text: str) -> Optional[str]:
    upper = text.upper()
    match = PAN_PATTERN.search(upper)
    return _normalize_pan(match.group(1)) if match else None


def _find_aadhaar_number(text: str) -> Optional[str]:
    for match in AADHAAR_PATTERN.finditer(text):
        normalized = _normalize_aadhaar(match.group(1))
        if len(normalized) == 12:
            return normalized
    return None


def _find_name_after_pan(text: str, pan_number: str) -> Optional[str]:
    """Heuristic: on e-PAN PDFs the holder name often follows the PAN line."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    upper_lines = [ln.upper() for ln in lines]

    pan_idx = next((i for i, ln in enumerate(upper_lines) if pan_number in ln), None)
    if pan_idx is None:
        return None

    skip_labels = {
        "NAME",
        "FATHER'S NAME",
        "FATHERS NAME",
        "DATE OF BIRTH",
        "SIGNATURE",
        "PERMANENT ACCOUNT NUMBER",
        "INCOME TAX DEPARTMENT",
        "GOVT. OF INDIA",
        "GOVT OF INDIA",
    }

    for ln in lines[pan_idx + 1 : pan_idx + 6]:
        upper = ln.upper()
        if upper in skip_labels or PAN_PATTERN.search(upper):
            continue
        if len(ln) >= 3 and re.search(r"[A-Za-z]", ln):
            return _clean_line(ln)
    return None


def _find_fathers_name_after_label(text: str) -> Optional[str]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for i, line in enumerate(lines):
        if re.search(r"father", line, re.IGNORECASE):
            inline = PAN_LABELS["fathers_name"].search(line)
            if inline:
                return _clean_line(inline.group(1))
            for nxt in lines[i + 1 : i + 3]:
                if DOB_PATTERN.search(nxt) or PAN_PATTERN.search(nxt.upper()):
                    break
                if len(nxt) >= 3 and re.search(r"[A-Za-z]", nxt):
                    return _clean_line(nxt)
    return _find_labeled_value(text, PAN_LABELS["fathers_name"])


def _find_dob(text: str) -> Optional[str]:
    labeled = _find_labeled_value(text, PAN_LABELS["date_of_birth"])
    if labeled:
        dob_match = DOB_PATTERN.search(labeled)
        return dob_match.group(1) if dob_match else labeled

    match = DOB_PATTERN.search(text)
    return match.group(1) if match else None


def parse_pan_text(text: str) -> dict:
    """Extract structured PAN fields from native PDF text."""
    if not text or len(text.strip()) < 10:
        return {}

    pan_number = _find_pan_number(text)
    name = _find_labeled_value(text, PAN_LABELS["name"])
    if not name and pan_number:
        name = _find_name_after_pan(text, pan_number)

    fathers_name = _find_fathers_name_after_label(text)
    date_of_birth = _find_dob(text)

    data = PanCardData(
        pan_number=pan_number,
        name=name,
        fathers_name=fathers_name,
        date_of_birth=date_of_birth,
    )
    return data.model_dump(exclude_none=True)


def parse_aadhaar_text(text: str) -> dict:
    """Extract structured Aadhaar fields from native PDF text."""
    if not text or len(text.strip()) < 10:
        return {}

    aadhaar_number = _find_aadhaar_number(text)
    name = _find_labeled_value(text, AADHAAR_LABELS["name"])
    date_of_birth = _find_labeled_value(text, AADHAAR_LABELS["date_of_birth"])
    gender = _find_labeled_value(text, AADHAAR_LABELS["gender"])
    address = _find_labeled_value(text, AADHAAR_LABELS["address"])

    if not date_of_birth:
        dob_match = DOB_PATTERN.search(text)
        if dob_match:
            date_of_birth = dob_match.group(1)
        else:
            yob_match = YOB_PATTERN.search(text)
            if yob_match:
                date_of_birth = yob_match.group(0)

    if not gender:
        gender_match = GENDER_PATTERN.search(text)
        if gender_match:
            raw = gender_match.group(1).upper()
            gender = {"M": "Male", "F": "Female"}.get(raw, raw.title())

    data = AadhaarCardData(
        aadhaar_number=aadhaar_number,
        name=name,
        date_of_birth=date_of_birth,
        gender=gender,
        address=address,
    )
    return data.model_dump(exclude_none=True)


def parse_identity_text(document_type: str, text: str) -> dict | None:
    """Parse identity document text based on expected type."""
    doc_type = (document_type or "").lower()
    if doc_type in ("pan", "PAN"):
        result = parse_pan_text(text)
    elif doc_type in ("aadhaar", "aadhar", "AADHAAR"):
        result = parse_aadhaar_text(text)
    else:
        return None

    if not result:
        logger.info(f"No identity fields parsed for {doc_type}")
        return None

    logger.info(f"Parsed {doc_type} fields locally: {list(result.keys())}")
    return result
