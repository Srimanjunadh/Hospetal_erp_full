import psycopg2
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
if DB_URL:
    if DB_URL.startswith("postgresql+asyncpg://"):
        DB_URL = DB_URL.replace("postgresql+asyncpg://", "postgresql://")
    DB_URL = DB_URL.replace("ssl=require", "sslmode=require")

def add_column_if_not_exists(cursor, table, column, datatype):
    cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'")
    if not cursor.fetchone():
        print(f"Adding column '{column}' to '{table}'...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {datatype}")
    else:
        print(f"Column '{column}' already exists in '{table}'.")

def migrate_schema():
    print(f"Connecting to database to run migrations...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()

    try:
        # Hospitals Table
        print("\n--- Migrating 'hospitals' table ---")
        add_column_if_not_exists(cursor, 'hospitals', 'location', 'VARCHAR')
        add_column_if_not_exists(cursor, 'hospitals', 'node_code', 'VARCHAR UNIQUE')
        add_column_if_not_exists(cursor, 'hospitals', 'specialization', 'VARCHAR')
        add_column_if_not_exists(cursor, 'hospitals', 'admin_id', 'INTEGER')
        add_column_if_not_exists(cursor, 'hospitals', 'subscription_status', "VARCHAR DEFAULT 'ACTIVE'")
        add_column_if_not_exists(cursor, 'hospitals', 'subscription_expiry', 'TIMESTAMP')
        add_column_if_not_exists(cursor, 'hospitals', 'total_revenue', 'FLOAT DEFAULT 0.0')

        # Users Table
        print("\n--- Migrating 'users' table ---")
        add_column_if_not_exists(cursor, 'users', 'username', 'VARCHAR UNIQUE')
        add_column_if_not_exists(cursor, 'users', 'hashed_password', 'VARCHAR')
        add_column_if_not_exists(cursor, 'users', 'location', 'VARCHAR')
        add_column_if_not_exists(cursor, 'users', 'weight', 'FLOAT')
        add_column_if_not_exists(cursor, 'users', 'assigned_doctor_id', 'INTEGER')
        add_column_if_not_exists(cursor, 'users', 'assigned_nurse_id', 'INTEGER')
        add_column_if_not_exists(cursor, 'users', 'hospital_id', 'INTEGER')
        add_column_if_not_exists(cursor, 'users', 'image', 'TEXT')
        add_column_if_not_exists(cursor, 'users', 'gender', 'VARCHAR')
        add_column_if_not_exists(cursor, 'users', 'dob', 'VARCHAR')
        add_column_if_not_exists(cursor, 'users', 'blood_group', 'VARCHAR')

        # Doctors Table
        print("\n--- Migrating 'doctors' table ---")
        add_column_if_not_exists(cursor, 'doctors', 'user_id', 'INTEGER')
        add_column_if_not_exists(cursor, 'doctors', 'room_number', 'VARCHAR')
        
        print("\nSchema alterations completed successfully!")

    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        cursor.close()
        conn.close()

async def create_missing_tables():
    print("\n--- Creating missing ERP tables ---")
    import app.db.session as session
    from app.models import models
    engine = session.engine
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    print("Missing tables created successfully!")

if __name__ == "__main__":
    migrate_schema()
    asyncio.run(create_missing_tables())
