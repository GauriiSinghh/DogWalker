import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  CalendarDays,
  PersonStanding,
  Users,
  Tag,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut,
  X,
} from "lucide-react";
import logo from "../assets/images/logo.png";
import { clearAdminSession } from "../utils/adminAuth";
import { useSidebar } from "../hooks/useSidebar";
import "../styles/sidebar.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "walkers", label: "Walkers", icon: PersonStanding },
  { id: "customers", label: "Customers", icon: Users },
  { id: "pricing", label: "Pricing", icon: Tag },
  { id: "settings", label: "Settings", icon: Settings2 },
];


function Tooltip({ label, show }) {
  if (!show || !label) return null;
  return (
    <span className="admin-sidebar__tooltip" role="tooltip">
      {label}
    </span>
  );
}

export default function Sidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}) {
  const navigate = useNavigate();
  const { isDark, toggleTheme, themeAnimating } = useSidebar({
    collapsed,
    onToggleCollapse,
  });

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  const handleSettings = () => {
    onSectionChange("settings");
    onClose?.();
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
        role="navigation"
        aria-label="Admin navigation"
        className={clsx(
          "admin-sidebar",
          isOpen && "admin-sidebar--open",
          collapsed && "admin-sidebar--collapsed",
          isDark ? "admin-sidebar--dark" : "admin-sidebar--light"
        )}
      >
        {/* Floating collapse / expand toggle */}
        <button
          type="button"
          className="admin-sidebar__toggle-float"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span
            className={clsx(
              "admin-sidebar__toggle-icon",
              collapsed
                ? "admin-sidebar__toggle-icon--visible"
                : "admin-sidebar__toggle-icon--hidden"
            )}
            aria-hidden={!collapsed}
          >
            <PanelLeftOpen size={16} strokeWidth={2} />
          </span>
          <span
            className={clsx(
              "admin-sidebar__toggle-icon",
              !collapsed
                ? "admin-sidebar__toggle-icon--visible"
                : "admin-sidebar__toggle-icon--hidden"
            )}
            aria-hidden={collapsed}
          >
            <PanelLeftClose size={16} strokeWidth={2} />
          </span>
        </button>

        {/* Brand header */}
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-inner">
            <div className="admin-sidebar__logo-wrap">
              <img src={logo} alt="Zuppy" className="admin-sidebar__logo" />
            </div>
            <div className="admin-sidebar__brand-label">
              <span className="admin-sidebar__brand-name">Zuppy</span>
              <span className="admin-sidebar__brand-sub">Admin Panel</span>
            </div>
          </div>
          {isOpen && (
            <button
              type="button"
              className="admin-sidebar__close"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation label */}
        <div className="admin-sidebar__panel-label" aria-hidden={collapsed}>
          Navigation
        </div>

        {/* Nav items */}
        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <div key={id} className="admin-sidebar__tooltip-wrap">
              <button
                type="button"
                className={clsx(
                  "admin-sidebar__link",
                  activeSection === id && "admin-sidebar__link--active"
                )}
                onClick={() => {
                  onSectionChange(id);
                  onClose?.();
                }}
                aria-label={label}
                aria-current={activeSection === id ? "page" : undefined}
              >
                <Icon size={20} strokeWidth={activeSection === id ? 2.25 : 2} />
                <span className="admin-sidebar__link-label">{label}</span>
              </button>
              <Tooltip label={label} show={collapsed} />
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="admin-sidebar__footer">
          <div
            className={clsx(
              "admin-sidebar__profile",
              collapsed && "admin-sidebar__profile--collapsed"
            )}
          >
            <div className="admin-sidebar__tooltip-wrap">
              <div className="admin-sidebar__profile-avatar" aria-hidden="true">
                A
              </div>
              <Tooltip label="Admin · Super Admin" show={collapsed} />
            </div>
            <div className="admin-sidebar__profile-info">
              <span className="admin-sidebar__profile-name">Admin</span>
              <span className="admin-sidebar__profile-role">Super Admin</span>
            </div>
          </div>

          <div className="admin-sidebar__actions">
            <button
              type="button"
              className="admin-sidebar__action-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              <span
                className={clsx(
                  "admin-sidebar__theme-icon",
                  themeAnimating && "admin-sidebar__theme-icon--spin"
                )}
              >
                {isDark ? (
                  <Sun size={18} strokeWidth={2} />
                ) : (
                  <Moon size={18} strokeWidth={2} />
                )}
              </span>
              {collapsed && (
                <span className="admin-sidebar__tooltip" role="tooltip">
                  {isDark ? "Light mode" : "Dark mode"}
                </span>
              )}
            </button>

            <button
              type="button"
              className="admin-sidebar__action-btn"
              onClick={handleSettings}
              aria-label="Settings"
            >
              <Settings2 size={18} strokeWidth={2} />
              {collapsed && (
                <span className="admin-sidebar__tooltip" role="tooltip">
                  Settings
                </span>
              )}
            </button>

            <button
              type="button"
              className="admin-sidebar__action-btn admin-sidebar__action-btn--logout"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut size={18} strokeWidth={2} />
              {collapsed && (
                <span className="admin-sidebar__tooltip" role="tooltip">
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
