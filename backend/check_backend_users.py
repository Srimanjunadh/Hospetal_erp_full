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
        db_path = Path(__file__).parent / "medclues.db"
    if not db_path.exists():
        db_path = Path(__file__).parent.parent / "backend" / "medclues.db"
    conn = sqlite3.connect(db_path)

c = conn.cursor()
res = c.execute('SELECT id, username, role FROM users').fetchall()
for r in res:
    print(r)
conn.close()
