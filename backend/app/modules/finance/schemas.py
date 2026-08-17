"""
Finance Module Validation Schemas
Defines request and response models for Invoices, Payments, Refunds, Ledger entries, and reports.
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from typing import Optional, List, Dict, Any

class BillingItem(BaseModel):
    """Represents a billing record entry."""
    id: int = Field(..., description="Unique billing database ID")
    patient_id: int = Field(..., description="Patient database ID")
    hospital_id: int = Field(..., description="Hospital database ID")
    amount: float = Field(..., description="Total billing amount")
    reason: str = Field(..., description="Details/reason for billing")
    status: str = Field(..., description="Current payment/billing status")
    created_at: datetime = Field(..., description="Timestamp when billing record was created")

    class Config:
        from_attributes = True

class ExpenditureResponse(BaseModel):
    """Response schema summarizing a patient's historical expenditure."""
    total: float = Field(..., description="Sum of all patient billing charges")
    history: List[BillingItem] = Field(..., description="Historical list of all patient charges")

# Invoices
class InvoiceCreate(BaseModel):
    """Payload to generate a new hospital invoice."""
    hospital_id: int = Field(..., description="Hospital database ID")
    patient_id: int = Field(..., description="Patient database ID")
    billing_id: Optional[int] = Field(None, description="Optional link to a billing request item")
    amount: float = Field(..., ge=0.01, description="Invoice amount, must be greater than zero")
    due_date: date = Field(..., description="Invoice payment due date")

    @field_validator("amount")
    @classmethod
    def validate_positive_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be strictly positive")
        return v

class InvoiceResponse(BaseModel):
    """Invoice model representation response details."""
    id: int = Field(..., description="Invoice database ID")
    hospital_id: int = Field(..., description="Hospital database ID")
    patient_id: int = Field(..., description="Patient database ID")
    billing_id: Optional[int] = Field(None, description="Linked billing request ID")
    invoice_number: str = Field(..., description="Unique code identifier of the invoice")
    amount: float = Field(..., description="Invoice amount")
    status: str = Field(..., description="Status (e.g. UNPAID, PAID, OVERDUE)")
    due_date: date = Field(..., description="Invoice due date")
    created_at: datetime = Field(..., description="Creation date timestamp")

    class Config:
        from_attributes = True

# General Ledger Transaction
class LedgerCreate(BaseModel):
    """Payload to record general ledger book transactions."""
    hospital_id: int = Field(..., description="Hospital database ID")
    invoice_id: Optional[int] = Field(None, description="Linked invoice ID")
    type: str = Field(..., description="Transaction type, either DEBIT or CREDIT")
    amount: float = Field(..., ge=0.01, description="Ledger record amount, must be greater than zero")
    account_code: str = Field(..., description="Accounts ledger category code")
    description: str = Field(..., description="Custom ledger notes/details")

    @field_validator("amount")
    @classmethod
    def validate_positive_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be strictly positive")
        return v

    @field_validator("type")
    @classmethod
    def validate_ledger_type(cls, v: str) -> str:
        valid_types = {"DEBIT", "CREDIT"}
        if v.upper() not in valid_types:
            raise ValueError("Type must be either DEBIT or CREDIT")
        return v.upper()

class LedgerResponse(BaseModel):
    """Response representation of a ledger entry."""
    id: int = Field(..., description="Ledger item database ID")
    hospital_id: int = Field(..., description="Hospital database ID")
    invoice_id: Optional[int] = Field(None, description="Associated invoice ID")
    type: str = Field(..., description="Ledger transaction type")
    amount: float = Field(..., description="Transaction amount")
    account_code: str = Field(..., description="Account category code")
    description: str = Field(..., description="Notes description")
    created_at: datetime = Field(..., description="Timestamp of transaction entry")

    class Config:
        from_attributes = True

# Payments
class PaymentCreate(BaseModel):
    """Payload to register a payment receipt."""
    hospital_id: int = Field(..., description="Hospital database ID")
    billing_id: Optional[int] = Field(None, description="Associated billing item ID")
    invoice_id: Optional[int] = Field(None, description="Associated invoice ID")
    amount: float = Field(..., ge=0.01, description="Paid amount, must be greater than zero")
    payment_method: str = Field(..., description="Mode of payment (e.g. CASH, CARD, UPI, INSURANCE)")
    transaction_reference: Optional[str] = Field(None, description="External transaction reference ID (optional)")

    @field_validator("amount")
    @classmethod
    def validate_positive_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be strictly positive")
        return v

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, v: str) -> str:
        valid_methods = {"CASH", "CARD", "UPI", "INSURANCE"}
        if v.upper() not in valid_methods:
            raise ValueError(f"Invalid payment method. Must be one of: {', '.join(valid_methods)}")
        return v.upper()

class PaymentResponse(BaseModel):
    """Response representing recorded payment details."""
    id: int = Field(..., description="Payment record database ID")
    hospital_id: int = Field(..., description="Hospital database ID")
    billing_id: Optional[int] = Field(None, description="Associated billing ID")
    invoice_id: Optional[int] = Field(None, description="Associated invoice ID")
    amount: float = Field(..., description="Payment amount received")
    payment_method: str = Field(..., description="Payment mode")
    transaction_reference: Optional[str] = Field(None, description="External transaction reference details")
    created_at: datetime = Field(..., description="Received timestamp")

    class Config:
        from_attributes = True

# Refunds
class RefundCreate(BaseModel):
    """Payload to authorize a customer refund transaction."""
    hospital_id: int = Field(..., description="Hospital database ID")
    payment_id: int = Field(..., description="Original payment database ID")
    amount: float = Field(..., ge=0.01, description="Refund amount, must be greater than zero")
    reason: str = Field(..., description="Reason detail for authorizing the refund")

    @field_validator("amount")
    @classmethod
    def validate_positive_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be strictly positive")
        return v

class RefundResponse(BaseModel):
    """Response representing details of a processed refund."""
    id: int = Field(..., description="Refund record database ID")
    hospital_id: int = Field(..., description="Hospital database ID")
    payment_id: int = Field(..., description="Payment database ID link")
    amount: float = Field(..., description="Refund amount processed")
    reason: str = Field(..., description="Refund reason")
    created_at: datetime = Field(..., description="Processed timestamp")

    class Config:
        from_attributes = True

# Financial Reports
class ProfitLossReport(BaseModel):
    """Report detailing aggregate revenues, expenses, and net profit margins."""
    total_income: float = Field(..., description="Sum of credit transactions and payments")
    total_expense: float = Field(..., description="Sum of debit transactions and refunds")
    net_profit: float = Field(..., description="Net margin (Total Income - Total Expense)")
    breakdown: Dict[str, float] = Field(..., description="Accounts categorization breakdown summary")
