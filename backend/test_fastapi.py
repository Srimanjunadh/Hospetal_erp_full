import sys
import os
import asyncio
import threading
import time
import requests
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.abspath('c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend'))
from app.main import app as main_app

def start_server():
    uvicorn.run(main_app, host="127.0.0.1", port=8001, log_level="error")

def run():
    # Start server in a thread
    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    
    time.sleep(3) # Wait for server to start
    
    # 1. Connect to DB to get patient email
    import sqlite3
    db_path = 'c:/Users/shaik/OneDrive - Vignan University/Desktop/Hospetal_erp_full/backend/medclues.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users WHERE role = 'patient' LIMIT 1")
    row = cursor.fetchone()
    email = row["email"]
    print("Email:", email)
    
    # 2. Generate token directly
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": email})
    
    # 3. Call HTTP endpoint
    url = "http://127.0.0.1:8001/api/user/appointments"
    print("Calling:", url)
    
    # Let's also set DATABASE_URL to empty to force SQLite
    os.environ["DATABASE_URL"] = ""
    
    res = requests.get(url, headers={"token": token})
    print("Status:", res.status_code)
    print("Response:", res.text)

if __name__ == '__main__':
    run()
