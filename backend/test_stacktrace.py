import sys
import os
import time
import requests
import subprocess

def run():
    # Start the server as a subprocess so we can capture its output
    env = os.environ.copy()
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8002"],
        cwd="c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )
    
    # Wait for server to start
    time.sleep(4)
    
    # Get token
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
    
    sys.path.insert(0, os.path.abspath('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend'))
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": email})
    
    # Make request
    try:
        res = requests.get("http://127.0.0.1:8002/api/user/appointments", headers={"token": token})
        print("Status:", res.status_code)
        print("Response:", res.text)
    except Exception as e:
        print("Error:", e)
        
    # Terminate server and print output
    process.terminate()
    stdout, stderr = process.communicate()
    print("STDOUT:")
    print(stdout)
    print("STDERR:")
    print(stderr)

if __name__ == "__main__":
    run()
