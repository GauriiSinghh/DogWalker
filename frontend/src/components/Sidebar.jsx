import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiCalendar,
  FiUsers,
  FiUser,
  FiSettings,
  FiLogOut,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import logo from "../assets/images/logo.png";
import { clearAdminSession } from "../utils/adminAuth";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid },
  { id: "bookings", label: "Bookings", icon: FiCalendar },
  { id: "walkers", label: "Walkers", icon: FiUsers },
  { id: "customers", label: "Customers", icon: FiUser },
  { id: "settings", label: "Settings", icon: FiSettings },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  return (
    <>
      {isOpen && (
        <div
          className="admin-sidebar-overlay admin-sidebar-overlay--visible"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar${isOpen ? " admin-sidebar--open" : ""}${
          collapsed ? " admin-sidebar--collapsed" : ""
        }`}
      >
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-inner">
            <div className="admin-sidebar__logo-wrap">
              <img src={logo} alt="Zuppy" className="admin-sidebar__logo" />
            </div>
            {!collapsed && (
              <div className="admin-sidebar__brand-text">
                <span className="admin-sidebar__brand-name">Zuppy</span>
                <span className="admin-sidebar__brand-sub">Admin Panel</span>
              </div>
            )}
          </div>
          {isOpen && (
            <button
              type="button"
              className="admin-sidebar__close"
              onClick={onClose}
              aria-label="Close menu"
            >
              <FiX />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="admin-sidebar__panel-label">Navigation</div>
        )}

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }, index) => (
            <motion.button
              key={id}
              type="button"
              className={`admin-sidebar__link${
                activeSection === id ? " admin-sidebar__link--active" : ""
              }`}
              onClick={() => {
                onSectionChange(id);
                onClose?.();
              }}
              title={collapsed ? label : undefined}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Icon />
              {!collapsed && label}
            </motion.button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className={`admin-sidebar__profile${collapsed ? " admin-sidebar__profile--collapsed" : ""}`}>
            <div className="admin-sidebar__profile-avatar">A</div>
            {!collapsed && (
              <div className="admin-sidebar__profile-info">
                <span className="admin-sidebar__profile-name">Admin</span>
                <span className="admin-sidebar__profile-role">Super Admin</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="admin-sidebar__collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            {!collapsed && <span>Collapse</span>}
          </button>

          <button
            type="button"
            className="admin-sidebar__logout"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
          >
            <FiLogOut />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
