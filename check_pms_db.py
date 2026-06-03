import asyncio
import asyncpg

PMS_URL = 'postgresql://neondb_owner:npg_yoN80LlTYPEF@ep-fragrant-wildflower-amav9yzw-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async def main():
    conn = await asyncpg.connect(PMS_URL)
    rows = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    print([r[0] for r in rows])
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
