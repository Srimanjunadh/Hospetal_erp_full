import requests
import json

def test_book_appointment():
    url = "http://localhost:8000/api/appointments/"
    payload = {
        "patient_id": 21,
        "doctor_id": 1,
        "hospital_id": 2,
        "preferred_time": "2026-04-25 10:00",
        "reason": "Test Reason from Script",
        "type": "offline"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_book_appointment()
