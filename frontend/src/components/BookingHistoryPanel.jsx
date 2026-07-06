import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Footprints,
  Scissors,
  Home,
  Users,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { fetchMyBookings } from "../services/bookingApi";
import "../styles/booking-history.css";

const SERVICE_ICONS = {
  "Dog Walking": Footprints,
  "Dog Walker": Footprints,
  "Dog Grooming": Scissors,
  Grooming: Scissors,
  "Pet Boarding": Home,
  Boarding: Home,
  "Friend/Family": Users,
};

const STATUS_CLASS = {
  PENDING: "bh-badge--pending",
  CONFIRMED: "bh-badge--confirmed",
  COMPLETED: "bh-badge--completed",
  CANCELLED: "bh-badge--cancelled",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(amount) {
  if (amount == null) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

function ServiceIcon({ type }) {
  const Icon = SERVICE_ICONS[type] || Footprints;
  return (
    <div className="bh-service-icon">
      <Icon size={22} strokeWidth={2} />
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = STATUS_CLASS[status] || "bh-badge--pending";
  return <span className={`bh-badge ${cls}`}>{status}</span>;
}

function PaymentBadge({ status }) {
  const paid = status === "PAID";
  return (
    <span className={`bh-badge ${paid ? "bh-badge--paid" : "bh-badge--unpaid"}`}>
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

export default function BookingHistoryPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("One-Time");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const data = await fetchMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message || "Could not load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Poll every 30s + refetch on window focus
  useEffect(() => {
    const interval = setInterval(() => loadBookings(true), 30000);
    const onFocus = () => loadBookings(true);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadBookings]);

  const summary = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const completed = bookings.filter((b) => b.status === "COMPLETED").length;
    const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;
    const spent = bookings
      .filter((b) => b.payment_status === "PAID")
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    return { total, pending, completed, cancelled, spent };
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (tab === "One-Time" && b.booking_category !== "One-Time") return false;
      if (tab === "Subscription" && b.booking_category !== "Subscription") return false;
      if (serviceFilter !== "all" && b.service_type !== serviceFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (paymentFilter !== "all" && b.payment_status !== paymentFilter) return false;
      if (dateFilter && b.booking_date !== dateFilter) return false;
      return true;
    });
  }, [bookings, tab, serviceFilter, statusFilter, paymentFilter, dateFilter]);

  const serviceTypes = useMemo(
    () => [...new Set(bookings.map((b) => b.service_type).filter(Boolean))],
    [bookings]
  );

  if (loading) {
    return (
      <div className="bh-page">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bh-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="bh-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CalendarDays size={22} color="#f97316" strokeWidth={2} />
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            My Bookings
          </h2>
        </div>
        <button
          type="button"
          className="bh-action-btn"
          onClick={() => loadBookings(true)}
          disabled={refreshing}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={14} className={refreshing ? "spin" : ""} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
          Refresh
        </button>
      </div>

      {error && <div className="global-error">{error}</div>}

      <div className="bh-summary-grid">
        <div className="bh-summary-card">
          <div className="bh-summary-label">Total Bookings</div>
          <div className="bh-summary-value">{summary.total}</div>
        </div>
        <div className="bh-summary-card">
          <div className="bh-summary-label">Pending</div>
          <div className="bh-summary-value">{summary.pending}</div>
        </div>
        <div className="bh-summary-card">
          <div className="bh-summary-label">Completed</div>
          <div className="bh-summary-value">{summary.completed}</div>
        </div>
        <div className="bh-summary-card">
          <div className="bh-summary-label">Cancelled</div>
          <div className="bh-summary-value">{summary.cancelled}</div>
        </div>
        <div className="bh-summary-card">
          <div className="bh-summary-label">Money Spent</div>
          <div className="bh-summary-value bh-summary-value--money">{fmtMoney(summary.spent)}</div>
        </div>
      </div>

      <div className="bh-tabs" role="tablist">
        {["One-Time", "Subscription"].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`bh-tab${tab === t ? " bh-tab--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bh-filters">
        <select
          className="bh-filter-select"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          aria-label="Filter by service"
        >
          <option value="all">All Services</option>
          {serviceTypes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="bh-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          className="bh-filter-select"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          aria-label="Filter by payment"
        >
          <option value="all">All Payments</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
        </select>
        <input
          type="date"
          className="bh-filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter by date"
        />
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            className="bh-empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="bh-empty-icon">
              <CalendarDays size={40} strokeWidth={1.5} color="#f97316" style={{ opacity: 0.4 }} />
            </div>
            <p style={{ margin: "0 0 16px", color: "var(--z-muted)", fontWeight: 600 }}>
              {bookings.length === 0
                ? "You don't have any bookings yet."
                : "No bookings match your filters."}
            </p>
            {bookings.length === 0 && (
              <Link
                to="/booking-choice"
                className="btn-primary"
                style={{ display: "inline-flex", width: "auto", minHeight: 40, padding: "8px 20px" }}
              >
                Book a Service
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            className="bh-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filtered.map((b) => (
              <article key={b.id} className="bh-card">
                <div className="bh-card-header">
                  <div className="bh-card-left">
                    <ServiceIcon type={b.service_type} />
                    <div className="bh-card-meta">
                      <span className="bh-booking-id">{b.id}</span>
                      <span className="bh-plan-name">{b.plan_name || b.service_type}</span>
                      <span className="bh-datetime">
                        {fmtDate(b.booking_date)} · {b.time_slot || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="bh-card-right">
                    <span className="bh-amount">{fmtMoney(b.amount)}</span>
                    <div className="bh-badges">
                      <PaymentBadge status={b.payment_status} />
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </div>

                {b.walker && (
                  <div className="bh-walker">
                    <div className="bh-walker-avatar">
                      {b.walker.profile_image ? (
                        <img src={b.walker.profile_image} alt={b.walker.name} />
                      ) : (
                        b.walker.name?.charAt(0)?.toUpperCase() || "W"
                      )}
                    </div>
                    <div className="bh-walker-info">
                      <div className="bh-walker-name">{b.walker.name}</div>
                      {b.walker.phone && (
                        <div className="bh-walker-phone">{b.walker.phone}</div>
                      )}
                    </div>
                  </div>
                )}

                {expandedId === b.id && (
                  <div className="bh-detail-panel">
                    <div>
                      <div className="bh-detail-label">Service</div>
                      {b.service_type} · {b.booking_category}
                    </div>
                    <div>
                      <div className="bh-detail-label">Duration</div>
                      {b.duration ? `${b.duration} min` : "—"}
                    </div>
                    <div>
                      <div className="bh-detail-label">Payment</div>
                      {b.payment_method} · {b.payment_status}
                    </div>
                    {b.address && (
                      <div>
                        <div className="bh-detail-label">Location</div>
                        {b.address}
                      </div>
                    )}
                    {b.friend_family && (
                      <div>
                        <div className="bh-detail-label">Friend/Family</div>
                        {b.friend_family.name} · {b.friend_family.mobile}
                      </div>
                    )}
                    {b.special_instructions && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <div className="bh-detail-label">Special Instructions</div>
                        {b.special_instructions}
                      </div>
                    )}
                  </div>
                )}

                <div className="bh-actions">
                  <button
                    type="button"
                    className="bh-action-btn"
                    onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                  >
                    View Details
                  </button>
                  {b.status === "CONFIRMED" && (
                    <button type="button" className="bh-action-btn">Track</button>
                  )}
                  {b.payment_status === "PAID" && (
                    <button type="button" className="bh-action-btn">Invoice</button>
                  )}
                  {["PENDING", "CONFIRMED"].includes(b.status) && (
                    <button type="button" className="bh-action-btn bh-action-btn--danger">
                      Cancel
                    </button>
                  )}
                  {b.status === "COMPLETED" && b.walker && (
                    <button type="button" className="bh-action-btn">Rate Walker</button>
                  )}
                  <Link to="/booking-choice" className="bh-action-btn" style={{ textDecoration: "none" }}>
                    Repeat Booking
                  </Link>
                </div>
              </article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
