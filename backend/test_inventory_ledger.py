import asyncio
import os
import sys
sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.inventory.services import InventoryService
from app.modules.inventory.schemas import (
    WarehouseCreate, StockMovementCreate, TransferCreate
)

async def verify_inventory_ledger():
    print("Verifying Inventory & Warehouse Ledger module...")
    db = AsyncSessionLocal()
    
    try:
        # 1. Create a Warehouse
        wh_data1 = WarehouseCreate(
            hospital_id=1,
            name="Alpha Pharmacy Depot",
            location="Zone B, Ground Floor"
        )
        wh1 = await InventoryService.create_warehouse(db, wh_data1)
        assert wh1.id is not None, "Warehouse ID not generated"
        assert wh1.name == "Alpha Pharmacy Depot", "Warehouse name mismatch"
        print("Warehouse 1 Creation: SUCCESS, ID:", wh1.id)

        wh_data2 = WarehouseCreate(
            hospital_id=1,
            name="Beta Emergency Storage",
            location="Zone C, Floor 2"
        )
        wh2 = await InventoryService.create_warehouse(db, wh_data2)
        print("Warehouse 2 Creation: SUCCESS, ID:", wh2.id)

        # 2. Add an Inventory Item under Warehouse 1
        # (Hospital 1 is seeded. Let's create item)
        item = await InventoryService.create_item(
            db,
            hospital_id=1,
            name="Paracetamol 500mg",
            category="MEDICINE",
            quantity=1000,
            min_threshold=200
        )
        item.warehouse_id = wh1.id
        await db.commit()
        print("Inventory Item Created & linked to Wh1, ID:", item.id)

        # 3. Log Stock Movement (Stock Out)
        movement_data = StockMovementCreate(
            item_id=item.id,
            warehouse_id=wh1.id,
            movement_type="STOCK_OUT",
            quantity=100,
            notes="Dispatched to OPD pharmacy ward"
        )
        movement = await InventoryService.record_movement(db, movement_data)
        assert movement.id is not None, "Stock movement ID not generated"
        
        # Verify item quantity is updated
        await db.refresh(item)
        assert item.quantity == 900, "Item quantity was not deducted"
        print("Stock Movement Logged (Stock Out): SUCCESS, New Qty:", item.quantity)

        # 4. Execute Transfer (Move 200 items from Wh1 to Wh2)
        transfer_data = TransferCreate(
            item_id=item.id,
            from_warehouse_id=wh1.id,
            to_warehouse_id=wh2.id,
            quantity=200
        )
        transfer = await InventoryService.execute_transfer(db, transfer_data)
        assert transfer.id is not None, "Transfer ID not generated"
        assert transfer.status == "COMPLETED", "Transfer status mismatch"

        # Check movement records
        movements = await InventoryService.get_movements(db, item.id)
        # Expected movements: 1 (Manual Stock Out) + 2 (Transfer Out & In)
        assert len(movements) >= 3, "Expected at least 3 movement logs"
        print("Inter-Warehouse Stock Transfer: SUCCESS, Item linked to Wh2")

        # 5. Check Low Stock alerts trigger
        # Deduct stock further to trigger low-stock alert
        # Threshold is 200. Currently item.quantity = 900. Let's deduct 800
        deduct_data = StockMovementCreate(
            item_id=item.id,
            warehouse_id=wh2.id,
            movement_type="STOCK_OUT",
            quantity=800,
            notes="Dispatched emergency bulk order"
        )
        await InventoryService.record_movement(db, deduct_data)
        
        alerts = await InventoryService.get_stock_alerts(db, hospital_id=1)
        alert_names = [a.name for a in alerts]
        assert "Paracetamol 500mg" in alert_names, "Low stock item not flagged in alerts"
        print("Low Stock Alarms & Alerts: SUCCESS")

        print("\nAll Inventory & Warehouse Management checks PASSED successfully.")
    except Exception as e:
        print("Verification FAILED:", e)
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(verify_inventory_ledger())
