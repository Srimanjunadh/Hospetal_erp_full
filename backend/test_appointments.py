import sys
import os
sys.path.insert(0, os.path.abspath('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend'))

import asyncio
from app.modules.pms.router import get_user_appointments
from app.db.session import AsyncSessionLocal
import sqlite3

class MockDB:
    def __init__(self):
        self.conn = sqlite3.connect('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend/medclues.db')
        self.conn.row_factory = sqlite3.Row
    def cursor(self):
        class CursorWrapper:
            def __init__(self, cursor):
                self.cursor = cursor
            def execute(self, query, params=None):
                q = query.replace("%s", "?")
                if params:
                    self.cursor.execute(q, params)
                else:
                    self.cursor.execute(q)
            def fetchone(self):
                row = self.cursor.fetchone()
                return dict(row) if row else None
            def fetchall(self):
                return [dict(r) for r in self.cursor.fetchall()]
            def __getattr__(self, name):
                return getattr(self.cursor, name)
        return CursorWrapper(self.conn.cursor())
    def commit(self):
        self.conn.commit()

async def test():
    from app.core.security import create_access_token
    # Find a patient email
    db = MockDB()
    cursor = db.cursor()
    cursor.execute("SELECT email FROM users WHERE role = 'patient' LIMIT 1")
    u = cursor.fetchone()
    if not u:
        print("No patient found")
        return
    email = u["email"]
    print("Testing for email:", email)
    token = create_access_token(data={"sub": email})
    
    try:
        res = await get_user_appointments(token=token, authorization=None, db=db)
        print("Result:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test())
