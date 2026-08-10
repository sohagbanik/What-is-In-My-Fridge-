from dotenv import load_dotenv
import os
import cv2
import numpy as np
import urllib.request
import base64
import json
import re
from groq import Groq

load_dotenv('backend/.env')
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Download stock fridge image
url = "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500"
img_bytes = urllib.request.urlopen(url).read()

# Preprocess image (resize to 400px max side)
nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
h, w = img.shape[:2]
if max(h, w) > 400:
    scale = 400 / max(h, w)
    img = cv2.resize(img, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_AREA)

_, jpeg = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 70])
b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')

prompt = """Detect all visible food items in this fridge/kitchen image.
Return ONLY a valid JSON array of objects.
Schema for each item:
{"name": "Item Name", "quantity": "amount", "category": "Produce|Dairy|Protein|Pantry|Beverage|Condiment", "confidence": "high|medium|low", "freshness": "fresh|okay|expiring soon|expired"}

CRITICAL: Do NOT write any introduction or reasoning. Output MUST start with '[' and end with ']'."""

print("Testing qwen/qwen3.6-27b with max_tokens=1500...")
try:
    resp = client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        messages=[
            {"role": "system", "content": "You are a precise JSON food detection vision API. Return JSON only."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
                ]
            }
        ],
        temperature=0.1,
        max_tokens=1500
    )
    raw = resp.choices[0].message.content
    print("--- RAW OUTPUT START ---")
    print(raw[:500])
    print("--- RAW OUTPUT END ---")

    # Clean think tags
    cleaned = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

    print("\n--- CLEANED OUTPUT ---")
    print(cleaned)

    parsed = json.loads(cleaned)
    print(f"\nSUCCESS! Parsed {len(parsed)} items:")
    for item in parsed:
        print(" ", item)
except Exception as e:
    import traceback
    print("FAILED:", e)
    traceback.print_exc()
