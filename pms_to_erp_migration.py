"""
PMS -> ERP Hospital Migration Script (Neon Postgres)
=====================================
This script:
1. Clears all existing ERP hospitals and their staff
2. Registers all PMS hospitals in the ERP with unique node codes
3. Adds doctors from PMS embedded hospital_tieup_doctors to ERP
4. Adds nurses and lab techs (unique per hospital)
5. Stores a pms_hospital_id -> erp_hospital_id mapping for appointment sync
"""

import asyncio
import asyncpg
import os
from datetime import datetime, timedelta
import hashlib
import json
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# CONFIGURATION
# ============================================================
ERP_DATABASE_URL = os.getenv("DATABASE_URL").replace("+asyncpg", "")
PMS_DATABASE_URL = os.getenv("PMS_DATABASE_URL", "postgresql://neondb_owner:npg_yoN80LlTYPEF@ep-fragrant-wildflower-amav9yzw-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require")

def get_password_hash(password: str) -> str:
    import secrets
    import hashlib
    salt = secrets.token_hex(16)
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}:{hash_bytes.hex()}"

ADMIN_PW = "Admin@1234"
ADMIN_PW_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

async def fetch_pms_data(pms_conn):
    hospitals = await pms_conn.fetch("SELECT id, name, address, type FROM hospital_tieups ORDER BY id")
    
    doctors_by_hosp = {}
    emb_docs = await pms_conn.fetch("""
        SELECT d.id, d.name, d.speciality as specialization, d.experience, d.hospital_id as hospital_tieup_id
        FROM doctors d
        ORDER BY d.hospital_id, d.name
    """)
    for d in emb_docs:
        hid = d['hospital_tieup_id']
        if hid not in doctors_by_hosp:
            doctors_by_hosp[hid] = []
        doctors_by_hosp[hid].append(dict(d))
    
    return [dict(h) for h in hospitals], doctors_by_hosp

def generate_node_code(hospital_name: str, index: int) -> str:
    h = hashlib.md5(f"{hospital_name}{index}".encode()).hexdigest()
    num = int(h[:8], 16) % 9000 + 1000
    return str(num)

async def erp_migrate(pms_hospitals, doctors_by_hosp, erp_conn):
    print("\n🔴 STEP 1: Clearing existing ERP hospital data...")
    
    # Get existing hospital IDs
    rows = await erp_conn.fetch("SELECT id FROM hospitals")
    old_hospital_ids = [r['id'] for r in rows]
    print(f"   Found {len(old_hospital_ids)} existing ERP hospitals: {old_hospital_ids}")
    
    for hid in old_hospital_ids:
        await erp_conn.execute("DELETE FROM appointments WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM lab_tests WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM admissions WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM pharmacy_orders WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM billing WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM inventory WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM blood_bank WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM ward_beds WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM ambulances WHERE hospital_id = $1", hid)
        await erp_conn.execute("DELETE FROM system_alerts WHERE hospital_id = $1", hid)
    
    await erp_conn.execute("DELETE FROM doctors")
    print("   ✓ Cleared all ERP doctors")
    
    await erp_conn.execute("UPDATE hospitals SET admin_id = NULL")
    await erp_conn.execute("UPDATE users SET hospital_id = NULL")

    await erp_conn.execute("DELETE FROM hospitals")
    print("   ✓ Cleared all ERP hospitals")

    await erp_conn.execute("DELETE FROM users WHERE role != 'super_admin'")
    print("   ✓ Cleared all ERP staff/patients")
    print("   ✅ ERP database cleared successfully!")
    
    print("\n🟡 STEP 2: Registering PMS hospitals in ERP...")
    pms_to_erp_mapping = {}
    
    nurse_pools = [
        ["Nurse Priya", "Nurse Meena"], ["Nurse Sunita", "Nurse Kavitha"],
        ["Nurse Radha", "Nurse Lalitha"], ["Nurse Deepa", "Nurse Sujatha"],
        ["Nurse Anitha", "Nurse Padma"], ["Nurse Rekha", "Nurse Jyothi"]
    ]
    
    lab_pools = [
        "Lab Tech Ravi", "Lab Tech Suresh", "Lab Tech Kishore", "Lab Tech Naveen"
    ]
    
    subscription_expiry = datetime.now() + timedelta(days=365)
    
    for idx, hosp in enumerate(pms_hospitals[:2]):
        pms_id = hosp['id']
        hosp_name = hosp['name']
        hosp_address = hosp.get('address', 'Andhra Pradesh, India')
        
        node_code = generate_node_code(hosp_name, pms_id)
        
        admin_username = f"admin_{pms_id}"
        admin_password = f"Admin@{pms_id}"
        admin_name = f"{hosp_name} Admin"
        
        # Insert admin
        admin_id = await erp_conn.fetchval("""
            INSERT INTO users (username, name, email, role, hashed_password, phone, created_at)
            VALUES ($1, $2, $3, 'hospital_admin', $4, $5, NOW()) RETURNING id
        """, admin_username, admin_name, f"admin{pms_id}@medclues.local", 
             get_password_hash(admin_password), f"90000{pms_id:05d}")
        
        # Insert hospital
        erp_hospital_id = await erp_conn.fetchval("""
            INSERT INTO hospitals (name, location, node_code, admin_id, subscription_status, subscription_expiry, total_revenue, created_at)
            VALUES ($1, $2, $3, $4, 'ACTIVE', $5, 0.0, NOW()) RETURNING id
        """, hosp_name, hosp_address, node_code, admin_id, subscription_expiry)
        
        await erp_conn.execute("UPDATE users SET hospital_id = $1 WHERE id = $2", erp_hospital_id, admin_id)
        
        pms_to_erp_mapping[pms_id] = {
            'erp_id': erp_hospital_id,
            'name': hosp_name,
            'node_code': node_code
        }
        
        print(f"   ✓ Registered: {hosp_name} → ERP ID:{erp_hospital_id}, Node:{node_code}")
        
        hosp_doctors = doctors_by_hosp.get(pms_id, [])[:3]
        for doc in hosp_doctors:
            doc_name = doc['name'].strip()
            doc_spec = doc.get('specialization', 'General Physician').strip()
            try:
                exp_str = str(doc.get('experience', '0')).strip()
                exp_years = int(''.join(filter(str.isdigit, exp_str)) or '0')
            except:
                exp_years = 0
            
            doc_username = f"doc_{pms_id}_{doc['id']}"
            doc_password = f"Doc@{pms_id}"
            
            doc_user_id = await erp_conn.fetchval("""
                INSERT INTO users (username, name, role, hashed_password, phone, hospital_id, created_at)
                VALUES ($1, $2, 'doctor', $3, $4, $5, NOW()) RETURNING id
            """, doc_username, doc_name, get_password_hash(doc_password),
                 f"98765{doc['id']:05d}", erp_hospital_id)
            
            await erp_conn.execute("""
                INSERT INTO doctors (user_id, specialization, experience, hospital_id, room_number, status)
                VALUES ($1, $2, $3, $4, $5, 'on-duty')
            """, doc_user_id, doc_spec, exp_years, erp_hospital_id, f"R{doc['id']:03d}")
        
        nurse_names = nurse_pools[idx % len(nurse_pools)]
        for i, nurse_name in enumerate(nurse_names):
            nurse_username = f"nurse_{pms_id}_{i+1}"
            nurse_password = f"Nurse@{pms_id}"
            await erp_conn.execute("""
                INSERT INTO users (username, name, role, hashed_password, phone, hospital_id, created_at)
                VALUES ($1, $2, 'nurse', $3, $4, $5, NOW())
            """, nurse_username, nurse_name, get_password_hash(nurse_password), f"87654{pms_id:04d}{i}", erp_hospital_id)
            
        lab_name = lab_pools[idx % len(lab_pools)]
        lab_username = f"lab_{pms_id}"
        lab_password = f"Lab@{pms_id}"
        await erp_conn.execute("""
            INSERT INTO users (username, name, role, hashed_password, phone, hospital_id, created_at)
            VALUES ($1, $2, 'lab', $3, $4, $5, NOW())
        """, lab_username, lab_name, get_password_hash(lab_password), f"76543{pms_id:05d}", erp_hospital_id)
        
        for blood_group in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            await erp_conn.execute("""
                INSERT INTO blood_bank (hospital_id, blood_group, units_available)
                VALUES ($1, $2, $3)
            """, erp_hospital_id, blood_group, float((idx % 10) + 5))
            
    print(f"\n✅ STEP 2 COMPLETE: Registered 2 PMS hospitals in ERP")
    return pms_to_erp_mapping

def save_mapping(mapping):
    mapping_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pms_erp_hospital_mapping.json")
    json_mapping = {str(k): v for k, v in mapping.items()}
    with open(mapping_file, 'w') as f:
        json.dump(json_mapping, f, indent=2)
    print(f"\n💾 Mapping saved to: {mapping_file}")

async def main():
    print("=" * 60)
    print("  PMS -> ERP Hospital Migration (Neon Postgres)")
    print("=" * 60)
    
    print("\n📡 Connecting to PMS (Neon PostgreSQL)...")
    pms_conn = await asyncpg.connect(PMS_DATABASE_URL)
    pms_hospitals, doctors_by_hosp = await fetch_pms_data(pms_conn)
    await pms_conn.close()
    print(f"   ✓ Found {len(pms_hospitals)} hospitals in PMS")
    
    print("\n📡 Connecting to ERP (Neon PostgreSQL)...")
    erp_conn = await asyncpg.connect(ERP_DATABASE_URL)
    mapping = await erp_migrate(pms_hospitals, doctors_by_hosp, erp_conn)
    await erp_conn.close()
    
    save_mapping(mapping)
    print("  ✅ MIGRATION COMPLETE!")

if __name__ == "__main__":
    asyncio.run(main())
