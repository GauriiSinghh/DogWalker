import { API_BASE } from "../config/api";

const cache = new Map();

export async function fetchServicePricing(serviceType) {
  const serviceKey = String(serviceType).trim().toLowerCase();

  const res = await fetch(`${API_BASE}/pricing/${serviceKey}`);

  if (!res.ok) {
    let msg = "Failed to fetch pricing";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") msg = data.detail;
    } catch {
      // fallback
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const pricingData = {
    price: data.price,
    subscriptionPrice: data.subscription_price,
  };

  cache.set(serviceKey, pricingData);
  return pricingData;
}

export function getCachedServicePricing(serviceType) {
  const serviceKey = String(serviceType).trim().toLowerCase();
  return cache.get(serviceKey) || null;
}
