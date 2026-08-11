import requests
import os

img_path = r"C:\Users\banik\.gemini\antigravity-ide\brain\fcc67d9c-2c7d-4869-a4e1-0fdf8424fc41\media__1786466493183.jpg"

if not os.path.exists(img_path):
    print("Error: Attached image not found at", img_path)
    exit(1)

print(f"Testing /scan-image with attached fridge image ({os.path.getsize(img_path)} bytes)...")

with open(img_path, "rb") as f:
    resp = requests.post(
        "http://localhost:8000/scan-image",
        files={"file": ("attached_fridge.jpg", f, "image/jpeg")},
        timeout=60
    )

data = resp.json()
print("Status Code:", resp.status_code)
print("Success:", data.get("success"))
print("Processing Time:", data.get("processing_time_ms"), "ms")
items = data.get("items", [])
print(f"Detected {len(items)} items:")
for idx, item in enumerate(items, 1):
    print(f"  {idx}. {item['name']} ({item.get('category')}) - {item.get('quantity')} [Freshness: {item.get('freshness')}]")
