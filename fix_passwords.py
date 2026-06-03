"""
Fix: Update ERP passwords using bcrypt directly (bypass passlib).
"""
import sqlite3
import bcrypt

STANDARD_PASSWORD = "MediClues123"

conn = sqlite3.connect('C:/Users/ASUS/OneDrive/Desktop/ERP/backend/medclues.db')
c = conn.cursor()

# Get all users
c.execute("SELECT id, username, role FROM users WHERE role != 'super_admin'")
users = c.fetchall()
print(f"Updating passwords for {len(users)} users...")

# Generate bcrypt hash
std_hash = bcrypt.hashpw(STANDARD_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"Standard hash: {std_hash[:30]}...")

for user_id, username, role in users:
    c.execute(
        "UPDATE users SET hashed_password = ?, cleartext_password = ? WHERE id = ?",
        (std_hash, STANDARD_PASSWORD, user_id)
    )

conn.commit()

# Verify
c.execute("""
    SELECT u.id, u.username, u.role, h.name as hospital_name
    FROM users u
    LEFT JOIN hospitals h ON u.hospital_id = h.id
    WHERE u.role = 'hospital_admin'
    LIMIT 10
""")
print("\nHospital Admins (login with 'MediClues123'):")
for row in c.fetchall():
    print(f"  {row[1]} -> {row[3]}")

# Count by role
c.execute("SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY COUNT(*) DESC")
print("\nUser counts by role:")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
print(f"\nAll {len(users)} ERP users now use password: MediClues123")
