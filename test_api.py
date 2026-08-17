import urllib.request
import json

def fetch(url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except Exception as e:
        return {"error": str(e)}

print("/api/doctor/list:", fetch("http://localhost:8000/api/doctor/list"))
print("/api/hospital-tieup/public/doctors:", fetch("http://localhost:8000/api/hospital-tieup/public/doctors"))
