import sqlite3
import os

db_path = r"C:\Users\ASUS\OneDrive\Desktop\ERP\backend\medclues.db"
if not os.path.exists(db_path):
    print("DB NOT FOUND")
    exit()

conn = sqlite3.connect(db_path)
c = conn.cursor()
res = c.execute('SELECT id, username, role FROM users').fetchall()
for r in res:
    print(r)
conn.close()
