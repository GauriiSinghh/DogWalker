// Central API base — set VITE_API_URL in .env for production
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000";