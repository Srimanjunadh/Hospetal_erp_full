
import asyncio
import json
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.future import select

# Use the absolute path to medclues.db
DB_PATH = "C:/Users/ASUS/OneDrive/Desktop/ERP/backend/medclues.db"
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# Add the backend path to sys.path so we can import app.models
import sys
sys.path.append("C:/Users/ASUS/OneDrive/Desktop/ERP/backend")
from app.models.models import Hospital

async def check_hospitals():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        res = await conn.execute(select(Hospital))
        hospitals = res.fetchall()
        print(f"--- ERP HOSPITALS (medclues.db) ---")
        erp_hosp_ids = []
        for h in hospitals:
            print(f"ID: {h.id}, Name: {h.name}, Node: {h.node_code}")
            erp_hosp_ids.append(h.id)
            
    mapping_path = "C:/Users/ASUS/OneDrive/Desktop/ERP/backend/pms_erp_hospital_mapping.json"
    if os.path.exists(mapping_path):
        with open(mapping_path, 'r') as f:
            mapping = json.load(f)
        print(f"\n--- MAPPING (pms_erp_hospital_mapping.json) ---")
        mapped_erp_ids = [v['erp_id'] for v in mapping.values()]
        for pms_id, data in mapping.items():
            print(f"PMS ID: {pms_id} -> ERP ID: {data['erp_id']}, Name: {data['name']}, Node: {data['node_code']}")
            
        print(f"\n--- MISSING IN MAPPING ---")
        for h in hospitals:
            if h.id not in mapped_erp_ids:
                print(f"MISSING: ID: {h.id}, Name: {h.name}, Node: {h.node_code}")
    else:
        print("\nMapping file not found!")

if __name__ == "__main__":
    asyncio.run(check_hospitals())
