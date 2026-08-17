import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os

def test_sqlite():
    print("Testing SQLite...")
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE appointments (scheduled_at TEXT)")
    cursor.execute("INSERT INTO appointments VALUES ('2026-06-10 19:30:00')")
    cursor.execute("SELECT * FROM appointments WHERE CAST(scheduled_at AS TEXT) LIKE '2026-06-10%'")
    print(cursor.fetchall())

def test_postgres():
    print("Testing Postgres...")
    from dotenv import load_dotenv
    load_dotenv('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend/.env')
    db_url = os.getenv("DATABASE_URL")
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    db_url = db_url.replace("ssl=require", "sslmode=require")
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments WHERE CAST(scheduled_at AS TEXT) LIKE '2026-06-10%'")
    print(cursor.fetchall())

test_sqlite()
test_postgres()
