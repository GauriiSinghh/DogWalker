import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { API_BASE } from "../config/api.js";
import "../styles/modal-base.css";
import "../styles/signup.css";

const MAX_PET_IMAGE_SIZE = 2 * 1024 * 1024;

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
    created_at: pet.created_at,
    updated_at: pet.updated_at,
  };
}

async function readError(res, fallback) {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (data.detail?.errors) return Object.values(data.detail.errors).join(", ");
    if (Array.isArray(data.detail)) return data.detail.map((e) => e.msg).join(", ");
    if (data.message) return data.message;
  } catch {
    // ignore
  }
  return fallback;
}

export default function AddPetModal({
  open,
  mode = "add",
  pet = null,
  onClose,
  onSaved,
}) {
  const [name, setName] = useState("");
  const [petImage, setPetImage] = useState("");
  const [preview, setPreview] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [imageError, setImageError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = mode === "edit" && pet?.id;

 useEffect(() => {
    if (!open) return;

    const initialise = () => {
        setName(isEdit ? pet.name : "");
        const img = isEdit ? (pet.pet_image || pet.image_url || "") : "";
        setPetImage(img);
        setPreview(img);
    };

    initialise();
}, [open, isEdit, pet]);

  useEffect(() => {
    if (!open) return;

    function handleKey(e) {
      if (e.key === "Escape" && !saving) onClose?.();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, saving]);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    setImageError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please upload an image file");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PET_IMAGE_SIZE) {
      setImageError("Image must be smaller than 2 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setImageError("Could not read image file");
    };
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPetImage(result);
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setFormError("");
    setShowErrors(true);

    if (name.trim().length < 2) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(
        isEdit ? `${API_BASE}/pets/${pet.id}` : `${API_BASE}/pets`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            name: name.trim(),
            pet_image: petImage || "",
          }),
        }
      );

      if (!res.ok) {
        throw new Error(await readError(res, "Could not save pet"));
      }

      const data = await res.json();
      onSaved?.(normalizePet(data));
    } catch (err) {
      setFormError(err.message || "Could not save pet");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => {
            if (!saving) onClose?.();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5000,
            background: "rgba(15, 23, 42, 0.48)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <motion.div
            className="auth-card"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              maxWidth: 520,
              width: "100%",
              borderRadius: 24,
              overflow: "hidden",
            }}
          >
            <div
              className="auth-header"
              style={{
                padding: "22px 28px 16px",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {isEdit ? "Edit Pet" : "Add New Pet"}
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
                  Save your pet details for faster bookings.
                </p>
              </div>

              <button
                type="button"
                className="auth-close"
                aria-label="Close"
                onClick={() => {
                  if (!saving) onClose?.();
                }}
                disabled={saving}
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form
              className="auth-body auth-form"
              onSubmit={handleSubmit}
              noValidate
              style={{ padding: "28px", gap: 20 }}
            >
              {formError && <div className="global-error">{formError}</div>}

              <div className="form-group">
                <label className="form-label">Pet Name</label>
                <input
                  className={`form-input ${
                    showErrors && name.trim().length < 2 ? "invalid" : ""
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bruno"
                  disabled={saving}
                />
                {showErrors && name.trim().length < 2 && (
                  <div className="field-error-msg">
                    Enter a valid pet name
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Pet Image</label>
                <div className="pet-image-upload">
                  <input
                    id="pet-modal-image"
                    type="file"
                    accept="image/*"
                    className="pet-image-input"
                    onChange={handleImageChange}
                    disabled={saving}
                  />
                  <label
                    htmlFor="pet-modal-image"
                    className="pet-image-label"
                    style={{ height: 160, borderRadius: 18 }}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Pet preview"
                        className="pet-image-preview"
                        style={{
                          height: 160,
                          width: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "0.9rem" }}>
                        Upload a pet photo
                      </span>
                    )}
                  </label>
                </div>
                {imageError && (
                  <div className="field-error-msg">{imageError}</div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                  style={{
                    minHeight: 44,
                    padding: "10px 24px",
                    width: "auto",
                  }}
                >
                  {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Pet"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onClose?.()}
                  disabled={saving}
                  style={{ height: 44, width: "auto" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}