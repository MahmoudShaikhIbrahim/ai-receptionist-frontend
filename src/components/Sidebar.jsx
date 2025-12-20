// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true"></div>
        <div>
          <div className="sidebar__name">Pure AI</div>
          <div className="sidebar__role">Admin Console</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav__section">
          <div className="nav__title">Main</div>
          <NavItem to="/" label="Dashboard" icon={<IconGrid />} />
        </div>

        <div className="nav__section">
          <div className="nav__title">Operations</div>
          <NavItem to="/bookings" label="Bookings" icon={<IconCalendar />} />
          <NavItem to="/orders" label="Orders" icon={<IconBox />} />
        </div>

        <div className="nav__section">
          <div className="nav__title">Settings</div>
          <NavItem to="/settings/business" label="Business" icon={<IconSliders />} />
          <NavItem to="/settings/agent" label="Agent" icon={<IconUser />} />
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

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `navItem ${isActive ? "navItem--active" : ""}`}
    >
      <span className="navItem__icon" aria-hidden="true">{icon}</span>
      <span className="navItem__label">{label}</span>
    </NavLink>
  );
}

/* Minimal inline SVG icons (no dependencies) */
function Svg({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}
function IconGrid() {
  return (
    <Svg>
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.6" />
    </Svg>
  );
}
function IconCalendar() {
  return (
    <Svg>
      <path d="M7 3v3M17 3v3M4 9h16M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
    </Svg>
  );
}
function IconBox() {
  return (
    <Svg>
      <path d="M21 8l-9-5-9 5 9 5 9-5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 8v10l9 5 9-5V8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 13v10" stroke="currentColor" strokeWidth="1.6" />
    </Svg>
  );
}
function IconSliders() {
  return (
    <Svg>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2 14h4M10 8h4M18 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}
function IconUser() {
  return (
    <Svg>
      <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.6" />
    </Svg>
  );
}