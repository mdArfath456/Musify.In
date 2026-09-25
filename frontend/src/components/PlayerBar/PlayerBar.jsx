import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../../context/PlayerContext";
import { useLikes } from "../../context/LikesContext";
import { useToast } from "../Toast/ToastContext";
import { addYoutubeTrackToLiked } from "../../api/music.api";
import { Heart, Music2, Pause, Play, Plus, SkipBack, SkipForward } from "lucide-react";
import "./PlayerBar.css";

function formatCounter(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const remainingSeconds = (totalSeconds % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${remainingSeconds}` : `${minutes}:${remainingSeconds}`;
}

function isEphemeralId(id) {
  return typeof id === "string" && id.startsWith("yt-");
}

export default function PlayerBar() {
  const { track, isPlaying, progress, duration, togglePlay, seek, playNext, playPrev, markCurrentTrackAdded } = usePlayer();
  const { isLiked, toggleLike, markLiked } = useLikes();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [artworkFailed, setArtworkFailed] = useState(false);
  const seekPositionRef = useRef(0);
  const timelineRef = useRef(null);

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const displayedProgress = isSeeking ? seekPosition : progress;
  const safeProgress = safeDuration
    ? Math.min(safeDuration, Math.max(0, Number.isFinite(displayedProgress) ? displayedProgress : 0))
    : 0;

  useEffect(() => {
    if (!isSeeking) {
      const nextPosition = Number.isFinite(progress) && progress >= 0 ? progress : 0;
      seekPositionRef.current = nextPosition;
      setSeekPosition(nextPosition);
    }
  }, [progress, isSeeking]);

  useEffect(() => {
    setIsSeeking(false);
    setArtworkFailed(false);
    const nextPosition = Number.isFinite(progress) && progress >= 0 ? progress : 0;
    seekPositionRef.current = nextPosition;
    setSeekPosition(nextPosition);
  }, [track?._id]);

  useEffect(() => {
    setArtworkFailed(false);
  }, [track?.thumbnail]);

  if (!track) {
    return (
      <div className="player-bar player-bar-empty">
        <span className="eyebrow">No track loaded - pick something from your library</span>
      </div>
    );
  }

  const pct = safeDuration ? (safeProgress / safeDuration) * 100 : 0;
  const ephemeral = isEphemeralId(track._id);
  const liked = !ephemeral && isLiked(track._id);
  const artworkUrl = typeof track.thumbnail === "string" && track.thumbnail.trim() ? track.thumbnail : null;
  const hasArtwork = Boolean(artworkUrl && !artworkFailed);

  const positionFromPointer = (event) => {
    if (!safeDuration || !timelineRef.current) return null;
    const rect = timelineRef.current.getBoundingClientRect();
    if (!rect.width) return null;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    return ratio * safeDuration;
  };

  const updateSeekPosition = (event) => {
    const nextPosition = positionFromPointer(event);
    if (nextPosition === null) return;
    seekPositionRef.current = nextPosition;
    setSeekPosition(nextPosition);
  };

  const handleTimelinePointerDown = (event) => {
    if (!safeDuration) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsSeeking(true);
    updateSeekPosition(event);
  };

  const handleTimelinePointerMove = (event) => {
    if (isSeeking) updateSeekPosition(event);
  };

  const finishSeeking = (event, shouldCommit) => {
    if (!isSeeking) return;
    if (shouldCommit) updateSeekPosition(event);
    const selectedPosition = seekPositionRef.current;
    setIsSeeking(false);
    if (shouldCommit && Number.isFinite(selectedPosition)) seek(selectedPosition);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleTimelineKeyDown = (event) => {
    if (!safeDuration) return;
    const step = event.shiftKey ? 10 : 5;
    let nextPosition = safeProgress;
    if (event.key === "ArrowLeft") nextPosition -= step;
    else if (event.key === "ArrowRight") nextPosition += step;
    else if (event.key === "Home") nextPosition = 0;
    else if (event.key === "End") nextPosition = safeDuration;
    else return;

    event.preventDefault();
    seek(Math.min(safeDuration, Math.max(0, nextPosition)));
  };

  const handleLikeClick = async () => {
    if (!ephemeral) {
      toggleLike(track._id);
      return;
    }
    setAdding(true);
    try {
      const music = await addYoutubeTrackToLiked({
        videoId: track.youtubeVideoId,
        title: track.title,
        channelTitle: track.channelTitle || track.artist?.username,
        thumbnail: track.thumbnail
      });
      markLiked(music._id);
      markCurrentTrackAdded(music);
      showToast("Added to Liked Songs", { type: "success" });
    } catch (err) {
      showToast(err.message || "Could not add this song", { type: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="player-bar">
      <div className="player-card">
        {hasArtwork && (
          <img className="player-ambient" src={artworkUrl} alt="" aria-hidden="true" onError={() => setArtworkFailed(true)} />
        )}
        <div className="player-ambient-overlay" />

        <div className="player-card-inner">
          <p className="player-eyebrow">Now Playing</p>

          <div className="player-main">
            <div className={`player-artwork-shell ${isPlaying ? "is-playing" : ""}`}>
              {hasArtwork ? (
                <img
                  className="player-artwork"
                  src={artworkUrl}
                  alt={`${track.title || "Song"} artwork`}
                  onError={() => setArtworkFailed(true)}
                />
              ) : (
                <div className="player-artwork player-artwork-fallback" aria-label="Musify artwork"><Music2 size={25} /></div>
              )}
            </div>

            <div className="player-info-row">
              <div className="player-track-copy">
                <p className="player-track-title" title={track.title}>{track.title || "Untitled track"}</p>
                <p className="player-track-artist">{track.artist?.username || track.channelTitle || "Unknown artist"}</p>
              </div>
              <button
                className={`player-like ${liked ? "liked" : ""} ${ephemeral ? "player-like-add" : ""}`}
                onClick={handleLikeClick}
                disabled={adding}
                aria-label={ephemeral ? "Add to Liked Songs" : liked ? "Unlike" : "Like"}
                title={ephemeral ? "Add to Liked Songs" : liked ? "Unlike" : "Like"}
              >
                {ephemeral ? (adding ? "..." : <Plus size={19} />) : <Heart size={19} fill={liked ? "currentColor" : "none"} />}
              </button>
            </div>

            <div className="player-progress">
              <div
                ref={timelineRef}
                className={`player-scrub ${isSeeking ? "seeking" : ""}`}
                onPointerDown={handleTimelinePointerDown}
                onPointerMove={handleTimelinePointerMove}
                onPointerUp={(event) => finishSeeking(event, true)}
                onPointerCancel={(event) => finishSeeking(event, false)}
                onKeyDown={handleTimelineKeyDown}
                role="slider"
                tabIndex={safeDuration ? 0 : -1}
                aria-label="Seek"
                aria-valuemin="0"
                aria-valuemax={safeDuration}
                aria-valuenow={safeProgress}
                aria-valuetext={`${formatCounter(safeProgress)} of ${formatCounter(safeDuration)}`}
              >
                <div className="player-scrub-track" />
                <div className="player-scrub-fill" style={{ width: `${pct}%` }} />
                <div className="player-scrub-head" style={{ left: `${pct}%` }} />
              </div>
              <div className="player-time-row">
                <span className="player-counter">{formatCounter(safeProgress)}</span>
                <span className="player-counter">{formatCounter(safeDuration)}</span>
              </div>
            </div>

            <div className="player-controls">
              <button className="player-btn" onClick={playPrev} aria-label="Previous track" title="Previous track"><SkipBack size={20} /></button>
              <button className="player-btn player-btn-main" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
              </button>
              <button className="player-btn" onClick={playNext} aria-label="Next track" title="Next track"><SkipForward size={20} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
