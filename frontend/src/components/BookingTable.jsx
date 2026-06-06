import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FiInbox } from "react-icons/fi";
import StatusBadge from "./StatusBadge";
import BookingActions from "./BookingActions";
import BookingManagePanel from "./BookingManagePanel";

const FILTER_TABS = [
  { id: "all", label: "All Bookings" },
  { id: "New", label: "Pending" },
  { id: "Assigned", label: "Assigned" },
  { id: "Completed", label: "Completed" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.25, 1, 0.5, 1] },
  }),
};

function EmptyState({ filter }) {
  const messages = {
    New: "No pending bookings at the moment.",
    Assigned: "No assigned bookings right now.",
    Completed: "No completed bookings to show.",
    all: "New walk requests will appear here once customers submit bookings.",
  };

  return (
    <div className="admin-table__empty">
      <div className="admin-table__empty-icon">
        <FiInbox />
      </div>
      <p className="admin-table__empty-title">No bookings found</p>
      <p className="admin-table__empty-text">
        {messages[filter] || messages.all}
      </p>
    </div>
  );
}

function BookingRow({ booking, isActive, onManage }) {
  return (
    <tr className={`admin-table__row${isActive ? " admin-table__row--active" : ""}`}>
      <td className="admin-table__id" data-label="ID">#{booking.id}</td>
      <td className="admin-table__name" data-label="Name">{booking.name}</td>
      <td className="admin-table__cell-muted" data-label="Apartment">{booking.apartment}</td>
      <td className="admin-table__cell-muted" data-label="Mobile">{booking.mobile}</td>
      <td data-label="Status">
        <StatusBadge status={booking.status} />
      </td>
      <td className="admin-table__actions" data-label="Actions">
        <BookingActions
          booking={booking}
          isActive={isActive}
          onManage={onManage}
        />
      </td>
    </tr>
  );
}

function BookingCard({ booking, index, isActive, onManage }) {
  return (
    <motion.div
      className={`admin-booking-card${isActive ? " admin-booking-card--active" : ""}`}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="admin-booking-card__top">
        <div>
          <span className="admin-booking-card__id">#{booking.id}</span>
          <p className="admin-booking-card__name">{booking.name}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="admin-booking-card__details">
        <div className="admin-booking-card__row">
          <span className="admin-booking-card__label">Apartment</span>
          <span className="admin-booking-card__value">{booking.apartment}</span>
        </div>
        <div className="admin-booking-card__row">
          <span className="admin-booking-card__label">Mobile</span>
          <span className="admin-booking-card__value">{booking.mobile}</span>
        </div>
      </div>

      <div className="admin-booking-card__actions">
        <BookingActions
          booking={booking}
          isActive={isActive}
          onManage={onManage}
        />
      </div>
    </motion.div>
  );
}

export default function BookingTable({ bookings, onStatusChange }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [managedBooking, setManagedBooking] = useState(null);

  const filteredBookings = useMemo(() => {
    if (activeFilter === "all") return bookings;
    return bookings.filter((b) => b.status === activeFilter);
  }, [bookings, activeFilter]);

  const tabCounts = useMemo(() => ({
    all: bookings.length,
    New: bookings.filter((b) => b.status === "New").length,
    Assigned: bookings.filter((b) => b.status === "Assigned").length,
    Completed: bookings.filter((b) => b.status === "Completed").length,
  }), [bookings]);

  const handleManage = (booking) => {
    setManagedBooking(booking);
  };

  const handleClosePanel = () => setManagedBooking(null);

  const handleStatusChange = async (id, status) => {
    await onStatusChange(id, status);
  };

  const activeManagedBooking = managedBooking
    ? bookings.find((b) => b.id === managedBooking.id) || managedBooking
    : null;

  return (
    <div className="admin-bookings">
      <motion.div
        className="admin-table-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="admin-table-card__header">
          <h2 className="admin-table-card__title">Booking Management</h2>
          <span className="admin-table-card__count">
            {filteredBookings.length} showing
          </span>
        </div>

        <div className="admin-filter-tabs" role="tablist" aria-label="Filter bookings">
          {FILTER_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeFilter === id}
              className={`admin-filter-tab${activeFilter === id ? " admin-filter-tab--active" : ""}`}
              onClick={() => setActiveFilter(id)}
            >
              {label}
              <span className="admin-filter-tab__count">{tabCounts[id]}</span>
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <>
            <div className="admin-table-scroll admin-table-desktop">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Apartment</th>
                    <th scope="col">Mobile</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="admin-table__th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      isActive={managedBooking?.id === booking.id}
                      onManage={handleManage}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-booking-cards">
              {filteredBookings.map((booking, index) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  index={index}
                  isActive={managedBooking?.id === booking.id}
                  onManage={handleManage}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {activeManagedBooking && (
        <BookingManagePanel
          booking={activeManagedBooking}
          onClose={handleClosePanel}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
