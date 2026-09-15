import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close the drawer automatically whenever the route changes (i.e. after
  // tapping a nav link), so the person doesn't have to close it manually.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent the page behind the drawer from scrolling while it's open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const linkClass = ({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <>
      <div className="sidebar-topbar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">M</span>
          <span className="sidebar-brand-name">Musify</span>
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <span className={`sidebar-toggle-bar ${isOpen ? "open" : ""}`} />
          <span className={`sidebar-toggle-bar ${isOpen ? "open" : ""}`} />
          <span className={`sidebar-toggle-bar ${isOpen ? "open" : ""}`} />
        </button>
      </div>

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">M</span>
          <span className="sidebar-brand-name">Musify</span>
        </div>

        <nav className="sidebar-nav">
          <span className="eyebrow sidebar-section-label">Listen</span>
          <NavLink to="/library" className={linkClass}>
            Library
          </NavLink>
          <NavLink to="/albums" className={linkClass}>
            Albums
          </NavLink>
          <NavLink to="/liked" className={linkClass}>
            Liked Songs
          </NavLink>
          <NavLink to="/recent" className={linkClass}>
            Recently Played
          </NavLink>
          <NavLink to="/ai" className={linkClass}>
            AI Assistant
          </NavLink>
          <NavLink to="/online" className={linkClass}>
            Online Search
          </NavLink>

          {user?.role === "artist" && (
            <>
              <span className="eyebrow sidebar-section-label">Studio</span>
              <NavLink to="/studio" className={linkClass}>
                Upload &amp; albums
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-reel" aria-hidden="true">
            <div className="sidebar-reel-hub" />
          </div>
          <p className="sidebar-tagline">Every track, on the record.</p>
        </div>
      </aside>
    </>
  );
}