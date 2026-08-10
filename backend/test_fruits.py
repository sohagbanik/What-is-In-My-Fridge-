import os
import base64
import urllib.request
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Download a fruit and veggie fridge image
url = "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600" # Fresh fruits & vegetables image
img_bytes = urllib.request.urlopen(url).read()
b64 = base64.b64encode(img_bytes).decode("utf-8")

prompt = """You are a smart kitchen food detection AI. Identify ALL visible fruits, vegetables, and food items in this image.
Return a JSON object with key "items".
For each item provide:
- name: specific food name (e.g., "Bananas", "Apples", "Carrots", "Bell Peppers")
- quantity: estimated count/amount
- category: one of Produce, Dairy, Protein, Pantry, Beverage, Condiment
- confidence: high, medium, or low
- freshness: fresh, okay, expiring soon, or expired

JSON format:
{"items": [{"name": "Bananas", "quantity": "1 bunch", "category": "Produce", "confidence": "high", "freshness": "fresh"}]}"""

print("Scanning fruit & vegetable image with Groq Vision AI...")
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
print("\n[SUCCESS] Response:\n", content)
parsed = json.loads(content)
print(f"\n[DETECTED {len(parsed.get('items', []))} ITEMS]:")
for item in parsed.get("items", []):
    print(f"  - {item['name']} ({item['category']}) - {item['quantity']} [{item['confidence']}]")
