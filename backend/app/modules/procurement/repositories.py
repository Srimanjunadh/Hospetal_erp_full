from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.shared.database.models import Vendor, PurchaseRequest, PurchaseOrder, SupplierInvoice
from typing import List, Optional

class ProcurementRepository:
    @staticmethod
    async def create_vendor(db: AsyncSession, vendor: Vendor) -> Vendor:
        db.add(vendor)
        await db.flush()
        return vendor

    @staticmethod
    async def get_vendor_by_id(db: AsyncSession, vendor_id: int) -> Optional[Vendor]:
        result = await db.execute(select(Vendor).filter(Vendor.id == vendor_id))
        return result.scalars().first()

    @staticmethod
    async def list_vendors(db: AsyncSession) -> List[Vendor]:
        result = await db.execute(select(Vendor))
        return result.scalars().all()

    @staticmethod
    async def create_purchase_request(db: AsyncSession, req: PurchaseRequest) -> PurchaseRequest:
        db.add(req)
        await db.flush()
        return req

    @staticmethod
    async def get_purchase_request_by_id(db: AsyncSession, req_id: int) -> Optional[PurchaseRequest]:
        result = await db.execute(select(PurchaseRequest).filter(PurchaseRequest.id == req_id))
        return result.scalars().first()

    @staticmethod
    async def create_purchase_order(db: AsyncSession, po: PurchaseOrder) -> PurchaseOrder:
        db.add(po)
        await db.flush()
        return po

    @staticmethod
    async def get_purchase_order_by_id(db: AsyncSession, po_id: int) -> Optional[PurchaseOrder]:
        result = await db.execute(select(PurchaseOrder).filter(PurchaseOrder.id == po_id))
        return result.scalars().first()

    @staticmethod
    async def create_supplier_invoice(db: AsyncSession, invoice: SupplierInvoice) -> SupplierInvoice:
        db.add(invoice)
        await db.flush()
        return invoice

    @staticmethod
    async def get_supplier_invoice_by_id(db: AsyncSession, invoice_id: int) -> Optional[SupplierInvoice]:
        result = await db.execute(select(SupplierInvoice).filter(SupplierInvoice.id == invoice_id))
        return result.scalars().first()

    @staticmethod
    async def save(db: AsyncSession) -> None:
        await db.commit()
