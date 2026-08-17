from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.database.models import (
    Vendor, PurchaseRequest, PurchaseOrder, SupplierInvoice,
    InventoryItem, StockMovement, GeneralLedger
)
from app.modules.procurement.repositories import ProcurementRepository
from app.modules.procurement.schemas import (
    VendorCreate, PurchaseRequestCreate, PurchaseOrderCreate, SupplierInvoiceCreate
)
from fastapi import HTTPException
import secrets
from datetime import datetime
from typing import List, Optional

class ProcurementService:
    @staticmethod
    async def create_vendor(db: AsyncSession, data: VendorCreate) -> Vendor:
        vendor = Vendor(
            name=data.name,
            contact_email=data.contact_email,
            phone=data.phone,
            address=data.address
        )
        await ProcurementRepository.create_vendor(db, vendor)
        await ProcurementRepository.save(db)
        return vendor

    @staticmethod
    async def list_vendors(db: AsyncSession) -> List[Vendor]:
        return await ProcurementRepository.list_vendors(db)

    @staticmethod
    async def create_purchase_request(db: AsyncSession, data: PurchaseRequestCreate) -> PurchaseRequest:
        req = PurchaseRequest(
            hospital_id=data.hospital_id,
            requester_id=data.requester_id,
            item_name=data.item_name,
            category=data.category,
            quantity=data.quantity,
            estimated_cost=data.estimated_cost,
            status="PENDING"
        )
        await ProcurementRepository.create_purchase_request(db, req)
        await ProcurementRepository.save(db)
        return req

    @staticmethod
    async def approve_purchase_request(db: AsyncSession, req_id: int, status: str) -> PurchaseRequest:
        req = await ProcurementRepository.get_purchase_request_by_id(db, req_id)
        if not req:
            raise HTTPException(status_code=404, detail="Purchase request not found")
        if status not in ["APPROVED", "REJECTED"]:
            raise HTTPException(status_code=400, detail="Invalid approval status")
        req.status = status
        await ProcurementRepository.save(db)
        
        if status == "APPROVED":
            try:
                from app.shared.events.event_bus import EventBus
                from app.shared.events.schemas import PurchaseApprovedEvent
                event_data = PurchaseApprovedEvent(
                    purchase_order_id=req.id,
                    hospital_id=req.hospital_id,
                    item_name=req.item_name,
                    category=req.category,
                    quantity=req.quantity,
                    cost=req.estimated_cost
                )
                import asyncio
                asyncio.create_task(EventBus.publish("domain.purchase.approved", event_data))
            except Exception:
                pass
                
        return req

    @staticmethod
    async def create_purchase_order(db: AsyncSession, data: PurchaseOrderCreate) -> PurchaseOrder:
        vendor = await ProcurementRepository.get_vendor_by_id(db, data.vendor_id)
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")

        po_num = "PO-" + secrets.token_hex(4).upper()
        po = PurchaseOrder(
            purchase_request_id=data.purchase_request_id,
            vendor_id=data.vendor_id,
            hospital_id=data.hospital_id,
            po_number=po_num,
            total_amount=data.total_amount,
            status="ISSUED"
        )
        await ProcurementRepository.create_purchase_order(db, po)
        await ProcurementRepository.save(db)
        return po

    @staticmethod
    async def receive_goods(db: AsyncSession, po_id: int) -> PurchaseOrder:
        po = await ProcurementRepository.get_purchase_order_by_id(db, po_id)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        if po.status == "DELIVERED":
            raise HTTPException(status_code=400, detail="Goods already received for this PO")

        po.status = "DELIVERED"

        # --- INVENTORY INTEGRATION ---
        # If PO is linked to a Purchase Request, we import the request item name, category and quantity
        if po.purchase_request_id:
            req = await ProcurementRepository.get_purchase_request_by_id(db, po.purchase_request_id)
            if req:
                # Find matching item in inventory or create it
                from sqlalchemy.future import select
                result = await db.execute(
                    select(InventoryItem).filter(
                        InventoryItem.hospital_id == po.hospital_id,
                        InventoryItem.name == req.item_name
                    )
                )
                item = result.scalars().first()
                
                if not item:
                    item = InventoryItem(
                        hospital_id=po.hospital_id,
                        name=req.item_name,
                        category=req.category,
                        quantity=req.quantity,
                        min_threshold=50,
                        unit_price=po.total_amount / req.quantity
                    )
                    db.add(item)
                    await db.flush()
                else:
                    item.quantity += req.quantity

                # Record stock movement (ledger tracking)
                movement = StockMovement(
                    item_id=item.id,
                    warehouse_id=item.warehouse_id,
                    movement_type="STOCK_IN",
                    quantity=req.quantity,
                    notes=f"Procured from PO #{po.po_number}"
                )
                db.add(movement)

        await ProcurementRepository.save(db)
        return po

    @staticmethod
    async def receive_supplier_invoice(db: AsyncSession, data: SupplierInvoiceCreate) -> SupplierInvoice:
        po = await ProcurementRepository.get_purchase_order_by_id(db, data.purchase_order_id)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")

        inv_num = "SUP-INV-" + secrets.token_hex(4).upper()
        invoice = SupplierInvoice(
            purchase_order_id=data.purchase_order_id,
            invoice_number=inv_num,
            amount=data.amount,
            status="UNPAID"
        )
        await ProcurementRepository.create_supplier_invoice(db, invoice)
        await ProcurementRepository.save(db)
        return invoice

    @staticmethod
    async def pay_supplier_invoice(db: AsyncSession, invoice_id: int) -> SupplierInvoice:
        invoice = await ProcurementRepository.get_supplier_invoice_by_id(db, invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Supplier invoice not found")
        if invoice.status == "PAID":
            raise HTTPException(status_code=400, detail="Supplier invoice is already paid")

        invoice.status = "PAID"
        
        # --- FINANCE INTEGRATION ---
        # Fetch the PO details to identify the hospital
        po = await ProcurementRepository.get_purchase_order_by_id(db, invoice.purchase_order_id)
        if po:
            ledger = GeneralLedger(
                hospital_id=po.hospital_id,
                invoice_id=None,
                type="DEBIT",
                amount=invoice.amount,
                account_code="OPERATIONAL_EXPENSE",
                description=f"Paid Supplier Invoice #{invoice.invoice_number} for PO #{po.po_number}"
            )
            db.add(ledger)

        await ProcurementRepository.save(db)
        return invoice
