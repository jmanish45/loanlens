"""Mistral-based PDF document extraction pipeline.

Implements native PyMuPDF text extraction with OCR fallback (Tesseract + image preprocessing),
followed by structured Pydantic extraction using Mistral LLM (mistral-small-2506).
"""

from __future__ import annotations

import io
import os
import logging
from typing import Tuple, Optional, Any, Type
import numpy as np
from PIL import Image, ImageOps
import fitz  # PyMuPDF
import pytesseract
from pydantic import BaseModel
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate

from config import get_settings
from schemas.common import DocumentType
from schemas.payment_slip import PaymentSlip
from schemas.salary_slip import SalarySlipData
from schemas.bank_statement import BankStatementData
from schemas.form16_itr import Form16Data
from schemas.identity import PanCardData, AadhaarCardData

logger = logging.getLogger(__name__)

# Minimum characters expected from the native text layer before considering it valid
MIN_NATIVE_TEXT_CHARS = 40

# OCR render resolution (DPI).
OCR_DPI = 350

# Ensure Tesseract binary is set if on Windows standard path
TESSERACT_WINDOWS_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TESSERACT_WINDOWS_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_WINDOWS_PATH


# ---------------------------------------------------------------------------
# Schema Mapping & System Prompts
# ---------------------------------------------------------------------------

SCHEMA_MAP: dict[str, Type[BaseModel]] = {
    "PAYMENT_SLIP": PaymentSlip,
    "payment_slip": PaymentSlip,
    "SALARY_SLIP": SalarySlipData,
    "salary_slip": SalarySlipData,
    "BANK_STATEMENT": BankStatementData,
    "bank_statement": BankStatementData,
    "FORM_16": Form16Data,
    "form16": Form16Data,
    "PAN": PanCardData,
    "pan": PanCardData,
    "AADHAAR": AadhaarCardData,
    "aadhaar": AadhaarCardData,
}

SYSTEM_PROMPTS: dict[str, str] = {
    "PAYMENT_SLIP": """You are a document-extraction assistant for payment slips.
Read the raw text extracted from a payment slip (it may contain minor OCR noise/typos) and extract clean, structured data.

Rules:
- Only extract values that are actually present or clearly inferable from the text; never invent data.
- Correct obvious OCR artifacts (e.g. 'O' vs '0', stray symbols) when reconstructing numeric fields, but do not alter the actual values.
- Strip currency symbols and thousands separators from amounts (return plain numbers).
- "components" must list each row of the payment details table (component name, amount, and its status/note if present).
- If a field is missing from the text, use empty string/null for text fields and 0 for numeric fields.
""",
    "SALARY_SLIP": """You are a document-extraction assistant for Indian salary slips / payslips.
Read the raw text extracted from a salary slip (it may contain minor OCR noise/typos) and extract clean, structured data.

Rules:
- Extract employee details, employer, salary month, basic salary, HRA, gross salary, PF, TDS, total deductions, and net salary.
- Strip currency symbols (₹, Rs.) and commas from amounts.
- Set missing fields to null.
- Never invent data not present in the document.
""",
    "BANK_STATEMENT": """You are a document-extraction assistant for bank account statements.
Read the raw text extracted from a bank statement and extract structured data.

Rules:
- Extract account holder name, bank name, account number, IFSC code, statement period, opening balance, closing balance, total credits/debits, and sample transactions.
- Strip currency symbols and commas from amounts.
- Set missing fields to null.
- Never invent data not present in the document.
""",
    "FORM_16": """You are a document-extraction assistant for Form 16 (TDS certificate from employer).
Read the raw text extracted from Form 16 and extract structured financial data.

Rules:
- Extract employee name, PAN of employee, employer name, TAN of employer, assessment year, financial year, gross salary, total exemptions, net taxable salary, total deductions, total taxable income, and TDS deducted.
- Strip currency symbols and commas from amounts.
- Set missing fields to null.
""",
    "PAN": """You are a document-extraction assistant for PAN cards.
Extract pan_number, name, fathers_name, and date_of_birth from the text.
Strip invalid characters from PAN number (standard format: 5 letters, 4 digits, 1 letter).
""",
    "AADHAAR": """You are a document-extraction assistant for Aadhaar cards.
Extract aadhaar_number (12 digits), name, date_of_birth, gender, and address.
""",
}


# ---------------------------------------------------------------------------
# Step 1: Text extraction (Native first, Tesseract OCR fallback)
# ---------------------------------------------------------------------------

def _extract_native_text(doc: fitz.Document) -> str:
    """Pull embedded text layer directly via PyMuPDF."""
    parts = [page.get_text() for page in doc]
    return "\n".join(parts).strip()


def _preprocess_for_ocr(pix: fitz.Pixmap) -> Image.Image:
    """Convert a rendered page to a cleaned-up image to boost OCR accuracy.

    Steps: grayscale -> autocontrast -> binarize (simple threshold).
    Helps with scanned/photographed documents (shadows, low contrast).
    """
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    img = img.convert("L")  # grayscale
    img = ImageOps.autocontrast(img)

    # Simple global threshold binarization
    arr = np.array(img)
    threshold = arr.mean() * 0.9  # slightly below mean tends to preserve thin text
    binarized = np.where(arr > threshold, 255, 0).astype(np.uint8)
    return Image.fromarray(binarized)


def _extract_ocr_text(doc: fitz.Document) -> str:
    """Render each page to an image and run Tesseract OCR on it."""
    zoom = OCR_DPI / 72  # fitz default render is 72 DPI
    matrix = fitz.Matrix(zoom, zoom)

    ocr_parts = []
    # psm 6: assume a uniform block of text — works well for slip/table layouts.
    tesseract_config = "--oem 3 --psm 6"

    for page_num, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=matrix)
        processed_img = _preprocess_for_ocr(pix)
        page_text = pytesseract.image_to_string(processed_img, config=tesseract_config)
        ocr_parts.append(page_text)
        logger.info(f"    OCR'd page {page_num}/{len(doc)} ({len(page_text)} chars)")

    return "\n".join(ocr_parts).strip()


def extract_text_from_pdf_data(file_bytes: bytes) -> Tuple[str, str]:
    """Extract text from PDF bytes, preferring the native layer, falling back to OCR.

    Returns:
        (text, extraction_method) where extraction_method is 'native' or 'ocr'.
    """
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        native_text = _extract_native_text(doc)

        if len(native_text) >= MIN_NATIVE_TEXT_CHARS:
            logger.info(f"Native text extracted: {len(native_text)} chars")
            return native_text, "native"

        logger.info(f"Native text layer too short ({len(native_text)} chars) — falling back to OCR...")
        ocr_text = _extract_ocr_text(doc)

        if not ocr_text:
            raise ValueError(
                "Could not extract any text from the PDF via native layer or OCR. "
                "The file may be corrupted or the scan quality too poor."
            )
        return ocr_text, "ocr"


# ---------------------------------------------------------------------------
# Step 2 & 3: Mistral LLM Structuring & Pydantic Validation
# ---------------------------------------------------------------------------

def build_structured_mistral_llm(schema_cls: Type[BaseModel]):
    """Instantiate ChatMistralAI model with structured output."""
    settings = get_settings()
    api_key = settings.mistral_api_key or os.getenv("MISTRAL_API_KEY", "")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY is not set in environment or config.")

    model_name = settings.mistral_model or "mistral-small-2506"
    model = ChatMistralAI(
        model=model_name,
        temperature=0,
        mistral_api_key=api_key
    )
    return model.with_structured_output(schema_cls)


def extract_structured_data_mistral(
    document_type: str,
    raw_text: str
) -> dict[str, Any]:
    """Send extracted raw text to Mistral LLM to produce validated structured JSON.

    Args:
        document_type: The normalized or frontend document type (e.g. 'payment_slip', 'salary_slip')
        raw_text: The OCR / native extracted raw text

    Returns:
        Dictionary of validated extracted fields
    """
    doc_key = document_type.upper().replace(" ", "_")
    schema_cls = SCHEMA_MAP.get(doc_key, SCHEMA_MAP.get(document_type, PaymentSlip))
    system_prompt = SYSTEM_PROMPTS.get(doc_key, SYSTEM_PROMPTS.get("PAYMENT_SLIP"))

    structured_llm = build_structured_mistral_llm(schema_cls)

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Extract the structured document data from this text:\n\n{data}"),
    ])

    messages = prompt.format_messages(data=raw_text)
    result = structured_llm.invoke(messages)

    if isinstance(result, BaseModel):
        return result.model_dump(exclude_none=False)
    elif isinstance(result, dict):
        return result
    else:
        return dict(result)
