import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2, FiEye, FiX } from "react-icons/fi";
import {
  getWalkers,
  getWalker,
  createWalker,
  deleteWalker,
} from "../services/adminApi";

function AvailabilityBadge({ available }) {
  return (
    <span
      className={`admin-entity-badge ${
        available ? "admin-entity-badge--available" : "admin-entity-badge--busy"
      }`}
    >
      {available ? "Available" : "Busy"}
    </span>
  );
}

function WalkerDetailModal({ walker, onClose, onDelete, deleting }) {
  if (!walker) return null;

  return (
    <div className="admin-entity-modal" role="presentation">
      <div className="admin-entity-modal__backdrop" onClick={onClose} />
      <motion.div
        className="admin-entity-modal__dialog"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <header className="admin-entity-modal__header">
          <div>
            <span className="admin-entity-modal__chip">Walker #{walker.id}</span>
            <h3 className="admin-entity-modal__title">{walker.name}</h3>
          </div>
          <button type="button" className="admin-entity-modal__close" onClick={onClose}>
            <FiX />
          </button>
        </header>

        <div className="admin-entity-modal__body">
          <dl className="admin-entity-details">
            <div className="admin-entity-details__row">
              <dt>Mobile</dt>
              <dd>{walker.mobile}</dd>
            </div>
            <div className="admin-entity-details__row">
              <dt>Status</dt>
              <dd><AvailabilityBadge available={walker.is_available} /></dd>
            </div>
            <div className="admin-entity-details__row">
              <dt>Active assignments</dt>
              <dd>{walker.active_assignments ?? 0}</dd>
            </div>
            <div className="admin-entity-details__row">
              <dt>Total assignments</dt>
              <dd>{walker.total_assignments ?? 0}</dd>
            </div>
            {walker.created_at && (
              <div className="admin-entity-details__row">
                <dt>Added</dt>
                <dd>{new Date(walker.created_at).toLocaleString("en-IN")}</dd>
              </div>
            )}
          </dl>
        </div>

        <footer className="admin-entity-modal__footer">
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={() => onDelete(walker)}
            disabled={deleting || (walker.active_assignments ?? 0) > 0}
          >
            <FiTrash2 />
            {deleting ? "Removing..." : "Remove Walker"}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}

export default function WalkersPanel({ searchQuery = "" }) {
  const [walkers, setWalkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedWalker, setSelectedWalker] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadWalkers = () => {
    setLoading(true);
    setError("");
    getWalkers()
      .then((data) => setWalkers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Could not load walkers"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWalkers();
  }, []);

  const filteredWalkers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return walkers;
    return walkers.filter(
      (w) =>
        w.name?.toLowerCase().includes(query) ||
        w.mobile?.toLowerCase().includes(query)
    );
  }, [walkers, searchQuery]);

  const handleAddWalker = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newMobile.trim()) return;

    setSaving(true);
    setError("");
    try {
      await createWalker({
        name: newName.trim(),
        mobile: newMobile.trim(),
        is_available: true,
      });
      setNewName("");
      setNewMobile("");
      setShowAddForm(false);
      loadWalkers();
    } catch (err) {
      setError(err.message || "Could not add walker");
    } finally {
      setSaving(false);
    }
  };

  const handleViewWalker = async (walker) => {
    try {
      const detail = await getWalker(walker.id);
      setSelectedWalker(detail);
    } catch (err) {
      setError(err.message || "Could not load walker details");
    }
  };

  const handleDeleteWalker = async (walker) => {
    if (!window.confirm(`Remove walker "${walker.name}"?`)) return;

    setDeletingId(walker.id);
    setError("");
    try {
      await deleteWalker(walker.id);
      setSelectedWalker(null);
      loadWalkers();
    } catch (err) {
      setError(err.message || "Could not remove walker");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-entity-panel">
      <div className="admin-table-card">
        <div className="admin-table-card__header">
          <h2 className="admin-table-card__title">Dog Walkers</h2>
          <div className="admin-entity-panel__actions">
            <span className="admin-table-card__count">{filteredWalkers.length} walkers</span>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => setShowAddForm((v) => !v)}
            >
              <FiPlus />
              Add Walker
            </button>
          </div>
        </div>

        {error && <div className="admin-entity-panel__error">{error}</div>}

        {showAddForm && (
          <form className="admin-entity-form" onSubmit={handleAddWalker}>
            <input
              type="text"
              className="admin-entity-form__input"
              placeholder="Walker name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input
              type="tel"
              className="admin-entity-form__input"
              placeholder="Mobile number"
              value={newMobile}
              onChange={(e) => setNewMobile(e.target.value)}
              required
            />
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? "Saving..." : "Save Walker"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="admin-entity-panel__hint">Loading walkers...</p>
        ) : filteredWalkers.length === 0 ? (
          <div className="admin-table__empty">
            <p className="admin-table__empty-title">No walkers found</p>
            <p className="admin-table__empty-text">Add a walker to start assigning bookings.</p>
          </div>
        ) : (
          <div className="admin-table-scroll admin-table-desktop">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Mobile</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="admin-table__th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWalkers.map((walker) => (
                  <tr key={walker.id} className="admin-table__row">
                    <td className="admin-table__name">{walker.name}</td>
                    <td className="admin-table__cell-muted">{walker.mobile}</td>
                    <td><AvailabilityBadge available={walker.is_available} /></td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() => handleViewWalker(walker)}
                      >
                        <FiEye /> View
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--danger-text"
                        onClick={() => handleDeleteWalker(walker)}
                        disabled={deletingId === walker.id}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedWalker && (
        <WalkerDetailModal
          walker={selectedWalker}
          onClose={() => setSelectedWalker(null)}
          onDelete={handleDeleteWalker}
          deleting={deletingId === selectedWalker.id}
        />
      )}
    </div>
  );
}
