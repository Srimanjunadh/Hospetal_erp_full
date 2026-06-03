import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8000/api"

async def test_flow():
    async with httpx.AsyncClient() as client:
        print("=== 1. FETCHING PENDING ADMISSIONS ===")
        # St. Mary's hospital ID is 1
        res = await client.get(f"{BASE_URL}/clinical/admissions/pending?hospital_id=1")
        print("Pending Admissions Status:", res.status_code)
        admissions = res.json()
        print("Admissions:", json.dumps(admissions, indent=2))

        admission_id = None
        for adm in admissions:
            if adm.get("patient") and adm["patient"].get("username") == "john_p":
                admission_id = adm["id"]
                break

        if not admission_id:
            print("No pending admission found for john_p. Was it already admitted?")
            # Try fetching all to see if already admitted
            res = await client.get(f"{BASE_URL}/clinical/admissions")
            all_adms = res.json()
            for adm in all_adms:
                if adm.get("patient") and adm["patient"].get("username") == "john_p":
                    print(f"Found admission for john_p: Status = {adm.get('status')}, Room = {adm.get('room_number')}")
                    admission_id = adm["id"]
                    if adm.get("status") == "admitted":
                        print("Already admitted. Skipping assignment.")
                        admission_id = None
                    break

        if admission_id:
            print(f"\n=== 2. ASSIGNING ROOM TO ADMISSION ID {admission_id} ===")
            payload = {
                "admission_id": admission_id,
                "room_number": "RM-101"
            }
            res = await client.post(f"{BASE_URL}/clinical/admissions/finalize", json=payload)
            print("Finalize Status:", res.status_code)
            print("Response:", res.json())

        print("\n=== 3. VERIFYING PATIENT DATA (john_p) ===")
        # Get patient ID
        # Patient login
        login_payload = {
            "nodeId": "6797",
            "identifier": "john_p",
            "securityToken": "john_password"
        }
        res = await client.post(f"{BASE_URL}/auth/login", json=login_payload)
        patient_data = res.json().get("user")
        if not patient_data:
            print("Failed to login as john_p:", res.json())
            return
        
        patient_id = patient_data["id"]
        
        # We can check vitals via DB or API if there's a patient endpoint for it.
        # But since I don't have a direct patient dashboard API script, I'll query the DB directly to be sure.

if __name__ == "__main__":
    asyncio.run(test_flow())
