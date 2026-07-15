import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaPaw, FaPlus } from "react-icons/fa";
import { API_BASE } from "../config/api.js";
import AddPetModal from "./AddPetModal.jsx";
import "../styles/signup.css";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizePet(pet) {
  return {
    id: pet.id,
    user_id: pet.user_id,
    name: pet.name || pet.pet_name || "",
    pet_image: pet.pet_image || pet.image_url || "",
    image_url: pet.image_url || pet.pet_image || "",
  };
}

async function readError(res, fallback) {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map((e) => e.msg).join(", ");
    if (data.message) return data.message;
  } catch {
    // ignore
  }
  return fallback;
}

export default function SelectPetStep({
  selectedPetId,
  onSelectPet,
  onBack,
  onContinue,
  continueLabel = "Continue to Payment",
  backLabel = "Back",
}) {
  const controlled = selectedPetId !== undefined;
  const [internalSelectedPetId, setInternalSelectedPetId] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [selectionError, setSelectionError] = useState("");

  const activePetId = controlled ? selectedPetId : internalSelectedPetId;

  const selectedPet = useMemo(
    () => pets.find((p) => Number(p.id) === Number(activePetId)) || null,
    [pets, activePetId]
  );

  const loadPets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/pets`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await readError(res, "Could not load pets"));
      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map(normalizePet) : [];
      setPets(normalized);

      if (!activePetId && normalized.length === 1) {
        choosePet(normalized[0]);
      }
    } catch (err) {
      setError(err.message || "Could not load pets");
    } finally {
      setLoading(false);
    }
  }, [activePetId]);

 useEffect(() => {
    void loadPets();
}, [loadPets]);

  function choosePet(pet) {
    setSelectionError("");
    if (!controlled) setInternalSelectedPetId(pet.id);
    onSelectPet?.(pet);
  }

  async function handleSavedPet(pet) {
    const normalized = normalizePet(pet);
    setPetModalOpen(false);
    await loadPets();
    choosePet(normalized);
  }

  function handleContinue() {
    if (!selectedPet) {
      setSelectionError("Please select a pet to continue.");
      return;
    }
    onContinue?.(selectedPet);
  }

  return (
    <div className="auth-body" style={{ padding: "32px 32px 40px", gap: 24 }}>
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "1.55rem",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#0f172a",
          }}
        >
          Select Pet
        </h1>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
          Choose one saved pet for this booking.
        </p>
      </div>

      {error && <div className="global-error">{error}</div>}
      {selectionError && <div className="global-error">{selectionError}</div>}

      {loading ? (
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading pets...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {pets.map((pet) => {
            const active = Number(activePetId) === Number(pet.id);

            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => choosePet(pet)}
                style={{
                  textAlign: "left",
                  border: active
                    ? "2px solid var(--z-primary)"
                    : "1px solid rgba(15, 23, 42, 0.08)",
                  borderRadius: 18,
                  background: active ? "rgba(249, 115, 22, 0.05)" : "#fff",
                  padding: 14,
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 14px 30px rgba(249, 115, 22, 0.16)"
                    : "0 10px 24px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  position: "relative",
                  minHeight: 230,
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--z-primary)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 18px rgba(249, 115, 22, 0.28)",
                    }}
                  >
                    <FaCheck size={13} />
                  </span>
                )}

                <div
                  style={{
                    height: 135,
                    borderRadius: 16,
                    background: "rgba(249, 115, 22, 0.08)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--z-primary)",
                  }}
                >
                  {pet.pet_image ? (
                    <img
                      src={pet.pet_image}
                      alt={pet.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <FaPaw size={34} />
                  )}
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 900, color: "#0f172a" }}>
                    {pet.name}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                    {active ? "Selected for this booking" : "Tap to select"}
                  </p>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setPetModalOpen(true)}
            className="btn btn-outline"
            style={{
              minHeight: 230,
              borderRadius: 18,
              borderStyle: "dashed",
              background: "rgba(249, 115, 22, 0.03)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "var(--z-primary)",
            }}
          >
            <FaPlus size={26} />
            <span style={{ fontWeight: 900 }}>Add New Pet</span>
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        <button
          type="button"
          className="btn btn-outline"
          onClick={onBack}
          style={{ height: 44, width: "auto", padding: "10px 22px" }}
        >
          {backLabel}
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handleContinue}
          disabled={!selectedPet}
          style={{ minHeight: 44, width: "auto", padding: "10px 24px" }}
        >
          {continueLabel}
        </button>
      </div>

      <AddPetModal
        open={petModalOpen}
        mode="add"
        onClose={() => setPetModalOpen(false)}
        onSaved={handleSavedPet}
      />
    </div>
  );
}