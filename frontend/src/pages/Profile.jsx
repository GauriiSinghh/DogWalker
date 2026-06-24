// src/pages/Profile.jsx
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.js";
import { API_BASE } from "../config/api.js";
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

function Profile() {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ---- Personal info edit state ----
  const [editPersonal, setEditPersonal] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", mobile: "", apartment: "", flatNo: "", address: "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const [personalError, setPersonalError] = useState("");
  const [personalSuccess, setPersonalSuccess] = useState("");

  // ---- Pet info edit state ----
  const [editPet, setEditPet] = useState(false);
  const [petName, setPetName] = useState("");
  const [petImage, setPetImage] = useState("");
  const [petImagePreview, setPetImagePreview] = useState("");
  const [petImageChanged, setPetImageChanged] = useState(false);
  const [petImageError, setPetImageError] = useState("");
  const [petError, setPetError] = useState("");
  const [petSuccess, setPetSuccess] = useState("");

  // ---- Booking history ----
  const [bookings, setBookings] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

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
      // Keep global context in sync with the freshest server data.
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

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/booking-history`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Could not load booking history");
      setBookings(await res.json());
    } catch (err) {
      setHistoryError(err.message || "Could not load booking history");
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProfile();
    loadHistory();
  }, [loadProfile, loadHistory]);

  // ---- Personal info handlers ----
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
    try {
      // Task 2: update via PUT /api/users/{user_id} when we know the id,
      // otherwise fall back to the existing PATCH /profile endpoint.
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
      // Immediately propagate to global user state (single source of truth).
      updateUser({
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        apartment: data.apartment,
        flatNo: data.flatNo,
        address: data.address,
      });
      setEditPersonal(false);
      setShowErrors(false);
      setPersonalSuccess("Profile updated!");
      setTimeout(() => setPersonalSuccess(""), 3000);
    } catch (err) {
      setPersonalError(err.message || "Could not update profile");
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

  // ---- Pet handlers ----
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
      setEditPet(false);
      // Keep pet info in the global context too.
      updateUser({ pet_name: data.pet_name || "", pet_image: data.pet_image || "" });
      setPetSuccess("Pet info updated!");
      setTimeout(() => setPetSuccess(""), 3000);
    } catch (err) {
      setPetError(err.message || "Could not update pet info");
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

  // ---- Booking detail ----
  async function toggleDetail(id) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailCache[id]) {
      setDetailLoading(true);
      try {
        const res = await fetch(`${API_BASE}/booking-history/${id}`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setDetailCache((prev) => ({ ...prev, [id]: data }));
        }
      } finally {
        setDetailLoading(false);
      }
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const fmtDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };
  const fmtAmount = (paise) => (paise == null ? "—" : `₹${(paise / 100).toFixed(0)}`);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-body">
            <p>Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-body">
            <div className="global-error">{loadError}</div>
            <button className="btn btn-outline" onClick={() => navigate("/")}>Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        style={{ marginBottom: 24 }}
      >
        <div className="auth-header">
          <Link to="/" className="auth-header-logo">
            <img src={logo} alt="Zuppy" />
          </Link>
          <Link to="/" className="auth-close" aria-label="Close">
            <FaTimes size={16} />
          </Link>
        </div>

        {/* ===== SECTION 1: PERSONAL INFO ===== */}
        <div className="auth-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 className="auth-title">Personal Information</h1>
            {!editPersonal && (
              <button className="btn btn-outline" type="button" onClick={() => setEditPersonal(true)}>
                Edit
              </button>
            )}
          </div>

          {personalError && <div className="global-error">{personalError}</div>}
          {personalSuccess && <div className="global-success">{personalSuccess}</div>}

          <form className="auth-form" style={{ marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); savePersonal(); }} noValidate>
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
                <label className="form-label">Email</label>
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
                {showErrors && !/^(\+91|91)?[6-9]\d{9}$/.test(form.mobile.trim()) && <div className="field-error-msg">Enter a valid mobile number</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Apartment</label>
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
                {showErrors && form.address.trim().length < 10 && <div className="field-error-msg">Please enter a detailed address</div>}
              </div>
            </div>

            {editPersonal && (
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={cancelPersonal}>Cancel</button>
              </div>
            )}
          </form>
        </div>
      </motion.div>

      {/* ===== SECTION 2: PET INFO ===== */}
      <motion.div className="auth-card" variants={pageTransition} initial="initial" animate="animate" style={{ marginBottom: 24 }}>
        <div className="auth-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 className="auth-title">Pet Information</h1>
            {!editPet && (
              <button className="btn btn-outline" type="button" onClick={() => setEditPet(true)}>Edit</button>
            )}
          </div>

          {petError && <div className="global-error">{petError}</div>}
          {petSuccess && <div className="global-success">{petSuccess}</div>}

          <div className="auth-form" style={{ marginTop: 16 }}>
            <div className="form-row">
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
                  <label htmlFor="profile-pet-image" className="pet-image-label">
                    {petImagePreview ? (
                      <img src={petImagePreview} alt="Pet" className="pet-image-preview" />
                    ) : (
                      <span>{editPet ? "Upload a photo" : "No photo"}</span>
                    )}
                  </label>
                </div>
                {petImageError && <div className="field-error-msg">{petImageError}</div>}
              </div>
            </div>

            {editPet && (
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" className="btn-primary" onClick={savePet}>Save</button>
                <button type="button" className="btn btn-outline" onClick={cancelPet}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 3: BOOKING HISTORY ===== */}
      <motion.div className="auth-card" variants={pageTransition} initial="initial" animate="animate" style={{ marginBottom: 24 }}>
        <div className="auth-body">
          <h1 className="auth-title">Booking History</h1>
          {historyError && <div className="global-error">{historyError}</div>}

          {bookings.length === 0 && !historyError && (
            <p className="auth-subtitle" style={{ marginTop: 12 }}>No bookings yet.</p>
          )}

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {bookings.map((b) => (
              <div key={b.id} className="profile-booking-row" style={{ border: "1px solid #f0e4d8", borderRadius: 14, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => toggleDetail(b.id)}
                  style={{
                    width: "100%", textAlign: "left", background: "#fffaf5", border: "none",
                    cursor: "pointer", padding: "14px 16px", fontFamily: "inherit",
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "center",
                  }}
                >
                  <span><strong>{fmtDate(b.created_at)}</strong></span>
                  <span>{b.status}</span>
                  <span>{b.payment_status || "—"}</span>
                  <span>{b.assigned_walker || "Unassigned"}</span>
                  <span style={{ textAlign: "right", fontWeight: 700 }}>{fmtAmount(b.amount)}</span>
                </button>

                {expandedId === b.id && (
                  <div style={{ padding: "14px 16px", borderTop: "1px dashed rgba(0,0,0,0.08)" }}>
                    {detailLoading && !detailCache[b.id] ? (
                      <p>Loading…</p>
                    ) : detailCache[b.id] ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.92rem" }}>
                        <div><span style={{ color: "var(--muted)" }}>Booking ID:</span> #{detailCache[b.id].id}</div>
                        <div><span style={{ color: "var(--muted)" }}>Apartment:</span> {detailCache[b.id].apartment}</div>
                        <div><span style={{ color: "var(--muted)" }}>Flat/Villa:</span> {detailCache[b.id].flatNo}</div>
                        <div><span style={{ color: "var(--muted)" }}>Address:</span> {detailCache[b.id].address}</div>
                        <div><span style={{ color: "var(--muted)" }}>Mobile:</span> {detailCache[b.id].mobile}</div>
                        <div><span style={{ color: "var(--muted)" }}>Pet:</span> {detailCache[b.id].pet_name || "—"}</div>
                        <div><span style={{ color: "var(--muted)" }}>Status:</span> {detailCache[b.id].status}</div>
                        <div><span style={{ color: "var(--muted)" }}>Payment:</span> {detailCache[b.id].payment_status || "—"}</div>
                        <div><span style={{ color: "var(--muted)" }}>Walker:</span> {detailCache[b.id].assigned_walker || "Unassigned"}</div>
                        <div><span style={{ color: "var(--muted)" }}>Amount:</span> {fmtAmount(detailCache[b.id].amount)}</div>
                      </div>
                    ) : (
                      <p>Could not load details.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 4: LOGOUT ===== */}
      <motion.div className="auth-card" variants={pageTransition} initial="initial" animate="animate">
        <div className="auth-body">
          <h1 className="auth-title">Logout</h1>
          <p className="auth-subtitle">Sign out of your account on this device.</p>
          <button className="btn btn-outline" type="button" onClick={handleLogout} style={{ marginTop: 12 }}>
            Logout
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;