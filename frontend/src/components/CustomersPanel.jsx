import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiEye, FiX } from "react-icons/fi";
import StatusBadge from "./StatusBadge";
import { getCustomers, getCustomerDetail } from "../services/adminApi";

function CustomerDetailModal({ customer, onClose }) {
  if (!customer) return null;

  return (
    <div className="admin-entity-modal" role="presentation">
      <div className="admin-entity-modal__backdrop" onClick={onClose} />
      <motion.div
        className="admin-entity-modal__dialog admin-entity-modal__dialog--wide"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <header className="admin-entity-modal__header">
          <div>
            <span className="admin-entity-modal__chip">Customer</span>
            <h3 className="admin-entity-modal__title">{customer.name}</h3>
          </div>
          <button type="button" className="admin-entity-modal__close" onClick={onClose}>
            <FiX />
          </button>
        </header>

        <div className="admin-entity-modal__body">
          <dl className="admin-entity-details">
            <div className="admin-entity-details__row">
              <dt>Email</dt>
              <dd>{customer.email}</dd>
            </div>
            <div className="admin-entity-details__row">
              <dt>Mobile</dt>
              <dd>{customer.mobile}</dd>
            </div>
            <div className="admin-entity-details__row">
              <dt>Apartment</dt>
              <dd>{customer.apartment}</dd>
            </div>
            <div className="admin-entity-details__row">
              <dt>Flat / Villa</dt>
              <dd>{customer.flatNo}</dd>
            </div>
            <div className="admin-entity-details__row">
              <dt>Address</dt>
              <dd>{customer.address}</dd>
            </div>
            {customer.pet_name && (
              <div className="admin-entity-details__row">
                <dt>Pet</dt>
                <dd>{customer.pet_name}</dd>
              </div>
            )}
            <div className="admin-entity-details__row">
              <dt>Total bookings</dt>
              <dd>{customer.booking_count}</dd>
            </div>
          </dl>

          <h4 className="admin-entity-modal__section-title">Booking history</h4>
          {customer.bookings?.length ? (
            <div className="admin-entity-history">
              {customer.bookings.map((booking) => (
                <div key={booking.id} className="admin-entity-history__item">
                  <div className="admin-entity-history__top">
                    <span className="admin-entity-history__id">#{booking.id}</span>
                    <StatusBadge status={booking.status} compact />
                  </div>
                  <p className="admin-entity-history__meta">
                    {booking.apartment}
                    {booking.assigned_walker ? ` · ${booking.assigned_walker}` : ""}
                  </p>
                  <p className="admin-entity-history__date">
                    {booking.created_at
                      ? new Date(booking.created_at).toLocaleString("en-IN")
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-entity-panel__hint">No bookings on record.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function CustomersPanel({ searchQuery = "" }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getCustomers()
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Could not load customers"))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.mobile?.toLowerCase().includes(query) ||
        c.apartment?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const handleViewCustomer = async (customer) => {
    setLoadingDetail(true);
    setError("");
    try {
      const detail = await getCustomerDetail(customer.email);
      setSelectedCustomer(detail);
    } catch (err) {
      setError(err.message || "Could not load customer details");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="admin-entity-panel">
      <div className="admin-table-card">
        <div className="admin-table-card__header">
          <h2 className="admin-table-card__title">Customers</h2>
          <span className="admin-table-card__count">
            {filteredCustomers.length} unique customers
          </span>
        </div>

        {error && <div className="admin-entity-panel__error">{error}</div>}

        {loading ? (
          <p className="admin-entity-panel__hint">Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <div className="admin-table__empty">
            <p className="admin-table__empty-title">No customers yet</p>
            <p className="admin-table__empty-text">
              Customers appear here after they book a walk.
            </p>
          </div>
        ) : (
          <div className="admin-table-scroll admin-table-desktop">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Mobile</th>
                  <th scope="col">Apartment</th>
                  <th scope="col">Bookings</th>
                  <th scope="col" className="admin-table__th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.email} className="admin-table__row">
                    <td className="admin-table__name">{customer.name}</td>
                    <td className="admin-table__cell-muted">{customer.email}</td>
                    <td className="admin-table__cell-muted">{customer.mobile}</td>
                    <td className="admin-table__cell-muted">{customer.apartment}</td>
                    <td className="admin-table__cell-muted">{customer.booking_count}</td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        onClick={() => handleViewCustomer(customer)}
                        disabled={loadingDetail}
                      >
                        <FiEye /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
