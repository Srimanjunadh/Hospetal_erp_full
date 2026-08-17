import os
import requests
import sys

def run():
    # 1. Connect to DB to get patient email
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
    cursor.execute("SELECT email FROM users WHERE role = 'patient' LIMIT 1")
    row = cursor.fetchone()
    email = row["email"]
    print("Email:", email)
    
    # 2. Generate token directly
    sys.path.insert(0, os.path.abspath('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend'))
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": email})
    
    # 3. Call HTTP endpoint
    url = "http://localhost:8000/api/user/appointments"
    print("Calling:", url)
    res = requests.get(url, headers={"token": token})
    print("Status:", res.status_code)
    print("Response:", res.text)

if __name__ == '__main__':
    run()
