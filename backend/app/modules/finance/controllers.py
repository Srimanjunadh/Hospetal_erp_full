"""
Finance & Billing Controllers
Exposes REST endpoints for tracking patient expenditure, generating invoices, receiving payments, processing refunds, and financial reporting.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.finance.schemas import (
    ExpenditureResponse, InvoiceCreate, InvoiceResponse, PaymentCreate, PaymentResponse,
    RefundCreate, RefundResponse, LedgerResponse, ProfitLossReport
)
from app.modules.finance.services import FinanceService
from typing import Optional, List

router = APIRouter()

@router.get("/patient/{patient_id}/billing", response_model=ExpenditureResponse, summary="Get total patient expenditure", description="Calculates the sum of all billing items recorded for a specific patient ID.")
async def get_total_expenditure(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get aggregated charges and history for a patient.
    
    :param patient_id: Patient ID
    :param db: Database session
    :return: Aggregate details and transaction list
    """
    return await FinanceService.get_total_expenditure(db, patient_id)

@router.post("/invoice", response_model=InvoiceResponse, summary="Generate patient invoice", description="Generates a new hospital invoice request tied to a billing record.")
async def create_invoice(data: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new invoice request.
    
    :param data: Invoice details
    :param db: Database session
    :return: Invoice details confirmation
    """
    return await FinanceService.create_invoice(db, data)

@router.get("/invoice/{invoice_id}", response_model=InvoiceResponse, summary="Get invoice details", description="Retrieves detailed properties of a registered invoice.")
async def get_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieve invoice details by ID.
    
    :param invoice_id: Invoice ID
    :param db: Database session
    :return: Invoice details
    """
    return await FinanceService.get_invoice(db, invoice_id)

@router.post("/payment", response_model=PaymentResponse, summary="Receive invoice payment", description="Records payment receipt for a patient invoice, updates status, and logs to ledger books.")
async def receive_payment(data: PaymentCreate, db: AsyncSession = Depends(get_db)):
    """
    Record payment transaction.
    
    :param data: Payment transaction details
    :param db: Database session
    :return: Payment response receipt
    """
    return await FinanceService.receive_payment(db, data)

@router.post("/refund", response_model=RefundResponse, summary="Process refund request", description="Validates and authorizes refund requests against an original payment receipt ID.")
async def process_refund(data: RefundCreate, db: AsyncSession = Depends(get_db)):
    """
    Record refund transaction.
    
    :param data: Refund request details
    :param db: Database session
    :return: Refund processed response details
    """
    return await FinanceService.process_refund(db, data)

@router.get("/ledger", response_model=List[LedgerResponse], summary="List general ledger entries", description="Retrieves double-entry bookkeeping transactions recorded for hospital accounts.")
async def list_ledger(
    hospital_id: Optional[int] = Query(None, description="Optional hospital ID to filter ledger list"), 
    db: AsyncSession = Depends(get_db)
):
    """
    List general ledger transactions.
    
    :param hospital_id: Optional hospital ID filter
    :param db: Database session
    :return: List of ledger items
    """
    return await FinanceService.list_ledger(db, hospital_id)

@router.get("/reports/profit-loss", response_model=ProfitLossReport, summary="Get profit and loss statements", description="Compiles aggregate revenues and expenses to generate a profit & loss statement.")
async def get_profit_loss(
    hospital_id: Optional[int] = Query(None, description="Optional hospital ID to filter report details"), 
    db: AsyncSession = Depends(get_db)
):
    """
    Generate hospital profit and loss reports.
    
    :param hospital_id: Optional hospital ID filter
    :param db: Database session
    :return: Profit and Loss analysis report
    """
    return await FinanceService.get_profit_loss(db, hospital_id)
