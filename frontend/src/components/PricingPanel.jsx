import { useState, useEffect } from "react";
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { getAllAdminPricings, updateAdminPricing } from "../services/adminApi";
import "../styles/admin.css";

const SERVICES = [
  { key: "walker", label: "Walker Service", icon: "🐕", description: "Standard 10-minute / 30-minute dog walking" },
  { key: "boarding", label: "Boarding Service", icon: "🏠", description: "Overnight pet stay and care" },
  { key: "grooming", label: "Grooming Service", icon: "✂️", description: "Bath, haircut, nail trimming" },
  { key: "vet", label: "Vet Consultation", icon: "🩺", description: "Home vet visit or online consultation" },
  { key: "vaccination", label: "Vaccination Service", icon: "💉", description: "Routine immunization and booster doses" },
  { key: "pathology", label: "Pathology Tests", icon: "🧪", description: "Blood work, lab tests, health screening" },
  { key: "sitter", label: "Pet Sitter", icon: "🐾", description: "In-home pet care and companionship" },
];

export default function PricingPanel() {
  const [pricings, setPricings] = useState({});
  const [formState, setFormState] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [messages, setMessages] = useState({});
  const [globalError, setGlobalError] = useState("");

  const loadPricings = async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const data = await getAllAdminPricings();
      setPricings(data || {});
      const initialForm = {};
      SERVICES.forEach(({ key }) => {
        const item = data?.[key] || {};
        initialForm[key] = {
          price: item.price !== undefined ? String(item.price) : "",
          subscription_price: item.subscription_price !== undefined ? String(item.subscription_price) : "",
        };
      });
      setFormState(initialForm);
    } catch (err) {
      setGlobalError(err.message || "Failed to load pricing configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricings();
  }, []);

  const handleChange = (key, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
    // Clear message on change
    setMessages((prev) => ({ ...prev, [key]: null }));
  };

  const handleSave = async (key) => {
    const current = formState[key];
    const priceNum = Number(current?.price);
    const subPriceNum = Number(current?.subscription_price);

    if (current?.price === "" || current?.subscription_price === "") {
      setMessages((prev) => ({
        ...prev,
        [key]: { type: "error", text: "Both price and subscription price are required." },
      }));
      return;
    }

    if (Number.isNaN(priceNum) || Number.isNaN(subPriceNum)) {
      setMessages((prev) => ({
        ...prev,
        [key]: { type: "error", text: "Please enter valid numeric amounts." },
      }));
      return;
    }

    if (priceNum < 0 || subPriceNum < 0) {
      setMessages((prev) => ({
        ...prev,
        [key]: { type: "error", text: "Prices cannot be negative numbers." },
      }));
      return;
    }

    setSavingKey(key);
    setMessages((prev) => ({ ...prev, [key]: null }));

    try {
      const updated = await updateAdminPricing(key, {
        price: Math.round(priceNum),
        subscription_price: Math.round(subPriceNum),
      });

      setPricings((prev) => ({ ...prev, [key]: updated }));
      setFormState((prev) => ({
        ...prev,
        [key]: {
          price: String(updated.price),
          subscription_price: String(updated.subscription_price),
        },
      }));
      setMessages((prev) => ({
        ...prev,
        [key]: { type: "success", text: "Pricing saved successfully!" },
      }));
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        [key]: { type: "error", text: err.message || "Failed to save pricing." },
      }));
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="pricing-panel pricing-panel--loading">
        <FiRefreshCw className="pricing-panel__spinner" size={24} />
        <p>Loading pricing configurations...</p>
      </div>
    );
  }

  return (
    <div className="pricing-panel">
      {globalError && (
        <div className="pricing-panel__global-error">
          <FiAlertCircle size={18} />
          <span>{globalError}</span>
          <button type="button" onClick={loadPricings} className="pricing-panel__retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="pricing-panel__grid">
        {SERVICES.map(({ key, label, icon, description }) => {
          const state = formState[key] || { price: "", subscription_price: "" };
          const isSaving = savingKey === key;
          const msg = messages[key];
          const dbItem = pricings[key];

          return (
            <div key={key} className="pricing-card">
              <div className="pricing-card__header">
                <div className="pricing-card__title-wrap">
                  <span className="pricing-card__icon">{icon}</span>
                  <div>
                    <h3 className="pricing-card__title">{label}</h3>
                    <p className="pricing-card__desc">{description}</p>
                  </div>
                </div>
                {dbItem?.is_active && <span className="pricing-card__badge">Active</span>}
              </div>

              <div className="pricing-card__body">
                <div className="pricing-card__field">
                  <label htmlFor={`price-${key}`} className="pricing-card__label">
                    Base Price (₹)
                  </label>
                  <div className="pricing-card__input-wrap">
                    <span className="pricing-card__prefix">₹</span>
                    <input
                      id={`price-${key}`}
                      type="number"
                      min="0"
                      step="1"
                      className="pricing-card__input"
                      value={state.price}
                      onChange={(e) => handleChange(key, "price", e.target.value)}
                      placeholder="e.g. 299"
                    />
                  </div>
                </div>

                <div className="pricing-card__field">
                  <label htmlFor={`sub-price-${key}`} className="pricing-card__label">
                    Subscription Price (₹)
                  </label>
                  <div className="pricing-card__input-wrap">
                    <span className="pricing-card__prefix">₹</span>
                    <input
                      id={`sub-price-${key}`}
                      type="number"
                      min="0"
                      step="1"
                      className="pricing-card__input"
                      value={state.subscription_price}
                      onChange={(e) => handleChange(key, "subscription_price", e.target.value)}
                      placeholder="e.g. 249"
                    />
                  </div>
                </div>
              </div>

              {msg && (
                <div className={`pricing-card__msg pricing-card__msg--${msg.type}`}>
                  {msg.type === "success" ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="pricing-card__footer">
                <button
                  type="button"
                  className="pricing-card__save-btn"
                  onClick={() => handleSave(key)}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Pricing"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
