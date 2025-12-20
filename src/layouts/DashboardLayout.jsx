// src/layouts/DashboardLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="appShell">
      <Sidebar />

      <div className="appMain">
        <TopNav />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

function TopNav() {
  const navigate = useNavigate();
  const { logout, business } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    const onDown = (e) => {
      const el = document.querySelector("[data-profile-wrap]");
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const title = useMemo(() => "Pure AI", []);

  function handleLogout() {
    logout();                 // 🔴 CLEAR TOKEN
    navigate("/login");       // 🔴 REDIRECT
  }

  function goProfile() {
    navigate("/settings/business");
    setOpen(false);
  }

  function goSettings() {
    navigate("/settings/agent");
    setOpen(false);
  }

  return (
    <header className={`topNav ${scrolled ? "topNav--scrolled" : ""}`}>
      <div className="topNav__left">
        <div className="topNav__title">{title}</div>
        <div className="topNav__subtitle">Admin Console</div>
      </div>

      <div className="topNav__right">
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => alert("Quick Actions coming soon")}
        >
          <span className="icon" aria-hidden="true">⌘</span>
          <span>Quick Actions</span>
        </button>

        <div className="profile" data-profile-wrap>
          <button
            className="profileBtn"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="avatar" aria-hidden="true">
              {business?.businessName?.[0]?.toUpperCase() || "B"}
            </div>
            <div className="profileBtn__meta">
              <div className="profileBtn__name">
                {business?.businessName || "Business"}
              </div>
              <div className="profileBtn__hint">Business Admin</div>
            </div>
            <span className="chev" aria-hidden="true">▾</span>
          </button>

          {open && (
            <div className="menu" role="menu">
              <button
                className="menuItem"
                role="menuitem"
                type="button"
                onClick={goProfile}
              >
                Profile
              </button>

              <button
                className="menuItem"
                role="menuitem"
                type="button"
                onClick={goSettings}
              >
                Settings
              </button>

              <div className="menuSep" />

              <button
                className="menuItem menuItem--danger"
                role="menuitem"
                type="button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}