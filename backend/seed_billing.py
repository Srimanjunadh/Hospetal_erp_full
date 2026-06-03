import sqlite3
conn = sqlite3.connect('medclues.db')
c = conn.cursor()

# Create Billing table
c.execute('''CREATE TABLE IF NOT EXISTS billing
             (id INTEGER PRIMARY KEY AUTOINCREMENT,
              patient_id INTEGER,
              hospital_id INTEGER,
              amount FLOAT,
              reason TEXT,
              status TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')

# Create LabTest table
c.execute('''CREATE TABLE IF NOT EXISTS lab_tests
             (id INTEGER PRIMARY KEY AUTOINCREMENT,
              patient_id INTEGER,
              doctor_id INTEGER,
              test_name TEXT,
              status TEXT DEFAULT 'pending',
              file_path TEXT,
              test_id TEXT UNIQUE,
              cost FLOAT DEFAULT 0.0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')

# Add dummy billing for Manju (ID 21)
c.execute("INSERT INTO billing (patient_id, hospital_id, amount, reason, status) VALUES (21, 1, 1500.0, 'Consultation & Diagnostics', 'paid')")
# Add dummy billing for Avinash (ID 22)
c.execute("INSERT INTO billing (patient_id, hospital_id, amount, reason, status) VALUES (22, 1, 2500.0, 'Advanced Clinical Screening', 'paid')")

conn.commit()
conn.close()
print("Tables created and dummy records added.")
