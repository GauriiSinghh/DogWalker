import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaPlus, FaArrowLeft } from "react-icons/fa";
import { API_BASE } from "../config/api.js";
import { cacheStore } from "../utils/cacheStore.js";
import AddPetModal from "./AddPetModal.jsx";
import "../styles/signup.css";
import "../styles/select-pet.css";

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

function getPetInitials(name) {
  if (!name) return "🐾";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Memoized presentational component for performance audit
const PetCard = React.memo(({ pet, active, onClick }) => {
  return (
    <motion.button
      type="button"
      onClick={() => onClick(pet)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`pet-card ${active ? "pet-card--active" : ""}`}
    >
      {active && (
        <span className="pet-card__badge">
          <FaCheck size={12} />
        </span>
      )}

      <div className="pet-card__avatar-wrap">
        {pet.pet_image ? (
          <img
            src={pet.pet_image}
            alt={pet.name}
            className="pet-card__image"
          />
        ) : (
          <div className="pet-card__initials">
            {getPetInitials(pet.name)}
          </div>
        )}
      </div>

      <div className="pet-card__info">
        <h3 className="pet-card__name">
          {pet.name}
        </h3>
        <p className="pet-card__status">
          {active ? "Selected" : "Tap to select"}
        </p>
      </div>
    </motion.button>
  );
});

PetCard.displayName = "PetCard";

export default function SelectPetStep({
  selectedPetId,
  onSelectPet,
  onBack,
  onContinue,
  continueLabel = "Continue to Payment",
  backLabel = "Back",
  submitting = false,
}) {
  const controlled = selectedPetId !== undefined;
  const [internalSelectedPetId, setInternalSelectedPetId] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(() => {
    const cached = cacheStore.get("pets");
    return !cached;
  });
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [selectionError, setSelectionError] = useState("");

  const activePetId = controlled ? selectedPetId : internalSelectedPetId;

  const selectedPet = useMemo(
    () => pets.find((p) => Number(p.id) === Number(activePetId)) || null,
    [pets, activePetId]
  );

  const choosePet = useCallback((pet) => {
    setSelectionError("");
    if (!controlled) setInternalSelectedPetId(pet.id);
    onSelectPet?.(pet);
  }, [controlled, onSelectPet]);

  const loadPets = useCallback(async (silent = false) => {
    if (!silent) {
      const cached = cacheStore.get("pets");
      if (cached) {
        setPets(cached.data);
        if (!activePetId && cached.data.length === 1) {
          choosePet(cached.data[0]);
        }
        if (!cached.isStale) {
          setLoading(false);
          return;
        }
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
    setError("");

    try {
      const data = await cacheStore.getOrFetch("pets", async () => {
        const res = await fetch(`${API_BASE}/pets`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await readError(res, "Could not load pets"));
        const petsData = await res.json();
        return Array.isArray(petsData) ? petsData.map(normalizePet) : [];
      });
      setPets(data);
      if (!activePetId && data.length === 1) {
        choosePet(data[0]);
      }
    } catch (err) {
      if (!cacheStore.get("pets")) {
        setError(err.message || "Could not load pets");
      }
    } finally {
      setLoading(false);
    }
  }, [activePetId, choosePet]);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  async function handleSavedPet(pet) {
    const normalized = normalizePet(pet);
    setPetModalOpen(false);
    cacheStore.delete("pets"); // invalidate pets cache
    await loadPets(true);
    choosePet(normalized);
  }

  function handleContinue() {
    if (!selectedPet) {
      setSelectionError("Please select a pet for this booking.");
      return;
    }
    onContinue?.(selectedPet);
  }

  return (
    <div
      className="select-pet-container"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        position: "relative",
      }}
    >
      <div className="auth-body" style={{ padding: "28px 24px 20px", gap: 20, flex: 1 }}>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.6rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#0f172a",
            }}
          >
            Select Your Pet
          </h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.925rem" }}>
            Choose the pet accompanying this walk request.
          </p>
        </div>

        {error && <div className="global-error">{error}</div>}
        {selectionError && <div className="global-error">{selectionError}</div>}

        {loading && pets.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 14, padding: "20px 0" }}>Loading your pets...</div>
        ) : (
          <div className="select-pet__grid">
            {pets.map((pet) => {
              const active = Number(activePetId) === Number(pet.id);
              return (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  active={active}
                  onClick={choosePet}
                />
              );
            })}

            <motion.button
              type="button"
              onClick={() => setPetModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pet-card__add-btn"
            >
              <div className="pet-card__add-icon">
                <FaPlus size={20} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>Add New Pet</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar (Fixed on mobile / always reachable) */}
      <div className="select-pet-footer">
        {onBack && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={onBack}
            disabled={submitting}
            style={{
              height: 46,
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            <FaArrowLeft size={13} />
            <span>{backLabel}</span>
          </button>
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={handleContinue}
          disabled={!selectedPet || submitting}
          style={{
            height: 46,
            padding: "0 24px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "0.95rem",
            marginLeft: onBack ? "auto" : 0,
            width: onBack ? "auto" : "100%",
            boxShadow: selectedPet ? "0 8px 20px rgba(249, 115, 22, 0.25)" : "none",
          }}
        >
          {submitting ? "Opening Payment..." : continueLabel}
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