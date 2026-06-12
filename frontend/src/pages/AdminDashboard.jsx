import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiMenu, FiUsers, FiUser, FiSettings } from "react-icons/fi";
import { getBookings, updateBooking } from "../services/adminApi";
import Sidebar from "../components/Sidebar";
import StatsCards from "../components/StatsCards";
import BookingTable from "../components/BookingTable";
import WalkersPanel from "../components/WalkersPanel";
import CustomersPanel from "../components/CustomersPanel";
import ThemeToggle from "../components/ThemeToggle";
import { useAdminTheme } from "../hooks/useAdminTheme";
import "../styles/admin.css";


const PLACEHOLDER_CONTENT = {
  walkers: {
    title: "Walkers",
    text: "Manage dog walker profiles, availability, and assignments from this section.",
  },
  customers: {
    title: "Customers",
    text: "View customer profiles, booking history, and contact details in one place.",
  },
  settings: {
    title: "Settings",
    text: "Configure admin preferences, notifications, and system settings here.",
  },
};

const PLACEHOLDER_ICONS = {
  walkers: FiUsers,
  customers: FiUser,
  settings: FiSettings,
};

const sectionTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
};

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PlaceholderPanel({ section }) {
  const content = PLACEHOLDER_CONTENT[section];
  if (!content) return null;

  const Icon = PLACEHOLDER_ICONS[section] || FiMenu;

  return (
    <motion.div className="admin-placeholder" {...sectionTransition}>
      <div className="admin-placeholder__icon">
        <Icon />
      </div>
      <h2 className="admin-placeholder__title">{content.title}</h2>
      <p className="admin-placeholder__text">{content.text}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { theme, toggleTheme } = useAdminTheme();
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchBookings = () => {
    getBookings()
      .then((data) => {
        setBookings(data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);
  useEffect(() => {
  const WS_URL =
  window.location.hostname === "localhost"
    ? "ws://localhost:8000/ws/bookings"
    : "wss://dogwalkerbackend1.onrender.com/ws/bookings";

const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("✅ WebSocket Connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    console.log("📩 WS Message:", data);

    fetchBookings(); // refresh bookings automatically
  };

  ws.onclose = () => {
    console.log("❌ WebSocket Disconnected");
  };

  ws.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };

 return () => {
  if (
    ws.readyState === WebSocket.OPEN ||
    ws.readyState === WebSocket.CONNECTING
  ) {
    ws.close();
  }
};
}, []);

  const updateBookingRecord = async (id, data) => {
    await updateBooking(id, data);
    fetchBookings();
  };

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter(
      (booking) =>
        String(booking.id).includes(query) ||
        booking.name?.toLowerCase().includes(query) ||
        booking.apartment?.toLowerCase().includes(query) ||
        booking.mobile?.toLowerCase().includes(query) ||
        booking.assigned_walker?.toLowerCase().includes(query) ||
        booking.status?.toLowerCase().includes(query)
    );
  }, [bookings, searchQuery]);

  const showStats = activeSection === "dashboard" || activeSection === "bookings";
  const showTable = activeSection === "dashboard" || activeSection === "bookings";
  const showWalkers = activeSection === "walkers";
  const showCustomers = activeSection === "customers";
  const showPlaceholder = activeSection === "settings";

  const searchPlaceholder =
    activeSection === "walkers"
      ? "Search walkers..."
      : activeSection === "customers"
        ? "Search customers..."
        : "Search bookings...";

  const sectionTitles = {
    dashboard: { title: "Dashboard Overview", subtitle: "Monitor bookings and activity at a glance" },
    bookings: { title: "Bookings", subtitle: "Manage and update walk requests" },
    walkers: { title: "Walkers", subtitle: "Walker management" },
    customers: { title: "Customers", subtitle: "Customer directory" },
    settings: { title: "Settings", subtitle: "Admin configuration" },
  };

  const currentSection = sectionTitles[activeSection] || sectionTitles.dashboard;

  return (
    <div className={`admin-layout admin-layout--${theme}${sidebarCollapsed ? " admin-layout--collapsed" : ""}`}>
      <button
        type="button"
        className="admin-mobile-toggle"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <FiMenu />
      </button>

      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="admin-main">
        <motion.header
          className="admin-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="admin-header__left">
            <h1 className="admin-header__welcome">Welcome back, Admin</h1>
            <p className="admin-header__date">{formatDate(new Date())}</p>
          </div>

          <div className="admin-header__right">
            <div className="admin-header__search">
              <FiSearch className="admin-header__search-icon" />
              <input
                type="search"
                className="admin-header__search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className="admin-header__avatar" title="Admin">
              A
            </div>
          </div>
        </motion.header>

        <main className="admin-content">
          <div className="admin-section-header">
            <h2 className="admin-section-title">{currentSection.title}</h2>
            <p className="admin-section-subtitle">{currentSection.subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {showStats && <StatsCards bookings={bookings} />}

              {showTable && (
                <BookingTable
                  bookings={filteredBookings}
                  onBookingUpdate={updateBookingRecord}
                />
              )}

              {showWalkers && <WalkersPanel searchQuery={searchQuery} />}

              {showCustomers && <CustomersPanel searchQuery={searchQuery} />}

              {showPlaceholder && <PlaceholderPanel section={activeSection} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
