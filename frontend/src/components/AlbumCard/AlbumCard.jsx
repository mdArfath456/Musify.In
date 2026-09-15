import { Link } from "react-router-dom";
import "./AlbumCard.css";

export default function AlbumCard({ album }) {
  return (
    <Link to={`/albums/${album._id}`} className="album-card">
      <div className="album-card-art" aria-hidden="true">
        <span>{album.title?.[0]?.toUpperCase() || "?"}</span>
      </div>
      <p className="album-card-title">{album.title}</p>
      <p className="album-card-artist">{album.artist?.username || "Unknown artist"}</p>
    </Link>
  );
}
