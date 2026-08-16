"""Salary slip extraction schema."""

from pydantic import BaseModel, Field
from typing import Optional


class DeductionItem(BaseModel):
    """A single deduction line item."""

    name: str = Field(description="Name of the deduction (e.g., PF, TDS, ESI)")
    amount: Optional[float] = Field(default=None, description="Deduction amount")


class EarningItem(BaseModel):
    """A single earning line item."""

    name: str = Field(description="Name of the earning (e.g., Basic, HRA, DA)")
    amount: Optional[float] = Field(default=None, description="Earning amount")


class SalarySlipData(BaseModel):
    """Structured data extracted from a salary slip."""

    employee_name: Optional[str] = Field(default=None, description="Employee full name")
    employee_id: Optional[str] = Field(default=None, description="Employee ID / code")
    employer: Optional[str] = Field(default=None, description="Company / employer name")
    designation: Optional[str] = Field(default=None, description="Job title / designation")
    salary_month: Optional[str] = Field(default=None, description="Month and year of the salary (e.g., July 2026)")
    pay_date: Optional[str] = Field(default=None, description="Date of payment")

    # Earnings
    basic_salary: Optional[float] = Field(default=None, description="Basic salary amount")
    hra: Optional[float] = Field(default=None, description="House Rent Allowance")
    other_earnings: Optional[list[EarningItem]] = Field(default=None, description="Other earning components")
    gross_salary: Optional[float] = Field(default=None, description="Total gross salary")

    # Deductions
    pf: Optional[float] = Field(default=None, description="Provident Fund deduction")
    tax_deducted: Optional[float] = Field(default=None, description="TDS / income tax deducted")
    other_deductions: Optional[list[DeductionItem]] = Field(default=None, description="Other deduction items")
    total_deductions: Optional[float] = Field(default=None, description="Total deductions")

    # Net
    net_salary: Optional[float] = Field(default=None, description="Net salary (take-home pay)")

    # Bank details (if present)
    bank_account: Optional[str] = Field(default=None, description="Bank account number (partial)")
    pan_number: Optional[str] = Field(default=None, description="PAN number on the slip")
