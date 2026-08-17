import os
import psycopg2
import sqlite3
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def add_column():
    db_url = os.getenv("DATABASE_URL", "sqlite:///backend/medclues.db")

    if db_url.startswith("postgresql://") or db_url.startswith("postgresql+asyncpg://"):
        parsed_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        parsed_url = parsed_url.replace("ssl=require", "sslmode=require")
        conn = psycopg2.connect(parsed_url)
        cursor = conn.cursor()
        
        try:
            print("Adding 'specialization' column to 'hospitals' table in PostgreSQL...")
            cursor.execute("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS specialization VARCHAR")
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            conn.close()
    else:
        db_relative_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
        db_path = Path(__file__).parent / db_relative_path.replace("./", "")
        if not db_path.exists():
            # If run from backend dir or root dir
            db_path = Path(__file__).parent / "medclues.db"
            if not db_path.exists():
                db_path = Path(__file__).parent.parent / "backend" / "medclues.db"

        if not db_path.exists():
            print(f"DB not found at {db_path}")
            return

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            print("Adding 'specialization' column to 'hospitals' table in SQLite...")
            cursor.execute("ALTER TABLE hospitals ADD COLUMN specialization TEXT")
            conn.commit()
            print("Column added successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("Column 'specialization' already exists.")
            else:
                print(f"Error: {e}")
        finally:
            conn.close()

if __name__ == "__main__":
    add_column()
