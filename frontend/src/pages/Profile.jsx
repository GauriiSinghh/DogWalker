import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FaTimes, FaUser, FaPaw, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../components/Toast.jsx";
import { API_BASE } from "../config/api.js";
import { cacheStore } from "../utils/cacheStore.js";
import BookingHistoryPanel from "../components/BookingHistoryPanel.jsx";
import AddPetModal from "../components/AddPetModal.jsx";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";
import "../styles/signup.css";

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

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
    if (data.detail?.errors) return Object.values(data.detail.errors).join(", ");
    if (Array.isArray(data.detail)) return data.detail.map((e) => e.msg).join(", ");
    if (data.message) return data.message;
  } catch {
    // ignore
  }
  return fallback;
}

function Profile({ view = "profile" }) {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(() => {
    const cached = cacheStore.get("profile");
    return cached ? cached.data : {
      name: "",
      email: "",
      mobile: "",
      apartment: "",
      flatNo: "",
      address: "",
      pet_name: "",
      pet_image: "",
    };
  });

  const [loading, setLoading] = useState(() => {
    const cached = cacheStore.get("profile");
    return !cached;
  });
  const [loadError, setLoadError] = useState("");

  const [editPersonal, setEditPersonal] = useState(false);
  const [form, setForm] = useState(() => {
    const cached = cacheStore.get("profile");
    return cached ? {
      name: cached.data.name || "",
      email: cached.data.email || "",
      mobile: cached.data.mobile || "",
      apartment: cached.data.apartment || "",
      flatNo: cached.data.flatNo || "",
      address: cached.data.address || "",
    } : {
      name: "",
      email: "",
      mobile: "",
      apartment: "",
      flatNo: "",
      address: "",
    };
  });
  const [showErrors, setShowErrors] = useState(false);
  const [personalError, setPersonalError] = useState("");
  const [personalSuccess, setPersonalSuccess] = useState("");

  const [pets, setPets] = useState(() => {
    const cached = cacheStore.get("pets");
    return cached ? cached.data : [];
  });
  const [petsLoading, setPetsLoading] = useState(() => {
    const cached = cacheStore.get("pets");
    return !cached;
  });
  const [petsError, setPetsError] = useState("");
  const [petSuccess, setPetSuccess] = useState("");
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [petModalMode, setPetModalMode] = useState("add");
  const [editingPet, setEditingPet] = useState(null);
  const [deletingPetId, setDeletingPetId] = useState(null);

  const APARTMENTS = [
    "Sobha Dream Acres Apartment",
    "Prestige Shantiniketan",
    "Purva Fountain Square",
    "DLF Jigani",
  ];

  const syncPrimaryPet = useCallback(
    (list) => {
      const primary = list?.[0];
      updateUser({
        pet_name: primary?.name || "",
        pet_image: primary?.pet_image || "",
      });
    },
    [updateUser]
  );

  const loadPets = useCallback(async (silent = false) => {
    if (!silent) {
      const cached = cacheStore.get("pets");
      if (cached) {
        setPets(cached.data);
        syncPrimaryPet(cached.data);
        if (!cached.isStale) {
          setPetsLoading(false);
          return;
        }
        setPetsLoading(false);
      } else {
        setPetsLoading(true);
      }
    }
    setPetsError("");

    try {
      const data = await cacheStore.getOrFetch("pets", async () => {
        const res = await fetch(`${API_BASE}/pets`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await readError(res, "Could not load pets"));
        const petsData = await res.json();
        return Array.isArray(petsData) ? petsData.map(normalizePet) : [];
      });

      setPets(data);
      syncPrimaryPet(data);
    } catch (err) {
      if (!cacheStore.get("pets")) {
        setPetsError(err.message || "Could not load pets");
      }
    } finally {
      setPetsLoading(false);
    }
  }, [syncPrimaryPet]);

  const loadProfile = useCallback(async (silent = false) => {
    if (!silent) {
      const cached = cacheStore.get("profile");
      if (cached) {
        setProfile(cached.data);
        setForm({
          name: cached.data.name || "",
          email: cached.data.email || "",
          mobile: cached.data.mobile || "",
          apartment: cached.data.apartment || "",
          flatNo: cached.data.flatNo || "",
          address: cached.data.address || "",
        });
        if (!cached.isStale) {
          setLoading(false);
          return;
        }
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
    setLoadError("");

    try {
      const data = await cacheStore.getOrFetch("profile", async () => {
        const res = await fetch(`${API_BASE}/profile`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await readError(res, "Could not load profile"));
        return res.json();
      });

      setProfile(data);
      setForm({
        name: data.name || "",
        email: data.email || "",
        mobile: data.mobile || "",
        apartment: data.apartment || "",
        flatNo: data.flatNo || "",
        address: data.address || "",
      });

      updateUser({
        name: data.name || "",
        email: data.email || "",
        mobile: data.mobile || "",
        apartment: data.apartment || "",
        flatNo: data.flatNo || "",
        address: data.address || "",
        pet_name: data.pet_name || "",
        pet_image: data.pet_image || "",
      });
    } catch (err) {
      if (!cacheStore.get("profile")) {
        setLoadError(err.message || "Could not load profile");
      }
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProfile();
    loadPets();
  }, [loadProfile, loadPets]);

  function validatePersonal() {
    if (form.name.trim().length < 2) return false;
    if (!form.email || !form.email.includes("@")) return false;
    if (!/^(\+91|91)?[6-9]\d{9}$/.test(form.mobile.trim())) return false;
    if (!form.apartment) return false;
    if (!form.flatNo.trim()) return false;
    if (form.address.trim().length < 10) return false;
    return true;
  }

  function buildChangedFields() {
    const changed = {};
    ["name", "email", "mobile", "apartment", "flatNo", "address"].forEach((k) => {
      if (form[k] !== (profile?.[k] || "")) changed[k] = form[k];
    });
    return changed;
  }

  async function savePersonal() {
    setPersonalError("");
    setPersonalSuccess("");

    if (!validatePersonal()) {
      setShowErrors(true);
      return;
    }

    const changed = buildChangedFields();
    if (Object.keys(changed).length === 0) {
      setEditPersonal(false);
      return;
    }

    const previousData = { ...profile };
    const optimisticData = { ...profile, ...changed };

    setProfile(optimisticData);
    updateUser(changed);
    setEditPersonal(false);
    setShowErrors(false);

    try {
      let res;

      if (profile?.id != null) {
        res = await fetch(`${API_BASE}/api/users/${profile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(changed),
        });
      } else {
        res = await fetch(`${API_BASE}/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(changed),
        });
      }

      if (!res.ok) {
        throw new Error(await readError(res, "Update failed"));
      }

      const data = await res.json();
      const mergedData = { ...optimisticData, ...data };

      cacheStore.delete("profile");
      setProfile(mergedData);
      updateUser({
        name: mergedData.name,
        email: mergedData.email,
        mobile: mergedData.mobile,
        apartment: mergedData.apartment,
        flatNo: mergedData.flatNo,
        address: mergedData.address,
      });

      setPersonalSuccess("Profile updated!");
      setTimeout(() => setPersonalSuccess(""), 3000);
    } catch (err) {
      setProfile(previousData);
      updateUser({
        name: previousData.name,
        email: previousData.email,
        mobile: previousData.mobile,
        apartment: previousData.apartment,
        flatNo: previousData.flatNo,
        address: previousData.address,
      });
      setPersonalError(err.message || "Could not update profile");
      toast.error("Failed to update. Changes reverted.");
    }
  }

  function cancelPersonal() {
    setForm({
      name: profile.name || "",
      email: profile.email || "",
      mobile: profile.mobile || "",
      apartment: profile.apartment || "",
      flatNo: profile.flatNo || "",
      address: profile.address || "",
    });
    setShowErrors(false);
    setPersonalError("");
    setEditPersonal(false);
  }

  function openAddPetModal() {
    setEditingPet(null);
    setPetModalMode("add");
    setPetModalOpen(true);
  }

  function openEditPetModal(pet) {
    setEditingPet(pet);
    setPetModalMode("edit");
    setPetModalOpen(true);
  }

  function closePetModal() {
    setPetModalOpen(false);
    setEditingPet(null);
  }

  async function handlePetSaved() {
    closePetModal();
    cacheStore.delete("pets");
    await loadPets(true);

    setPetSuccess(petModalMode === "edit" ? "Pet updated!" : "Pet added!");
    setTimeout(() => setPetSuccess(""), 3000);
  }

  async function deletePet(pet) {
    const ok = window.confirm(`Delete ${pet.name}? This cannot be undone.`);
    if (!ok) return;

    const previousPets = [...pets];
    const optimisticPets = pets.filter((p) => p.id !== pet.id);

    setDeletingPetId(pet.id);
    setPets(optimisticPets);
    syncPrimaryPet(optimisticPets);
    setPetsError("");

    try {
      const res = await fetch(`${API_BASE}/pets/${pet.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) {
        throw new Error(await readError(res, "Could not delete pet"));
      }

      cacheStore.delete("pets");
      await loadPets(true);
      setPetSuccess("Pet deleted!");
      setTimeout(() => setPetSuccess(""), 3000);
    } catch (err) {
      setPets(previousPets);
      syncPrimaryPet(previousPets);
      setPetsError(err.message || "Could not delete pet");
      toast.error("Failed to delete pet.");
    } finally {
      setDeletingPetId(null);
    }
  }

  if (loadError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-body" style={{ padding: "40px 24px" }}>
            <div className="global-error">{loadError}</div>
            <button className="btn btn-outline" onClick={() => navigate("/")}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !profile?.name && view === "profile") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-body" style={{ padding: "40px 24px" }}>
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ padding: "40px 16px" }}>
      <motion.div
        className="auth-card"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        style={{
          maxWidth: view === "bookings" ? "960px" : "760px",
          width: "100%",
          marginBottom: 24,
          borderRadius: "24px",
          boxShadow: "0 20px 50px rgba(15, 17, 21, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          background: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <div
          className="auth-header"
          style={{
            padding: "24px 32px 16px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link to="/" className="auth-header-logo">
              <img src={logo} alt="Zuppy" style={{ height: "32px", width: "auto" }} />
            </Link>
          </div>
          <Link to="/" className="auth-close" aria-label="Close" style={{ textDecoration: "none" }}>
            <FaTimes size={16} />
          </Link>
        </div>

        {view === "profile" && (
          <div className="auth-body" style={{ padding: "32px 32px 40px", gap: "32px" }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.04)",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.01)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FaUser style={{ color: "var(--z-primary)", fontSize: "1.1rem" }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                    Personal Details
                  </h2>
                </div>
                {!editPersonal && (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => setEditPersonal(true)}
                    style={{ padding: "6px 14px", fontSize: "0.85rem", height: "auto" }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {personalError && <div className="global-error">{personalError}</div>}
              {personalSuccess && <div className="global-success">{personalSuccess}</div>}

              <form
                className="auth-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  savePersonal();
                }}
                noValidate
              >
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className={`form-input ${showErrors && form.name.trim().length < 2 ? "invalid" : ""}`}
                    value={form.name}
                    disabled={!editPersonal}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {showErrors && form.name.trim().length < 2 && (
                    <div className="field-error-msg">Enter your full name</div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      className={`form-input ${
                        showErrors && (!form.email || !form.email.includes("@")) ? "invalid" : ""
                      }`}
                      value={form.email}
                      disabled={!editPersonal}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    {showErrors && (!form.email || !form.email.includes("@")) && (
                      <div className="field-error-msg">Enter a valid email</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      className={`form-input ${
                        showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(form.mobile.trim()) ? "invalid" : ""
                      }`}
                      value={form.mobile}
                      disabled={!editPersonal}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    />
                    {showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(form.mobile.trim()) && (
                      <div className="field-error-msg">Enter valid mobile number</div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Apartment Complex</label>
                  <select
                    className={`form-select ${showErrors && !form.apartment ? "invalid" : ""}`}
                    value={form.apartment}
                    disabled={!editPersonal}
                    onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                  >
                    <option value="">-- Choose Apartment --</option>
                    {APARTMENTS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {showErrors && !form.apartment && (
                    <div className="field-error-msg">Please select an apartment</div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Flat / Villa Number</label>
                    <input
                      className={`form-input ${showErrors && !form.flatNo.trim() ? "invalid" : ""}`}
                      value={form.flatNo}
                      disabled={!editPersonal}
                      onChange={(e) => setForm({ ...form, flatNo: e.target.value })}
                    />
                    {showErrors && !form.flatNo.trim() && (
                      <div className="field-error-msg">Enter flat/villa number</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Detailed Address</label>
                    <input
                      className={`form-input ${
                        showErrors && form.address.trim().length < 10 ? "invalid" : ""
                      }`}
                      value={form.address}
                      disabled={!editPersonal}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                    {showErrors && form.address.trim().length < 10 && (
                      <div className="field-error-msg">
                        Please enter detailed address (min 10 chars)
                      </div>
                    )}
                  </div>
                </div>

                {editPersonal && (
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ minHeight: "44px", padding: "10px 24px", width: "auto" }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={cancelPersonal}
                      style={{ height: "44px", width: "auto" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.04)",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.01)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FaPaw style={{ color: "var(--z-primary)", fontSize: "1.1rem" }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                    My Pets
                  </h2>
                </div>

                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={openAddPetModal}
                  style={{ padding: "6px 14px", fontSize: "0.85rem", height: "auto" }}
                >
                  <FaPlus style={{ marginRight: 6 }} />
                  Add New Pet
                </button>
              </div>

              {petsError && <div className="global-error">{petsError}</div>}
              {petSuccess && <div className="global-success">{petSuccess}</div>}

              {petsLoading ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>Loading pets...</div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16,
                  }}
                >
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      style={{
                        border: "1px solid rgba(15, 23, 42, 0.08)",
                        borderRadius: 18,
                        background: "#fff",
                        padding: 14,
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          height: 140,
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
                          <FaPaw size={36} />
                        )}
                      </div>

                      <div>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                          {pet.name}
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                          Saved pet profile
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => openEditPetModal(pet)}
                          style={{
                            height: 38,
                            flex: 1,
                            padding: "8px 10px",
                            fontSize: 13,
                          }}
                        >
                          <FaEdit style={{ marginRight: 6 }} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => deletePet(pet)}
                          disabled={deletingPetId === pet.id}
                          style={{
                            height: 38,
                            flex: 1,
                            padding: "8px 10px",
                            fontSize: 13,
                            color: "#dc2626",
                            borderColor: "rgba(220, 38, 38, 0.25)",
                          }}
                        >
                          <FaTrash style={{ marginRight: 6 }} />
                          {deletingPetId === pet.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={openAddPetModal}
                    className="btn btn-outline"
                    style={{
                      minHeight: 240,
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
                    <span style={{ fontWeight: 800 }}>Add New Pet</span>
                  </button>
                </div>
              )}
            </div>

            <AddPetModal
              open={petModalOpen}
              mode={petModalMode}
              pet={editingPet}
              onClose={closePetModal}
              onSaved={handlePetSaved}
            />
          </div>
        )}

        {view === "bookings" && (
          <div className="auth-body" style={{ padding: "32px 32px 40px" }}>
            <BookingHistoryPanel />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Profile;