import asyncio
import os
import sys
sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.procurement.services import ProcurementService
from app.modules.procurement.schemas import (
    VendorCreate, PurchaseRequestCreate, PurchaseOrderCreate, SupplierInvoiceCreate
)
from app.modules.inventory.services import InventoryService
from app.modules.finance.services import FinanceService

async def verify_procurement_pipeline():
    print("Verifying Procurement ERP module & Integrations...")
    db = AsyncSessionLocal()
    
    try:
        # 1. Create a Vendor
        vendor_data = VendorCreate(
            name="Apex Surgicals Ltd",
            contact_email="supplies@apexsurgicals.com",
            phone="+91-888999111"
        )
        # Handle re-runnability by catching UniqueConstraintViolation
        try:
            vendor = await ProcurementService.create_vendor(db, vendor_data)
            print("Vendor Creation: SUCCESS, ID:", vendor.id)
        except Exception:
            from sqlalchemy.future import select
            from app.shared.database.models import Vendor
            result = await db.execute(select(Vendor).filter(Vendor.name == "Apex Surgicals Ltd"))
            vendor = result.scalars().first()
            print("Vendor (Existing): FOUND, ID:", vendor.id)

        # 2. Submit Purchase Request (Equipments)
        request_data = PurchaseRequestCreate(
            hospital_id=1,
            requester_id=1, # Admin user
            item_name="Defibrillator X100",
            category="EQUIPMENT",
            quantity=5,
            estimated_cost=7500.0
        )
        req = await ProcurementService.create_purchase_request(db, request_data)
        assert req.id is not None, "Request ID not generated"
        assert req.status == "PENDING", "Request status mismatch"
        print("Purchase Request Submission: SUCCESS, ID:", req.id)

        # 3. Request Approval
        approved_req = await ProcurementService.approve_purchase_request(db, req.id, "APPROVED")
        assert approved_req.status == "APPROVED", "Request was not approved"
        print("Purchase Request Approval Workflow: SUCCESS")

        # 4. Issue Purchase Order
        po_data = PurchaseOrderCreate(
            purchase_request_id=approved_req.id,
            vendor_id=vendor.id,
            hospital_id=1,
            total_amount=7500.0
        )
        po = await ProcurementService.create_purchase_order(db, po_data)
        assert po.id is not None, "PO ID not generated"
        assert po.po_number.startswith("PO-"), "PO number format mismatch"
        print("Purchase Order Issuance: SUCCESS, PO #:", po.po_number)

        # 5. Receive Goods (Inventory Integration Check)
        delivered_po = await ProcurementService.receive_goods(db, po.id)
        assert delivered_po.status == "DELIVERED", "PO status was not updated to DELIVERED"
        
        # Verify corresponding inventory item was created & count added
        from sqlalchemy.future import select
        from app.shared.database.models import InventoryItem, StockMovement
        result = await db.execute(select(InventoryItem).filter(InventoryItem.name == "Defibrillator X100"))
        item = result.scalars().first()
        assert item is not None, "Inventory item was not automatically created"
        assert item.quantity >= 5, "Quantity was not added to inventory"
        
        # Verify stock movement record is written
        movement_res = await db.execute(select(StockMovement).filter(StockMovement.item_id == item.id))
        movements = movement_res.scalars().all()
        assert len(movements) > 0, "No stock movement logged for incoming goods arrival"
        print("Inventory Goods Receipt Integration: SUCCESS, Item quantity added:", item.quantity)

        # 6. Supplier Invoice Receipt
        invoice_data = SupplierInvoiceCreate(
            purchase_order_id=po.id,
            amount=7500.0
        )
        invoice = await ProcurementService.receive_supplier_invoice(db, invoice_data)
        assert invoice.id is not None, "Invoice ID not generated"
        assert invoice.status == "UNPAID", "Invoice status mismatch"
        print("Supplier Invoice Receipt: SUCCESS, ID:", invoice.id)

        # 7. Pay Supplier Invoice (Finance Integration Check)
        paid_inv = await ProcurementService.pay_supplier_invoice(db, invoice.id)
        assert paid_inv.status == "PAID", "Supplier Invoice not marked PAID"
        
        # Verify a matching DEBIT of OPERATIONAL_EXPENSE is written on General Ledger
        from app.shared.database.models import GeneralLedger
        ledger_res = await db.execute(
            select(GeneralLedger)
            .filter(
                GeneralLedger.hospital_id == 1,
                GeneralLedger.type == "DEBIT",
                GeneralLedger.account_code == "OPERATIONAL_EXPENSE"
            )
        )
        ledger_entries = ledger_res.scalars().all()
        assert len(ledger_entries) > 0, "No Operational Expense Debit registered in General Ledger"
        print("Finance General Ledger Integration: SUCCESS, Supplier payment debited")

        print("\nAll Procurement ERP Pipeline checks PASSED successfully.")
    except Exception as e:
        print("Verification FAILED:", e)
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(verify_procurement_pipeline())
