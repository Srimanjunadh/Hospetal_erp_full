"""
Finance & Billing Repository Layer
Implements direct database CRUD transactions for Billing, Invoices, General Ledger, Payments, and Refunds.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.shared.database.models import Billing, Invoice, GeneralLedger, Payment, Refund
from typing import List, Optional

class FinanceRepository:
    @staticmethod
    async def get_bills_by_patient_id(db: AsyncSession, patient_id: int) -> List[Billing]:
        """
        Retrieves all billing records associated with a patient.
        
        :param db: Async database session
        :param patient_id: Patient database ID
        :return: List of Billing records
        """
        result = await db.execute(select(Billing).filter(Billing.patient_id == patient_id))
        return list(result.scalars().all())

    @staticmethod
    async def get_billing_by_id(db: AsyncSession, billing_id: int) -> Optional[Billing]:
        """
        Retrieves a single billing record by database ID.
        
        :param db: Async database session
        :param billing_id: Billing database ID
        :return: Billing record model object or None
        """
        result = await db.execute(select(Billing).filter(Billing.id == billing_id))
        return result.scalars().first()

    @staticmethod
    async def create_invoice(db: AsyncSession, invoice: Invoice) -> Invoice:
        """
        Registers a new Invoice object.
        
        :param db: Async database session
        :param invoice: Invoice model instance
        :return: Persisted Invoice record
        """
        db.add(invoice)
        await db.flush()
        return invoice

    @staticmethod
    async def get_invoice_by_id(db: AsyncSession, invoice_id: int) -> Optional[Invoice]:
        """
        Retrieves invoice details by database ID.
        
        :param db: Async database session
        :param invoice_id: Invoice database ID
        :return: Invoice record model object or None
        """
        result = await db.execute(select(Invoice).filter(Invoice.id == invoice_id))
        return result.scalars().first()

    @staticmethod
    async def get_invoice_by_billing_id(db: AsyncSession, billing_id: int) -> Optional[Invoice]:
        """
        Retrieves invoice details associated with a specific billing record.
        
        :param db: Async database session
        :param billing_id: Billing record ID
        :return: Invoice record model object or None
        """
        result = await db.execute(select(Invoice).filter(Invoice.billing_id == billing_id))
        return result.scalars().first()

    @staticmethod
    async def create_ledger_entry(db: AsyncSession, entry: GeneralLedger) -> GeneralLedger:
        """
        Inserves a General Ledger entry.
        
        :param db: Async database session
        :param entry: GeneralLedger model instance
        :return: Persisted GeneralLedger entry
        """
        db.add(entry)
        await db.flush()
        return entry

    @staticmethod
    async def list_ledger_entries(db: AsyncSession, hospital_id: Optional[int] = None) -> List[GeneralLedger]:
        """
        Retrieves general ledger transactions, optionally filtering by hospital.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: List of GeneralLedger records
        """
        query = select(GeneralLedger)
        if hospital_id:
            query = query.filter(GeneralLedger.hospital_id == hospital_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_payment(db: AsyncSession, payment: Payment) -> Payment:
        """
        Saves a payment receipt details record.
        
        :param db: Async database session
        :param payment: Payment model instance
        :return: Persisted Payment record
        """
        db.add(payment)
        await db.flush()
        return payment

    @staticmethod
    async def get_payment_by_id(db: AsyncSession, payment_id: int) -> Optional[Payment]:
        """
        Retrieves payment receipt details by ID.
        
        :param db: Async database session
        :param payment_id: Payment database ID
        :return: Payment record model object or None
        """
        result = await db.execute(select(Payment).filter(Payment.id == payment_id))
        return result.scalars().first()

    @staticmethod
    async def create_refund(db: AsyncSession, refund: Refund) -> Refund:
        """
        Saves a refund record entry.
        
        :param db: Async database session
        :param refund: Refund model instance
        :return: Persisted Refund record
        """
        db.add(refund)
        await db.flush()
        return refund

    @staticmethod
    async def save(db: AsyncSession) -> None:
        """
        Commits active transaction session.
        
        :param db: Async database session
        """
        await db.commit()
