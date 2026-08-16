import { useCallback, useEffect, useState, useRef } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiImage,
  FiLock,
} from "react-icons/fi";
import {
  createWalker,
  deleteWalker,
  getWalkers,
  updateWalker,
  validateWalkerUnique,
} from "../services/walkersApi";
import { cacheStore } from "../utils/cacheStore.js";
import { useToast } from "./Toast.jsx";
import "../styles/admin.css";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  mobile_number: "",
  address: "",
  profile_image: "",
  is_available: true,
  is_active: true,
};

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function deriveWalkerStatus(w) {
  if (w.is_active === false) return { label: "Inactive", tone: "red" };
  if (w.current_booking_id) {
    const s = (w.current_booking_status || "Assigned").toLowerCase();
    if (s === "completed") return { label: "Completed", tone: "green" };
    if (s === "assigned") return { label: "Assigned", tone: "blue" };
    if (s === "started" || s === "reached") return { label: w.current_booking_status, tone: "purple" };
    return { label: "Busy", tone: "orange" };
  }
  if (w.is_available) return { label: "Available", tone: "green" };
  return { label: "Unavailable", tone: "gray" };
}

export default function WalkersPanel() {
  const toast = useToast();

  const [walkers, setWalkers] = useState(() => {
    const cached = cacheStore.get("admin-walkers");
    return cached ? cached.data : [];
  });
  const [loading, setLoading] = useState(() => !cacheStore.get("admin-walkers"));

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingWalker, setEditingWalker] = useState(null); // walker object or null
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete Modal State
  const [deletingWalker, setDeletingWalker] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const uniqTimer = useRef(null);

  const updateCacheAndState = useCallback((newList) => {
    setWalkers(newList);
    cacheStore.set("admin-walkers", newList, 300000);
  }, []);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) {
      const cached = cacheStore.get("admin-walkers");
      if (cached) {
        setWalkers(Array.isArray(cached.data) ? cached.data : []);
        if (!cached.isStale) {
          setLoading(false);
          return;
        }
      } else {
        setLoading(true);
      }
    }
    try {
      const data = await getWalkers();
      const list = Array.isArray(data) ? data : [];
      updateCacheAndState(list);
    } catch (err) {
      if (!silent) {
        toast.error(err.message || "Failed to load walkers");
      }
    } finally {
      setLoading(false);
    }
  }, [updateCacheAndState, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Open Add Walker Modal
  function openCreate() {
    setEditingWalker(null);
    setErrors({});
    setForm(emptyForm);
    setShowPassword(false);
    setShowModal(true);
  }

  // Open Edit Walker Modal
  function openEdit(w) {
    setEditingWalker(w);
    setErrors({});
    setShowPassword(false);
    setForm({
      name: w.name || "",
      email: w.email || "",
      password: "", // password blank when editing unless changing
      mobile_number: w.mobile_number || w.mobile || "",
      address: w.address || "",
      profile_image: w.profile_image || "",
      is_available: w.is_available !== undefined ? !!w.is_available : true,
      is_active: w.is_active !== undefined ? !!w.is_active : true,
    });
    setShowModal(true);
  }

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined, form: undefined }));
  }

  function validateClient() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(form.email.trim())) e.email = "Enter a valid email address";
    
    if (!editingWalker && !form.password.trim()) {
      e.password = "Password is required for new walker";
    } else if (form.password.trim() && form.password.trim().length < 6) {
      e.password = "Password must be at least 6 characters";
    }

    if (!form.mobile_number.trim()) e.mobile_number = "Mobile number is required";
    if (!form.address.trim()) e.address = "Address is required";

    // Local uniqueness check against current state
    const emailLower = form.email.trim().toLowerCase();
    const mobile = form.mobile_number.trim();
    const conflict = walkers.find((w) => {
      if (editingWalker && w.id === editingWalker.id) return false;
      const wMobile = w.mobile_number || w.mobile || "";
      return (
        (w.email || "").toLowerCase() === emailLower ||
        wMobile === mobile
      );
    });
    if (conflict) {
      if ((conflict.email || "").toLowerCase() === emailLower) e.email = "Email is already registered";
      if ((conflict.mobile_number || conflict.mobile || "") === mobile) e.mobile_number = "Mobile number is already registered";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function validateUniqueBackend(partial = {}) {
    if (uniqTimer.current) clearTimeout(uniqTimer.current);
    uniqTimer.current = setTimeout(async () => {
      try {
        const res = await validateWalkerUnique({
          name: partial.name ?? form.name.trim(),
          email: partial.email ?? form.email.trim(),
          mobile_number: partial.mobile_number ?? form.mobile_number.trim(),
          exclude_walker_id: editingWalker?.id,
        });
        if (!res?.ok && res?.errors) {
          setErrors((prev) => ({ ...prev, ...res.errors }));
        }
      } catch {
        // silent validation fallback
      }
    }, 300);
  }

  async function onSave(e) {
    e.preventDefault();
    setErrors({});
    if (!validateClient()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile_number: form.mobile_number.trim(),
        address: form.address.trim(),
        profile_image: form.profile_image.trim() || null,
        is_available: !!form.is_available,
        is_active: !!form.is_active,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      };

      if (editingWalker) {
        const updated = await updateWalker(editingWalker.id, payload);
        const nextList = walkers.map((w) => (w.id === editingWalker.id ? { ...w, ...updated } : w));
        updateCacheAndState(nextList);
        toast.success(`Walker "${updated.name || payload.name}" updated successfully!`);
      } else {
        const created = await createWalker(payload);
        const nextList = [created, ...walkers];
        updateCacheAndState(nextList);
        toast.success(`Walker "${created.name}" added successfully!`);
      }

      setShowModal(false);
      setEditingWalker(null);
      setForm(emptyForm);
    } catch (err) {
      const detail = err?.data?.detail;
      if (detail && typeof detail === "object" && detail.errors) {
        setErrors((prev) => ({ ...prev, ...detail.errors }));
      } else if (typeof detail === "string") {
        setErrors((prev) => ({ ...prev, form: detail }));
      } else {
        setErrors((prev) => ({ ...prev, form: err.message || "Failed to save walker" }));
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingWalker) return;
    setDeleting(true);
    try {
      await deleteWalker(deletingWalker.id);
      const nextList = walkers.filter((w) => w.id !== deletingWalker.id);
      updateCacheAndState(nextList);
      toast.success(`Walker "${deletingWalker.name}" deleted successfully!`);
      setDeletingWalker(null);
    } catch (err) {
      const errMsg = err?.data?.detail || err.message || "Could not delete walker";
      toast.error(errMsg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-entity-panel">
      <div className="admin-table-card">
        {/* Header Bar */}
        <div className="admin-table-card__header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 className="admin-table-card__title">Walker Management</h2>
            <span className="admin-table-card__count">{walkers.length} profiles</span>
          </div>
          <button className="admin-btn admin-btn--primary" onClick={openCreate} type="button">
            <FiPlus size={16} />
            <span>Add Walker</span>
          </button>
        </div>

        {/* Table View (Desktop & Tablet) */}
        <div className="admin-table-scroll admin-table-desktop">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Walker</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Availability</th>
                <th>Account Status</th>
                <th>Current Booking</th>
                <th>Joined</th>
                <th className="admin-table__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && walkers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="admin-table__empty">
                    <div className="admin-table__empty-text">Loading walkers…</div>
                  </td>
                </tr>
              ) : walkers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="admin-table__empty">
                    <div className="admin-table__empty-title">No Walkers Registered</div>
                    <div className="admin-table__empty-text">Click "+ Add Walker" to create the first walker profile.</div>
                  </td>
                </tr>
              ) : (
                walkers.map((w) => {
                  const mobile = w.mobile_number || w.mobile || "—";
                  return (
                    <tr key={w.id} className="admin-table__row">
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="walkers__avatar">
                            {w.profile_image ? (
                              <img src={w.profile_image} alt={w.name} />
                            ) : (
                              <div className="walkers__avatarFallback">
                                {(w.name || "?")[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="admin-table__name">{w.name}</div>
                            <div className="admin-table__cell-muted" style={{ fontSize: 12 }}>
                              ID: #{w.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{w.email || "—"}</div>
                        <div className="admin-table__cell-muted" style={{ fontSize: 12 }}>
                          {mobile}
                        </div>
                      </td>
                      <td style={{ maxWidth: 180 }}>
                        <div
                          className="walkers__truncate"
                          title={w.address || ""}
                          style={{ fontSize: 13 }}
                        >
                          {w.address || "—"}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status-pill tone-${w.is_available ? "green" : "gray"}`}>
                          {w.is_available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-pill tone-${w.is_active !== false ? "green" : "red"}`}>
                          {w.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {w.current_booking_id ? (
                          <span className="admin-booking-tag">
                            #{w.current_booking_id}{" "}
                            <span className="walkers__muted">({w.current_booking_status || "Assigned"})</span>
                          </span>
                        ) : (
                          <span className="admin-table__cell-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className="admin-table__cell-muted" style={{ fontSize: 12 }}>
                          {formatDate(w.created_at)}
                        </span>
                      </td>
                      <td className="admin-table__actions">
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            className="admin-action-btn admin-action-btn--edit"
                            type="button"
                            onClick={() => openEdit(w)}
                            title="Edit Walker"
                          >
                            <FiEdit2 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn--danger"
                            type="button"
                            onClick={() => setDeletingWalker(w)}
                            title="Delete Walker"
                          >
                            <FiTrash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards Fallback */}
        <div className="admin-booking-cards">
          {walkers.map((w) => {
            const mobile = w.mobile_number || w.mobile || "—";
            return (
              <div key={w.id} className="admin-booking-card">
                <div className="admin-booking-card__top">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="walkers__avatar">
                      {w.profile_image ? (
                        <img src={w.profile_image} alt={w.name} />
                      ) : (
                        <div className="walkers__avatarFallback">{(w.name || "?")[0].toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <h4 className="admin-booking-card__name">{w.name}</h4>
                      <span className="admin-booking-card__id">{w.email}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span className={`admin-status-pill tone-${w.is_available ? "green" : "gray"}`}>
                      {w.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>

                <div className="admin-booking-card__details">
                  <div className="admin-booking-card__row">
                    <span className="admin-booking-card__label">Mobile</span>
                    <span className="admin-booking-card__value">{mobile}</span>
                  </div>
                  <div className="admin-booking-card__row">
                    <span className="admin-booking-card__label">Address</span>
                    <span className="admin-booking-card__value">{w.address || "—"}</span>
                  </div>
                  <div className="admin-booking-card__row">
                    <span className="admin-booking-card__label">Account</span>
                    <span className="admin-booking-card__value">{w.is_active !== false ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                <div className="admin-booking-card__actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    className="admin-btn admin-btn--ghost"
                    style={{ padding: "6px 12px", fontSize: 13 }}
                    type="button"
                    onClick={() => openEdit(w)}
                  >
                    <FiEdit2 size={13} /> Edit
                  </button>
                  <button
                    className="admin-btn admin-btn--danger"
                    style={{ padding: "6px 12px", fontSize: 13 }}
                    type="button"
                    onClick={() => setDeletingWalker(w)}
                  >
                    <FiTrash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Walker Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  {editingWalker ? `Edit Walker: ${editingWalker.name}` : "Add New Walker"}
                </h3>
                <p className="admin-modal-subtitle">
                  {editingWalker ? "Update walker profile information and status" : "Enter details to create a new walker profile"}
                </p>
              </div>
              <button
                className="admin-modal-close"
                type="button"
                onClick={() => !saving && setShowModal(false)}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={onSave} className="admin-modal-body" autoComplete="off">
              {errors.form && (
                <div className="admin-form-error-banner">
                  <FiAlertTriangle size={16} />
                  <span>{errors.form}</span>
                </div>
              )}

              <div className="admin-form-grid">
                {/* Name */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Walker Name <span className="req">*</span>
                  </label>
                  <div className="admin-input-wrap">
                    <FiUser className="admin-input-icon" />
                    <input
                      className={`admin-input ${errors.name ? "admin-input--error" : ""}`}
                      value={form.name}
                      onChange={(e) => {
                        setField("name", e.target.value);
                        validateUniqueBackend({ name: e.target.value });
                      }}
                      placeholder="e.g. Alex Morgan"
                      autoComplete="off"
                    />
                  </div>
                  {errors.name && <div className="admin-field-error">{errors.name}</div>}
                </div>

                {/* Email */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Email Address <span className="req">*</span>
                  </label>
                  <div className="admin-input-wrap">
                    <FiMail className="admin-input-icon" />
                    <input
                      className={`admin-input ${errors.email ? "admin-input--error" : ""}`}
                      value={form.email}
                      onChange={(e) => {
                        setField("email", e.target.value);
                        validateUniqueBackend({ email: e.target.value });
                      }}
                      type="email"
                      placeholder="alex@example.com"
                      autoComplete="off"
                    />
                  </div>
                  {errors.email && <div className="admin-field-error">{errors.email}</div>}
                </div>

                {/* Mobile Number */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Mobile Number <span className="req">*</span>
                  </label>
                  <div className="admin-input-wrap">
                    <FiPhone className="admin-input-icon" />
                    <input
                      className={`admin-input ${errors.mobile_number ? "admin-input--error" : ""}`}
                      value={form.mobile_number}
                      onChange={(e) => {
                        setField("mobile_number", e.target.value);
                        validateUniqueBackend({ mobile_number: e.target.value });
                      }}
                      placeholder="e.g. +91 9876543210"
                      inputMode="tel"
                      autoComplete="off"
                    />
                  </div>
                  {errors.mobile_number && <div className="admin-field-error">{errors.mobile_number}</div>}
                </div>

                {/* Password */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Password {editingWalker ? <span className="opt">(Optional - leave blank to keep unchanged)</span> : <span className="req">*</span>}
                  </label>
                  <div className="admin-input-wrap">
                    <FiLock className="admin-input-icon" />
                    <input
                      className={`admin-input ${errors.password ? "admin-input--error" : ""}`}
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder={editingWalker ? "Enter new password if changing" : "Choose a secure password"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="admin-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {errors.password && <div className="admin-field-error">{errors.password}</div>}
                </div>

                {/* Address */}
                <div className="admin-form-group admin-form-group--full">
                  <label className="admin-form-label">
                    Address <span className="req">*</span>
                  </label>
                  <div className="admin-input-wrap">
                    <FiMapPin className="admin-input-icon" />
                    <input
                      className={`admin-input ${errors.address ? "admin-input--error" : ""}`}
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder="Street address, city, area"
                      autoComplete="off"
                    />
                  </div>
                  {errors.address && <div className="admin-field-error">{errors.address}</div>}
                </div>

                {/* Profile Image URL */}
                <div className="admin-form-group admin-form-group--full">
                  <label className="admin-form-label">
                    Profile Image URL <span className="opt">(Optional)</span>
                  </label>
                  <div className="admin-input-wrap">
                    <FiImage className="admin-input-icon" />
                    <input
                      className="admin-input"
                      value={form.profile_image}
                      onChange={(e) => setField("profile_image", e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Availability & Active Toggles */}
                <div className="admin-form-group admin-form-group--full admin-toggles-row">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_available}
                      onChange={(e) => setField("is_available", e.target.checked)}
                    />
                    <span>Available for Walk Assignments</span>
                  </label>

                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setField("is_active", e.target.checked)}
                    />
                    <span>Account Active</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="admin-modal-footer">
                <button
                  className="admin-btn admin-btn--ghost"
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="admin-btn-spinner" />
                      <span>{editingWalker ? "Updating…" : "Creating…"}</span>
                    </>
                  ) : (
                    <span>{editingWalker ? "Update Walker" : "Create Walker"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {deletingWalker && (
        <div className="admin-modal-overlay" onClick={() => !deleting && setDeletingWalker(null)}>
          <div className="admin-modal-container admin-modal-container--sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#f87171" }}>
                <FiAlertTriangle size={22} />
                <h3 className="admin-modal-title" style={{ color: "#f87171" }}>
                  Delete Walker
                </h3>
              </div>
              <button
                className="admin-modal-close"
                type="button"
                onClick={() => !deleting && setDeletingWalker(null)}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ gap: 16 }}>
              <p style={{ margin: 0, color: "var(--admin-text-muted)", fontSize: 14, lineHeight: 1.5 }}>
                Are you sure you want to delete walker <strong>"{deletingWalker.name}"</strong>?
                This action is permanent and cannot be undone.
              </p>

              <div className="admin-modal-footer" style={{ paddingTop: 16 }}>
                <button
                  className="admin-btn admin-btn--ghost"
                  type="button"
                  onClick={() => setDeletingWalker(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="admin-btn admin-btn--danger"
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="admin-btn-spinner" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <span>Delete Walker</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}