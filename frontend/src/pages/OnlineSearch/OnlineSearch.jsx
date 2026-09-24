import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { searchOnline } from "../../api/youtube.api";
import { addYoutubeTrackToLiked } from "../../api/music.api";
import { usePlayer } from "../../context/PlayerContext";
import { useLikes } from "../../context/LikesContext";
import { useToast } from "../../components/Toast/ToastContext";
import "./OnlineSearch.css";

// Shapes a raw search result the way the global player expects. Not yet a
// real library track — gets a synthetic id until "Add to Liked Songs" turns
// it into one (see PlayerContext's isEphemeralId).
function toPlayableTrack(result) {
  return {
    _id: `yt-${result.videoId}`,
    title: result.title,
    artist: { username: result.channelTitle },
    source: "youtube",
    youtubeVideoId: result.videoId,
    thumbnail: result.thumbnail,
    channelTitle: result.channelTitle,
    uri: null
  };
}

export default function OnlineSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [addedVideoIds, setAddedVideoIds] = useState(() => new Set());
  const [addingVideoId, setAddingVideoId] = useState(null);

  // Playback goes through the same global player as the rest of the app —
  // that's what gives this page its forward/backward controls for free via
  // the PlayerBar at the bottom (its prev/next just walk this results
  // queue), and it's what lets an "Add to Liked Songs" track keep playing
  // uninterrupted afterwards.
  const { track, isPlaying, playTrack } = usePlayer();
  const { markLiked } = useLikes();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchOnline(query);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err.message || "Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const playResult = (result) => {
    const queue = results.map(toPlayableTrack);
    playTrack(toPlayableTrack(result), queue);
  };

  const handleAdd = async (result) => {
    setAddingVideoId(result.videoId);
    try {
      const music = await addYoutubeTrackToLiked({
        videoId: result.videoId,
        title: result.title,
        channelTitle: result.channelTitle,
        thumbnail: result.thumbnail
      });
      setAddedVideoIds((prev) => new Set(prev).add(result.videoId));
      markLiked(music._id);
      showToast("Added to Liked Songs", { type: "success" });
    } catch (err) {
      showToast(err.message || "Could not add this song", { type: "error" });
    } finally {
      setAddingVideoId(null);
    }
  };

  return (
    <div className="page">
      <Navbar title="Online Search" subtitle="Search and play songs, no video, just the music." />

      <div className="page-body">
        <form className="online-search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any song, artist, or album..."
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !query.trim()}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {loading && <Loader label="Searching online" />}
        {!loading && error && <p className="error-text">{error}</p>}
        {!loading && !error && searched && results.length === 0 && (
          <EmptyState title="No results" description={`Nothing found for "${query}".`} />
        )}
        {!loading && !error && !searched && (
          <EmptyState title="Search anything" description="Type a song or artist name to find and play it instantly — use the player bar below to skip forward and back through your results." />
        )}

        {!loading && !error && results.length > 0 && (
          <div className="online-results">
            {results.map((r) => {
              const isActive = track?._id === `yt-${r.videoId}`;
              const added = addedVideoIds.has(r.videoId);
              const adding = addingVideoId === r.videoId;
              return (
                <div key={r.videoId} className={`online-result-card ${isActive ? "active" : ""}`}>
                  <button className="online-result-play" onClick={() => playResult(r)} aria-label={`Play ${r.title}`}>
                    <img src={r.thumbnail} alt="" />
                    {isActive && (
                      <span className="online-result-playing-badge">{isPlaying ? "▶ Playing" : "❚❚ Paused"}</span>
                    )}
                  </button>
                  <div className="online-result-meta">
                    <p className="online-result-title">{r.title}</p>
                    <p className="online-result-channel">{r.channelTitle}</p>
                  </div>
                  <button
                    className={`online-result-add ${added ? "added" : ""}`}
                    onClick={() => handleAdd(r)}
                    disabled={adding || added}
                  >
                    {added ? "✓ Added" : adding ? "Adding…" : "+ Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
