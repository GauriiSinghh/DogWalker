import { API_BASE } from "../config/api";

const API_URL = API_BASE;

export const getBookings = async () => {
  const token = localStorage.getItem("adminToken");

  const response = await fetch(`${API_URL}/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const updateBooking = async (id, data) => {
  const token = localStorage.getItem("adminToken");

  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
};