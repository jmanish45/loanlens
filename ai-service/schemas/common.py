"""Common schemas for AI document processing."""

from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, Any


class DocumentType(str, Enum):
    PAN = "PAN"
    AADHAAR = "AADHAAR"
    SALARY_SLIP = "SALARY_SLIP"
    BANK_STATEMENT = "BANK_STATEMENT"
    FORM_16 = "FORM_16"
    ITR = "ITR"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ClassificationResult(BaseModel):
    """Result of document classification."""

    document_type: DocumentType = Field(description="Predicted document type")
    confidence: float = Field(ge=0.0, le=1.0, description="Classification confidence score")
    reasoning: str = Field(default="", description="Brief reasoning for the classification")


class ProcessingResult(BaseModel):
    """Complete result of document processing (classification + extraction)."""

    document_type: DocumentType
    confidence: float = Field(ge=0.0, le=1.0)
    processing_status: ProcessingStatus = ProcessingStatus.COMPLETED
    extracted_data: Optional[dict[str, Any]] = None
    processing_error: Optional[str] = None
    raw_text_preview: Optional[str] = Field(
        default=None, description="First 500 chars of extracted text for debugging"
    )


class ProcessDocumentRequest(BaseModel):
    """Request to process a document — used when the file is sent as a path."""

    file_path: Optional[str] = None
    document_id: Optional[str] = None
