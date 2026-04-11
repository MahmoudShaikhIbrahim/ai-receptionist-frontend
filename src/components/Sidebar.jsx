// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { IconLayoutGrid } from "@tabler/icons-react";
import { useNotifications } from "../context/NotificationContext";

export default function Sidebar() {
  const { bookingCount, orderCount, clearBookings, clearOrders } = useNotifications();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true"></div>
        <div>
          <div className="sidebar__name">Pure AI</div>
          <div className="sidebar__role">Admin Console</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav__section">
          <div className="nav__title">Main</div>
          <NavItem to="/dashboard" label="Dashboard" icon={<IconGrid />} end />
        </div>

        <div className="nav__section">
          <div className="nav__title">Operations</div>
          <NavItem to="/dashboard/floor" label="Live Floor" icon={<IconLayout />} end />
          <NavItem
            to="/bookings"
            label="Bookings & Orders"
            icon={<IconCalendar />}
            badge={bookingCount}
            onActivate={clearBookings}
          />
          <NavItem
            to="/orders/manual"
            label="Manual Orders"
            icon={<IconBag />}
          />
          <NavItem
            to="/orders"
            label="Kitchen"
            icon={<IconBox />}
            badge={orderCount}
            onActivate={clearOrders}
            end
          />
        </div>

        <div className="nav__section">
          <div className="nav__title">Settings</div>
          <NavItem to="/settings/business" label="Business"      icon={<IconSliders />} />
          <NavItem to="/settings/agent"    label="Agent"         icon={<IconUser />} />
          <NavItem to="/settings/menu"     label="Menu"          icon={<IconMenu />} />
          <NavItem to="/settings/hours"    label="Opening Hours" icon={<IconClock />} />
          <NavItem to="/dashboard/floor/layout" label="Floor Layout" icon={<IconLayoutGrid />} end />
        </div>
      </nav>

      <div className="sidebar__footer">
        <div className="hintPill">
          <span className="hintDot" aria-hidden="true" />
          <span>Server: localhost</span>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, label, icon, end = false, badge = 0, onActivate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onActivate}
      className={({ isActive }) => `navItem ${isActive ? "navItem--active" : ""}`}
    >
      <span className="navItem__icon" aria-hidden="true">{icon}</span>
      <span className="navItem__label">{label}</span>
      {badge > 0 && (
        <span style={{
          marginLeft: "auto",
          minWidth: 20, height: 20,
          borderRadius: 999,
          background: "#FF3B30",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 5px",
        }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </NavLink>
  );
}

function Svg({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function IconGrid() {
  return <Svg><path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.6" /></Svg>;
}
function IconCalendar() {
  return <Svg><path d="M7 3v3M17 3v3M4 9h16M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" /></Svg>;
}
function IconBox() {
  return <Svg><path d="M21 8l-9-5-9 5 9 5 9-5Z" stroke="currentColor" strokeWidth="1.6" /><path d="M3 8v10l9 5 9-5V8" stroke="currentColor" strokeWidth="1.6" /><path d="M12 13v10" stroke="currentColor" strokeWidth="1.6" /></Svg>;
}
function IconLayout() {
  return <Svg><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 8h4M14 8h2M8 13h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></Svg>;
}
function IconSliders() {
  return <Svg><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M2 14h4M10 8h4M18 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></Svg>;
}
function IconUser() {
  return <Svg><path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="1.6" /><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.6" /></Svg>;
}
function IconMenu() {
  return <Svg><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.6" /><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z" stroke="currentColor" strokeWidth="1.6" /><path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></Svg>;
}
function IconClock() {
  return <Svg><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></Svg>;
}
function IconBag() {
  return <Svg><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="currentColor" strokeWidth="1.6"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></Svg>;
}