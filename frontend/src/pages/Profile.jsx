// src/pages/Profile.jsx
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FaTimes, FaUser, FaPaw } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../components/Toast.jsx";
import { API_BASE } from "../config/api.js";
import BookingHistoryPanel from "../components/BookingHistoryPanel.jsx";
import logo from "../assets/images/logo.png";
import "../styles/modal-base.css";
import "../styles/signup.css";

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

const MAX_PET_IMAGE_SIZE = 2 * 1024 * 1024;

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function Profile({ view = "profile" }) {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
  name: "",
  email: "",
  mobile: "",
  apartment: "",
  flatNo: "",
  address: "",
  pet_name: "",
  pet_image: "",
});

const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [editPersonal, setEditPersonal] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", mobile: "", apartment: "", flatNo: "", address: "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const [personalError, setPersonalError] = useState("");
  const [personalSuccess, setPersonalSuccess] = useState("");

  const [editPet, setEditPet] = useState(false);
  const [petName, setPetName] = useState("");
  const [petImage, setPetImage] = useState("");
  const [petImagePreview, setPetImagePreview] = useState("");
  const [petImageChanged, setPetImageChanged] = useState(false);
  const [petImageError, setPetImageError] = useState("");
  const [petError, setPetError] = useState("");
  const [petSuccess, setPetSuccess] = useState("");

  const APARTMENTS = [
    "Sobha Dream Acres Apartment",
    "Prestige Shantiniketan",
    "Purva Fountain Square",
    "DLF Jigani",
  ];

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/profile`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Could not load profile");
      const data = await res.json();
      setProfile(data);
      setForm({
        name: data.name || "",
        email: data.email || "",
        mobile: data.mobile || "",
        apartment: data.apartment || "",
        flatNo: data.flatNo || "",
        address: data.address || "",
      });
      setPetName(data.pet_name || "");
      setPetImagePreview(data.pet_image || "");
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
      setLoadError(err.message || "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProfile();
  }, [loadProfile]);

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

    // 1. Update UI instantly
    setProfile(optimisticData);
    updateUser(changed);
    setEditPersonal(false);
    setShowErrors(false);

    try {
      // 2. Sync with backend silently
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");
      setProfile(data);
      updateUser({
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        apartment: data.apartment,
        flatNo: data.flatNo,
        address: data.address,
      });
      setPersonalSuccess("Profile updated!");
      setTimeout(() => setPersonalSuccess(""), 3000);
    } catch (err) {
      // 3. Revert on failure
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

  function handlePetImageChange(e) {
    const file = e.target.files?.[0];
    setPetImageError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPetImageError("Please upload an image file");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PET_IMAGE_SIZE) {
      setPetImageError("Image must be smaller than 2 MB");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPetImage(result);
      setPetImagePreview(result);
      setPetImageChanged(true);
      // Instant preview in global user state
      updateUser({ pet_image: result });
    };
    reader.readAsDataURL(file);
  }

  async function savePet() {
    setPetError("");
    setPetSuccess("");
    if (petName.trim().length < 2) {
      setPetError("Please enter a valid pet name");
      return;
    }
    const body = {};
    if (petName !== (profile?.pet_name || "")) body.pet_name = petName.trim();
    if (petImageChanged && petImage) body.pet_image = petImage;
    if (Object.keys(body).length === 0) {
      setEditPet(false);
      return;
    }

    const previousData = { ...profile };
    const optimisticData = {
      ...profile,
      pet_name: body.pet_name ?? profile.pet_name,
      pet_image: body.pet_image ?? profile.pet_image,
    };

    // 1. Update UI instantly
    setProfile(optimisticData);
    updateUser({
      pet_name: optimisticData.pet_name || "",
      pet_image: optimisticData.pet_image || "",
    });
    setEditPet(false);

    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");
      setProfile(data);
      setPetName(data.pet_name || "");
      setPetImagePreview(data.pet_image || "");
      setPetImageChanged(false);
      updateUser({ pet_name: data.pet_name || "", pet_image: data.pet_image || "" });
      setPetSuccess("Pet info updated!");
      setTimeout(() => setPetSuccess(""), 3000);
    } catch (err) {
      setProfile(previousData);
      setPetName(previousData.pet_name || "");
      setPetImagePreview(previousData.pet_image || "");
      updateUser({
        pet_name: previousData.pet_name || "",
        pet_image: previousData.pet_image || "",
      });
      setPetError(err.message || "Could not update pet info");
      toast.error("Failed to update. Changes reverted.");
    }
  }

  function cancelPet() {
    setPetName(profile.pet_name || "");
    setPetImagePreview(profile.pet_image || "");
    setPetImage("");
    setPetImageChanged(false);
    setPetImageError("");
    setPetError("");
    setEditPet(false);
  }

  if (loadError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-body" style={{ padding: "40px 24px" }}>
            <div className="global-error">{loadError}</div>
            <button className="btn btn-outline" onClick={() => navigate("/")}>Go Home</button>
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
          maxWidth: view === "bookings" ? "960px" : "640px",
          width: "100%",
          marginBottom: 24,
          borderRadius: "24px",
          boxShadow: "0 20px 50px rgba(15, 17, 21, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          background: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <div className="auth-header" style={{ padding: "24px 32px 16px", borderBottom: "1px solid rgba(0, 0, 0, 0.04)" }}>
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
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.04)", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FaUser style={{ color: "var(--z-primary)", fontSize: "1.1rem" }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Personal Details</h2>
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

              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); savePersonal(); }} noValidate>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className={`form-input ${showErrors && form.name.trim().length < 2 ? "invalid" : ""}`}
                    value={form.name}
                    disabled={!editPersonal}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {showErrors && form.name.trim().length < 2 && <div className="field-error-msg">Enter your full name</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      className={`form-input ${showErrors && (!form.email || !form.email.includes("@")) ? "invalid" : ""}`}
                      value={form.email}
                      disabled={!editPersonal}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    {showErrors && (!form.email || !form.email.includes("@")) && <div className="field-error-msg">Enter a valid email</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      className={`form-input ${showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(form.mobile.trim()) ? "invalid" : ""}`}
                      value={form.mobile}
                      disabled={!editPersonal}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    />
                    {showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(form.mobile.trim()) && <div className="field-error-msg">Enter valid mobile number</div>}
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
                    {APARTMENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {showErrors && !form.apartment && <div className="field-error-msg">Please select an apartment</div>}
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
                    {showErrors && !form.flatNo.trim() && <div className="field-error-msg">Enter flat/villa number</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Detailed Address</label>
                    <input
                      className={`form-input ${showErrors && form.address.trim().length < 10 ? "invalid" : ""}`}
                      value={form.address}
                      disabled={!editPersonal}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                    {showErrors && form.address.trim().length < 10 && <div className="field-error-msg">Please enter detailed address (min 10 chars)</div>}
                  </div>
                </div>

                {editPersonal && (
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button type="submit" className="btn-primary" style={{ minHeight: "44px", padding: "10px 24px", width: "auto" }}>Save Changes</button>
                    <button type="button" className="btn btn-outline" onClick={cancelPersonal} style={{ height: "44px", width: "auto" }}>Cancel</button>
                  </div>
                )}
              </form>
            </div>

            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.04)", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FaPaw style={{ color: "var(--z-primary)", fontSize: "1.1rem" }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Pet Information</h2>
                </div>
                {!editPet && (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => setEditPet(true)}
                    style={{ padding: "6px 14px", fontSize: "0.85rem", height: "auto" }}
                  >
                    Edit Pet
                  </button>
                )}
              </div>

              {petError && <div className="global-error">{petError}</div>}
              {petSuccess && <div className="global-success">{petSuccess}</div>}

              <div className="auth-form">
                <div className="form-row" style={{ alignItems: "center" }}>
                  <div className="form-group">
                    <label className="form-label">Pet Name</label>
                    <input
                      className={`form-input ${editPet && petName.trim().length < 2 ? "invalid" : ""}`}
                      value={petName}
                      disabled={!editPet}
                      onChange={(e) => setPetName(e.target.value)}
                      placeholder="Bruno"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pet Photo</label>
                    <div className="pet-image-upload">
                      {editPet && (
                        <input id="profile-pet-image" type="file" accept="image/*" className="pet-image-input" onChange={handlePetImageChange} />
                      )}
                      <label htmlFor="profile-pet-image" className="pet-image-label" style={{ height: "80px", borderRadius: "16px" }}>
                        {petImagePreview ? (
                          <img src={petImagePreview} alt="Pet" className="pet-image-preview" style={{ height: "80px", width: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "0.85rem" }}>{editPet ? "Upload a photo" : "No photo available"}</span>
                        )}
                      </label>
                    </div>
                    {petImageError && <div className="field-error-msg">{petImageError}</div>}
                  </div>
                </div>

                {editPet && (
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button type="button" className="btn-primary" onClick={savePet} style={{ minHeight: "44px", padding: "10px 24px", width: "auto" }}>Save Photo</button>
                    <button type="button" className="btn btn-outline" onClick={cancelPet} style={{ height: "44px", width: "auto" }}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
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