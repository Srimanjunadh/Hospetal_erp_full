import asyncio
import os
import sys
sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.hospital.services import HospitalService
from app.modules.hospital.schemas import (
    HospitalRegister, HospitalConfigUpdate, RoomCreate, OTCreate, FacilityCreate
)

async def verify_hospital_management():
    print("Verifying Hospital Management module...")
    db = AsyncSessionLocal()
    
    try:
        # 1. Register a new hospital
        h_data = HospitalRegister(
            name="Northside Branch Hospital",
            location="88 North Ave",
            node_code="NODE-NORTH",
            specialization="Pediatrics",
            admin_id=1,
            organization_id=1
        )
        h = await HospitalService.register_hospital(db, h_data)
        assert h.id is not None, "Hospital ID not generated"
        assert h.name == "Northside Branch Hospital", "Hospital Name mismatch"
        print("Hospital Registration: SUCCESS, ID:", h.id)

        # 2. Update config settings
        conf_data = HospitalConfigUpdate(
            config_settings={"operational_hours": "24/7", "icu_beds_limit": 20}
        )
        updated_h = await HospitalService.update_config(db, h.id, conf_data)
        assert updated_h.config_settings["operational_hours"] == "24/7", "Config settings not updated"
        print("Hospital Config Update: SUCCESS")

        # 3. Add room
        room_data = RoomCreate(
            hospital_id=h.id,
            room_number="ICU-404",
            room_type="ICU",
            floor="4th Floor"
        )
        room = await HospitalService.add_room(db, room_data)
        assert room.id is not None, "Room ID not generated"
        assert room.room_number == "ICU-404", "Room number mismatch"
        print("Room Allocation: SUCCESS, ID:", room.id)

        # 4. Add Operation Theatre
        ot_data = OTCreate(
            hospital_id=h.id,
            name="Neurology OT"
        )
        ot = await HospitalService.add_ot(db, ot_data)
        assert ot.id is not None, "OT ID not generated"
        assert ot.name == "Neurology OT", "OT name mismatch"
        print("Operation Theatre Creation: SUCCESS, ID:", ot.id)

        # 5. Add Facility / Equipment
        fac_data = FacilityCreate(
            hospital_id=h.id,
            name="GE MRI Machine",
            category="IMAGING"
        )
        fac = await HospitalService.add_facility(db, fac_data)
        assert fac.id is not None, "Facility ID not generated"
        assert fac.name == "GE MRI Machine", "Facility name mismatch"
        print("Facility/Equipment Addition: SUCCESS, ID:", fac.id)

        print("\nAll Hospital Management checks PASSED successfully.")
    except Exception as e:
        print("Verification FAILED:", e)
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(verify_hospital_management())
