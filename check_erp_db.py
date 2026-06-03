import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    db_url = os.getenv('DATABASE_URL').replace('+asyncpg', '')
    conn = await asyncpg.connect(db_url)
    rows = await conn.fetch('SELECT id, name FROM hospitals')
    for row in rows:
        print(dict(row))
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
