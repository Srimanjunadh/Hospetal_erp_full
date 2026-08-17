import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'doctors'")
print([row[0] for row in cur.fetchall()])
conn.close()
