import { useState, useEffect, useCallback } from "react";
import { fetchServicePricing, getCachedServicePricing } from "../services/pricingService";

export function usePricing(serviceType = "walker") {
  const cached = getCachedServicePricing(serviceType);
  const [pricing, setPricing] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  const loadPricing = useCallback(async () => {
    if (!serviceType) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchServicePricing(serviceType);
      setPricing(data);
    } catch (err) {
      setError(err.message || "Could not load pricing");
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  return {
    price: pricing?.price ?? null,
    subscriptionPrice: pricing?.subscriptionPrice ?? null,
    pricing,
    loading,
    error,
    refetch: loadPricing,
  };
}
