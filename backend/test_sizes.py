from dotenv import load_dotenv
import os
import cv2
import numpy as np
import base64
from groq import Groq

load_dotenv('backend/.env')
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Test different image max dimensions
sizes = [128, 256, 320, 384, 512, 640]

for s in sizes:
    # Create a simple synthetic color image with shapes (fruit-like)
    img = np.zeros((s, s, 3), dtype=np.uint8)
    img[:] = (200, 240, 200) # light background
    # Draw red circle (apple)
    cv2.circle(img, (s//3, s//2), s//4, (0, 0, 220), -1)
    # Draw yellow circle (banana)
    cv2.circle(img, (2*s//3, s//2), s//5, (0, 220, 240), -1)

    _, jpeg = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 70])
    b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')

    prompt = 'Return JSON array of food items: [{"name":"Apple","category":"Produce"}]'

    print(f"\n--- Testing Image Size {s}x{s} (JPEG size: {len(jpeg)} bytes) ---")
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
            max_tokens=1024,
            temperature=0.2
        )
        content = resp.choices[0].message.content
        print(f"[SUCCESS] Tokens used: prompt={resp.usage.prompt_tokens}, completion={resp.usage.completion_tokens}")
        print(f"Content snippet:\n{content[:200]}")
    except Exception as e:
        print(f"[FAILED] {e}")
