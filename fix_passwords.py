import os
import psycopg2
import sqlite3
import bcrypt
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

STANDARD_PASSWORD = "MediClues123"

db_url = os.getenv("DATABASE_URL", "sqlite:///backend/medclues.db")

if db_url.startswith("postgresql://") or db_url.startswith("postgresql+asyncpg://"):
    parsed_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    parsed_url = parsed_url.replace("ssl=require", "sslmode=require")
    conn = psycopg2.connect(parsed_url)
    c = conn.cursor()
    c.execute("SELECT id, username, role FROM users WHERE role != 'super_admin'")
    users = c.fetchall()
    print(f"Updating passwords for {len(users)} users in PostgreSQL...")
    std_hash = bcrypt.hashpw(STANDARD_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    for user_id, username, role in users:
        c.execute(
            "UPDATE users SET hashed_password = %s WHERE id = %s",
            (std_hash, user_id)
        )
    conn.commit()
else:
    db_relative_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_path = Path(__file__).parent / db_relative_path.replace("./", "")
    if not db_path.exists():
        db_path = Path(__file__).parent / "backend" / "medclues.db"
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT id, username, role FROM users WHERE role != 'super_admin'")
    users = c.fetchall()
    print(f"Updating passwords for {len(users)} users in SQLite...")
    std_hash = bcrypt.hashpw(STANDARD_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    for user_id, username, role in users:
        c.execute(
            "UPDATE users SET hashed_password = ?, cleartext_password = ? WHERE id = ?",
            (std_hash, STANDARD_PASSWORD, user_id)
        )
    conn.commit()

# Verify
c.execute("""
    SELECT u.id, u.username, u.role, h.name as hospital_name
    FROM users u
    LEFT JOIN hospitals h ON u.hospital_id = h.id
    WHERE u.role = 'hospital_admin'
    LIMIT 10
""")
print("\nHospital Admins (login with 'MediClues123'):")
for row in c.fetchall():
    print(f"  {row[1]} -> {row[3]}")

# Count by role
c.execute("SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY COUNT(*) DESC")
print("\nUser counts by role:")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
print(f"\nAll {len(users)} ERP users now use password: MediClues123")
