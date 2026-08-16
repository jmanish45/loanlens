"""Deterministic Cross-Document Validation Engine.

Executes deterministic mathematical and rule-based comparisons across extracted
document fields and applicant-declared information without using LLMs for arithmetic.
"""

import re
from difflib import SequenceMatcher
from typing import Dict, Any, List, Optional, Tuple
from schemas.verification import (
    VerificationCheck,
    CheckStatus,
    SeverityLevel,
    VerificationStatus,
    VerifyApplicationDocument,
)


def normalize_text(text: Optional[str]) -> str:
    """Normalize string for consistent comparison."""
    if not text:
        return ""
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    return " ".join(cleaned.split())


def fuzzy_similarity(str1: Optional[str], str2: Optional[str]) -> float:
    """Calculate string similarity ratio between 0.0 and 1.0."""
    n1 = normalize_text(str1)
    n2 = normalize_text(str2)
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0
    if n1 in n2 or n2 in n1:
        return 0.9
    return SequenceMatcher(None, n1, n2).ratio()


def parse_numeric(val: Any) -> float:
    """Parse monetary or numeric values safely."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        cleaned = re.sub(r"[^\d.-]", "", val.replace(",", ""))
        try:
            return float(cleaned) if cleaned and cleaned not in ("-", ".") else 0.0
        except ValueError:
            return 0.0
    return 0.0


def normalize_pan_str(pan: Optional[str]) -> Optional[str]:
    """Clean PAN string."""
    if not pan:
        return None
    match = re.search(r"[A-Z]{5}[0-9]{4}[A-Z]", pan.upper().replace(" ", ""))
    return match.group(0) if match else None


def normalize_date_str(date_str: Optional[str]) -> Optional[str]:
    """Extract standard date digits."""
    if not date_str:
        return None
    cleaned = re.sub(r"[^\d]", "", date_str.strip())
    return cleaned if len(cleaned) in (4, 8) else date_str.strip()


def run_deterministic_validation(
    applicant_declared: Dict[str, Any],
    documents: List[VerifyApplicationDocument],
) -> Tuple[List[VerificationCheck], VerificationStatus, SeverityLevel]:
    """
    Run deterministic cross-document validation rules.

    Returns:
        Tuple of (checks_list, overall_status, overall_severity)
    """
    checks: List[VerificationCheck] = []

    # Map extracted data by document type
    docs_by_type: Dict[str, List[Dict[str, Any]]] = {}
    for doc in documents:
        dtype = (doc.document_type or "OTHER").upper().replace(" ", "_")
        if dtype not in docs_by_type:
            docs_by_type[dtype] = []
        if doc.extracted_data:
            docs_by_type[dtype].push(doc.extracted_data) if hasattr(docs_by_type[dtype], 'push') else docs_by_type[dtype].append(doc.extracted_data)

    def get_first(dtype: str) -> Optional[Dict[str, Any]]:
        items = docs_by_type.get(dtype, [])
        return items[0] if items else None

    pan_data = get_first("PAN")
    aadhaar_data = get_first("AADHAAR")
    salary_slip = get_first("SALARY_SLIP") or get_first("PAYMENT_SLIP")
    bank_stmt = get_first("BANK_STATEMENT")
    form16 = get_first("FORM_16")

    declared_income = parse_numeric(applicant_declared.get("declaredMonthlyIncome") or applicant_declared.get("declared_monthly_income"))
    declared_name = applicant_declared.get("name") or applicant_declared.get("applicant_name")

    # -------------------------------------------------------------------------
    # 1. Identity Checks: Name Consistency
    # -------------------------------------------------------------------------
    names: List[Tuple[str, str]] = []
    if declared_name:
        names.append(("Declared Name", declared_name))
    if pan_data and pan_data.get("name"):
        names.append(("PAN Card", pan_data["name"]))
    if aadhaar_data and aadhaar_data.get("name"):
        names.append(("Aadhaar Card", aadhaar_data["name"]))
    if salary_slip and salary_slip.get("employee_name"):
        names.append(("Salary Slip", salary_slip["employee_name"]))
    if bank_stmt and bank_stmt.get("account_holder"):
        names.append(("Bank Statement", bank_stmt["account_holder"]))
    if form16 and form16.get("employee_name"):
        names.append(("Form 16", form16["employee_name"]))

    if len(names) >= 2:
        base_src, base_name = names[0]
        mismatches: List[str] = []
        lowest_sim = 1.0

        for src, name in names[1:]:
            sim = fuzzy_similarity(base_name, name)
            if sim < lowest_sim:
                lowest_sim = sim
            if sim < 0.70:
                mismatches.append(f"{src} ('{name}') differs from {base_src} ('{base_name}')")

        name_evidence = {src: name for src, name in names}
        name_evidence["lowest_match_score"] = f"{int(lowest_sim * 100)}%"

        if lowest_sim >= 0.85:
            checks.append(VerificationCheck(
                type="IDENTITY_NAME_MATCH",
                status=CheckStatus.PASSED,
                severity=SeverityLevel.LOW,
                message="Applicant name is consistent across all provided documents.",
                evidence=name_evidence,
            ))
        elif lowest_sim >= 0.70:
            checks.append(VerificationCheck(
                type="IDENTITY_NAME_MATCH",
                status=CheckStatus.WARNING,
                severity=SeverityLevel.MEDIUM,
                message="Minor variations detected in applicant name across documents (e.g. initials or abbreviations).",
                evidence=name_evidence,
            ))
        else:
            checks.append(VerificationCheck(
                type="IDENTITY_NAME_MATCH",
                status=CheckStatus.FLAGGED,
                severity=SeverityLevel.HIGH,
                message=f"Significant name discrepancy detected: {'; '.join(mismatches)}.",
                evidence=name_evidence,
            ))

    # -------------------------------------------------------------------------
    # 2. Identity Checks: Date of Birth & PAN Consistency
    # -------------------------------------------------------------------------
    dobs: List[Tuple[str, str]] = []
    if pan_data and pan_data.get("date_of_birth"):
        dobs.append(("PAN Card", pan_data["date_of_birth"]))
    if aadhaar_data and aadhaar_data.get("date_of_birth"):
        dobs.append(("Aadhaar Card", aadhaar_data["date_of_birth"]))

    if len(dobs) >= 2:
        dob_evidence = {src: val for src, val in dobs}
        n_dob1 = normalize_date_str(dobs[0][1])
        n_dob2 = normalize_date_str(dobs[1][1])
        if n_dob1 == n_dob2 or (n_dob1 and n_dob2 and (n_dob1 in n_dob2 or n_dob2 in n_dob1)):
            checks.append(VerificationCheck(
                type="DOB_CONSISTENCY",
                status=CheckStatus.PASSED,
                severity=SeverityLevel.LOW,
                message="Date of birth matches across identity documents.",
                evidence=dob_evidence,
            ))
        else:
            checks.append(VerificationCheck(
                type="DOB_CONSISTENCY",
                status=CheckStatus.FLAGGED,
                severity=SeverityLevel.HIGH,
                message=f"Date of birth mismatch between {dobs[0][0]} and {dobs[1][0]}.",
                evidence=dob_evidence,
            ))

    # PAN Number Cross-Check
    pan_numbers: List[Tuple[str, str]] = []
    if pan_data and pan_data.get("pan_number"):
        pan_numbers.append(("PAN Card", pan_data["pan_number"]))
    if salary_slip and salary_slip.get("pan_number"):
        pan_numbers.append(("Salary Slip", salary_slip["pan_number"]))
    if form16 and form16.get("pan_employee"):
        pan_numbers.append(("Form 16", form16["pan_employee"]))

    if len(pan_numbers) >= 2:
        pan_evidence = {src: val for src, val in pan_numbers}
        norm_pans = [normalize_pan_str(val) for _, val in pan_numbers if normalize_pan_str(val)]
        if len(set(norm_pans)) == 1:
            checks.append(VerificationCheck(
                type="PAN_CONSISTENCY",
                status=CheckStatus.PASSED,
                severity=SeverityLevel.LOW,
                message="PAN number matches consistently across all records.",
                evidence=pan_evidence,
            ))
        else:
            checks.append(VerificationCheck(
                type="PAN_CONSISTENCY",
                status=CheckStatus.FLAGGED,
                severity=SeverityLevel.HIGH,
                message="PAN number mismatch detected across documents.",
                evidence=pan_evidence,
            ))

    # -------------------------------------------------------------------------
    # 3. Employment Checks: Employer Name Consistency
    # -------------------------------------------------------------------------
    employers: List[Tuple[str, str]] = []
    if salary_slip and salary_slip.get("employer"):
        employers.append(("Salary Slip", salary_slip["employer"]))
    if form16 and form16.get("employer_name"):
        employers.append(("Form 16", form16["employer_name"]))

    if len(employers) >= 2:
        emp_evidence = {src: val for src, val in employers}
        emp_sim = fuzzy_similarity(employers[0][1], employers[1][1])
        emp_evidence["match_score"] = f"{int(emp_sim * 100)}%"

        if emp_sim >= 0.75:
            checks.append(VerificationCheck(
                type="EMPLOYER_CONSISTENCY",
                status=CheckStatus.PASSED,
                severity=SeverityLevel.LOW,
                message="Employer name is consistent across employment records.",
                evidence=emp_evidence,
            ))
        elif emp_sim >= 0.50:
            checks.append(VerificationCheck(
                type="EMPLOYER_CONSISTENCY",
                status=CheckStatus.WARNING,
                severity=SeverityLevel.MEDIUM,
                message="Minor variation in employer legal naming between documents.",
                evidence=emp_evidence,
            ))
        else:
            checks.append(VerificationCheck(
                type="EMPLOYER_CONSISTENCY",
                status=CheckStatus.FLAGGED,
                severity=SeverityLevel.HIGH,
                message=f"Employer mismatch detected: '{employers[0][1]}' vs '{employers[1][1]}'.",
                evidence=emp_evidence,
            ))

    # -------------------------------------------------------------------------
    # 4. Income Checks: Declared vs Salary Slip
    # -------------------------------------------------------------------------
    slip_net = parse_numeric(salary_slip.get("net_salary") or salary_slip.get("net_payment") or salary_slip.get("payment_amount")) if salary_slip else 0.0
    slip_gross = parse_numeric(salary_slip.get("gross_salary")) if salary_slip else 0.0

    if declared_income > 0 and (slip_net > 0 or slip_gross > 0):
        ref_salary = slip_net if slip_net > 0 else slip_gross
        diff_pct = abs(declared_income - ref_salary) / declared_income * 100.0

        inc_evidence = {
            "declared_monthly_income": f"₹{declared_income:,.0f}",
            "salary_slip_net": f"₹{slip_net:,.0f}" if slip_net > 0 else "N/A",
            "salary_slip_gross": f"₹{slip_gross:,.0f}" if slip_gross > 0 else "N/A",
            "variance": f"{diff_pct:.1f}%",
        }

        if diff_pct <= 20.0:
            checks.append(VerificationCheck(
                type="DECLARED_VS_SLIP_INCOME",
                status=CheckStatus.PASSED,
                severity=SeverityLevel.LOW,
                message="Declared monthly income aligns with salary slip compensation.",
                evidence=inc_evidence,
            ))
        elif diff_pct <= 35.0:
            checks.append(VerificationCheck(
                type="DECLARED_VS_SLIP_INCOME",
                status=CheckStatus.WARNING,
                severity=SeverityLevel.MEDIUM,
                message=f"Declared income differs by {diff_pct:.1f}% from salary slip take-home pay.",
                evidence=inc_evidence,
            ))
        else:
            checks.append(VerificationCheck(
                type="DECLARED_VS_SLIP_INCOME",
                status=CheckStatus.FLAGGED,
                severity=SeverityLevel.HIGH,
                message=f"Material difference ({diff_pct:.1f}%) between declared income and salary slip.",
                evidence=inc_evidence,
            ))

    # -------------------------------------------------------------------------
    # 5. Income Checks: Salary Slip vs Bank Statement Salary Credits
    # -------------------------------------------------------------------------
    if bank_stmt and (slip_net > 0 or declared_income > 0):
        salary_credits = bank_stmt.get("salary_credits") or []
        credits_amounts = [parse_numeric(c.get("amount")) for c in salary_credits if parse_numeric(c.get("amount")) > 0]

        if credits_amounts:
            avg_bank_salary = sum(credits_amounts) / len(credits_amounts)
            baseline = slip_net if slip_net > 0 else declared_income
            bank_diff_pct = abs(baseline - avg_bank_salary) / baseline * 100.0

            bank_sal_evidence = {
                "salary_slip_net": f"₹{slip_net:,.0f}" if slip_net > 0 else "N/A",
                "bank_average_salary_credit": f"₹{avg_bank_salary:,.0f}",
                "credits_found": len(credits_amounts),
                "variance": f"{bank_diff_pct:.1f}%",
            }

            if bank_diff_pct <= 20.0:
                checks.append(VerificationCheck(
                    type="SLIP_VS_BANK_SALARY",
                    status=CheckStatus.PASSED,
                    severity=SeverityLevel.LOW,
                    message="Bank statement recurring salary credits match salary slip amount.",
                    evidence=bank_sal_evidence,
                ))
            elif bank_diff_pct <= 35.0:
                checks.append(VerificationCheck(
                    type="SLIP_VS_BANK_SALARY",
                    status=CheckStatus.WARNING,
                    severity=SeverityLevel.MEDIUM,
                    message=f"Bank recurring salary credits differ by {bank_diff_pct:.1f}% from salary slip.",
                    evidence=bank_sal_evidence,
                ))
            else:
                checks.append(VerificationCheck(
                    type="SLIP_VS_BANK_SALARY",
                    status=CheckStatus.FLAGGED,
                    severity=SeverityLevel.HIGH,
                    message=f"Bank statement recurring salary credits (₹{avg_bank_salary:,.0f}) differ significantly ({bank_diff_pct:.1f}%) from salary slip.",
                    evidence=bank_sal_evidence,
                ))
        else:
            checks.append(VerificationCheck(
                type="SLIP_VS_BANK_SALARY",
                status=CheckStatus.WARNING,
                severity=SeverityLevel.MEDIUM,
                message="No recurring salary credit entries explicitly identified in bank statement transactions.",
                evidence={"salary_credits_detected": 0},
            ))

    # -------------------------------------------------------------------------
    # 6. Income Checks: Salary Slip vs Form 16
    # -------------------------------------------------------------------------
    if form16 and (slip_gross > 0 or slip_net > 0):
        f16_gross = parse_numeric(form16.get("gross_salary") or form16.get("total_income"))
        if f16_gross > 0:
            annualized_slip = (slip_gross if slip_gross > 0 else slip_net) * 12.0
            f16_diff_pct = abs(annualized_slip - f16_gross) / f16_gross * 100.0

            f16_evidence = {
                "salary_slip_annualized": f"₹{annualized_slip:,.0f}",
                "form16_gross_salary": f"₹{f16_gross:,.0f}",
                "variance": f"{f16_diff_pct:.1f}%",
            }

            if f16_diff_pct <= 25.0:
                checks.append(VerificationCheck(
                    type="SLIP_VS_FORM16_INCOME",
                    status=CheckStatus.PASSED,
                    severity=SeverityLevel.LOW,
                    message="Annualized salary aligns with Form 16 reported gross salary.",
                    evidence=f16_evidence,
                ))
            elif f16_diff_pct <= 40.0:
                checks.append(VerificationCheck(
                    type="SLIP_VS_FORM16_INCOME",
                    status=CheckStatus.WARNING,
                    severity=SeverityLevel.MEDIUM,
                    message=f"Variance of {f16_diff_pct:.1f}% between Form 16 annual income and salary slip.",
                    evidence=f16_evidence,
                ))
            else:
                checks.append(VerificationCheck(
                    type="SLIP_VS_FORM16_INCOME",
                    status=CheckStatus.FLAGGED,
                    severity=SeverityLevel.HIGH,
                    message=f"Substantial variance ({f16_diff_pct:.1f}%) between Form 16 gross salary and annualized salary slip.",
                    evidence=f16_evidence,
                ))

    # -------------------------------------------------------------------------
    # 7. Financial Checks: Existing EMI Debits
    # -------------------------------------------------------------------------
    if bank_stmt:
        emi_debits = bank_stmt.get("emi_debits") or []
        emi_amounts = [parse_numeric(e.get("amount")) for e in emi_debits if parse_numeric(e.get("amount")) > 0]
        total_emi = sum(emi_amounts)

        if total_emi > 0:
            income_ref = slip_net if slip_net > 0 else declared_income
            dti = (total_emi / income_ref * 100.0) if income_ref > 0 else 0.0

            emi_evidence = {
                "detected_monthly_emi_total": f"₹{total_emi:,.0f}",
                "emi_count": len(emi_amounts),
                "estimated_monthly_income": f"₹{income_ref:,.0f}" if income_ref > 0 else "N/A",
                "existing_obligation_ratio": f"{dti:.1f}%" if income_ref > 0 else "N/A",
            }

            if dti > 50.0:
                checks.append(VerificationCheck(
                    type="EXISTING_EMI_BURDEN",
                    status=CheckStatus.WARNING,
                    severity=SeverityLevel.HIGH,
                    message=f"High existing loan EMI obligations detected ({dti:.1f}% of income).",
                    evidence=emi_evidence,
                ))
            else:
                checks.append(VerificationCheck(
                    type="EXISTING_EMI_BURDEN",
                    status=CheckStatus.PASSED,
                    severity=SeverityLevel.LOW,
                    message=f"Existing EMI obligations detected (approx. ₹{total_emi:,.0f}/month) within manageable limits.",
                    evidence=emi_evidence,
                ))

    # -------------------------------------------------------------------------
    # Overall Status Calculation
    # -------------------------------------------------------------------------
    has_flagged = any(c.status == CheckStatus.FLAGGED for c in checks)
    has_high_warning = any(c.status == CheckStatus.WARNING and c.severity == SeverityLevel.HIGH for c in checks)
    has_med_warning = any(c.status == CheckStatus.WARNING and c.severity == SeverityLevel.MEDIUM for c in checks)

    if has_flagged or has_high_warning:
        overall_status = VerificationStatus.REVIEW_REQUIRED
        overall_severity = SeverityLevel.HIGH
    elif has_med_warning:
        overall_status = VerificationStatus.REVIEW_REQUIRED
        overall_severity = SeverityLevel.MEDIUM
    elif len(checks) < 2:
        overall_status = VerificationStatus.INCOMPLETE
        overall_severity = SeverityLevel.MEDIUM
    else:
        overall_status = VerificationStatus.CONSISTENT
        overall_severity = SeverityLevel.LOW

    return checks, overall_status, overall_severity
