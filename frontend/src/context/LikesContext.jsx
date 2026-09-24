import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getLikedTracks, toggleLikeTrack } from "../api/music.api";
import { useAuth } from "./AuthContext";

const LikesContext = createContext(null);

export function LikesProvider({ children }) {
    const { user } = useAuth();
    const [likedIds, setLikedIds] = useState(() => new Set());

    // Load the user's liked tracks once on login; clear them out on logout so
    // a previous user's likes never flash for the next person on a shared device.
    useEffect(() => {
        if (!user) {
            setLikedIds(new Set());
            return;
        }
        let cancelled = false;
        getLikedTracks()
            .then((tracks) => {
                if (!cancelled) setLikedIds(new Set(tracks.map((t) => t._id)));
            })
            .catch(() => {
                // Not fatal — the heart icons just start unfilled until the next
                // successful fetch (e.g. a page revisit).
            });
        return () => {
            cancelled = true;
        };
    }, [user]);

    const isLiked = useCallback((trackId) => likedIds.has(trackId), [likedIds]);

    const flip = (prev, trackId) => {
        const next = new Set(prev);
        if (next.has(trackId)) next.delete(trackId);
        else next.add(trackId);
        return next;
    };

    const toggleLike = useCallback(async (trackId) => {
        // Optimistic update so the heart responds instantly; rolled back if the
        // request fails.
        setLikedIds((prev) => flip(prev, trackId));
        try {
            await toggleLikeTrack(trackId);
        } catch {
            setLikedIds((prev) => flip(prev, trackId));
        }
    }, []);

    // Used after "Add to Liked Songs" on a YouTube result — the backend call
    // that creates + likes the track already happened, this just reflects
    // the result locally without a full refetch.
    const markLiked = useCallback((trackId) => {
        setLikedIds((prev) => new Set(prev).add(trackId));
    }, []);

    return (
        <LikesContext.Provider value={{ isLiked, toggleLike, markLiked }}>
            {children}
        </LikesContext.Provider>
    );
}

export function useLikes() {
    const ctx = useContext(LikesContext);
    if (!ctx) throw new Error("useLikes must be used within LikesProvider");
    return ctx;
}