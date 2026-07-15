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

export async function cancelBooking(bookingId, reason = null, cancelledBy = "customer") {
  const body = { reason, cancelled_by: cancelledBy };
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Could not cancel booking");
  }
  return data;
}

export function getBookingsWebSocketUrl() {
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}/ws/bookings`;
}
