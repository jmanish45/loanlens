"""LLM prompt templates for document classification and extraction."""

CLASSIFICATION_PROMPT = """You are a document classification expert for an Indian loan processing system.

Analyze the following document text and classify it into EXACTLY ONE of these categories:
- PAN: PAN card (Permanent Account Number)
- AADHAAR: Aadhaar card (UID)
- SALARY_SLIP: Monthly salary slip / payslip
- BANK_STATEMENT: Bank account statement
- FORM_16: Form 16 (TDS certificate from employer)
- ITR: Income Tax Return filing
- OTHER: A recognizable document that doesn't fit the above categories
- UNKNOWN: Cannot determine the document type

Respond ONLY with valid JSON in this exact format:
{{
  "document_type": "<one of the types above>",
  "confidence": <float between 0.0 and 1.0>,
  "reasoning": "<brief one-line explanation>"
}}

Document text:
---
{document_text}
---"""

CLASSIFICATION_VISION_PROMPT = """You are a document classification expert for an Indian loan processing system.

Look at this document image and classify it into EXACTLY ONE of these categories:
- PAN: PAN card (Permanent Account Number)
- AADHAAR: Aadhaar card (UID)
- SALARY_SLIP: Monthly salary slip / payslip
- BANK_STATEMENT: Bank account statement
- FORM_16: Form 16 (TDS certificate from employer)
- ITR: Income Tax Return filing
- OTHER: A recognizable document that doesn't fit the above categories
- UNKNOWN: Cannot determine the document type

Respond ONLY with valid JSON in this exact format:
{{
  "document_type": "<one of the types above>",
  "confidence": <float between 0.0 and 1.0>,
  "reasoning": "<brief one-line explanation>"
}}"""

SALARY_SLIP_EXTRACTION_PROMPT = """You are a precise data extraction expert. Extract structured information from this salary slip document.

Extract ALL available fields. If a field is not present in the document, set it to null.
For monetary amounts, use plain numbers without currency symbols or commas.

Respond ONLY with valid JSON matching this schema:
{{
  "employee_name": "string or null",
  "employee_id": "string or null",
  "employer": "string or null",
  "designation": "string or null",
  "salary_month": "string or null (e.g., 'July 2026')",
  "pay_date": "string or null",
  "basic_salary": "number or null",
  "hra": "number or null",
  "other_earnings": [{{"name": "string", "amount": "number"}}] or null,
  "gross_salary": "number or null",
  "pf": "number or null",
  "tax_deducted": "number or null",
  "other_deductions": [{{"name": "string", "amount": "number"}}] or null,
  "total_deductions": "number or null",
  "net_salary": "number or null",
  "bank_account": "string or null (partial is fine)",
  "pan_number": "string or null"
}}

Document text:
---
{document_text}
---"""

BANK_STATEMENT_EXTRACTION_PROMPT = """You are a precise data extraction expert. Extract structured information from this bank statement document.

Extract ALL available fields. If a field is not present, set it to null.
For monetary amounts, use plain numbers without currency symbols or commas.
For transactions, extract up to 10 sample transactions.
Identify salary/income credits (regular monthly credits from employers) and EMI debits (recurring loan payments).

Respond ONLY with valid JSON matching this schema:
{{
  "account_holder": "string or null",
  "bank_name": "string or null",
  "branch": "string or null",
  "account_number": "string or null",
  "ifsc_code": "string or null",
  "account_type": "string or null (Savings/Current)",
  "statement_period_from": "string or null",
  "statement_period_to": "string or null",
  "opening_balance": "number or null",
  "closing_balance": "number or null",
  "total_credits": "number or null",
  "total_debits": "number or null",
  "average_balance": "number or null",
  "salary_credits": [{{"date": "string", "description": "string", "amount": "number", "transaction_type": "CREDIT", "balance": "number or null"}}] or null,
  "emi_debits": [{{"date": "string", "description": "string", "amount": "number", "transaction_type": "DEBIT", "balance": "number or null"}}] or null,
  "transaction_count": "number or null",
  "sample_transactions": [{{"date": "string", "description": "string", "amount": "number", "transaction_type": "CREDIT or DEBIT", "balance": "number or null"}}] or null
}}

Document text:
---
{document_text}
---"""

FORM16_EXTRACTION_PROMPT = """You are a precise data extraction expert. Extract structured information from this Form 16 (TDS Certificate) document.

Extract ALL available fields. If a field is not present, set it to null.
For monetary amounts, use plain numbers without currency symbols or commas.

Respond ONLY with valid JSON matching this schema:
{{
  "employee_name": "string or null",
  "pan_employee": "string or null",
  "employer_name": "string or null",
  "tan_employer": "string or null",
  "assessment_year": "string or null",
  "financial_year": "string or null",
  "gross_salary": "number or null",
  "total_exemptions": "number or null",
  "net_taxable_salary": "number or null",
  "total_income": "number or null",
  "section_80c": "number or null",
  "section_80d": "number or null",
  "total_deductions": "number or null",
  "total_taxable_income": "number or null",
  "tax_payable": "number or null",
  "tds_deducted": "number or null"
}}

Document text:
---
{document_text}
---"""

ITR_EXTRACTION_PROMPT = """You are a precise data extraction expert. Extract structured information from this Income Tax Return (ITR) document.

Extract ALL available fields. If a field is not present, set it to null.
For monetary amounts, use plain numbers without currency symbols or commas.

Respond ONLY with valid JSON matching this schema:
{{
  "assessee_name": "string or null",
  "pan": "string or null",
  "assessment_year": "string or null",
  "filing_date": "string or null",
  "itr_form": "string or null",
  "acknowledgement_number": "string or null",
  "income_from_salary": "number or null",
  "income_from_house_property": "number or null",
  "income_from_business": "number or null",
  "income_from_capital_gains": "number or null",
  "income_from_other_sources": "number or null",
  "gross_total_income": "number or null",
  "total_deductions": "number or null",
  "total_taxable_income": "number or null",
  "total_tax_paid": "number or null",
  "refund_due": "number or null"
}}

Document text:
---
{document_text}
---"""

OCR_VISION_PROMPT = """Extract ALL text content from this document image. 
Preserve the layout structure as much as possible.
Include all text, numbers, tables, headers, and footers.
If there are tables, format them with clear column separation.
Return only the extracted text, no commentary."""

# Map document types to their extraction prompts
EXTRACTION_PROMPTS = {
    "SALARY_SLIP": SALARY_SLIP_EXTRACTION_PROMPT,
    "BANK_STATEMENT": BANK_STATEMENT_EXTRACTION_PROMPT,
    "FORM_16": FORM16_EXTRACTION_PROMPT,
    "ITR": ITR_EXTRACTION_PROMPT,
}
