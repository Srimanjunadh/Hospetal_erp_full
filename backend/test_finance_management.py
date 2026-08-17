import asyncio
import os
import sys
from datetime import date
sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.finance.services import FinanceService
from app.modules.finance.schemas import (
    InvoiceCreate, PaymentCreate, RefundCreate
)

async def verify_finance_management():
    print("Verifying Finance & Accounting module...")
    db = AsyncSessionLocal()
    
    try:
        # 1. Create Invoice for patient ID 1, Hospital ID 1
        invoice_data = InvoiceCreate(
            hospital_id=1,
            patient_id=1,
            amount=250.0,
            due_date=date.today()
        )
        invoice = await FinanceService.create_invoice(db, invoice_data)
        assert invoice.id is not None, "Invoice ID not generated"
        assert invoice.amount == 250.0, "Invoice amount mismatch"
        assert invoice.status == "DRAFT", "Invoice status mismatch"
        print("Invoice Generation: SUCCESS, ID:", invoice.id)

        # 2. Process Payment against that invoice
        payment_data = PaymentCreate(
            hospital_id=1,
            invoice_id=invoice.id,
            amount=250.0,
            payment_method="CARD",
            transaction_reference="TXN-998811"
        )
        payment = await FinanceService.receive_payment(db, payment_data)
        assert payment.id is not None, "Payment ID not generated"
        
        # Verify invoice status is updated to PAID
        updated_invoice = await FinanceService.get_invoice(db, invoice.id)
        assert updated_invoice.status == "PAID", "Invoice status not updated to PAID"
        print("Payment Receipt: SUCCESS, ID:", payment.id, "Invoice marked PAID")

        # 3. Check General Ledger
        ledger_entries = await FinanceService.list_ledger(db, hospital_id=1)
        assert len(ledger_entries) > 0, "No ledger entries created"
        revenue_entry = [entry for entry in ledger_entries if entry.account_code == "REVENUE" and entry.invoice_id == invoice.id]
        assert len(revenue_entry) == 1, "Expected exactly 1 revenue ledger credit entry"
        assert revenue_entry[0].type == "CREDIT", "Ledger entry type is not CREDIT"
        print("General Ledger Double-Entry Booking: SUCCESS, Account Code:", revenue_entry[0].account_code)

        # 4. Process Refund against payment
        refund_data = RefundCreate(
            hospital_id=1,
            payment_id=payment.id,
            amount=50.0,
            reason="Overcharged consult fee"
        )
        refund = await FinanceService.process_refund(db, refund_data)
        assert refund.id is not None, "Refund ID not generated"
        assert refund.amount == 50.0, "Refund amount mismatch"
        print("Refund Registration: SUCCESS, ID:", refund.id)

        # 5. Verify Profit & Loss statement breakdown
        pl_report = await FinanceService.get_profit_loss(db, hospital_id=1)
        assert pl_report.total_income >= 250.0, "Income total calculation mismatch"
        assert pl_report.total_expense >= 50.0, "Expense total calculation mismatch"
        assert pl_report.net_profit == pl_report.total_income - pl_report.total_expense
        print("Profit & Loss Report Statement: SUCCESS")
        print("Total Income:", pl_report.total_income)
        print("Total Expense:", pl_report.total_expense)
        print("Net Profit:", pl_report.net_profit)

        print("\nAll Finance & Accounting Management checks PASSED successfully.")
    except Exception as e:
        print("Verification FAILED:", e)
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(verify_finance_management())
