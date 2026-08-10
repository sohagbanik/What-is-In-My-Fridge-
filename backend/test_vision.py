"""Test the /scan-image endpoint with the stock fridge image to verify the new vision model works."""
import requests
import sys

# Download the stock fridge image
print("Downloading stock fridge image...")
img_url = "https://lh3.googleusercontent.com/aida-public/AB6AXuBwqyI9v0b09z_jZW-DMXdhkWlvrh84xsMpxS_5wRv2ZO41SrFPpwX5I3buOqPOjmLx-ius8pSHCGv8j0OQ2o_D7abQwtoBLqaHpKKGgS7Pp5s7drvJ-N0dvtSlzSdfaps6_0Zw5dcxlPWuNiRkoWikegGhUf_Zu0l_SWeIUX7oXJW8wZYMP7VjQZjBKkr_J00Vtkz6mRaT2xddHnBD4wu2nQJkzbYlgXxd-CHeXYQC87OtqbnbaWuBfg"
img_resp = requests.get(img_url, timeout=15)
img_bytes = img_resp.content
print(f"  Downloaded: {len(img_bytes)} bytes")

# Send to scan-image endpoint
print("\nSending to /scan-image...")
resp = requests.post(
    "http://localhost:8000/scan-image",
    files={"file": ("fridge.jpg", img_bytes, "image/jpeg")},
    timeout=30,
)

data = resp.json()
print(f"\nStatus: {resp.status_code}")
print(f"Success: {data.get('success')}")
print(f"Processing time: {data.get('processing_time_ms')}ms")

items = data.get("items", [])
print(f"Items detected: {len(items)}")
for item in items:
    print(f"  - {item['name']} ({item.get('category','?')}) [{item.get('confidence','?')}] freshness={item.get('freshness','?')}")

if not data.get("success"):
    print(f"\nERROR: {data.get('error', 'Unknown error')}")
    sys.exit(1)
else:
    print("\n[PASS] Vision model working!")
