"""Document processing API router."""

import logging
import time
from fastapi import APIRouter, UploadFile, File, HTTPException

from schemas.common import ProcessingResult, ProcessingStatus, DocumentType
from services.text_extraction import extract_text
from services.classification import classify_document
from services.extraction import extract_structured_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["documents"])


@router.post("/process-document", response_model=ProcessingResult)
async def process_document(file: UploadFile = File(...)):
    """Process an uploaded document through the AI pipeline.

    Pipeline:
    1. Text extraction (PyMuPDF + pdfplumber, or Gemini Vision OCR)
    2. Document classification (Gemini LLM)
    3. Structured data extraction (Gemini LLM + Pydantic validation)

    Returns structured processing result.
    """
    start_time = time.time()

    # Validate file
    if not file.content_type:
        raise HTTPException(status_code=400, detail="File content type is required")

    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {', '.join(allowed_types)}",
        )

    try:
        # Read file bytes
        file_bytes = await file.read()

        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        logger.info(f"Processing document: {file.filename} ({file.content_type}, {len(file_bytes)} bytes)")

        # Step 1: Text extraction
        logger.info("Step 1: Extracting text...")
        extraction_result = extract_text(file_bytes, file.content_type)
        extracted_text = extraction_result["text"]

        if not extraction_result["has_text"]:
            logger.warning("No meaningful text could be extracted from the document")
            return ProcessingResult(
                document_type=DocumentType.UNKNOWN,
                confidence=0.0,
                processing_status=ProcessingStatus.FAILED,
                extracted_data=None,
                processing_error="Could not extract meaningful text from the document",
                raw_text_preview=extracted_text[:500] if extracted_text else None,
            )

        # Step 2: Classification
        logger.info("Step 2: Classifying document...")
        classification = classify_document(
            text=extracted_text,
            file_bytes=file_bytes,
            content_type=file.content_type,
        )
        logger.info(
            f"Classification: {classification.document_type} "
            f"(confidence: {classification.confidence:.2f}) — {classification.reasoning}"
        )

        # Step 3: Structured extraction
        logger.info(f"Step 3: Extracting structured data for {classification.document_type}...")
        extracted_data = extract_structured_data(
            document_type=classification.document_type,
            text=extracted_text,
        )

        elapsed = time.time() - start_time
        logger.info(f"Processing complete in {elapsed:.1f}s")

        return ProcessingResult(
            document_type=classification.document_type,
            confidence=classification.confidence,
            processing_status=ProcessingStatus.COMPLETED,
            extracted_data=extracted_data,
            processing_error=None,
            raw_text_preview=extracted_text[:500],
        )

    except HTTPException:
        raise
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"Document processing failed after {elapsed:.1f}s: {e}", exc_info=True)
        return ProcessingResult(
            document_type=DocumentType.UNKNOWN,
            confidence=0.0,
            processing_status=ProcessingStatus.FAILED,
            extracted_data=None,
            processing_error=str(e),
        )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "loanlens-ai"}
