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

print("=== ERP HOSPITALS (from PMS) ===")
c.execute("""
    SELECT h.id, h.name, h.location, h.node_code, u.username as admin_username, u.hashed_password as admin_pw
    FROM hospitals h
    LEFT JOIN users u ON h.admin_id = u.id
    ORDER BY h.id
""")
hospitals = c.fetchall()
for h in hospitals:
    print(f"  ERP#{h[0]}: {h[1]}")
    print(f"    Location: {h[2]}")
    print(f"    Node Code: {h[3]}")
    print(f"    Admin Login: {h[4]} / {h[5]}")
    print()

print(f"Total hospitals: {len(hospitals)}")
print()

# Count by hospital
c.execute("""
    SELECT h.id, h.name,
        SUM(CASE WHEN u.role='doctor' THEN 1 ELSE 0 END) as doctors,
        SUM(CASE WHEN u.role='nurse' THEN 1 ELSE 0 END) as nurses,
        SUM(CASE WHEN u.role='lab' THEN 1 ELSE 0 END) as lab_techs
    FROM hospitals h
    LEFT JOIN users u ON u.hospital_id = h.id AND u.role IN ('doctor','nurse','lab')
    GROUP BY h.id, h.name
    ORDER BY h.id
""")
counts = c.fetchall()
print("=== STAFF COUNTS PER HOSPITAL ===")
for row in counts:
    print(f"  {row[1]}: {row[2]} doctors, {row[3]} nurses, {row[4]} lab techs")

conn.close()
