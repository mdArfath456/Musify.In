import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

export default function Navbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
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
        <div className="navbar-user-info">
          <span className="navbar-user-name">{user?.username}</span>
          <span className="navbar-user-role">{user?.role}</span>
        </div>
        <button className="btn btn-ghost navbar-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
