"""Form 16 and ITR extraction schemas."""

from pydantic import BaseModel, Field
from typing import Optional


class Form16Data(BaseModel):
    """Structured data extracted from Form 16."""

    employee_name: Optional[str] = Field(default=None, description="Employee name")
    pan_employee: Optional[str] = Field(default=None, description="Employee PAN number")
    employer_name: Optional[str] = Field(default=None, description="Employer / deductor name")
    tan_employer: Optional[str] = Field(default=None, description="Employer TAN number")
    assessment_year: Optional[str] = Field(default=None, description="Assessment year (e.g., 2026-27)")
    financial_year: Optional[str] = Field(default=None, description="Financial year (e.g., 2025-26)")

    # Income details
    gross_salary: Optional[float] = Field(default=None, description="Gross total salary")
    total_exemptions: Optional[float] = Field(default=None, description="Total exemptions under Section 10")
    net_taxable_salary: Optional[float] = Field(default=None, description="Net taxable salary")
    total_income: Optional[float] = Field(default=None, description="Gross total income")

    # Deductions
    section_80c: Optional[float] = Field(default=None, description="Deductions under Section 80C")
    section_80d: Optional[float] = Field(default=None, description="Deductions under Section 80D (health insurance)")
    total_deductions: Optional[float] = Field(default=None, description="Total deductions under Chapter VI-A")

    # Tax
    total_taxable_income: Optional[float] = Field(default=None, description="Total taxable income after deductions")
    tax_payable: Optional[float] = Field(default=None, description="Tax payable on total income")
    tds_deducted: Optional[float] = Field(default=None, description="Total TDS deducted")


class ITRData(BaseModel):
    """Structured data extracted from Income Tax Return."""

    assessee_name: Optional[str] = Field(default=None, description="Taxpayer name")
    pan: Optional[str] = Field(default=None, description="PAN number")
    assessment_year: Optional[str] = Field(default=None, description="Assessment year")
    filing_date: Optional[str] = Field(default=None, description="Date of filing")
    itr_form: Optional[str] = Field(default=None, description="ITR form number (e.g., ITR-1, ITR-2)")
    acknowledgement_number: Optional[str] = Field(default=None, description="ITR acknowledgement number")

    # Income
    income_from_salary: Optional[float] = Field(default=None, description="Income from salary/pension")
    income_from_house_property: Optional[float] = Field(default=None, description="Income from house property")
    income_from_business: Optional[float] = Field(default=None, description="Income from business/profession")
    income_from_capital_gains: Optional[float] = Field(default=None, description="Income from capital gains")
    income_from_other_sources: Optional[float] = Field(default=None, description="Income from other sources")
    gross_total_income: Optional[float] = Field(default=None, description="Gross total income")

    # Deductions & Tax
    total_deductions: Optional[float] = Field(default=None, description="Total deductions claimed")
    total_taxable_income: Optional[float] = Field(default=None, description="Total taxable income")
    total_tax_paid: Optional[float] = Field(default=None, description="Total tax paid")
    refund_due: Optional[float] = Field(default=None, description="Refund amount (if any)")
