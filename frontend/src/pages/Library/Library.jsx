import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import MusicCard from "../../components/MusicCard/MusicCard";
import SearchInput from "../../components/SearchInput/SearchInput";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { getAllMusics } from "../../api/music.api";
import "./Library.css";

export default function Library() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAllMusics()
      .then((data) => {
        if (!cancelled) setTracks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load your library.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || (t.artist?.username || "").toLowerCase().includes(q)
    );
  }, [tracks, query]);

  return (
    <div className="page">
      <Navbar title="Library" subtitle="Every track uploaded across Musify, freshest first." />

      <div className="page-body">
        {!loading && !error && tracks.length > 0 && (
          <div className="library-search">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by track or artist..." />
          </div>
        )}

        {loading && <Loader label="Cueing up your library" />}
        {!loading && error && <p className="error-text">{error}</p>}
        {!loading && !error && tracks.length === 0 && (
          <EmptyState title="No tracks yet" description="Once an artist uploads a track, it'll show up here." />
        )}
        {!loading && !error && tracks.length > 0 && filteredTracks.length === 0 && (
          <EmptyState title="No matches" description={`Nothing matches "${query}". Try a different search.`} />
        )}
        {!loading && !error && filteredTracks.length > 0 && (
          <div className="track-list">
            {filteredTracks.map((track, i) => (
              <MusicCard key={track._id} track={track} index={i} queue={filteredTracks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}