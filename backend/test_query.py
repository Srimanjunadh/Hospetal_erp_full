import sqlite3

def check():
    conn = sqlite3.connect('medclues.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT a.*, d.specialization, d.experience, d.room_number, d.hospital_id,
               u_doc.name as doctor_name, u_doc.location as doctor_location,
               h.name as hospital_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u_doc ON d.user_id = u_doc.id
        LEFT JOIN hospitals h ON a.hospital_id = h.id
        LIMIT 1
        """)
        row = cursor.fetchone()
        if row:
            print(dict(row))
        else:
            print("No rows")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
