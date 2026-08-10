import os
import base64
import urllib.request
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Download and encode a small image
url = "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400"
img_bytes = urllib.request.urlopen(url).read()
b64 = base64.b64encode(img_bytes).decode("utf-8")
print(f"Base64 image length: {len(b64)}")

models_to_test = ["qwen/qwen3.6-27b", "groq/compound", "groq/compound-mini"]

prompt = "List visible food items as JSON array. Example: [{\"name\":\"Tomato\",\"category\":\"Produce\"}]"

for model_name in models_to_test:
    print(f"\n--- Testing model: {model_name} ---")
    try:
        resp = client.chat.completions.create(
            model=model_name,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
                ]
            }],
            max_tokens=1024,
            temperature=0.2
        )
        content = resp.choices[0].message.content
        print(f"[SUCCESS] Response:\n{content[:300]}")
    except Exception as e:
        print(f"[FAILED] Error: {e}")
