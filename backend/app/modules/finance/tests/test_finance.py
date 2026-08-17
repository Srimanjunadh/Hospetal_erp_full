"""
Unit Tests for Finance Module Services
Verifies the correct execution of FinanceService billing logic using mocks.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.modules.finance.services import FinanceService
from app.modules.finance.schemas import InvoiceCreate, PaymentCreate, RefundCreate
from datetime import datetime, date

@pytest.mark.asyncio
async def test_finance_get_total_expenditure():
    """Test retrieving patient expenditure and verifying correct paid sum aggregation."""
    db = AsyncMock()
    
    # Mock bills with all fields needed by BillingItem schema
    mock_bill1 = MagicMock()
    mock_bill1.id = 1
    mock_bill1.patient_id = 101
    mock_bill1.hospital_id = 1
    mock_bill1.amount = 1500.0
    mock_bill1.reason = "Consultation"
    mock_bill1.status = "paid"
    mock_bill1.created_at = datetime(2026, 7, 1, 10, 0)
    
    mock_bill2 = MagicMock()
    mock_bill2.id = 2
    mock_bill2.patient_id = 101
    mock_bill2.hospital_id = 1
    mock_bill2.amount = 3200.0
    mock_bill2.reason = "Lab Scan"
    mock_bill2.status = "paid"
    mock_bill2.created_at = datetime(2026, 7, 5, 11, 0)
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [mock_bill1, mock_bill2]
    db.execute.return_value = mock_res
    
    expenditure = await FinanceService.get_total_expenditure(db, 101)
    assert expenditure.total == 4700.0
    assert len(expenditure.history) == 2
    assert expenditure.history[0].reason == "Consultation"

@pytest.mark.asyncio
async def test_create_invoice_success():
    """Test creating an invoice successfully."""
    db = AsyncMock()
    invoice_data = InvoiceCreate(
        hospital_id=1,
        patient_id=101,
        billing_id=None,
        amount=500.0,
        due_date=date(2026, 8, 1)
    )
    
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    
    invoice = await FinanceService.create_invoice(db, invoice_data)
    assert invoice.amount == 500.0
    assert invoice.status == "DRAFT"
    assert invoice.patient_id == 101

@pytest.mark.asyncio
async def test_receive_payment_success():
    """Test processing payment receipt and ensuring ledger credit creation."""
    db = AsyncMock()
    payment_data = PaymentCreate(
        hospital_id=1,
        billing_id=10,
        invoice_id=20,
        amount=250.0,
        payment_method="UPI",
        transaction_reference="TXN-12345"
    )
    
    # Mock invoice and billing record lookup
    mock_invoice = MagicMock()
    mock_invoice.status = "DRAFT"
    mock_invoice.billing_id = 10
    
    mock_billing = MagicMock()
    mock_billing.status = "unpaid"
    
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    
    async def mock_execute(query, *args, **kwargs):
        res = MagicMock()
        query_str = str(query)
        if "invoice" in query_str:
            res.scalars.return_value.first.return_value = mock_invoice
        else:
            res.scalars.return_value.first.return_value = mock_billing
        return res
        
    db.execute.side_effect = mock_execute
    
    payment = await FinanceService.receive_payment(db, payment_data)
    assert payment.amount == 250.0
    assert payment.payment_method == "UPI"
    assert mock_invoice.status == "PAID"
    assert mock_billing.status == "paid"

@pytest.mark.asyncio
async def test_process_refund_success_and_bounds():
    """Test process_refund validates original payment bounds correctly."""
    db = AsyncMock()
    refund_data = RefundCreate(
        hospital_id=1,
        payment_id=50,
        amount=100.0,
        reason="Overcharged"
    )
    
    # Mock original payment
    mock_payment = MagicMock()
    mock_payment.id = 50
    mock_payment.invoice_id = 20
    mock_payment.amount = 150.0
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = mock_payment
    db.execute.return_value = mock_res
    
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    
    refund = await FinanceService.process_refund(db, refund_data)
    assert refund.amount == 100.0
    assert refund.reason == "Overcharged"

@pytest.mark.asyncio
async def test_process_refund_exceeds_payment():
    """Test process_refund raises HTTPException when refund exceeds payment amount."""
    db = AsyncMock()
    refund_data = RefundCreate(
        hospital_id=1,
        payment_id=50,
        amount=200.0,
        reason="Double refund request"
    )
    
    mock_payment = MagicMock()
    mock_payment.amount = 150.0
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = mock_payment
    db.execute.return_value = mock_res
    
    with pytest.raises(HTTPException) as exc_info:
        await FinanceService.process_refund(db, refund_data)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Refund amount exceeds initial payment amount"
