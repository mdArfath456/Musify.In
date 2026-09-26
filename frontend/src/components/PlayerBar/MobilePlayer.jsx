import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Headphones,
  Heart,
  Music2,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react";
import "./MobilePlayer.css";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function Waveform({ isPlaying }) {
  return (
    <span className={`mobile-player-waveform ${isPlaying ? "is-playing" : ""}`} aria-label={isPlaying ? "Playing" : "Paused"}>
      {[0, 1, 2, 3, 4].map((bar) => <i key={bar} />)}
    </span>
  );
}

export default function MobilePlayer({
  track,
  isPlaying,
  duration,
  safeProgress,
  pct,
  artworkUrl,
  hasArtwork,
  liked,
  ephemeral,
  adding,
  isSeeking,
  volume,
  isMuted,
  togglePlay,
  playNext,
  playPrev,
  setVolume,
  toggleMute,
  onLike,
  timelineRef,
  onTimelinePointerDown,
  onTimelinePointerMove,
  onTimelinePointerUp,
  onTimelinePointerCancel,
  onTimelineKeyDown
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const artist = track.artist?.username || track.channelTitle || "Unknown artist";
  const title = track.title || "Untitled track";
  const remaining = Math.max(0, duration - safeProgress);

  useEffect(() => {
    if (!isExpanded) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  const artwork = (className) => hasArtwork
    ? <img className={className} src={artworkUrl} alt={`${title} artwork`} />
    : <span className={`${className} mobile-player-art-fallback`} aria-label="Musify artwork"><Music2 /></span>;

  return (
    <>
      <div className="mobile-player">
      <div className="mobile-player-mini" role="group" aria-label="Mini player">
        <button
          className="mobile-player-mini-open"
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-label={`Expand player: ${title}`}
        />
        <div className="mobile-player-mini-content">
          {artwork("mobile-player-mini-art")}
          <div className="mobile-player-mini-copy">
            <span className="mobile-player-mini-title">{title}</span>
            <span className="mobile-player-mini-artist">{artist}</span>
          </div>
          <div className="mobile-player-mini-actions">
            <Waveform isPlaying={isPlaying} />
            <button className="mobile-player-icon-button mini-play" type="button" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
            </button>
            <button className="mobile-player-icon-button mini-next" type="button" onClick={playNext} aria-label="Next track">
              <SkipForward size={19} />
            </button>
          </div>
        </div>
      </div>

      </div>
      {createPortal(<section
        className={`mobile-player-expanded ${isExpanded ? "is-expanded" : ""}`}
        aria-label="Now playing"
        aria-hidden={!isExpanded}
        inert={!isExpanded}
      >
        {hasArtwork && <img className="mobile-player-ambient" src={artworkUrl} alt="" aria-hidden="true" />}
        <div className="mobile-player-shade" />
        <div className="mobile-player-expanded-content">
          <header className="mobile-player-header">
            <button className="mobile-player-icon-button mobile-player-minimize" type="button" onClick={() => setIsExpanded(false)} aria-label="Minimize player">
              <ChevronDown size={25} />
            </button>
            <span>Now Playing</span>
            <span className="mobile-player-header-spacer" aria-hidden="true" />
          </header>

          <div className="mobile-player-art-stage">
            {artwork("mobile-player-large-art")}
          </div>

          <div className="mobile-player-track-row">
            <div className="mobile-player-track-copy">
              <h1 title={title}>{title}</h1>
              <p title={artist}>{artist}</p>
            </div>
            <button
              className={`mobile-player-icon-button mobile-player-like ${liked ? "liked" : ""}`}
              type="button"
              onClick={onLike}
              disabled={adding}
              aria-label={ephemeral ? "Add to Liked Songs" : liked ? "Unlike" : "Like"}
              title={ephemeral ? "Add to Liked Songs" : liked ? "Unlike" : "Like"}
            >
              {ephemeral ? (adding ? "..." : <Plus size={23} />) : <Heart size={23} fill={liked ? "currentColor" : "none"} />}
            </button>
          </div>

          <div className="mobile-player-progress">
            <div
              ref={timelineRef}
              className={`mobile-player-scrub ${isSeeking ? "seeking" : ""}`}
              onPointerDown={onTimelinePointerDown}
              onPointerMove={onTimelinePointerMove}
              onPointerUp={onTimelinePointerUp}
              onPointerCancel={onTimelinePointerCancel}
              onKeyDown={onTimelineKeyDown}
              role="slider"
              tabIndex={duration > 0 ? 0 : -1}
              aria-label="Seek"
              aria-valuemin="0"
              aria-valuemax={duration}
              aria-valuenow={safeProgress}
              aria-valuetext={`${formatTime(safeProgress)} of ${formatTime(duration)}`}
            >
              <span className="mobile-player-scrub-track" />
              <span className="mobile-player-scrub-fill" style={{ width: `${pct}%` }} />
              <span className="mobile-player-scrub-thumb" style={{ left: `${pct}%` }} />
            </div>
            <div className="mobile-player-time-row">
              <span>{formatTime(safeProgress)}</span>
              <span>-{formatTime(remaining)}</span>
            </div>
          </div>

          <div className="mobile-player-controls">
            <button className="mobile-player-icon-button" type="button" onClick={playPrev} aria-label="Previous track">
              <SkipBack size={25} />
            </button>
            <button className="mobile-player-main-button" type="button" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" />}
            </button>
            <button className="mobile-player-icon-button" type="button" onClick={playNext} aria-label="Next track">
              <SkipForward size={25} />
            </button>
          </div>

          <div className="mobile-player-volume">
            <button className="mobile-player-icon-button mobile-player-mute" type="button" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
              {isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(event) => setVolume(event.target.value)}
              aria-label="Volume"
              style={{ "--volume-level": `${(isMuted ? 0 : volume) * 100}%` }}
            />
            <Volume2 size={19} aria-hidden="true" />
          </div>

          <button className="mobile-player-output" type="button" disabled aria-label="Output device selection unavailable">
            <Headphones size={18} />
            <span>This device</span>
          </button>
        </div>
      </section>, document.body)}
    </>
  );
}