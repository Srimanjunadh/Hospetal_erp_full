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
    try:
        conn = psycopg2.connect(parsed_url)
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ambulance_requests (
            id SERIAL PRIMARY KEY,
            hospital_id INTEGER,
            patient_id INTEGER,
            nurse_id INTEGER,
            pickup_location TEXT,
            status VARCHAR DEFAULT 'dispatched',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(hospital_id) REFERENCES hospitals(id),
            FOREIGN KEY(patient_id) REFERENCES users(id),
            FOREIGN KEY(nurse_id) REFERENCES users(id)
        )
        ''')
        conn.commit()
        conn.close()
        print("Table ambulance_requests ensured in PostgreSQL.")
    except Exception as e:
        print(f"Error ensuring table in PostgreSQL: {e}")
else:
    db_relative_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_path = Path(__file__).parent / db_relative_path.replace("./", "")
    if not db_path.exists():
        db_path = Path(__file__).parent / "medclues.db"
    if not db_path.exists():
        db_path = Path(__file__).parent.parent / "backend" / "medclues.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ambulance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id INTEGER,
        patient_id INTEGER,
        nurse_id INTEGER,
        pickup_location TEXT,
        status TEXT DEFAULT 'dispatched',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(hospital_id) REFERENCES hospitals(id),
        FOREIGN KEY(patient_id) REFERENCES users(id),
        FOREIGN KEY(nurse_id) REFERENCES users(id)
    )
    ''')
    conn.commit()
    conn.close()
    print("Table ambulance_requests ensured in SQLite.")
