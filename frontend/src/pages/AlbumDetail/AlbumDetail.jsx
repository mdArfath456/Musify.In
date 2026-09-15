import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import MusicCard from "../../components/MusicCard/MusicCard";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { getAlbumById } from "../../api/music.api";
import "./AlbumDetail.css";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAlbumById(albumId)
      .then((data) => {
        if (!cancelled) setAlbum(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load this album.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [albumId]);

  return (
    <div className="page">
      <Navbar
        title={loading ? "Album" : album?.title || "Album"}
        subtitle={loading ? "" : `By ${album?.artist?.username || "Unknown artist"}`}
      />

      <div className="page-body">
        <Link to="/albums" className="album-back-link">
          ← Back to albums
        </Link>

        {loading && <Loader label="Fetching the album sleeve" />}
        {!loading && error && <p className="error-text">{error}</p>}
        {!loading && !error && (!album?.musics || album.musics.length === 0) && (
          <EmptyState title="This album is empty" description="No tracks have been added to this album yet." />
        )}
        {!loading && !error && album?.musics?.length > 0 && (
          <div className="track-list">
            {album.musics.map((track, i) => (
              <MusicCard key={track._id} track={track} index={i} queue={album.musics} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
