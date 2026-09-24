import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePlayer } from "../../context/PlayerContext";
import { LogOut, UserRound } from "lucide-react";
import "./Navbar.css";

export default function Navbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const { stopPlayback } = usePlayer();
  const navigate = useNavigate();

  const handleLogout = async () => {
    stopPlayback();
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div>
        <h1 className="navbar-title">{title}</h1>
        {subtitle && <p className="navbar-subtitle">{subtitle}</p>}
      </div>

      <div className="navbar-user">
        <div className="navbar-user-avatar"><UserRound size={17} /></div>
        <div className="navbar-user-info">
          <span className="navbar-user-name">{user?.username}</span>
          <span className="navbar-user-role">{user?.role}</span>
        </div>
        <button className="btn btn-ghost navbar-logout" onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
