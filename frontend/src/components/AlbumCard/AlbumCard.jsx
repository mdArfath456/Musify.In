import { Link } from "react-router-dom";
import { Disc3 } from "lucide-react";
import "./AlbumCard.css";

export default function AlbumCard({ album }) {
  return (
    <Link to={`/albums/${album._id}`} className="album-card">
      <div className="album-card-art" aria-hidden="true">
        <Disc3 size={34} />
      </div>
      <p className="album-card-title">{album.title}</p>
      <p className="album-card-artist">{album.artist?.username || "Unknown artist"}</p>
    </Link>
  );
}
