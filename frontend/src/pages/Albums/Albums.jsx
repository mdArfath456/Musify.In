import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import AlbumCard from "../../components/AlbumCard/AlbumCard";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { getAllAlbums } from "../../api/music.api";
import "./Albums.css";

export default function Albums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAllAlbums()
      .then((data) => {
        if (!cancelled) setAlbums(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load albums.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <Navbar title="Albums" subtitle="Collections curated by Musify's artists." />

      <div className="page-body">
        {loading && <Loader label="Pulling albums from the shelf" />}
        {!loading && error && <p className="error-text">{error}</p>}
        {!loading && !error && albums.length === 0 && (
          <EmptyState title="No albums yet" description="Artists can group tracks into albums from the Studio page." />
        )}
        {!loading && !error && albums.length > 0 && (
          <div className="card-grid">
            {albums.map((album) => (
              <AlbumCard key={album._id} album={album} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
