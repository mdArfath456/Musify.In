import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import MusicCard from "../../components/MusicCard/MusicCard";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { getRecentlyPlayed } from "../../api/music.api";
import "../Library/Library.css";

export default function RecentlyPlayed() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getRecentlyPlayed()
            .then((data) => {
                if (!cancelled) setTracks(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Could not load your listening history.");
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
            <Navbar title="Recently Played" subtitle="Your last 20 plays, most recent first." />

            <div className="page-body">
                {loading && <Loader label="Rewinding the tape" />}
                {!loading && error && <p className="error-text">{error}</p>}
                {!loading && !error && tracks.length === 0 && (
                    <EmptyState
                        title="Nothing played yet"
                        description="Play a track anywhere on Musify and it'll show up here."
                    />
                )}
                {!loading && !error && tracks.length > 0 && (
                    <div className="track-list">
                        {tracks.map((track, i) => (
                            <MusicCard key={`${track._id}-${track.playedAt}`} track={track} index={i} queue={tracks} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}