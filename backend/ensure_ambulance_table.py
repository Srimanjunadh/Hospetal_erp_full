import sqlite3
import os

db_path = r"C:\Users\ASUS\OneDrive\Desktop\ERP\backend\medclues.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create ambulance_requests table if not exists
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
print("Table ambulance_requests ensured.")
