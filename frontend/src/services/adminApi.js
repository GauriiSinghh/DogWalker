import { API_BASE } from "../config/api";

const API_URL = API_BASE;

function authHeaders(json = false) {
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function parseResponse(response) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    const message =
      typeof data.detail === "string" ? data.detail : "Request failed";
    throw new Error(message);
  }
  return data;
}

export const getBookings = async () => {
  const response = await fetch(`${API_URL}/bookings`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
};

export const getWalkers = async ({ available = false, bookingId = null } = {}) => {
  const params = new URLSearchParams();
  if (available) params.set("available", "true");
  if (bookingId != null) params.set("booking_id", String(bookingId));

  const query = params.toString();
  const response = await fetch(
    `${API_URL}/walkers${query ? `?${query}` : ""}`,
    { headers: authHeaders() }
  );
  return parseResponse(response);
};

export const getWalker = async (id) => {
  const response = await fetch(`${API_URL}/walkers/${id}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
};

export const createWalker = async (data) => {
  const response = await fetch(`${API_URL}/walkers`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  return parseResponse(response);
};

export const deleteWalker = async (id) => {
  const response = await fetch(`${API_URL}/walkers/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parseResponse(response);
};

export const getCustomers = async () => {
  const response = await fetch(`${API_URL}/customers`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
};

export const getCustomerDetail = async (email) => {
  const params = new URLSearchParams({ email });
  const response = await fetch(`${API_URL}/customers/detail?${params}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
};

export const updateBooking = async (id, data) => {
  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  return parseResponse(response);
};
