import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://').replace('ssl=require', 'sslmode=require')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

for table in ['users', 'doctors', 'hospitals']:
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
    cols = cur.fetchall()
    print(f"=== Table: {table} ===")
    for name, dtype in cols:
        print(f"  {name}: {dtype}")
conn.close()

