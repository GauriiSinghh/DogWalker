import { API_BASE } from "../config/api.js";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMyBookings() {
  const res = await fetch(`${API_BASE}/api/bookings/my`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Could not load bookings");
  }
  return res.json();
}
