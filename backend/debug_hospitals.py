
import asyncio
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.future import select

load_dotenv()

# Add the backend path dynamically
backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))
    
from app.models.models import Hospital

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///backend/medclues.db")
if "sqlite" in DATABASE_URL:
    db_relative_path = DATABASE_URL.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_path = backend_dir / db_relative_path.replace("./", "")
    if not db_path.exists():
        db_path = backend_dir / "medclues.db"
    DATABASE_URL = f"sqlite+aiosqlite:///{db_path.as_posix()}"

async def check_hospitals():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        res = await conn.execute(select(Hospital))
        hospitals = res.fetchall()
        print(f"--- ERP HOSPITALS ---")
        erp_hosp_ids = []
        for h in hospitals:
            print(f"ID: {h.id}, Name: {h.name}, Node: {h.node_code}")
            erp_hosp_ids.append(h.id)
            
    # Search for mapping file at root
    mapping_path = backend_dir.parent / "pms_erp_hospital_mapping.json"
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
