import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import MusicCard from "../../components/MusicCard/MusicCard";
import AlbumCard from "../../components/AlbumCard/AlbumCard";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { getArtistProfile } from "../../api/music.api";
import "../AlbumDetail/AlbumDetail.css";
import "../Library/Library.css";

export default function ArtistProfile() {
    const { artistId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getArtistProfile(artistId)
            .then((data) => {
                if (!cancelled) setProfile(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Could not load this artist.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [artistId]);

    const musics = profile?.musics || [];
    const albums = profile?.albums || [];

    return (
        <div className="page">
            <Navbar
                title={loading ? "Artist" : profile?.artist?.username || "Artist"}
                subtitle={loading ? "" : `${musics.length} track${musics.length === 1 ? "" : "s"} · ${albums.length} album${albums.length === 1 ? "" : "s"}`}
            />

            <div className="page-body">
                <Link to="/library" className="album-back-link">
                    ← Back to library
                </Link>

                {loading && <Loader label="Pulling up their profile" />}
                {!loading && error && <p className="error-text">{error}</p>}

                {!loading && !error && (
                    <>
                        {albums.length > 0 && (
                            <>
                                <h3 style={{ margin: "var(--space-6) 0 var(--space-4)" }}>Albums</h3>
                                <div className="card-grid">
                                    {albums.map((album) => (
                                        <AlbumCard key={album._id} album={album} />
                                    ))}
                                </div>
                            </>
                        )}

                        <h3 style={{ margin: "var(--space-6) 0 var(--space-4)" }}>Tracks</h3>
                        {musics.length === 0 ? (
                            <EmptyState title="No tracks yet" description="This artist hasn't uploaded anything yet." />
                        ) : (
                            <div className="track-list">
                                {musics.map((track, i) => (
                                    <MusicCard key={track._id} track={track} index={i} queue={musics} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}