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
    print(f"--- Checking PostgreSQL Database ---")
    try:
        conn = psycopg2.connect(parsed_url)
        cursor = conn.cursor()
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        tables = cursor.fetchall()
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT count(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"Table: {table_name}, Rows: {count}")
        conn.close()
    except Exception as e:
        print(f"Error checking PostgreSQL: {e}")
else:
    db_relative_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_path = Path(__file__).parent / db_relative_path.replace("./", "")
    if not db_path.exists():
        db_path = Path(__file__).parent / "medclues.db"
    if not db_path.exists():
        db_path = Path(__file__).parent.parent / "backend" / "medclues.db"
        
    print(f"--- Checking SQLite Database at {db_path} ---")
    if not db_path.exists():
        print("File does not exist.")
    else:
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            for table in tables:
                table_name = table[0]
                cursor.execute(f"SELECT count(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"Table: {table_name}, Rows: {count}")
            conn.close()
        except Exception as e:
            print(f"Error checking SQLite: {e}")
