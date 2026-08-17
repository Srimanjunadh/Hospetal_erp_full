import os
import psycopg2
import sqlite3
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL", "sqlite:///backend/medclues.db")

if db_url.startswith("postgresql://") or db_url.startswith("postgresql+asyncpg://"):
    parsed_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    parsed_url = parsed_url.replace("ssl=require", "sslmode=require")
    conn = psycopg2.connect(parsed_url)
    from psycopg2.extras import RealDictCursor
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    is_postgres = True
else:
    db_relative_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_path = Path(__file__).parent / db_relative_path.replace("./", "")
    if not db_path.exists():
        db_path = Path(__file__).parent / "medclues.db"
    if not db_path.exists():
        db_path = Path(__file__).parent.parent / "backend" / "medclues.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    is_postgres = False

print("=== FINAL END-TO-END VERIFICATION REPORT ===")

placeholder = "%s" if is_postgres else "?"

# 1. Check John Patient
cursor.execute("SELECT id, name FROM users WHERE username='john_p'")
patient = cursor.fetchone()
if not patient:
    print("Patient 'john_p' not found.")
    exit()

patient_id = patient['id']
print(f"Patient Name: {patient['name']} (ID: {patient_id})")

# 2. Check Admissions
cursor.execute(f"SELECT room_number, status FROM admissions WHERE patient_id={placeholder}", (patient_id,))
admissions = cursor.fetchall()
print(f"\nAdmissions ({len(admissions)}):")
for adm in admissions:
    print(f" - Status: {adm['status']}, Room: {adm['room_number']}")

# 3. Check Vitals (from Nurse Joy)
cursor.execute(f"SELECT heart_rate, blood_pressure, temperature, spo2, glucose, nursing_notes FROM patient_vitals WHERE patient_id={placeholder} ORDER BY created_at DESC", (patient_id,))
vitals = cursor.fetchall()
print(f"\nVitals Updates ({len(vitals)}):")
for v in vitals:
    print(f" - HR: {v['heart_rate']}, BP: {v['blood_pressure']}, Temp: {v['temperature']}, SpO2: {v['spo2']}, Glucose: {v['glucose']}")
    print(f"   Notes: {v['nursing_notes']}")

# 4. Check Prescriptions (from Dr. Smith)
cursor.execute(f"SELECT medicines, notes, status FROM prescriptions WHERE patient_id={placeholder}", (patient_id,))
prescriptions = cursor.fetchall()
print(f"\nPrescriptions ({len(prescriptions)}):")
for p in prescriptions:
    meds = json.loads(p['medicines']) if p['medicines'] else []
    med_names = [m.get('name', 'Unknown') for m in meds]
    print(f" - Medicines: {', '.join(med_names)}")
    print(f"   Notes: {p['notes']}, Status: {p['status']}")

# 5. Check Pharmacy Orders
cursor.execute(f"SELECT status FROM pharmacy_orders WHERE patient_id={placeholder}", (patient_id,))
pharm_orders = cursor.fetchall()
print(f"\nPharmacy Orders ({len(pharm_orders)}):")
for po in pharm_orders:
    print(f" - Status: {po['status']}")

# 6. Check Lab Tests (from Lab Tech)
cursor.execute(f"SELECT test_name, status, file_path FROM lab_tests WHERE patient_id={placeholder}", (patient_id,))
lab_tests = cursor.fetchall()
print(f"\nLab Tests ({len(lab_tests)}):")
for lt in lab_tests:
    print(f" - Test: {lt['test_name']}, Status: {lt['status']}, File: {lt['file_path']}")

conn.close()
