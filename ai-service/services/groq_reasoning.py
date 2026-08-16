"""Groq Reasoning Layer for Cross-Document Verification Analysis.

Consumes structured deterministic validation results and produces an objective,
officer-facing verification summary and findings without recalculating arithmetic.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel

from config import get_settings
from schemas.verification import (
    VerificationCheck,
    CheckStatus,
    SeverityLevel,
    VerificationStatus,
    RecommendedAction,
    FindingItem,
    GroqReasoningOutput,
    VerificationAnalysisResult,
)

logger = logging.getLogger(__name__)

GROQ_SYSTEM_PROMPT = """You are the Senior Cross-Document Verification & Analysis Specialist for the LoanLens Indian loan origination system.

Your role:
1. Interpret the deterministic mathematical and cross-document validation checks calculated by Python.
2. Synthesize an objective, professional, concise summary for the loan officer.
3. Highlight each key finding with its severity, clear explanation, and the specific documents involved (e.g. SALARY_SLIP, BANK_STATEMENT, PAN, AADHAAR, FORM_16).
4. Provide a recommended officer action (APPROVE_RECOMMENDED, MANUAL_REVIEW, or REQUEST_ADDITIONAL_DOCS).

Critical Decision Boundaries & Guidelines:
- Do NOT declare documents "fraudulent", "fake", or "forged". Use professional compliance language such as "Discrepancy detected", "Verification required", "Income variance", "Incomplete documentation".
- Do NOT make definitive loan approval/rejection decrees. The final credit decision strictly remains with the human loan officer.
- Do NOT invent information not present in the checks or evidence.
- Reflect the deterministic checks accurately.

Return strict JSON adhering to the required schema:
{
  "verificationStatus": "CONSISTENT" | "REVIEW_REQUIRED" | "INCOMPLETE",
  "summary": "<concise 1-2 sentence officer-facing summary>",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "findings": [
    {
      "title": "<finding title>",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "explanation": "<objective explanation referencing specific numbers/names>",
      "documents": ["<DOC_TYPE_1>", "<DOC_TYPE_2>"]
    }
  ],
  "recommendedAction": "APPROVE_RECOMMENDED" | "MANUAL_REVIEW" | "REQUEST_ADDITIONAL_DOCS"
}
"""


def _generate_fallback_reasoning(
    checks: List[VerificationCheck],
    overall_status: VerificationStatus,
    overall_severity: SeverityLevel,
) -> GroqReasoningOutput:
    """Generate high-quality rule-based reasoning if Groq is unavailable or key not set."""
    findings: List[FindingItem] = []

    doc_type_mapping = {
        "IDENTITY_NAME_MATCH": ["PAN", "AADHAAR", "SALARY_SLIP", "BANK_STATEMENT"],
        "DOB_CONSISTENCY": ["PAN", "AADHAAR"],
        "PAN_CONSISTENCY": ["PAN", "SALARY_SLIP", "FORM_16"],
        "EMPLOYER_CONSISTENCY": ["SALARY_SLIP", "FORM_16"],
        "DECLARED_VS_SLIP_INCOME": ["SALARY_SLIP"],
        "SLIP_VS_BANK_SALARY": ["SALARY_SLIP", "BANK_STATEMENT"],
        "SLIP_VS_FORM16_INCOME": ["SALARY_SLIP", "FORM_16"],
        "EXISTING_EMI_BURDEN": ["BANK_STATEMENT"],
    }

    title_mapping = {
        "IDENTITY_NAME_MATCH": "Name Consistency Across Records",
        "DOB_CONSISTENCY": "Date of Birth Verification",
        "PAN_CONSISTENCY": "PAN Number Cross-Verification",
        "EMPLOYER_CONSISTENCY": "Employer Name Alignment",
        "DECLARED_VS_SLIP_INCOME": "Declared Income vs Salary Slip Variance",
        "SLIP_VS_BANK_SALARY": "Salary Slip vs Bank Credit Alignment",
        "SLIP_VS_FORM16_INCOME": "Annual Salary vs Form 16 Consistency",
        "EXISTING_EMI_BURDEN": "Existing Loan Obligation Review",
    }

    for check in checks:
        if check.status in (CheckStatus.FLAGGED, CheckStatus.WARNING):
            title = title_mapping.get(check.type, check.type.replace("_", " ").title())
            docs = doc_type_mapping.get(check.type, ["DOCUMENTS"])
            findings.append(FindingItem(
                title=title,
                severity=check.severity,
                explanation=check.message,
                documents=docs,
            ))

    if overall_status == VerificationStatus.CONSISTENT:
        summary = "All cross-document identity, employment, and income checks are consistent and verified."
        rec_action = RecommendedAction.APPROVE_RECOMMENDED
        if not findings:
            findings.append(FindingItem(
                title="Cross-Document Consistency Verified",
                severity=SeverityLevel.LOW,
                explanation="Identity, income, and employment records show high correlation across all submitted documents.",
                documents=["PAN", "AADHAAR", "SALARY_SLIP", "BANK_STATEMENT"],
            ))
    elif overall_status == VerificationStatus.REVIEW_REQUIRED:
        flagged_count = sum(1 for c in checks if c.status == CheckStatus.FLAGGED)
        summary = f"Application contains {flagged_count} flagged item(s) requiring manual review by the loan officer."
        rec_action = RecommendedAction.MANUAL_REVIEW
    else:
        summary = "Additional documents are required to complete cross-document verification."
        rec_action = RecommendedAction.REQUEST_ADDITIONAL_DOCS

    return GroqReasoningOutput(
        verificationStatus=overall_status,
        summary=summary,
        riskLevel=overall_severity,
        findings=findings,
        recommendedAction=rec_action,
    )


def run_groq_reasoning(
    applicant_declared: Dict[str, Any],
    checks: List[VerificationCheck],
    overall_status: VerificationStatus,
    overall_severity: SeverityLevel,
) -> GroqReasoningOutput:
    """
    Execute Groq LLM reasoning on deterministic verification results.
    """
    settings = get_settings()
    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY", "")

    if not api_key:
        logger.info("[Groq] GROQ_API_KEY not configured — using deterministic reasoning synthesis.")
        return _generate_fallback_reasoning(checks, overall_status, overall_severity)

    try:
        model_name = settings.groq_model or "llama-3.3-70b-versatile"
        model = ChatGroq(
            model=model_name,
            temperature=0.1,
            groq_api_key=api_key,
        )

        structured_llm = model.with_structured_output(GroqReasoningOutput)

        # Prepare concise structured payload for Groq
        facts_payload = {
            "applicant_declared": applicant_declared,
            "deterministic_status": overall_status.value,
            "deterministic_severity": overall_severity.value,
            "deterministic_checks": [
                {
                    "type": c.type,
                    "status": c.status.value,
                    "severity": c.severity.value,
                    "message": c.message,
                    "evidence": c.evidence,
                }
                for c in checks
            ],
        }

        prompt = ChatPromptTemplate.from_messages([
            ("system", GROQ_SYSTEM_PROMPT),
            (
                "human",
                "Analyze the following deterministic cross-document verification results and generate the structured officer assessment:\n\n{facts}",
            ),
        ])

        messages = prompt.format_messages(facts=json.dumps(facts_payload, indent=2))
        result = structured_llm.invoke(messages)

        if isinstance(result, GroqReasoningOutput):
            return result
        elif isinstance(result, dict):
            return GroqReasoningOutput(**result)
        else:
            return GroqReasoningOutput(**dict(result))

    except Exception as e:
        logger.error(f"[Groq] Reasoning failed: {e}. Falling back to deterministic reasoning synthesis.", exc_info=True)
        return _generate_fallback_reasoning(checks, overall_status, overall_severity)
