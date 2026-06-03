import sqlite3
import os

DB_PATH = "c:/Users/ASUS/OneDrive/Desktop/ERP/backend/medclues.db"

def clear_data():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Disable foreign key checks for the session to allow easier deletion
    cursor.execute("PRAGMA foreign_keys = OFF;")

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    print(f"Cleaning {len(tables)} tables...")
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table};")
            # Reset auto-increment counters
            cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}';")
            print(f"  [OK] Cleared table: {table}")
        except Exception as e:
            print(f"  [FAIL] Failed to clear table {table}: {e}")

    # Re-enable foreign key checks
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Add a default super admin so the user can actually log in to start adding things
    try:
        print("\nAdding default Super Admin (username: admin, password: 123)...")
        
        # Check if users table has hashed_password or cleartext_password
        cursor.execute("PRAGMA table_info(users);")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'cleartext_password' in columns:
             cursor.execute("""
                INSERT INTO users (username, name, role, cleartext_password, hashed_password, created_at)
                VALUES ('admin', 'System Admin', 'super_admin', '123', 'hashed_123', datetime('now'))
            """)
        else:
             cursor.execute("""
                INSERT INTO users (username, name, role, hashed_password, created_at)
                VALUES ('admin', 'System Admin', 'super_admin', 'hashed_123', datetime('now'))
            """)
        
        print("  [OK] Super Admin added.")
    except Exception as e:
        print(f"  [FAIL] Failed to add Super Admin: {e}")

    conn.commit()
    conn.close()
    print("\nDATABASE DATA CLEARED SUCCESSFULLY. System ready for fresh start.")

if __name__ == "__main__":
    clear_data()
