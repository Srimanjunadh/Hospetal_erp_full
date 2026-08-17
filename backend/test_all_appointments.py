import sys
import os
sys.path.insert(0, os.path.abspath('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend'))

import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.modules.pms.router import get_user_appointments
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
    from app.core.security import create_access_token
    db = MockPostgresDB()
    cursor = db.cursor()
    cursor.execute("SELECT email FROM users WHERE role = 'patient'")
    users = cursor.fetchall()
    
    for u in users:
        email = u["email"]
        print(f"\\nTesting for email: {email}")
        token = create_access_token(data={"sub": email})
        
        try:
            res = await get_user_appointments(token=token, authorization=None, db=db)
            print("Result:", "Success", len(res.get("appointments", [])))
        except Exception as e:
            print("ERROR CAUGHT for email:", email)
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test())
