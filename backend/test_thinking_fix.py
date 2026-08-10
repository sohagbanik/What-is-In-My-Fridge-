import os
import base64
import urllib.request
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Download a small image
url = "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400"
img_bytes = urllib.request.urlopen(url).read()
b64 = base64.b64encode(img_bytes).decode("utf-8")

prompt = """Return a JSON object with key "items" containing a list of all visible food items.
Example: {"items": [{"name": "Milk", "quantity": "1 bottle", "category": "Dairy", "confidence": "high", "freshness": "fresh"}]}
Do not include any thinking tags or preamble."""

print("Testing qwen/qwen3.6-27b with json_object format...")
try:
    resp = client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
            ]
        }],
        response_format={"type": "json_object"},
        max_tokens=2048,
        temperature=0.1
    )
    content = resp.choices[0].message.content
    print("[SUCCESS] Raw response:\n", content)
    parsed = json.loads(content)
    print("[PARSE SUCCESS] Items count:", len(parsed.get("items", [])))
    for item in parsed.get("items", []):
        print(f"  - {item}")
except Exception as e:
    print("[FAILED] Error:", e)
