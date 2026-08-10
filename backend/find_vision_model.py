from dotenv import load_dotenv
import os
from groq import Groq

load_dotenv('backend/.env')
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

models = [
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-instruct",
    "llama-3.2-90b-vision-instruct",
    "meta-llama/llama-3.2-11b-vision-instruct",
    "meta-llama/llama-3.2-90b-vision-instruct",
    "qwen-2.5-vl-72b-instruct",
    "qwen/qwen-2.5-vl-72b-instruct",
    "qwen/qwen3.6-27b",
    "groq/compound",
    "groq/compound-mini",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
]

for m in models:
    try:
        resp = client.chat.completions.create(
            model=m,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is in this image?"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
                ]
            }],
            max_tokens=100
        )
        print(f"[WORKS] {m} -> {resp.choices[0].message.content[:50]}")
    except Exception as e:
        err = str(e)
        if "rate_limit_exceeded" in err or "413" in err or "TPM" in err:
            print(f"[RATE LIMIT] {m} -> {err[:150]}")
        elif "decommissioned" in err or "model_not_found" in err or "does not exist" in err:
            print(f"[DECOMMISSIONED/NOT FOUND] {m}")
        else:
            print(f"[ERROR] {m} -> {err[:150]}")
