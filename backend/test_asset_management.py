import asyncio
import os
import sys
from datetime import date
sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.asset.services import AssetService
from app.modules.asset.schemas import (
    AssetCreate, MaintenanceCreate
)

async def verify_asset_management():
    print("Verifying Asset Management ERP module...")
    db = AsyncSessionLocal()
    
    try:
        # 1. Register an Asset
        asset_data = AssetCreate(
            hospital_id=1,
            name="CT Scanner Aquilion Prime",
            category="MEDICAL_EQUIPMENT",
            serial_number="CT-992211A",
            purchase_date=date.today(),
            purchase_cost=150000.0,
            warranty_expiry=date(2028, 12, 31)
        )
        try:
            asset = await AssetService.create_asset(db, asset_data)
            print("Asset Registration: SUCCESS, ID:", asset.id)
        except Exception:
            from sqlalchemy.future import select
            from app.shared.database.models import Asset
            result = await db.execute(select(Asset).filter(Asset.serial_number == "CT-992211A"))
            asset = result.scalars().first()
            print("Asset (Existing): FOUND, ID:", asset.id)

        # 2. Schedule Maintenance
        maintenance_data = MaintenanceCreate(
            asset_id=asset.id,
            maintenance_type="EMERGENCY_REPAIR",
            scheduled_date=date.today(),
            description="Re-calibrating diagnostic X-ray tube sensors"
        )
        ticket = await AssetService.schedule_maintenance(db, maintenance_data)
        assert ticket.id is not None, "Maintenance Ticket ID not generated"
        assert ticket.status == "PENDING", "Ticket status mismatch"
        
        # Verify asset status is set to IN_REPAIR
        from app.modules.asset.repositories import AssetRepository
        updated_asset = await AssetRepository.get_asset_by_id(db, asset.id)
        assert updated_asset.status == "IN_REPAIR", "Asset was not set IN_REPAIR status"
        print("Maintenance Scheduling (EMERGENCY_REPAIR): SUCCESS, Asset status set to IN_REPAIR")

        # 3. Complete Maintenance ticket
        completed_ticket = await AssetService.complete_maintenance(db, ticket.id, cost=1200.0)
        assert completed_ticket.status == "COMPLETED", "Ticket status not COMPLETED"
        assert completed_ticket.cost == 1200.0, "Service cost mismatch"
        
        # Verify asset status returns to ACTIVE
        final_asset = await AssetRepository.get_asset_by_id(db, asset.id)
        assert final_asset.status == "ACTIVE", "Asset was not reset back to ACTIVE status"
        print("Maintenance Ticket Completion: SUCCESS, Asset status reset back to ACTIVE")

        # 4. Generate Asset Valuation Report
        report = await AssetService.get_valuation(db, hospital_id=1)
        assert report.total_assets_count >= 1, "Expected at least 1 asset in report"
        assert report.total_purchase_value >= 150000.0, "Valuation total mismatch"
        assert report.category_breakdown["MEDICAL_EQUIPMENT"] >= 150000.0, "Category total mismatch"
        print("Asset Valuation Reports: SUCCESS, Purchase Value:", report.total_purchase_value)

        print("\nAll Asset Management checks PASSED successfully.")
    except Exception as e:
        print("Verification FAILED:", e)
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(verify_asset_management())
