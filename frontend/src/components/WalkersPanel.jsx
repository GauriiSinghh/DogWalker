import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StatusBadge from "./StatusBadge";
import {
  createWalker,
  deleteWalker,
  getWalkers,
  updateWalker,
  validateWalkerUnique,
} from "../services/walkersApi";
import { cacheStore } from "../utils/cacheStore.js";
import "../styles/admin.css";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  mobile_number: "",
  address: "",
  profile_image: "",
  is_available: true,
};

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function deriveWalkerStatus(w) {
  if (w.is_active === false) return { label: "Offline", tone: "gray" };
  if (w.current_booking_id) {
    const s = (w.current_booking_status || "Assigned").toLowerCase();
    if (s === "completed") return { label: "Completed", tone: "green" };
    if (s === "assigned") return { label: "Assigned", tone: "blue" };
    if (s === "started" || s === "reached") return { label: w.current_booking_status, tone: "purple" };
    return { label: "Busy", tone: "orange" };
  }
  if (w.is_available) return { label: "Available", tone: "green" };
  return { label: "Busy", tone: "orange" };
}

export default function WalkersPanel({ searchQuery = "" }) {
  const [walkers, setWalkers] = useState(() => {
    const cached = cacheStore.get("admin-walkers");
    return cached ? cached.data : [];
  });
  const [loading, setLoading] = useState(() => !cacheStore.get("admin-walkers"));

  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  const [editing, setEditing] = useState(null); // walker object or null
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const uniqTimer = useRef(null);

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
      const data = await cacheStore.getOrFetch("admin-walkers", async () => getWalkers(), 300000);
      setWalkers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // when opening create form: hard-reset + force remount to kill autofill
  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm(emptyForm);
    setFormKey(Date.now());
    setShowForm(true);
  }

  function openEdit(w) {
    setEditing(w);
    setErrors({});
    setFormKey(Date.now());
    setShowForm(true);
    setForm({
      name: w.name || "",
      email: w.email || "",
      password: "", // never prefill password
      mobile_number: w.mobile || "",
      address: w.address || "",
      profile_image: w.profile_image || "",
      is_available: !!w.is_available,
    });
  }

  function resetForm() {
    setErrors({});
    if (editing) openEdit(editing);
    else {
      setForm(emptyForm);
      setFormKey(Date.now());
    }
  }

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined, form: undefined }));
  }

  const filtered = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return walkers;
    return walkers.filter((w) => {
      const status = `${w.current_booking_status || ""}`.toLowerCase();
      return (
        (w.name || "").toLowerCase().includes(q) ||
        (w.email || "").toLowerCase().includes(q) ||
        (w.mobile || "").toLowerCase().includes(q) ||
        (w.address || "").toLowerCase().includes(q) ||
        status.includes(q)
      );
    });
  }, [walkers, searchQuery]);

  const totalCount = walkers.length;

  function validateClient() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(form.email.trim())) e.email = "Enter a valid email";
    if (!editing && !form.password.trim()) e.password = "Password is required";
    if (!form.mobile_number.trim()) e.mobile_number = "Mobile number is required";
    if (!form.address.trim()) e.address = "Address is required";

    // quick local uniqueness check (still authoritative on backend)
    const emailLower = form.email.trim().toLowerCase();
    const mobile = form.mobile_number.trim();
    const conflict = walkers.find((w) => {
      if (editing && w.id === editing.id) return false;
      return (
        (w.email || "").toLowerCase() === emailLower ||
        (w.mobile || "") === mobile
      );
    });
    if (conflict) {
      if ((conflict.email || "").toLowerCase() === emailLower) e.email = "Email already exists";
      if ((conflict.mobile || "") === mobile) e.mobile_number = "Mobile already exists";
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
          exclude_walker_id: editing?.id,
        });
        if (!res?.ok && res?.errors) {
          setErrors((prev) => ({ ...prev, ...res.errors }));
        }
      } catch {
        // silent (don’t block typing)
      }
    }, 250);
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
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      };

      if (editing) {
        await updateWalker(editing.id, payload);
      } else {
        await createWalker(payload);
      }

      await refresh();
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      setFormKey(Date.now());
    } catch (err) {
      const detail = err?.data?.detail;
      if (detail?.errors) {
        setErrors((prev) => ({ ...prev, ...detail.errors }));
      } else {
        setErrors((prev) => ({ ...prev, form: String(detail || err.message || "Save failed") }));
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(w) {
    const ok = window.confirm(`Delete walker "${w.name}"?`);
    if (!ok) return;

    try {
      await deleteWalker(w.id);
      await refresh();
    } catch (err) {
      alert(err?.data?.detail || err.message || "Delete failed");
    }
  }

  return (
    <div className="admin-entity-panel">
      <div className="admin-table-card">
        <div className="admin-table-card__header">
          <div>
            <h2 className="admin-table-card__title">Walkers</h2>
            <p className="admin-table-card__count">{totalCount} active profiles</p>
          </div>
          <div className="admin-entity-panel__actions">
            <button className="admin-btn admin-btn--primary" onClick={openCreate} type="button">
              + Add Walker
            </button>
          </div>
        </div>

        <div className="admin-entity-panel__actions" style={{ padding: "16px 24px 0" }}>
          <div style={{ flex: 1 }}>
            <label className="walkers__label">Search Walker</label>
            <input
              className="admin-entity-form__input"
              value={searchQuery}
              readOnly
              placeholder="Use dashboard search…"
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ minWidth: 140 }}>
            <div className="walkers__label">Total Walkers</div>
            <div className="walkers__countValue">{totalCount}</div>
          </div>
        </div>

        {showForm && (
          <form
            key={formKey}
            className="admin-entity-form"
            onSubmit={onSave}
            autoComplete="off"
            style={{ padding: "16px 24px 24px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            <div>
              <label className="walkers__label">Walker Name *</label>
              <input
                className="admin-entity-form__input"
                value={form.name}
                onChange={(e) => {
                  setField("name", e.target.value);
                  validateUniqueBackend({ name: e.target.value });
                }}
                name="walker-name"
                autoComplete="off"
              />
              {errors.name && <div className="walkers__error">{errors.name}</div>}
            </div>

            <div>
              <label className="walkers__label">Email *</label>
              <input
                className="admin-entity-form__input"
                value={form.email}
                onChange={(e) => {
                  setField("email", e.target.value);
                  validateUniqueBackend({ email: e.target.value });
                }}
                type="email"
                name="walker-email"
                autoComplete="off"
              />
              {errors.email && <div className="walkers__error">{errors.email}</div>}
            </div>

            <div>
              <label className="walkers__label">Password {editing ? "(optional)" : "*"}</label>
              <input
                className="admin-entity-form__input"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                type="password"
                name="walker-new-password"
                autoComplete="new-password"
              />
              {errors.password && <div className="walkers__error">{errors.password}</div>}
            </div>

            <div>
              <label className="walkers__label">Mobile Number *</label>
              <input
                className="admin-entity-form__input"
                value={form.mobile_number}
                onChange={(e) => {
                  setField("mobile_number", e.target.value);
                  validateUniqueBackend({ mobile_number: e.target.value });
                }}
                name="walker-mobile"
                autoComplete="off"
                inputMode="tel"
              />
              {errors.mobile_number && <div className="walkers__error">{errors.mobile_number}</div>}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="walkers__label">Address *</label>
              <input
                className="admin-entity-form__input"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                name="walker-address"
                autoComplete="off"
              />
              {errors.address && <div className="walkers__error">{errors.address}</div>}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="walkers__label">Profile Image URL (optional)</label>
              <input
                className="admin-entity-form__input"
                value={form.profile_image}
                onChange={(e) => setField("profile_image", e.target.value)}
                name="walker-profile-image"
                autoComplete="off"
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="admin-btn admin-btn--ghost" type="button" onClick={() => setShowForm(false)} disabled={saving}>
                Close
              </button>
              <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Walker"}
              </button>
              <button className="admin-btn admin-btn--ghost" type="button" onClick={resetForm} disabled={saving}>
                Reset
              </button>
            </div>
            {errors.form && <div className="admin-entity-panel__error" style={{ gridColumn: "1 / -1" }}>{errors.form}</div>}
          </form>
        )}

        <div className="admin-table-scroll admin-table-desktop">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>Current Booking</th>
                <th>Status</th>
                <th>Created</th>
                <th className="admin-table__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !cacheStore.get("admin-walkers") ? (
                <tr><td colSpan="9" className="admin-entity-panel__hint">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="admin-entity-panel__hint">No walkers found.</td></tr>
              ) : (
                filtered.map((w) => {
                  const st = deriveWalkerStatus(w);
                return (
                  <tr key={w.id}>
                    <td>
                      <div className="walkers__avatar">
                        {w.profile_image ? (
                          <img src={w.profile_image} alt={w.name} />
                        ) : (
                          <div className="walkers__avatarFallback">{(w.name || "?")[0]}</div>
                        )}
                      </div>
                    </td>
                    <td className="walkers__strong">{w.name}</td>
                    <td>{w.email || "—"}</td>
                    <td>{w.mobile || "—"}</td>
                    <td className="walkers__truncate" title={w.address || ""}>{w.address || "—"}</td>
                   
                    <td>
                      {w.current_booking_id ? (
                        <span>
                          #{w.current_booking_id}{" "}
                          <span className="walkers__muted">({w.current_booking_status || "Assigned"})</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <StatusBadge status={st.label}  />
                    </td>
                    <td>{formatDateTime(w.created_at)}</td>
                    <td>
                      <div className="walkers__rowActions">
                        <button className="walkers__link" type="button" onClick={() => openEdit(w)}>
                          Edit
                        </button>
                        <button className="walkers__link walkers__link--danger" type="button" onClick={() => onDelete(w)}>
                          Delete
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
      </div>
    </div>
  );
}