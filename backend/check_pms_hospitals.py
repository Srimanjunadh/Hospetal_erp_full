
import httpx
import asyncio

async def check_pms_hospitals():
    PMS_BASE_URL = "http://127.0.0.1:5000"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PMS_BASE_URL}/api/hospital-tieup/public")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print("--- PMS HOSPITALS ---")
                    for h in data.get('hospitals', []):
                        print(f"ID: {h.get('id')}, Name: {h.get('name')}, Address: {h.get('address')}")
                else:
                    print(f"PMS API Error: {data.get('message')}")
            else:
                print(f"PMS API Status Code: {response.status_code}")
    except Exception as e:
        print(f"Error connecting to PMS: {e}")

if __name__ == "__main__":
    asyncio.run(check_pms_hospitals())
