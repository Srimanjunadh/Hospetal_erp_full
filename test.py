import sqlite3
conn = sqlite3.connect('backend/medclues.db')
for r in conn.execute("SELECT username, role FROM users WHERE username='OP-2026-001'").fetchall():
    print(repr(r[0]), repr(r[1]))
