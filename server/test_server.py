import urllib.request, json

data = json.dumps({
    "purchaseId": "test123",
    "title": "Test",
    "description": "Test",
    "starsAmount": 1
}).encode()

req = urllib.request.Request(
    "http://localhost:3000/create-invoice",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    resp = urllib.request.urlopen(req, timeout=15)
    print("OK:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Error:", e)
