import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    import os.path
    db_url = os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///./medclues.db')
    db_url = db_url.replace('+asyncpg', '')
    
    # Resolve relative sqlite path to absolute relative to backend directory
    if "sqlite" in db_url:
        db_relative_path = db_url.replace("sqlite+aiosqlite:///", "")
        if not os.path.isabs(db_relative_path.replace("./", "")):
            backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
            db_filename = db_relative_path.replace("./", "")
            db_path = os.path.join(backend_dir, db_filename)
            db_url = f"sqlite+aiosqlite:///{db_path.replace('\\', '/')}"
            
    conn = await asyncpg.connect(db_url) if "postgresql" in db_url else None
    
    if not conn:
        print(f"Testing with SQLite not directly supported via asyncpg in this script. URL: {db_url}")
        return
        
    rows = await conn.fetch('SELECT id, name FROM hospitals')
    for row in rows:
        print(dict(row))
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
