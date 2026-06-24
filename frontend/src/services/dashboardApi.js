// src/services/dashboardApi.js
// Dashboard-specific API calls (revenue stats + daily revenue chart data)
import { API_BASE } from "../config/api.js";

function authHeaders() {
  const token = localStorage.getItem("adminToken");
  return { Authorization: `Bearer ${token}` };
}

/**
 * GET /api/dashboard/revenue
 * -> { total_revenue: number, currency: string }
 */
export async function getTotalRevenue() {
  const res = await fetch(`${API_BASE}/api/dashboard/revenue`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not load revenue");
  return res.json();
}

/**
 * GET /api/dashboard/revenue-daily?days=30
 * -> [{ date: string, revenue: number }]
 */
export async function getDailyRevenue(days = 30) {
  const res = await fetch(
    `${API_BASE}/api/dashboard/revenue-daily?days=${days}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Could not load daily revenue");
  return res.json();
}

/**
 * GET /api/dashboard/stats
 * -> { total_bookings: number, new_bookings: number, assigned_bookings: number, completed_bookings: number }
 */
export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not load dashboard stats");
  return res.json();
}