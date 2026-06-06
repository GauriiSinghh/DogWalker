// Central API base — set VITE_API_URL in .env for production
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8000"
    : "https://dogwalkerbackend1.onrender.com");