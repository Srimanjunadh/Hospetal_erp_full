
import asyncio
import sys
import os

from pathlib import Path
backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

from app.core.sync_bridge import sync_hospital_to_pms

async def run_manual_sync():
    # Data for SMN hospetals (from our debug script)
    # MISSING: ID: 25, Name: SMN hospetals Facility, Node: 7230
    # Note: Name in ERP was "SMN hospetals Facility" (appended in auth.py)
    
    hospital_data = {
        "id": 25,
        "name": "SMN hospetals Facility",
        "location": "India", # Default or from user if known
        "node_code": "7230",
        "admin_username": "admin_smn", # Guessed or from DB
        "admin_password": "password"   # Guessed or from DB
    }
    
    print(f"Manually syncing {hospital_data['name']} to PMS...")
    success = await sync_hospital_to_pms(hospital_data)
    if success:
        print("✅ Manual sync successful!")
    else:
        print("❌ Manual sync failed. Check sync_bridge.log or console output.")

if __name__ == "__main__":
    asyncio.run(run_manual_sync())
