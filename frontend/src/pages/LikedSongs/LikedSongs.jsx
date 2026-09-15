import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import MusicCard from "../../components/MusicCard/MusicCard";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { getLikedTracks } from "../../api/music.api";
import { useLikes } from "../../context/LikesContext";
import "../Library/Library.css";

export default function LikedSongs() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Re-fetching keys off the liked-set identity so unliking a track here
    // removes it from the list immediately, without a manual refetch call.
    const { isLiked } = useLikes();

    useEffect(() => {
        let cancelled = false;
        getLikedTracks()
            .then((data) => {
                if (!cancelled) setTracks(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Could not load your liked songs.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const visibleTracks = tracks.filter((t) => isLiked(t._id));

    return (
        <div className="page">
            <Navbar title="Liked Songs" subtitle="Everything you've hearted, in one place." />

            <div className="page-body">
                {loading && <Loader label="Gathering your favorites" />}
                {!loading && error && <p className="error-text">{error}</p>}
                {!loading && !error && visibleTracks.length === 0 && (
                    <EmptyState
                        title="No liked songs yet"
                        description="Tap the heart on any track to save it here."
                    />
                )}
                {!loading && !error && visibleTracks.length > 0 && (
                    <div className="track-list">
                        {visibleTracks.map((track, i) => (
                            <MusicCard key={track._id} track={track} index={i} queue={visibleTracks} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}