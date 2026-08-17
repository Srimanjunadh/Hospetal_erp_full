import os
import psycopg2
import sqlite3
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def clear_data():
    db_url = os.getenv("DATABASE_URL", "sqlite:///backend/medclues.db")

    if db_url.startswith("postgresql://") or db_url.startswith("postgresql+asyncpg://"):
        parsed_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        parsed_url = parsed_url.replace("ssl=require", "sslmode=require")
        try:
            conn = psycopg2.connect(parsed_url)
            cursor = conn.cursor()
            print("Cleaning PostgreSQL Database...")
            cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
            tables = [row[0] for row in cursor.fetchall()]
            for table in tables:
                try:
                    cursor.execute(f"TRUNCATE TABLE {table} CASCADE;")
                    print(f"  [OK] Cleared table: {table}")
                except Exception as e:
                    print(f"  [FAIL] Failed to clear table {table}: {e}")
            
            try:
                print("\nAdding default Super Admin...")
                cursor.execute("""
                    INSERT INTO users (username, name, role, hashed_password)
                    VALUES ('admin', 'System Admin', 'super_admin', 'hashed_123')
                """)
                print("  [OK] Super Admin added.")
            except Exception as e:
                print(f"  [FAIL] Failed to add Super Admin: {e}")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error: {e}")
    else:
        db_relative_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
        db_path = Path(__file__).parent / db_relative_path.replace("./", "")
        if not db_path.exists():
            db_path = Path(__file__).parent / "medclues.db"
        if not db_path.exists():
            db_path = Path(__file__).parent.parent / "backend" / "medclues.db"
            
        print(f"Cleaning SQLite Database at {db_path}...")
        if not db_path.exists():
            print("File does not exist.")
            return
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = OFF;")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [row[0] for row in cursor.fetchall()]
        for table in tables:
            try:
                cursor.execute(f"DELETE FROM {table};")
                cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}';")
                print(f"  [OK] Cleared table: {table}")
            except Exception as e:
                print(f"  [FAIL] Failed to clear table {table}: {e}")
        cursor.execute("PRAGMA foreign_keys = ON;")
        try:
            print("\nAdding default Super Admin...")
            cursor.execute("""
                INSERT INTO users (username, name, role, hashed_password, created_at)
                VALUES ('admin', 'System Admin', 'super_admin', 'hashed_123', datetime('now'))
            """)
            print("  [OK] Super Admin added.")
        except Exception as e:
            print(f"  [FAIL] Failed to add Super Admin: {e}")
        conn.commit()
        conn.close()

if __name__ == "__main__":
    clear_data()
