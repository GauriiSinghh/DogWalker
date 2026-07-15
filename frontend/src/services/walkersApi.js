const API_BASE =
  (import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "https://dogwalkerbackend1.onrender.com").replace(/\/$/, "");

function getToken() {
  return (
    localStorage.getItem("admin_token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const err = new Error(data?.detail || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getWalkers({ available = false, bookingId = null } = {}) {
  const qs = new URLSearchParams();
  if (available) qs.set("available", "true");
  if (bookingId != null) qs.set("booking_id", String(bookingId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/walkers${suffix}`);
}

export function validateWalkerUnique({ name, email, mobile_number, exclude_walker_id } = {}) {
  const qs = new URLSearchParams();
  if (name) qs.set("name", name);
  if (email) qs.set("email", email);
  if (mobile_number) qs.set("mobile_number", mobile_number);
  if (exclude_walker_id != null) qs.set("exclude_walker_id", String(exclude_walker_id));
  return request(`/walkers/validate?${qs.toString()}`);
}

export function createWalker(payload) {
  return request(`/walkers`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateWalker(walkerId, payload) {
  return request(`/walkers/${walkerId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteWalker(walkerId) {
  return request(`/walkers/${walkerId}`, { method: "DELETE" });
}