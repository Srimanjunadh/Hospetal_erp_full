import re

    import os
    target_path = os.path.join(os.path.dirname(__file__), "backend", "app", "modules", "pms", "router.py")
    with open(target_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Replace import
    code = code.replace("import sqlite3", "import psycopg2\nfrom psycopg2.extras import RealDictCursor\nimport urllib.parse")
    
    # Replace DB Connection logic
    old_db_logic = """DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "medclues.db")

def get_db():
    try:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        yield conn
    except Exception as e:
        print(f"DATABASE CONNECTION ERROR: {e}")
        raise e
    finally:
        if 'conn' in locals():
            conn.close()"""
            
    new_db_logic = """def get_db():
    db_url = os.getenv("DATABASE_URL")
    if db_url and db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
    try:
        conn = psycopg2.connect(db_url)
        # Use RealDictCursor so rows behave like dictionaries
        conn.cursor_factory = RealDictCursor
        yield conn
    except Exception as e:
        print(f"DATABASE CONNECTION ERROR: {e}")
        raise e
    finally:
        if 'conn' in locals():
            conn.close()"""
            
    code = code.replace(old_db_logic, new_db_logic)
    
    # Replace type hints
    code = code.replace("db: sqlite3.Connection =", "db =")
    
    # Replace placeholders
    code = code.replace("?", "%s")
    
    # Replace datetime('now')
    code = code.replace("datetime('now')", "CURRENT_TIMESTAMP")
    
    # Fix cursor.lastrowid
    # We replace:
    # return {"success": True, "message": "Appointment booked successfully!", "appointmentId": cursor.lastrowid}
    # Wait! the query itself needs RETURNING id.
    
    old_insert = """        INSERT INTO appointments (
            patient_id, doctor_id, hospital_id, status, 
            scheduled_at, preferred_time, reason, type
        ) VALUES (%s, %s, %s, 'pending', %s, %s, %s, 'offline')
    ", (patient_id, doc_id, hospital_id, iso_scheduled_at, slotTime, full_reason))
    db.commit()
    
    return {"success": True, "message": "Appointment booked successfully!", "appointmentId": cursor.lastrowid}"""

    new_insert = """        INSERT INTO appointments (
            patient_id, doctor_id, hospital_id, status, 
            scheduled_at, preferred_time, reason, type
        ) VALUES (%s, %s, %s, 'pending', %s, %s, %s, 'offline') RETURNING id
    ", (patient_id, doc_id, hospital_id, iso_scheduled_at, slotTime, full_reason))
    new_id_row = cursor.fetchone()
    new_id = new_id_row["id"] if new_id_row else None
    db.commit()
    
    return {"success": True, "message": "Appointment booked successfully!", "appointmentId": new_id}"""

    code = code.replace(old_insert, new_insert)

    with open(target_path, "w", encoding="utf-8") as f:
        f.write(code)

if __name__ == "__main__":
    convert()
