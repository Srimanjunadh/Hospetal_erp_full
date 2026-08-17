import sys
import os
sys.path.insert(0, os.path.abspath('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend'))

import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.modules.pms.router import get_user_appointments, get_profile, list_doctors, list_hospital_doctors
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import Header

class MockPostgresDB:
    def __init__(self):
        db_url = os.getenv("DATABASE_URL")
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        db_url = db_url.replace("ssl=require", "sslmode=require")
        self.conn = psycopg2.connect(db_url)
        self.conn.cursor_factory = RealDictCursor
    def cursor(self):
        return self.conn.cursor()
    def commit(self):
        self.conn.commit()

async def test():
    db = MockPostgresDB()
    
    print("Testing /api/doctor/list...")
    try:
        res1 = await list_doctors(db=db)
        print("Success, length:", len(res1.get("doctors", [])))
    except Exception as e:
        print("ERROR IN /api/doctor/list")
        import traceback
        traceback.print_exc()

    print("\nTesting /api/hospital-tieup/public/doctors...")
    try:
        res2 = await list_hospital_doctors(db=db)
        print("Success, length:", len(res2.get("doctors", [])))
    except Exception as e:
        print("ERROR IN /api/hospital-tieup/public/doctors")
        import traceback
        traceback.print_exc()

    # Get a token for user
    from app.core.security import create_access_token
    cursor = db.cursor()
    cursor.execute("SELECT email FROM users WHERE role = 'patient' LIMIT 1")
    u = cursor.fetchone()
    if u:
        email = u["email"]
        token = create_access_token(data={"sub": email})
        
        print("\nTesting /api/user/get-profile...")
        try:
            res3 = await get_profile(token=token, db=db)
            print("Success:", res3.get("success"))
        except Exception as e:
            print("ERROR IN /api/user/get-profile")
            import traceback
            traceback.print_exc()
            
        print("\nTesting /api/user/appointments...")
        try:
            res4 = await get_user_appointments(token=token, authorization=None, db=db)
            print("Success:", res4.get("success"))
        except Exception as e:
            print("ERROR IN /api/user/appointments")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test())
