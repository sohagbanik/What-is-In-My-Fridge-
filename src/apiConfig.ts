// ============================================================================
// Centralized API Configuration
// ============================================================================
// All frontend API calls go through this config so the backend URL
// is defined in one place. Change this when deploying to production.
// ============================================================================

// The FastAPI backend URL. In development, it runs on port 8000.
export const API_BASE_URL = "http://localhost:8000";

// WebSocket base URL (same host, ws:// protocol).
export const WS_BASE_URL = "ws://localhost:8000";

// Convenience endpoint constants
export const ENDPOINTS = {
  SCAN_IMAGE: `${API_BASE_URL}/scan-image`,
  GENERATE_RECIPE: `${API_BASE_URL}/generate-recipe`,
  LIVE_SCAN_WS: `${WS_BASE_URL}/ws/scan-live`,
  HEALTH: `${API_BASE_URL}/health`,
} as const;
