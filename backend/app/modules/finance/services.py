"""
Finance & Billing Service Layer
Implements business workflows for invoice generation, payments, ledger logs, and profit-loss statements.
"""
import logging
import secrets
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.shared.database.models import Billing, Invoice, GeneralLedger, Payment, Refund
from app.modules.finance.repositories import FinanceRepository
from app.modules.finance.schemas import (
    ExpenditureResponse, BillingItem, InvoiceCreate, PaymentCreate, RefundCreate, ProfitLossReport
)
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

class FinanceService:
    @staticmethod
    async def get_total_expenditure(db: AsyncSession, patient_id: int) -> ExpenditureResponse:
        """
        Calculates patient's total charges and fetches their billing history.
        
        :param db: Async database session
        :param patient_id: Patient ID
        :return: ExpenditureResponse schema containing total paid amount and list history
        """
        try:
            logger.info(f"Calculating total expenditure for patient_id={patient_id}")
            bills = await FinanceRepository.get_bills_by_patient_id(db, patient_id)
            total = sum(b.amount for b in bills if b.status == "paid")
            history = [BillingItem.model_validate(b) for b in bills]
            return ExpenditureResponse(total=total, history=history)
        except Exception as e:
            logger.error(f"Error fetching expenditure for patient {patient_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error compiling patient billing statement")

    @staticmethod
    async def create_invoice(db: AsyncSession, data: InvoiceCreate) -> Invoice:
        """
        Generates a draft invoice tied optionally to a billing record.
        
        :param db: Async database session
        :param data: Typed InvoiceCreate details
        :return: Persisted Invoice model object
        :raises HTTPException: If linked billing request doesn't exist or invoice already exists
        """
        try:
            logger.info(f"Creating invoice for patient_id={data.patient_id} amount={data.amount}")
            if data.billing_id:
                billing = await FinanceRepository.get_billing_by_id(db, data.billing_id)
                if not billing:
                    logger.warning(f"Billing record {data.billing_id} not found for invoice creation")
                    raise HTTPException(status_code=404, detail="Billing record not found")
                existing = await FinanceRepository.get_invoice_by_billing_id(db, data.billing_id)
                if existing:
                    logger.warning(f"Invoice already exists for billing ID {data.billing_id}")
                    raise HTTPException(status_code=400, detail="Invoice already exists for this billing record")

            invoice_num = "INV-" + secrets.token_hex(4).upper()
            invoice = Invoice(
                hospital_id=data.hospital_id,
                patient_id=data.patient_id,
                billing_id=data.billing_id,
                invoice_number=invoice_num,
                amount=data.amount,
                status="DRAFT",
                due_date=data.due_date
            )
            await FinanceRepository.create_invoice(db, invoice)
            await FinanceRepository.save(db)
            
            # Publish InvoiceGenerated event
            try:
                from app.shared.events.event_bus import EventBus
                from app.shared.events.schemas import InvoiceGeneratedEvent
                event_data = InvoiceGeneratedEvent(
                    invoice_id=invoice.id,
                    hospital_id=invoice.hospital_id,
                    patient_id=invoice.patient_id,
                    amount=invoice.amount,
                    due_date=invoice.due_date.isoformat() if isinstance(invoice.due_date, (datetime, date)) else str(invoice.due_date)
                )
                import asyncio
                asyncio.create_task(EventBus.publish("domain.invoice.generated", event_data))
            except Exception as e:
                pass
                
            return invoice
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating invoice: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error generating patient invoice")

    @staticmethod
    async def get_invoice(db: AsyncSession, invoice_id: int) -> Invoice:
        """
        Retrieves detailed properties of an invoice.
        
        :param db: Async database session
        :param invoice_id: Invoice database ID
        :return: Invoice model object
        :raises HTTPException: If invoice does not exist
        """
        try:
            logger.info(f"Retrieving invoice details for invoice_id={invoice_id}")
            inv = await FinanceRepository.get_invoice_by_id(db, invoice_id)
            if not inv:
                logger.warning(f"Invoice ID {invoice_id} not found")
                raise HTTPException(status_code=404, detail="Invoice not found")
            return inv
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching invoice {invoice_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error retrieving invoice details")

    @staticmethod
    async def receive_payment(db: AsyncSession, data: PaymentCreate) -> Payment:
        """
        Registers payment receipt for an invoice/billing row, adds a ledger double-entry revenue credit record.
        
        :param db: Async database session
        :param data: Typed PaymentCreate details
        :return: Persisted Payment record
        :raises HTTPException: If invoice/billing record is not found or already paid
        """
        try:
            logger.info(f"Receiving payment for hospital_id={data.hospital_id} amount={data.amount} via {data.payment_method}")
            billing = None
            invoice = None
            
            if data.invoice_id:
                invoice = await FinanceRepository.get_invoice_by_id(db, data.invoice_id)
                if not invoice:
                    logger.warning(f"Invoice ID {data.invoice_id} not found for payment processing")
                    raise HTTPException(status_code=404, detail="Invoice not found")
                if invoice.status == "PAID":
                    logger.warning(f"Invoice ID {data.invoice_id} is already paid")
                    raise HTTPException(status_code=400, detail="Invoice is already paid")
                invoice.status = "PAID"
                
                if invoice.billing_id:
                    billing = await FinanceRepository.get_billing_by_id(db, invoice.billing_id)
                    if billing:
                        billing.status = "paid"
            elif data.billing_id:
                billing = await FinanceRepository.get_billing_by_id(db, data.billing_id)
                if not billing:
                    logger.warning(f"Billing ID {data.billing_id} not found for payment processing")
                    raise HTTPException(status_code=404, detail="Billing record not found")
                billing.status = "paid"

            payment = Payment(
                hospital_id=data.hospital_id,
                billing_id=data.billing_id,
                invoice_id=data.invoice_id,
                amount=data.amount,
                payment_method=data.payment_method,
                transaction_reference=data.transaction_reference
            )
            await FinanceRepository.create_payment(db, payment)

            # Record Ledger Entry as CREDIT
            ledger = GeneralLedger(
                hospital_id=data.hospital_id,
                invoice_id=data.invoice_id,
                type="CREDIT",
                amount=data.amount,
                account_code="REVENUE",
                description=f"Received payment via {data.payment_method} for Invoice #{data.invoice_id or 'Billing N/A'}"
            )
            await FinanceRepository.create_ledger_entry(db, ledger)
            await FinanceRepository.save(db)
            return payment
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registering payment receipt: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error processing payment transaction")

    @staticmethod
    async def process_refund(db: AsyncSession, data: RefundCreate) -> Refund:
        """
        Validates refund bounds, creates refund record, and registers ledger debit transaction outflow.
        
        :param db: Async database session
        :param data: Typed RefundCreate details
        :return: Persisted Refund record
        :raises HTTPException: If payment record not found or refund exceeds payment
        """
        try:
            logger.info(f"Processing refund for payment_id={data.payment_id} amount={data.amount}")
            payment = await FinanceRepository.get_payment_by_id(db, data.payment_id)
            if not payment:
                logger.warning(f"Payment record ID {data.payment_id} not found for refund processing")
                raise HTTPException(status_code=404, detail="Payment record not found")
            if data.amount > payment.amount:
                logger.warning(f"Refund amount {data.amount} exceeds payment amount {payment.amount}")
                raise HTTPException(status_code=400, detail="Refund amount exceeds initial payment amount")

            refund = Refund(
                hospital_id=data.hospital_id,
                payment_id=data.payment_id,
                amount=data.amount,
                reason=data.reason
            )
            await FinanceRepository.create_refund(db, refund)

            # Record ledger outflow as DEBIT
            ledger = GeneralLedger(
                hospital_id=data.hospital_id,
                invoice_id=payment.invoice_id,
                type="DEBIT",
                amount=data.amount,
                account_code="REFUND",
                description=f"Issued refund for Payment #{data.payment_id}. Reason: {data.reason}"
            )
            await FinanceRepository.create_ledger_entry(db, ledger)
            await FinanceRepository.save(db)
            return refund
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error issuing refund: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error executing refund transaction")

    @staticmethod
    async def list_ledger(db: AsyncSession, hospital_id: Optional[int] = None) -> List[GeneralLedger]:
        """
        Lists General Ledger entries.
        
        :param db: Async session
        :param hospital_id: Optional hospital ID filter
        :return: List of GeneralLedger objects
        """
        try:
            return await FinanceRepository.list_ledger_entries(db, hospital_id)
        except Exception as e:
            logger.error(f"Error retrieving ledger details: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error listing ledger records")

    @staticmethod
    async def get_profit_loss(db: AsyncSession, hospital_id: Optional[int] = None) -> ProfitLossReport:
        """
        Computes aggregate revenues, expenses, and returns net balance breakdowns.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: ProfitLossReport schema summary
        """
        try:
            logger.info(f"Generating Profit & Loss statement hospital_id={hospital_id}")
            entries = await FinanceRepository.list_ledger_entries(db, hospital_id)
            
            total_income = 0.0
            total_expense = 0.0
            breakdown = {
                "REVENUE": 0.0,
                "REFUND": 0.0,
                "OPERATIONAL_EXPENSE": 0.0,
                "SALARY": 0.0
            }
            
            for entry in entries:
                code = entry.account_code or "REVENUE"
                if entry.type == "CREDIT":
                    total_income += entry.amount
                    breakdown[code] = breakdown.get(code, 0.0) + entry.amount
                else:
                    total_expense += entry.amount
                    breakdown[code] = breakdown.get(code, 0.0) - entry.amount

            return ProfitLossReport(
                total_income=total_income,
                total_expense=total_expense,
                net_profit=total_income - total_expense,
                breakdown=breakdown
            )
        except Exception as e:
            logger.error(f"Error compiling P&L report: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error generating Profit and Loss analysis report")

    @staticmethod
    async def handle_invoice_generated(data: dict) -> None:
        """
        Subscribed event handler to create general ledger credit record asynchronously.
        """
        from app.db.session import AsyncSessionLocal
        from app.shared.database.models import GeneralLedger
        
        async with AsyncSessionLocal() as db:
            ledger = GeneralLedger(
                hospital_id=data["hospital_id"],
                invoice_id=data["invoice_id"],
                type="CREDIT",
                amount=data["amount"],
                account_code="REVENUE",
                description=f"Async Ledger Sync: Invoice #{data['invoice_id']} generated."
            )
            db.add(ledger)
            await db.commit()
            logger.info(f"Asynchronously recorded invoice income credit for ID={data['invoice_id']}")

    @staticmethod
    async def handle_purchase_approved(data: dict) -> None:
        """
        Subscribed event handler to record debit operational expenditure asynchronously.
        """
        from app.db.session import AsyncSessionLocal
        from app.shared.database.models import GeneralLedger
        
        async with AsyncSessionLocal() as db:
            ledger = GeneralLedger(
                hospital_id=data["hospital_id"],
                type="DEBIT",
                amount=data["cost"],
                account_code="OPERATIONAL_EXPENSE",
                description=f"Async Ledger Sync: Purchase Approved for '{data['item_name']}'. Order #{data['purchase_order_id']}."
            )
            db.add(ledger)
            await db.commit()
            logger.info(f"Asynchronously recorded procurement expenditure debit for Order={data['purchase_order_id']}")

