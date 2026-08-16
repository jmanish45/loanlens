"""Bank statement extraction schema."""

from pydantic import BaseModel, Field
from typing import Optional


class TransactionItem(BaseModel):
    """A single bank transaction."""

    date: Optional[str] = Field(default=None, description="Transaction date")
    description: str = Field(description="Transaction narration / description")
    amount: float = Field(description="Transaction amount")
    transaction_type: Optional[str] = Field(default=None, description="CREDIT or DEBIT")
    balance: Optional[float] = Field(default=None, description="Running balance after transaction")


class BankStatementData(BaseModel):
    """Structured data extracted from a bank statement."""

    account_holder: Optional[str] = Field(default=None, description="Account holder name")
    bank_name: Optional[str] = Field(default=None, description="Bank name")
    branch: Optional[str] = Field(default=None, description="Branch name or code")
    account_number: Optional[str] = Field(default=None, description="Account number (may be partial)")
    ifsc_code: Optional[str] = Field(default=None, description="IFSC code")
    account_type: Optional[str] = Field(default=None, description="Savings / Current")

    statement_period_from: Optional[str] = Field(default=None, description="Statement start date")
    statement_period_to: Optional[str] = Field(default=None, description="Statement end date")

    # Summary
    opening_balance: Optional[float] = Field(default=None, description="Opening balance")
    closing_balance: Optional[float] = Field(default=None, description="Closing balance")
    total_credits: Optional[float] = Field(default=None, description="Total credit amount")
    total_debits: Optional[float] = Field(default=None, description="Total debit amount")
    average_balance: Optional[float] = Field(default=None, description="Average monthly balance")

    # Key transactions (salary credits, EMI debits)
    salary_credits: Optional[list[TransactionItem]] = Field(
        default=None, description="Identified salary/income credit transactions"
    )
    emi_debits: Optional[list[TransactionItem]] = Field(
        default=None, description="Identified EMI/loan debit transactions"
    )

    # Sample transactions
    transaction_count: Optional[int] = Field(default=None, description="Total number of transactions")
    sample_transactions: Optional[list[TransactionItem]] = Field(
        default=None, description="First few transactions as a sample (max 10)"
    )
