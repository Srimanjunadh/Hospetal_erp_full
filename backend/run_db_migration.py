import os
import sqlite3
import psycopg2
import asyncio
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    db_url = os.getenv("DATABASE_URL", "sqlite:///./medclues.db")
    print(f"Running migration on database: {db_url}")
    
    if "sqlite" in db_url or not db_url:
        # SQLite
        db_relative_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        db_filename = db_relative_path.replace("./", "")
        db_path = os.path.join(backend_dir, db_filename) if not os.path.isabs(db_filename) else db_filename
        
        print(f"Connecting to SQLite database at: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Check users columns
            cursor.execute("PRAGMA table_info(users)")
            user_cols = [row[1] for row in cursor.fetchall()]
            
            if "is_verified" not in user_cols:
                print("Adding is_verified column to users...")
                cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
            if "email_verification_token" not in user_cols:
                print("Adding email_verification_token column to users...")
                cursor.execute("ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255)")
            if "password_reset_token" not in user_cols:
                print("Adding password_reset_token column to users...")
                cursor.execute("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255)")
            if "password_reset_expires_at" not in user_cols:
                print("Adding password_reset_expires_at column to users...")
                cursor.execute("ALTER TABLE users ADD COLUMN password_reset_expires_at DATETIME")
                
            # Check hospitals columns
            cursor.execute("PRAGMA table_info(hospitals)")
            hosp_cols = [row[1] for row in cursor.fetchall()]
            if "organization_id" not in hosp_cols:
                print("Adding organization_id column to SQLite hospitals table...")
                cursor.execute("ALTER TABLE hospitals ADD COLUMN organization_id INTEGER")
            if "config_settings" not in hosp_cols:
                print("Adding config_settings column to SQLite hospitals table...")
                cursor.execute("ALTER TABLE hospitals ADD COLUMN config_settings JSON")

            # Check inventory columns
            cursor.execute("PRAGMA table_info(inventory)")
            inv_cols = [row[1] for row in cursor.fetchall()]
            if "warehouse_id" not in inv_cols:
                print("Adding warehouse_id column to SQLite inventory table...")
                cursor.execute("ALTER TABLE inventory ADD COLUMN warehouse_id INTEGER")

            conn.commit()
            print("Successfully migrated columns in SQLite.")
        except Exception as e:
            print(f"Error during SQLite migration: {e}")
            conn.rollback()
        finally:
            conn.close()
            
    else:
        # PostgreSQL
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        db_url = db_url.replace("ssl=require", "sslmode=require")
        
        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        try:
            # Add users columns if they don't exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='is_verified'
            """)
            if not cursor.fetchone():
                print("Adding is_verified column to Postgres users table...")
                cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE")
                
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='email_verification_token'
            """)
            if not cursor.fetchone():
                print("Adding email_verification_token column to Postgres...")
                cursor.execute("ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255)")
                
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='password_reset_token'
            """)
            if not cursor.fetchone():
                print("Adding password_reset_token column to Postgres...")
                cursor.execute("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255)")
                
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='password_reset_expires_at'
            """)
            if not cursor.fetchone():
                print("Adding password_reset_expires_at column to Postgres...")
                cursor.execute("ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP")
                
            # Add organization_id column to hospitals if it doesn't exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='hospitals' AND column_name='organization_id'
            """)
            if not cursor.fetchone():
                print("Adding organization_id column to Postgres hospitals table...")
                cursor.execute("ALTER TABLE hospitals ADD COLUMN organization_id INTEGER")

            # Add config_settings column to hospitals if it doesn't exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='hospitals' AND column_name='config_settings'
            """)
            if not cursor.fetchone():
                print("Adding config_settings column to Postgres hospitals table...")
                cursor.execute("ALTER TABLE hospitals ADD COLUMN config_settings JSON")

            # Add warehouse_id column to inventory if it doesn't exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='inventory' AND column_name='warehouse_id'
            """)
            if not cursor.fetchone():
                print("Adding warehouse_id column to Postgres inventory table...")
                cursor.execute("ALTER TABLE inventory ADD COLUMN warehouse_id INTEGER")

            conn.commit()
            print("Successfully migrated columns in Postgres.")
        except Exception as e:
            print(f"Error during PostgreSQL migration: {e}")
            conn.rollback()
        finally:
            conn.close()

async def create_new_tables():
    from app.db.session import engine, Base
    # Make sure new models are registered on metadata
    from app.shared.database.models import (
        RefreshToken, AuditLog, Organization, Branch, Department, 
        OrganizationSetting, OrganizationPolicy, Room, OperationTheatre, Facility,
        EmployeeProfile, EmployeeAttendance, LeaveRequest, Payroll, EmployeeDocument, PerformanceReview,
        Invoice, GeneralLedger, Payment, Refund,
        Warehouse, StockMovement, InventoryTransfer,
        Vendor, PurchaseRequest, PurchaseOrder, SupplierInvoice,
        Asset, AssetMaintenance
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("New tables (organization, hospital, HR, Finance, Inventory, Procurement, and Asset) created successfully.")



if __name__ == "__main__":
    # 1. Run migrations for configured database
    run_migration()
    
    # 2. Run migration for local SQLite if database url is not SQLite
    db_url = os.getenv("DATABASE_URL", "sqlite:///./medclues.db")
    if "sqlite" not in db_url:
        print("\nAlso migrating local SQLite database for safety...")
        os.environ["DATABASE_URL"] = "sqlite:///./medclues.db"
        run_migration()
        # Restore DATABASE_URL
        os.environ["DATABASE_URL"] = db_url

    # 3. Create the new tables
    asyncio.run(create_new_tables())
