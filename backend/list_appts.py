import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend/.env')

db_url = os.getenv("DATABASE_URL")
if db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
db_url = db_url.replace("ssl=require", "sslmode=require")

conn = psycopg2.connect(db_url)
cursor = conn.cursor(cursor_factory=RealDictCursor)

cursor.execute("SELECT * FROM appointments")
appts = cursor.fetchall()
for a in appts:
    print(a)
