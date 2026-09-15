import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import MusicCard from "../../components/MusicCard/MusicCard";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { getAIRecommendations, getSimilarTracks } from "../../api/ai.api";
import "./AIAssistant.css";

const PRESETS = [
    "Romantic Bollywood songs",
    "Workout playlist",
    "Road trip anthems",
    "Rainy evening, slow and emotional",
    "Best Arijit Singh songs",
    "Party starters",
];

export default function AIAssistant() {
    const [searchParams, setSearchParams] = useSearchParams();
    const similarTo = searchParams.get("similarTo");
    const similarTitle = searchParams.get("title");

    const [prompt, setPrompt] = useState("");
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [ranFor, setRanFor] = useState("");

    const runRecommend = useCallback(async (text) => {
        if (!text.trim()) return;
        setLoading(true);
        setError("");
        try {
            const results = await getAIRecommendations(text);
            setTracks(results);
            setRanFor(text);
        } catch (err) {
            setError(err.message || "Could not get recommendations right now.");
        } finally {
            setLoading(false);
        }
    }, []);

    const runSimilar = useCallback(async (trackId, title) => {
        setLoading(true);
        setError("");
        try {
            const results = await getSimilarTracks(trackId);
            setTracks(results);
            setRanFor(`Similar to "${title}"`);
        } catch (err) {
            setError(err.message || "Could not find similar tracks right now.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (similarTo) {
            runSimilar(similarTo, similarTitle || "this track");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [similarTo]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchParams.has("similarTo")) setSearchParams({});
        runRecommend(prompt);
    };

    const handlePreset = (text) => {
        setPrompt(text);
        if (searchParams.has("similarTo")) setSearchParams({});
        runRecommend(text);
    };

    return (
        <div className="page">
            <Navbar title="AI Assistant" subtitle="Describe a mood or moment — Musify picks from what's actually in your library." />

            <div className="page-body">
                {!similarTo && (
                    <>
                        <form className="ai-form" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder='Try "songs for a rainy evening" or "best Arijit Singh songs"'
                            />
                            <button className="btn btn-primary" type="submit" disabled={loading || !prompt.trim()}>
                                {loading ? "Thinking…" : "Ask"}
                            </button>
                        </form>

                        <div className="ai-presets">
                            {PRESETS.map((preset) => (
                                <button key={preset} type="button" className="ai-preset-chip" onClick={() => handlePreset(preset)}>
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {similarTo && (
                    <button
                        type="button"
                        className="ai-preset-chip"
                        style={{ marginBottom: "var(--space-5)" }}
                        onClick={() => setSearchParams({})}
                    >
                        ← Ask something else instead
                    </button>
                )}

                {loading && <Loader label="Cueing up recommendations" />}
                {!loading && error && <p className="error-text">{error}</p>}

                {!loading && !error && ranFor && (
                    <p className="ai-results-heading">
                        {tracks.length > 0 ? `Results for: ${ranFor}` : `Nothing matched "${ranFor}" — try rephrasing.`}
                    </p>
                )}

                {!loading && !error && !ranFor && (
                    <EmptyState
                        title="Ask for anything"
                        description="Pick a suggestion above, or type your own mood, moment, or artist — Musify's assistant only recommends songs already in your library."
                    />
                )}

                {!loading && !error && tracks.length > 0 && (
                    <div className="track-list">
                        {tracks.map((track, i) => (
                            <MusicCard key={track._id} track={track} index={i} queue={tracks} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}