import sqlite3
conn = sqlite3.connect('c:/Users/ASUS/OneDrive/Desktop/Hospetal_Full/backend/medclues.db')
c = conn.cursor()
c.execute('SELECT id, name, location, node_code FROM hospitals ORDER BY id')
hospitals = c.fetchall()
print('=== ERP HOSPITALS ===')
for h in hospitals:
    print(h)
print()
c.execute("SELECT id, name, role, hospital_id FROM users WHERE role IN ('doctor','nurse','lab') ORDER BY hospital_id, role")
staff = c.fetchall()
print('=== ERP STAFF ===')
for s in staff:
    print(s)
conn.close()
