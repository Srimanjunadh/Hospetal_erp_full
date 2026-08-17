import sqlite3
import os

db_path = 'c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend/medclues.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

try:
    cursor.execute("SELECT email FROM users WHERE email = 'shaikjavedali19@gmail.com'")
    print(cursor.fetchone())
except Exception as e:
    print(e)

try:
    cursor.execute("SELECT * FROM appointments")
    print(len(cursor.fetchall()))
except Exception as e:
    print(e)
