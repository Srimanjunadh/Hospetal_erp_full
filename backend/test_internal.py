import asyncio
from app.main import app
from httpx import AsyncClient

async def test_root():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        print("Sending request to /")
        response = await ac.get("/")
        print(f"Status: {response.status_code}")
        print(f"Body: {response.json()}")

if __name__ == "__main__":
    asyncio.run(test_root())
