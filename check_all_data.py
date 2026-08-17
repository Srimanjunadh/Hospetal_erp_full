import os
import psycopg2
import sqlite3
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL", "sqlite:///backend/medclues.db")

if db_url.startswith("postgresql://") or db_url.startswith("postgresql+asyncpg://"):
    parsed_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    parsed_url = parsed_url.replace("ssl=require", "sslmode=require")
    conn = psycopg2.connect(parsed_url)
else:
    db_relative_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_path = Path(__file__).parent / db_relative_path.replace("./", "")
    if not db_path.exists():
        db_path = Path(__file__).parent / "backend" / "medclues.db"
    conn = sqlite3.connect(db_path)

c = conn.cursor()
c.execute('SELECT id, name, location, node_code FROM hospitals ORDER BY id')
hospitals = c.fetchall()
print('=== ERP HOSPITALS ===')
for h in hospitals:
    print(h)
print()
c.execute("SELECT id, name, role, hospital_id FROM users WHERE role IN ('doctor','nurse','lab') ORDER BY hospital_id, role")
staff = c.fetchall()
print('=== ERP STAFF ===')
for s in staff:
    print(s)
conn.close()
