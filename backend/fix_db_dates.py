import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "medclues.db")

def fix_status():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("UPDATE appointments SET status = 'pending' WHERE status = 'scheduled'")
    count = cursor.rowcount

    conn.commit()
    conn.close()
    print(f"Successfully updated {count} appointments to 'pending' status in medclues.db")

if __name__ == "__main__":
    fix_status()
