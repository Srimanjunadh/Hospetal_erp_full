import asyncio
import asyncpg

DATABASE_URL = "postgresql://neondb_owner:npg_yoN80LlTYPEF@ep-fragrant-wildflower-amav9yzw-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    
    print("=== PMS HOSPITALS (hospital_tieups) ===")
    hospitals = await conn.fetch("SELECT id, name, address, type FROM hospital_tieups ORDER BY id")
    for h in hospitals:
        print(dict(h))
    
    await conn.close()

asyncio.run(main())
