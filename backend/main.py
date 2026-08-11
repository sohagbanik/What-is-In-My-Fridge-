# ============================================================================
# 🍳 "What's In My Fridge?" — Python Backend (FastAPI)
# ============================================================================
#
# This is the complete backend server for the smart kitchen assistant app.
# It provides three core features:
#
#   1. Static Image Scanner   — POST /scan-image
#      Upload a photo of your fridge → AI identifies food items
#
#   2. Live Camera Scanner    — WebSocket /ws/scan-live
#      Stream webcam frames in real-time → continuous AI detection
#
#   3. Recipe Generator       — POST /generate-recipe
#      Send a list of ingredients → AI generates 2 recipes
#
# Tech Stack:
#   • FastAPI  — Modern async Python web framework
#   • OpenCV   — Image pre-processing (resize, contrast, encode)
#   • Groq SDK — Ultra-fast LLM inference (vision + text models)
#   • Uvicorn  — ASGI server to run FastAPI
#
# Run with:  uvicorn main:app --reload --port 8000
# ============================================================================

# ──────────────────────────────────────────────────────────────────────────────
# IMPORTS
# ──────────────────────────────────────────────────────────────────────────────

import os                       # Access environment variables
import io                       # In-memory byte streams
import base64                   # Encode images to base64 strings for the API
import time                     # Throttle mechanism for WebSocket frame rate
import json                     # Parse JSON responses from the LLM
import asyncio                  # Async support for WebSocket handling
import traceback                # Detailed error logging
import re                       # Regular expressions for string parsing

import cv2                      # OpenCV — image processing (resize, contrast, encode)
import numpy as np              # NumPy — required by OpenCV for image arrays

from fastapi import (
    FastAPI,                    # The main application class
    UploadFile,                 # Handle file uploads (images)
    File,                       # Declare file parameters
    WebSocket,                  # WebSocket connections for live streaming
    WebSocketDisconnect,        # Gracefully handle client disconnects
    HTTPException,              # Return proper HTTP error responses
)
from fastapi.middleware.cors import CORSMiddleware  # Cross-Origin Resource Sharing
from pydantic import BaseModel, Field               # Data validation & serialization
from typing import List, Optional                    # Type hints
from dotenv import load_dotenv                       # Load .env file variables
from groq import Groq                                # Groq SDK for LLM inference


# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURATION & INITIALIZATION
# ──────────────────────────────────────────────────────────────────────────────

# Load environment variables from .env file in the backend directory.
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=dotenv_path)
load_dotenv()  # Fallback to cwd

# Retrieve the Groq API key from environment variables.
# You MUST set this in your .env file:  GROQ_API_KEY=gsk_your_key_here
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("[!] WARNING: GROQ_API_KEY not found in .env file!")
    print("    Create a backend/.env file with:  GROQ_API_KEY=gsk_your_key_here")
    print("    Get your free key at: https://console.groq.com/keys")

# Initialize the Groq client.
# This object handles all communication with Groq's API servers.
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ──────────────────────────────────────────────────────────────────────────────
# FASTAPI APP SETUP
# ──────────────────────────────────────────────────────────────────────────────

# Create the FastAPI application instance with metadata for the auto-docs.
app = FastAPI(
    title="What's In My Fridge? — API",
    description="AI-powered kitchen assistant that scans your fridge and generates recipes.",
    version="1.0.0",
)

# ── CORS Middleware ──
# CORS (Cross-Origin Resource Sharing) allows your frontend (running on
# localhost:5173) to make requests to this backend (running on localhost:8000).
# Without this, the browser would block all cross-origin API calls.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow requests from ANY origin (fine for dev)
    allow_credentials=True,       # Allow cookies / auth headers
    allow_methods=["*"],          # Allow all HTTP methods (GET, POST, PUT, etc.)
    allow_headers=["*"],          # Allow all headers
)


# ──────────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS — Request/Response Validation
# ──────────────────────────────────────────────────────────────────────────────
#
# Pydantic models enforce strict data validation. FastAPI uses them to:
#   1. Validate incoming request bodies (reject bad data automatically)
#   2. Serialize outgoing responses (ensure consistent JSON shape)
#   3. Generate OpenAPI documentation (visible at /docs)
# ──────────────────────────────────────────────────────────────────────────────

class DetectedItem(BaseModel):
    """Represents a single food item detected by the vision AI."""
    name: str = Field(..., description="Name of the food item, e.g. 'Roma Tomatoes'")
    quantity: Optional[str] = Field(None, description="Estimated quantity, e.g. '3 pieces'")
    category: Optional[str] = Field(None, description="Category: Produce, Dairy, Protein, Pantry, Beverage, Condiment")
    confidence: Optional[str] = Field(None, description="AI confidence level: high, medium, low")
    freshness: Optional[str] = Field(None, description="Estimated freshness: fresh, okay, expiring soon, expired")


class ScanResponse(BaseModel):
    """Response returned by the /scan-image endpoint."""
    success: bool = Field(..., description="Whether the scan completed successfully")
    items: List[DetectedItem] = Field(default_factory=list, description="List of detected food items")
    message: Optional[str] = Field(None, description="Additional info or error message")
    processing_time_ms: Optional[float] = Field(None, description="Time taken to process in milliseconds")


class RecipeRequest(BaseModel):
    """Request body for the /generate-recipe endpoint."""
    ingredients: List[str] = Field(
        ...,
        min_length=1,
        description="List of ingredient names available in the pantry",
        json_schema_extra={"example": ["paneer", "tomatoes", "garlic", "spinach", "rice"]}
    )
    cuisine_preference: Optional[str] = Field(
        "Indian",
        description="Preferred cuisine focus, e.g. 'Indian' or 'Any'"
    )


class RecipeStep(BaseModel):
    """A single step in a recipe's instructions."""
    step_number: int = Field(..., description="Step order (1, 2, 3...)")
    instruction: str = Field(..., description="What to do in this step")
    duration_minutes: Optional[int] = Field(None, description="Estimated time for this step")


class GeneratedRecipe(BaseModel):
    """A single recipe generated by the AI."""
    title: str = Field(..., description="Name of the recipe")
    description: str = Field(..., description="Brief appetizing description")
    prep_time: str = Field(..., description="Preparation time, e.g. '10 min'")
    cook_time: str = Field(..., description="Cooking time, e.g. '20 min'")
    servings: int = Field(..., description="Number of servings")
    difficulty: str = Field(..., description="Easy, Medium, or Hard")
    calories_estimate: Optional[int] = Field(None, description="Estimated calories per serving")
    uses_expiring_items_count: Optional[int] = Field(0, description="Count of expiring pantry items used")
    ingredients_used: List[str] = Field(..., description="Ingredients from the user's list that are used")
    staples_needed: List[str] = Field(default_factory=list, description="Common staples assumed available (salt, oil, etc.)")
    steps: List[RecipeStep] = Field(..., description="Ordered cooking instructions")
    tags: List[str] = Field(default_factory=list, description="Tags like 'Indian', 'Vegetarian', 'Quick', etc.")


class RecipeResponse(BaseModel):
    """Response returned by the /generate-recipe endpoint."""
    success: bool = Field(..., description="Whether recipe generation succeeded")
    recipes: List[GeneratedRecipe] = Field(default_factory=list, description="List of generated recipes")
    message: Optional[str] = Field(None, description="Additional info or error message")


# ──────────────────────────────────────────────────────────────────────────────
# OPENCV IMAGE PRE-PROCESSING
# ──────────────────────────────────────────────────────────────────────────────
#
# Before sending any image to the Groq Vision API, we pre-process it with
# OpenCV for optimal results:
#
#   1. RESIZE — Downscale large images so the max dimension ≤ 1280px.
#      This reduces upload bandwidth and API latency significantly.
#
#   2. CONTRAST — Apply CLAHE (Contrast Limited Adaptive Histogram
#      Equalization) to improve visibility in dark fridge corners.
#
#   3. ENCODE — Convert the processed OpenCV image matrix (numpy array)
#      directly to JPEG bytes in memory, then to a base64 string.
#      No temporary files are ever written to disk.
# ──────────────────────────────────────────────────────────────────────────────

def preprocess_image(image_bytes: bytes) -> str:
    """
    Takes raw image bytes, processes them with OpenCV, and returns
    a base64-encoded JPEG string ready for the Groq Vision API.

    Pipeline:
        raw bytes → numpy array → OpenCV Mat → resize → contrast → JPEG → base64

    Args:
        image_bytes: Raw bytes of an image (JPEG, PNG, etc.)

    Returns:
        Base64-encoded string of the processed JPEG image.

    Raises:
        ValueError: If the image bytes cannot be decoded by OpenCV.
    """

    # ── Step 1: Decode raw bytes into an OpenCV image (numpy array) ──
    # np.frombuffer converts bytes → 1D numpy array of uint8.
    # cv2.imdecode interprets those bytes as an image (auto-detects format).
    # The flag cv2.IMREAD_COLOR loads it as a 3-channel BGR image.
    np_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Failed to decode image — the file may be corrupted or not a valid image format.")

    # ── Step 2: Resize — cap the maximum dimension at 512 pixels ──
    # Downscaling to 512px keeps the token count well under Groq's 8,000 TPM rate limit.
    max_dimension = 512
    height, width = image.shape[:2]  # shape is (height, width, channels)

    if max(height, width) > max_dimension:
        # Calculate the scale factor to bring the largest side down to 512.
        scale = max_dimension / max(height, width)
        new_width = int(width * scale)
        new_height = int(height * scale)

        # cv2.INTER_AREA is the best interpolation for downscaling.
        image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        print(f"   [RESIZE] {width}x{height} -> {new_width}x{new_height}")

    # ── Step 3: Contrast Enhancement using CLAHE ──
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    enhanced_lab = cv2.merge([l_channel, a_channel, b_channel])
    image = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    # ── Step 4: Encode to JPEG bytes in memory ──
    # 65% quality ensures minimal payload size while retaining food item visibility.
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, 65]
    success, jpeg_buffer = cv2.imencode(".jpg", image, encode_params)

    if not success:
        raise ValueError("Failed to encode the processed image to JPEG format.")

    # ── Step 5: Convert JPEG bytes to base64 string ──
    # The Groq Vision API expects images as base64-encoded strings.
    # base64.b64encode returns bytes, so we decode to a UTF-8 string.
    base64_string = base64.b64encode(jpeg_buffer.tobytes()).decode("utf-8")

    print(f"   [OK] Image processed: {len(base64_string) // 1024} KB base64")

    return base64_string


# ──────────────────────────────────────────────────────────────────────────────
# GROQ VISION API HELPER
# ──────────────────────────────────────────────────────────────────────────────

def analyze_image_with_groq(base64_image: str) -> List[DetectedItem]:
    """
    Sends a base64-encoded image to Groq's Vision model and parses the
    response into a list of DetectedItem objects.

    Args:
        base64_image: Base64-encoded JPEG image string.

    Returns:
        List of DetectedItem objects representing detected food.
    """

    if not groq_client:
        raise HTTPException(
            status_code=500,
            detail="Groq API key not configured. Add GROQ_API_KEY to your backend/.env file."
        )

    vision_prompt = """You are a smart kitchen food detection AI. Identify ALL visible fruits, vegetables, ingredients, and food items in this image.
Return a JSON object with key "items".
For each item provide:
- name: specific food name (e.g., "Bananas", "Apples", "Roma Tomatoes", "Whole Milk")
- quantity: estimated count or amount (e.g., "4", "1 bunch", "1 bottle")
- category: one of Produce, Dairy, Protein, Pantry, Beverage, Condiment
- confidence: high, medium, or low
- freshness: fresh, okay, expiring soon, or expired

JSON format example:
{"items": [{"name": "Tomatoes", "quantity": "4", "category": "Produce", "confidence": "high", "freshness": "fresh"}]}
If no food items are visible, return: {"items": []}"""

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": vision_prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
            ],
        }
    ]

    raw_text = ""

    # Attempt 1: Use response_format json_object (fastest, cleanest)
    try:
        response = groq_client.chat.completions.create(
            model="qwen/qwen3.6-27b",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2048,
        )
        raw_text = response.choices[0].message.content.strip()
        print(f"   [AI] JSON mode response received ({len(raw_text)} chars)")
    except Exception as api_err:
        err_str = str(api_err)
        print(f"   [WARN] JSON mode failed: {err_str[:200]}")

        # Attempt 2: Retry WITHOUT json_object constraint (handles low-quality images)
        if "json_validate_failed" in err_str or "400" in err_str:
            print("   [RETRY] Retrying without json_object constraint...")
            try:
                # Add explicit no-thinking instruction for the retry
                retry_messages = [
                    {"role": "system", "content": "Do NOT use <think> tags. Output the JSON directly with no preamble."},
                    *messages,
                ]
                response = groq_client.chat.completions.create(
                    model="qwen/qwen3.6-27b",
                    messages=retry_messages,
                    temperature=0.1,
                    max_tokens=4096,
                )
                raw_text = response.choices[0].message.content.strip()
                print(f"   [AI] Fallback response received ({len(raw_text)} chars)")
            except Exception as retry_err:
                print(f"   [ERROR] Retry also failed: {retry_err}")
                return []
        else:
            return []

    # ── Parse response ──
    # Strip <think>...</think> blocks from thinking models
    import re
    raw_text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL).strip()

    # Strip markdown code fences
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[-1]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

    items_data = []

    # Try parsing as JSON directly
    try:
        parsed = json.loads(raw_text)
        if isinstance(parsed, dict) and "items" in parsed:
            items_data = parsed["items"]
        elif isinstance(parsed, list):
            items_data = parsed
    except json.JSONDecodeError:
        # Try extracting JSON array from within the text
        start = raw_text.find("[")
        end = raw_text.rfind("]") + 1
        if start != -1 and end > start:
            try:
                items_data = json.loads(raw_text[start:end])
            except json.JSONDecodeError:
                print(f"   [WARN] Could not parse JSON from response: {raw_text[:300]}")
                return []
        else:
            print(f"   [WARN] No JSON array found in response: {raw_text[:300]}")
            return []

    # Convert raw dicts to validated Pydantic DetectedItem objects.
    detected_items = []
    if isinstance(items_data, list):
        for item in items_data:
            if not isinstance(item, dict):
                continue
            try:
                detected_items.append(DetectedItem(
                    name=str(item.get("name", "Unknown Item")),
                    quantity=str(item.get("quantity", "1")),
                    category=str(item.get("category", "Produce")),
                    confidence=str(item.get("confidence", "high")),
                    freshness=str(item.get("freshness", "fresh"))
                ))
            except Exception as item_err:
                print(f"   [WARN] Skipped malformed item ({item_err}): {item}")
                continue

    return detected_items


# ──────────────────────────────────────────────────────────────────────────────
# FEATURE 1: STATIC IMAGE SCANNER (REST API)
# ──────────────────────────────────────────────────────────────────────────────
#
# Endpoint: POST /scan-image
# Input:    A single image file (JPEG, PNG, etc.)
# Output:   JSON list of detected food items
#
# Flow:
#   1. Receive uploaded image file
#   2. Read raw bytes into memory
#   3. Pre-process with OpenCV (resize, contrast, encode)
#   4. Send to Groq Vision API
#   5. Parse response and return structured JSON
# ──────────────────────────────────────────────────────────────────────────────

@app.post(
    "/scan-image",
    response_model=ScanResponse,
    summary="Scan a fridge/pantry image",
    description="Upload a photo of your fridge or pantry. The AI will identify all visible food items.",
    tags=["Scanner"],
)
async def scan_image(
    file: UploadFile = File(..., description="Image file to scan (JPEG, PNG)")
):
    """
    Accepts an uploaded image, processes it with OpenCV, sends it to the
    Groq Vision model, and returns a list of detected food items.
    """
    start_time = time.time()

    # ── Validate file type ──
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/bmp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: {', '.join(allowed_types)}"
        )

    print(f"\n[SCAN] Request received: {file.filename} ({file.content_type})")

    try:
        # ── Read file bytes into memory ──
        image_bytes = await file.read()
        print(f"   [INFO] File size: {len(image_bytes) // 1024} KB")

        # ── Pre-process the image with OpenCV ──
        base64_image = preprocess_image(image_bytes)

        # ── Send to Groq Vision API for food detection ──
        print("   [AI] Sending to Groq Vision API...")
        detected_items = analyze_image_with_groq(base64_image)

        elapsed_ms = (time.time() - start_time) * 1000
        print(f"   [OK] Detected {len(detected_items)} items in {elapsed_ms:.0f}ms")

        return ScanResponse(
            success=True,
            items=detected_items,
            message=f"Detected {len(detected_items)} food items",
            processing_time_ms=round(elapsed_ms, 2),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"   [ERROR] {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


# ──────────────────────────────────────────────────────────────────────────────
# FEATURE 2: REAL-TIME LIVE CAMERA SCANNER (WEBSOCKET)
# ──────────────────────────────────────────────────────────────────────────────
#
# Endpoint: WebSocket /ws/scan-live
#
# How it works:
#   1. Frontend captures webcam frames and sends them as binary over WS.
#   2. Backend receives frames continuously but only processes 1 frame
#      every 2.5 seconds (throttling) to avoid Groq API rate limits.
#   3. Each processed frame is sent to the Vision API.
#   4. Results are sent back to the frontend as JSON messages.
#
# Throttling is essential because:
#   - Webcams send 15-30 frames per second
#   - Groq's API has rate limits (requests per minute)
#   - Processing every frame would be wasteful and expensive
#   - 1 frame every 2.5s gives real-time feel without hitting limits
# ──────────────────────────────────────────────────────────────────────────────

# Throttle interval in seconds: minimum time between API calls.
LIVE_SCAN_THROTTLE_SECONDS = 2.5

@app.websocket("/ws/scan-live")
async def websocket_live_scan(websocket: WebSocket):
    """
    WebSocket endpoint for real-time fridge scanning via webcam.

    Protocol:
        Client → Server:  Binary frames (raw JPEG/PNG bytes from webcam)
        Server → Client:  JSON messages with detected items

    The server maintains an open connection and processes frames at a
    throttled rate to balance real-time feedback with API limits.
    """
    await websocket.accept()
    print("\n[WS] Live scan WebSocket connected")

    # Track the timestamp of the last processed frame for throttling.
    last_processed_time = 0.0

    # Count frames for logging purposes.
    frame_count = 0
    processed_count = 0

    try:
        while True:
            # ── Receive a binary frame from the frontend ──
            # websocket.receive_bytes() blocks until data arrives.
            # The frontend sends raw image bytes (usually JPEG-encoded).
            frame_bytes = await websocket.receive_bytes()
            frame_count += 1

            # ── Throttle Check ──
            # Only process this frame if enough time has passed since the last one.
            # This prevents us from flooding the Groq API with requests.
            current_time = time.time()
            elapsed_since_last = current_time - last_processed_time

            if elapsed_since_last < LIVE_SCAN_THROTTLE_SECONDS:
                # Skip this frame — too soon since the last API call.
                # We don't send any response; the frontend keeps its previous state.
                continue

            # ── Process this frame ──
            last_processed_time = current_time
            processed_count += 1
            print(f"\n   [FRAME] Processing frame #{processed_count} (received #{frame_count})")

            try:
                # Pre-process with OpenCV (resize, contrast, encode to base64)
                base64_image = preprocess_image(frame_bytes)

                # Send to Groq Vision API
                detected_items = analyze_image_with_groq(base64_image)

                # Send results back to the frontend as JSON
                result = {
                    "type": "scan_result",
                    "items": [item.model_dump() for item in detected_items],
                    "frame_number": processed_count,
                    "timestamp": current_time,
                }
                await websocket.send_json(result)

                print(f"   [OK] Sent {len(detected_items)} items to client")

            except Exception as e:
                # Send error message but keep the connection open.
                # One bad frame shouldn't kill the entire session.
                error_msg = {
                    "type": "error",
                    "message": f"Frame processing failed: {str(e)}",
                    "frame_number": processed_count,
                }
                await websocket.send_json(error_msg)
                print(f"   [WARN] Frame error: {str(e)}")

    except WebSocketDisconnect:
        # Client closed the connection (navigated away, closed tab, etc.)
        print(f"\n[WS] Live scan disconnected. Processed {processed_count}/{frame_count} frames.")

    except Exception as e:
        print(f"\n[ERROR] WebSocket error: {str(e)}")
        # Attempt to close the connection gracefully
        try:
            await websocket.close(code=1011, reason=str(e))
        except Exception:
            pass


# ──────────────────────────────────────────────────────────────────────────────
# FEATURE 3: RECIPE GENERATOR (REST API)
# ──────────────────────────────────────────────────────────────────────────────
#
# Endpoint: POST /generate-recipe
# Input:    JSON body with a list of ingredient names
# Output:   2 creative recipes that use ONLY those ingredients + staples
#
# Key constraint: The AI must NOT invent ingredients the user doesn't have.
# It may assume standard household staples (salt, pepper, oil, water, etc.)
# but nothing else. This enforces the "zero waste" philosophy.
# ──────────────────────────────────────────────────────────────────────────────

@app.post(
    "/generate-recipe",
    response_model=RecipeResponse,
    summary="Generate recipes from ingredients",
    description="Provide a list of available ingredients and receive 2 AI-generated recipes.",
    tags=["Recipes"],
)
async def generate_recipe(request: RecipeRequest):
    """
    Takes a list of ingredient names and generates 2 creative recipes
    that strictly use only those ingredients plus common household staples.
    """

    if not groq_client:
        raise HTTPException(
            status_code=500,
            detail="Groq API key not configured. Add GROQ_API_KEY to your .env file."
        )

    print(f"\n[RECIPE] Request: {len(request.ingredients)} ingredients")
    print(f"   [LIST] {', '.join(request.ingredients)}")

    # ── Build the recipe generation prompt ──
    # The system prompt enforces strict constraints.
    # The user message contains the actual ingredient list.

    system_prompt = """You are an expert master chef AI specializing in authentic Indian Cuisine & Global Fusion for the app "What's In My Fridge?".
Your mission: create mouthwatering, authentic recipes prioritizing **Indian Cuisine** options while using ONLY the ingredients the user has, reducing food waste.

STRICT RULES:
1. You MUST use ONLY the ingredients provided by the user.
2. You MAY assume these standard kitchen staples & Indian spices are available: salt, black pepper, turmeric powder, red chili powder, cumin seeds, mustard seeds, coriander powder, garam masala, ginger, garlic, vegetable oil, ghee, butter, water, sugar, flour.
3. **MUST GENERATE INDIAN CUISINE**: At least ONE of the generated recipes MUST be an authentic Indian food dish (e.g. Paneer Tikka Masala, Aloo Gobi, Dal Tadka, Chana Masala, Vegetable Biryani, Palak Paneer, Egg Curry, Kadai Veg, Jeera Rice, Masala Omelette, Pav Bhaji, Raita, Pulao).
4. Generate exactly 2 recipe options — one quick & easy everyday dish, and one elevated rich traditional dish.
5. Include "Indian" tag in the `tags` array for Indian dishes, and "Vegetarian" if no meat/fish is used.
6. Calculate `uses_expiring_items_count` for how many perishable/expiring ingredients are incorporated.

OUTPUT FORMAT: Respond with ONLY a valid JSON array of exactly 2 recipe objects. No markdown preamble, no explanation, no code fences.

Each recipe object must have these exact keys:
{
  "title": "Recipe Name (e.g. Authentic Paneer Butter Masala)",
  "description": "A mouthwatering 1-2 sentence description",
  "prep_time": "10 min",
  "cook_time": "15 min",
  "servings": 2,
  "difficulty": "Easy",
  "calories_estimate": 380,
  "uses_expiring_items_count": 2,
  "ingredients_used": ["ingredient1", "ingredient2"],
  "staples_needed": ["turmeric", "cumin", "oil"],
  "steps": [
    {"step_number": 1, "instruction": "Heat oil in a pan...", "duration_minutes": 3},
    {"step_number": 2, "instruction": "Add spices and saute...", "duration_minutes": 5}
  ],
  "tags": ["Indian", "Vegetarian", "Quick"]
}"""

    user_message = f"""Here are my current pantry ingredients:

{json.dumps(request.ingredients, indent=2)}

Cuisine preference: {request.cuisine_preference or 'Indian'}

Generate 2 delicious recipe options (prioritizing authentic Indian food items)."""

    try:
        # ── Call the Groq Text API ──
        # We use a fast text model (not vision) since we're just working with text.
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",   # Fast text model for quick recipe generation
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,     # Moderate creativity — not too random, not too rigid
            max_tokens=3000,     # Recipes can be lengthy with step-by-step instructions
        )

        raw_text = response.choices[0].message.content.strip()

        # ── Parse the JSON response ──
        # Strip markdown code fences if the model wraps the JSON.
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[-1]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()

        try:
            recipes_data = json.loads(raw_text)
        except json.JSONDecodeError:
            # Attempt to extract JSON array from the response
            start = raw_text.find("[")
            end = raw_text.rfind("]") + 1
            if start != -1 and end > start:
                recipes_data = json.loads(raw_text[start:end])
            else:
                raise ValueError("Could not parse recipe response as JSON")

        # Convert raw dicts to validated Pydantic GeneratedRecipe objects.
        recipes = []
        for recipe_data in recipes_data[:2]:  # Limit to 2 recipes max
            try:
                recipes.append(GeneratedRecipe(**recipe_data))
            except Exception as e:
                print(f"   [WARN] Skipped malformed recipe: {e}")
                continue

        print(f"   [OK] Generated {len(recipes)} recipes")

        return RecipeResponse(
            success=True,
            recipes=recipes,
            message=f"Generated {len(recipes)} recipes from {len(request.ingredients)} ingredients",
        )

    except json.JSONDecodeError as e:
        print(f"   [ERROR] JSON parse error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response as valid JSON")
    except Exception as e:
        print(f"   [ERROR] {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Recipe generation failed: {str(e)}")


# ──────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK & ROOT ENDPOINT
# ──────────────────────────────────────────────────────────────────────────────

@app.get(
    "/",
    summary="Health check",
    tags=["System"],
)
async def root():
    """Root endpoint — confirms the API is running and shows configuration status."""
    return {
        "app": "What's In My Fridge? — API",
        "status": "running",
        "version": "1.0.0",
        "groq_configured": GROQ_API_KEY is not None,
        "endpoints": {
            "scan_image": "POST /scan-image",
            "live_scan": "WS /ws/scan-live",
            "generate_recipe": "POST /generate-recipe",
            "docs": "GET /docs",
        },
    }


@app.get(
    "/health",
    summary="Health check",
    tags=["System"],
)
async def health_check():
    """Simple health check for monitoring and load balancers."""
    return {"status": "healthy", "groq_configured": GROQ_API_KEY is not None}


# ──────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────────────────────────────
#
# This block runs when you execute the file directly: python main.py
# It starts the Uvicorn ASGI server on port 8000.
#
# For development, use:  uvicorn main:app --reload --port 8000
# The --reload flag auto-restarts the server when you edit code.
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 60)
    print("  What's In My Fridge? -- Backend Server")
    print("=" * 60)
    print(f"  Groq API Key: {'[OK] Configured' if GROQ_API_KEY else '[!] Missing'}")
    print(f"  Docs:         http://localhost:8000/docs")
    print(f"  Health:       http://localhost:8000/health")
    print("=" * 60 + "\n")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",    # Listen on all network interfaces
        port=8000,          # Port number
        reload=True,        # Auto-reload on file changes (dev only)
    )
