
import sqlite3
import os

DB_PATH = "C:/Users/ASUS/OneDrive/Desktop/ERP/backend/medclues.db"

def add_column():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Adding 'specialization' column to 'hospitals' table...")
        cursor.execute("ALTER TABLE hospitals ADD COLUMN specialization TEXT")
        conn.commit()
        print("Column added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'specialization' already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_column()
