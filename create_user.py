import asyncio
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import hashlib
import secrets

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_async_engine(DATABASE_URL)

def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}:{hash_bytes.hex()}"

async def create_user():
    email = "shaikjavedali19@gmail.com"
    password = "Javali@123"
    name = "Shaik Javed Ali"
    phone = "9876543210"
    hashed_pw = get_password_hash(password)
    
    try:
        async with engine.begin() as conn:
            # Check if user exists
            res = await conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
            row = res.fetchone()
            if row:
                print("User already exists! Updating password hash...")
                await conn.execute(text("UPDATE users SET hashed_password = :hashed_pw WHERE email = :email"), {"email": email, "hashed_pw": hashed_pw})
                print("User password hash updated successfully!")
                return
            
            # Find first hospital
            res = await conn.execute(text("SELECT id FROM hospitals ORDER BY id LIMIT 1"))
            hosp = res.fetchone()
            target_hosp_id = hosp[0] if hosp else None
            
            await conn.execute(text("""
                INSERT INTO users (username, name, email, role, hashed_password, phone, age, location, hospital_id, created_at)
                VALUES (:email, :name, :email, 'patient', :hashed_pw, :phone, 25, 'Visakhapatnam', :hosp_id, CURRENT_TIMESTAMP)
            """), {
                "email": email, "name": name, "hashed_pw": hashed_pw, 
                "phone": phone, "hosp_id": target_hosp_id
            })
            print("User created successfully!")
    except Exception as e:
        print("ERROR:", e)

asyncio.run(create_user())
