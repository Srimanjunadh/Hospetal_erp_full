import sqlite3
import os

db_paths = [
    r"C:\Users\ASUS\OneDrive\Desktop\ERP\medclues.db",
    r"C:\Users\ASUS\OneDrive\Desktop\ERP\backend\medclues.db"
]

for path in db_paths:
    print(f"--- Checking {path} ---")
    if not os.path.exists(path):
        print("File does not exist.")
        continue
    
    try:
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT count(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"Table: {table_name}, Rows: {count}")
        conn.close()
    except Exception as e:
        print(f"Error checking {path}: {e}")
    print("\n")
