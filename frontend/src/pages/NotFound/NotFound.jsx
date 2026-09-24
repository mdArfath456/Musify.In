import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="not-found">
      <span className="eyebrow">404</span>
      <h1>Side B is blank</h1>
      <p>There's nothing recorded at this address.</p>
      <Link className="btn btn-primary" to="/library">
        Back to Library
      </Link>
    </div>
  );
}
