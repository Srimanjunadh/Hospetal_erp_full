from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./medclues.db")

# Resolve relative SQLite path to be absolute relative to the backend directory
if DATABASE_URL.startswith("sqlite+aiosqlite:///"):
    db_relative_path = DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    if not os.path.isabs(db_relative_path.replace("./", "")):
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_filename = db_relative_path.replace("./", "")
        db_absolute_path = os.path.join(backend_dir, db_filename)
        db_path_posix = db_absolute_path.replace('\\', '/')
        DATABASE_URL = f"sqlite+aiosqlite:///{db_path_posix}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_async_engine(DATABASE_URL, echo=True, connect_args=connect_args)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
