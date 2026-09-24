import { Link } from "react-router-dom";
import { usePlayer } from "../../context/PlayerContext";
import { useLikes } from "../../context/LikesContext";
import { Heart, Music2, Sparkles } from "lucide-react";
import "./MusicCard.css";

export default function MusicCard({ track, index, queue }) {
  const { track: current, isPlaying, playTrack } = usePlayer();
  const { isLiked, toggleLike } = useLikes();
  const isCurrent = current?._id === track._id;
  const liked = isLiked(track._id);

  return (
    <div className={`music-card ${isCurrent ? "active" : ""}`}>
      <button className="music-card-main" onClick={() => playTrack(track, queue)}>
        <span className="music-card-art">
          {track.thumbnail ? <img src={track.thumbnail} alt="" loading="lazy" /> : <Music2 size={19} />}
          {isCurrent && isPlaying && <span className="music-card-playing" aria-label="Playing" />}
        </span>
        <div className="music-card-body">
          <p className="music-card-title">{track.title}</p>
          {track.artist?._id ? (
            <Link
              to={`/artists/${track.artist._id}`}
              className="music-card-artist music-card-artist-link"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist.username}
            </Link>
          ) : (
            <p className="music-card-artist">Unknown artist</p>
          )}
        </div>
      </button>
      <Link
        to={`/ai?similarTo=${track._id}&title=${encodeURIComponent(track.title)}`}
        className="music-card-similar"
        aria-label={`Find songs similar to ${track.title}`}
        title="Find similar songs"
        onClick={(e) => e.stopPropagation()}
      >
        <Sparkles size={16} />
      </Link>
      <button
        className={`music-card-like ${liked ? "liked" : ""}`}
        aria-label={liked ? "Unlike this track" : "Like this track"}
        aria-pressed={liked}
        onClick={(e) => {
          e.stopPropagation();
          toggleLike(track._id);
        }}
      >
        <Heart size={17} fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}