# Test the /scan-image endpoint with a real image downloaded from the web
import urllib.request
import os

# Download a fridge image for testing
url = "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800"
img_path = "test_fridge.jpg"

print("Downloading test fridge image...")
urllib.request.urlretrieve(url, img_path)
print(f"Downloaded: {os.path.getsize(img_path)} bytes")

# Send it to the scan endpoint
import requests
print("\nSending to /scan-image...")
with open(img_path, "rb") as f:
    resp = requests.post(
        "http://localhost:8000/scan-image",
        files={"file": ("test_fridge.jpg", f, "image/jpeg")}
    )

data = resp.json()
print(f"\nStatus: {resp.status_code}")
print(f"Success: {data.get('success')}")
print(f"Processing time: {data.get('processing_time_ms')}ms")
print(f"Items detected: {len(data.get('items', []))}")
for item in data.get("items", []):
    print(f"  - {item['name']} ({item.get('category', '?')}) [{item.get('confidence', '?')}] - {item.get('freshness', '?')}")

# Cleanup
os.remove(img_path)
