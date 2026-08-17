"""
Database Session Configuration
Manages the SQLAlchemy AsyncEngine and AsyncSessionLocal provider, and sets up
event listeners to synchronize changes across microservices.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy import event
import os
from dotenv import load_dotenv
from datetime import datetime, date

if "DATABASE_URL" not in os.environ:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./medclues.db")
print("USING DATABASE_URL:", DATABASE_URL)

# Resolve relative SQLite path to be absolute relative to the backend directory
if DATABASE_URL.startswith("sqlite+aiosqlite:///"):
    db_relative_path = DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    if not os.path.isabs(db_relative_path.replace("./", "")):
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        db_filename = db_relative_path.replace("./", "")
        db_absolute_path = os.path.join(backend_dir, db_filename)
        db_path_posix = db_absolute_path.replace('\\', '/')
        DATABASE_URL = f"sqlite+aiosqlite:///{db_path_posix}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_async_engine(DATABASE_URL, echo=True, connect_args=connect_args, pool_pre_ping=True, pool_recycle=300)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    try:
        async with AsyncSessionLocal() as session:
            yield session
    except Exception as e:
        print("GET_DB EXCEPTION:", e)
        raise

# --- SQLAlchemy Transaction Listeners for Microservices Table Syncing ---

@event.listens_for(Session, "before_commit")
def before_commit_listener(session: Session):
    """
    Scans the session for new and updated records of synced models right before committing,
    and stores their serialized values in session.info.
    """
    changed_items = []
    
    # Identify tracked models
    for obj in list(session.new) + list(session.dirty):
        model_name = obj.__class__.__name__
        if model_name in ["User", "Doctor", "Hospital", "Appointment", "Admission", "Prescription", "PharmacyOrder"]:
            obj_dict = {}
            # Retrieve values for mapped columns
            for col in obj.__table__.columns:
                val = getattr(obj, col.name)
                if val is not None:
                    if isinstance(val, (datetime, date)):
                        val = val.isoformat()
                    obj_dict[col.name] = val
            changed_items.append((model_name, obj_dict))
            
    session.info["changed_items"] = changed_items

@event.listens_for(Session, "after_commit")
def after_commit_listener(session: Session):
    """
    Broadcasts stored change records to all other microservice APIs after commit.
    """
    changed_items = session.info.get("changed_items", [])
    if not changed_items:
        return
        
    current_port = os.getenv("PORT")
    if current_port:
        try:
            current_port = int(current_port)
        except ValueError:
            current_port = None
            
    # Lazy import to avoid circular dependency issues
    from app.shared.database.sync import trigger_broadcast_sync
    for model_name, obj_dict in changed_items:
        trigger_broadcast_sync(model_name, obj_dict, current_port)
