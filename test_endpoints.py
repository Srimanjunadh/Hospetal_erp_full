import urllib.request
import json

urls = [
    'http://127.0.0.1:5000/api/doctor/list',
    'http://127.0.0.1:5000/api/hospital-tieup/public/doctors',
    'http://127.0.0.1:5000/api/hospital-tieup/public/all'
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode())
        if 'doctors' in data:
            print(f"SUCCESS for {url}: {len(data['doctors'])} items")
        else:
            print(f"SUCCESS for {url}: {len(data['hospitals'])} items")
    except Exception as e:
        print(f"ERROR for {url}: {e}")
