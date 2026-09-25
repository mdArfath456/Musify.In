import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import MusicCard from "../../components/MusicCard/MusicCard";
import SearchInput from "../../components/SearchInput/SearchInput";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { getAllMusics } from "../../api/music.api";
import { useAuth } from "../../context/AuthContext";
import { usePlayer } from "../../context/PlayerContext";
import { ArrowUpRight, Play } from "lucide-react";
import "./Library.css";

export default function Library() {
  const { user } = useAuth();
  const { playTrack } = usePlayer();
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
          <section className="library-hero">
            <div className="library-hero-copy">
              <span className="eyebrow">YOUR SOUNDTRACK</span>
              <h2>Good evening, {user?.username || "listener"}.</h2>
              <p>Pick something that matches your moment.</p>
              <button className="btn btn-primary" onClick={() => playTrack(tracks[0], tracks)}>
                <Play size={16} fill="currentColor" />
                Play something good
              </button>
            </div>
            <button className="library-featured" onClick={() => playTrack(tracks[0], tracks)}>
              <div className="library-featured-art">
                {tracks[0].thumbnail ? <img src={tracks[0].thumbnail} alt="" /> : <span />}
              </div>
              <div className="library-featured-copy">
                <span className="eyebrow">FRESH IN YOUR LIBRARY</span>
                <strong>{tracks[0].title}</strong>
                <span>{tracks[0].artist?.username || tracks[0].channelTitle || "Unknown artist"}</span>
              </div>
              <ArrowUpRight size={19} aria-hidden="true" />
            </button>
          </section>
        )}

        {!loading && !error && tracks.length > 0 && (
          <div className="library-search">
            <SearchInput value={query} onChange={setQuery} placeholder="Search songs, artists, or albums..." />
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
          <section className="library-collection">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE COLLECTION</span>
                <h2>All tracks</h2>
              </div>
              <span className="section-count">{filteredTracks.length} songs</span>
            </div>
            <div className="track-list">
            {filteredTracks.map((track, i) => (
              <MusicCard key={track._id} track={track} index={i} queue={filteredTracks} />
            ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}