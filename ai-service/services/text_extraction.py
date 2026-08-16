"""Text extraction service — handles PDF text and image OCR via Gemini Vision."""

import fitz  # PyMuPDF
import pdfplumber
import io
import logging
from pathlib import Path
from PIL import Image
import google.generativeai as genai

from config import get_settings
from utils.prompts import OCR_VISION_PROMPT

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> dict:
    """Extract text from a PDF using PyMuPDF, with table extraction via pdfplumber.

    Returns:
        dict with keys:
            - text: str (full extracted text)
            - tables: list[list[list[str]]] (extracted tables)
            - page_count: int
            - has_text: bool (whether meaningful text was found)
    """
    text_parts = []
    page_count = 0

    # PyMuPDF for text extraction
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page_count = len(doc)
        for page in doc:
            page_text = page.get_text("text")
            if page_text.strip():
                text_parts.append(page_text)
        doc.close()
    except Exception as e:
        logger.error(f"PyMuPDF text extraction failed: {e}")

    full_text = "\n\n".join(text_parts)

    # pdfplumber for table extraction
    tables = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_tables = page.extract_tables()
                if page_tables:
                    tables.extend(page_tables)
    except Exception as e:
        logger.error(f"pdfplumber table extraction failed: {e}")

    # Append table data to text for better LLM context
    if tables:
        table_text_parts = ["\n--- EXTRACTED TABLES ---"]
        for i, table in enumerate(tables):
            table_text_parts.append(f"\nTable {i + 1}:")
            for row in table:
                # Filter None values and join
                clean_row = [str(cell).strip() if cell else "" for cell in row]
                table_text_parts.append(" | ".join(clean_row))
        full_text += "\n".join(table_text_parts)

    has_text = len(full_text.strip()) > 50  # Meaningful text threshold

    return {
        "text": full_text,
        "tables": tables,
        "page_count": page_count,
        "has_text": has_text,
    }


def extract_text_from_image(file_bytes: bytes) -> dict:
    """Extract text from an image file using Gemini Vision OCR.

    Returns:
        dict with keys: text, tables (empty), page_count (1), has_text
    """
    text = ocr_with_gemini_vision(file_bytes, is_image=True)

    return {
        "text": text,
        "tables": [],
        "page_count": 1,
        "has_text": len(text.strip()) > 50,
    }


def ocr_with_gemini_vision(file_bytes: bytes, is_image: bool = False) -> str:
    """Use Gemini Vision to OCR a scanned document (PDF or image).

    Args:
        file_bytes: Raw file bytes
        is_image: True if the file is a JPG/PNG image

    Returns:
        Extracted text string
    """
    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    try:
        if is_image:
            image = Image.open(io.BytesIO(file_bytes))
            response = model.generate_content([OCR_VISION_PROMPT, image])
        else:
            # For scanned PDFs, convert first page to image
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            images_and_prompts = [OCR_VISION_PROMPT]

            # Process up to 5 pages for OCR
            for page_num in range(min(len(doc), 5)):
                page = doc[page_num]
                # Render page at 200 DPI for good quality
                pix = page.get_pixmap(dpi=200)
                img_bytes = pix.tobytes("png")
                image = Image.open(io.BytesIO(img_bytes))
                images_and_prompts.append(image)

            doc.close()
            response = model.generate_content(images_and_prompts)

        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini Vision OCR failed: {e}")
        return ""


def extract_text(file_bytes: bytes, content_type: str) -> dict:
    """Main entry point: extract text from any supported file type.

    For PDFs, tries native text first, falls back to Gemini Vision OCR.
    For images, uses Gemini Vision directly.
    """
    is_pdf = content_type == "application/pdf"
    is_image = content_type in ("image/jpeg", "image/png")

    if is_pdf:
        result = extract_text_from_pdf(file_bytes)

        # If PDF has no meaningful text (scanned), use Gemini Vision OCR
        if not result["has_text"]:
            logger.info("PDF has no text — falling back to Gemini Vision OCR")
            ocr_text = ocr_with_gemini_vision(file_bytes, is_image=False)
            result["text"] = ocr_text
            result["has_text"] = len(ocr_text.strip()) > 50

        return result

    elif is_image:
        return extract_text_from_image(file_bytes)

    else:
        raise ValueError(f"Unsupported content type: {content_type}")
