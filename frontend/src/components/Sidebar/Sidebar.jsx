import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Disc3, History, Heart, Home, LogOut, Menu, Moon, Search, Sparkles, Sun, Upload, UserRound, X } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { stopPlayback } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("musify.theme") !== "light");

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("musify.theme", isDark ? "dark" : "light");
  }, [isDark]);

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
  const handleLogout = async () => {
    stopPlayback();
    await logout();
    navigate("/login");
  };
  const navItems = [
    ["/library", "Library", Home],
    ["/albums", "Albums", Disc3],
    ["/liked", "Liked Songs", Heart],
    ["/recent", "Recently Played", History],
    ["/ai", "Musify AI", Sparkles],
    ["/online", "Online Search", Search],
  ];

  return (
    <>
      <div className="sidebar-topbar">
        <div className="sidebar-brand">
          <div className="brand-lockup" aria-label="Musify">
            <span className="brand-mark">M</span><span>MUSIFY</span>
          </div>
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {/* Always rendered (never conditionally mounted) so the CSS
          opacity/visibility transition below can actually animate it in
          and out — a conditionally-rendered overlay can only pop, never fade. */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-lockup" aria-label="Musify">
            <span className="brand-mark">M</span><span>MUSIFY</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="eyebrow sidebar-section-label">Listen</span>
          {navItems.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.role === "artist" && (
            <>
              <span className="eyebrow sidebar-section-label">Studio</span>
              <NavLink to="/studio" className={linkClass}>
                <Upload size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>Upload &amp; albums</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{user?.username?.slice(0, 1).toUpperCase() || "M"}</div>
            <div>
              <strong>{user?.username || "Listener"}</strong>
              <span>{user?.role || "music lover"}</span>
            </div>
          </div>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setIsDark((value) => !value)}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? "Light mode" : "Dark mode"}</span>
          </button>
          <button className="sidebar-logout" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}