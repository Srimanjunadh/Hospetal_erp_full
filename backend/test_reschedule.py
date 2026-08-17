import sys
import os
sys.path.insert(0, os.path.abspath('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend'))

import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.modules.pms.router import auto_reschedule_expired_appointments
import psycopg2
from psycopg2.extras import RealDictCursor

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
    print("Testing auto_reschedule_expired_appointments for ALL users...")
    try:
        await auto_reschedule_expired_appointments(db, user_id=None)
        print("Success!")
    except Exception as e:
        print("ERROR CAUGHT:")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test())
