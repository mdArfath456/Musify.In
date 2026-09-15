import { usePlayer } from "../../context/PlayerContext";
import "./PlayerBar.css";

function formatCounter(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function PlayerBar() {
  const { track, isPlaying, progress, duration, togglePlay, seek, playNext, playPrev } = usePlayer();

  if (!track) {
    return (
      <div className="player-bar player-bar-empty">
        <span className="eyebrow">No track loaded — pick something from your library</span>
      </div>
    );
  }

  const pct = duration ? (progress / duration) * 100 : 0;
  const ticks = Array.from({ length: 40 });

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  return (
    <div className="player-bar">
      <div className="player-track-info">
        <div className={`player-vinyl ${isPlaying ? "spinning" : ""}`} aria-hidden="true" />
        <div>
          <p className="player-track-title">{track.title}</p>
          <p className="player-track-artist">{track.artist?.username || "Unknown artist"}</p>
        </div>
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button className="player-btn" onClick={playPrev} aria-label="Previous track">
            ⏮
          </button>
          <button className="player-btn player-btn-main" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "❚❚" : "▶"}
          </button>
          <button className="player-btn" onClick={playNext} aria-label="Next track">
            ⏭
          </button>
        </div>

        <div className="player-scrub-row">
          <span className="player-counter">{formatCounter(progress)}</span>
          <div className="player-scrub" onClick={handleScrub} role="slider" aria-label="Seek" aria-valuenow={progress}>
            <div className="player-scrub-ticks">
              {ticks.map((_, i) => (
                <span key={i} className="player-tick" />
              ))}
            </div>
            <div className="player-scrub-fill" style={{ width: `${pct}%` }} />
            <div className="player-scrub-head" style={{ left: `${pct}%` }} />
          </div>
          <span className="player-counter">{formatCounter(duration)}</span>
        </div>
      </div>
    </div>
  );
}
