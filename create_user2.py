import asyncio
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_async_engine(DATABASE_URL)

async def create_user():
    email = "shaikjavedali19@gmail.com"
    password = "Javali@123"
    name = "Shaik Javed Ali"
    phone = "9876543210"
    
    try:
        async with engine.begin() as conn:
            # Check if user exists
            res = await conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
            row = res.fetchone()
            if row:
                print("User already exists!")
                return
            
            # Find first hospital
            res = await conn.execute(text("SELECT id FROM hospitals ORDER BY id LIMIT 1"))
            hosp = res.fetchone()
            target_hosp_id = hosp[0] if hosp else None
            
            await conn.execute(text("""
                INSERT INTO users (username, name, email, role, hashed_password, phone, age, location, hospital_id, created_at)
                VALUES (:email, :name, :email, 'patient', 'dummy_hash', :phone, 25, 'Visakhapatnam', :hosp_id, CURRENT_TIMESTAMP)
            """), {
                "email": email, "name": name, 
                "phone": phone, "hosp_id": target_hosp_id
            })
            print("User created successfully!")
    except Exception as e:
        print("ERROR:", e)

asyncio.run(create_user())
