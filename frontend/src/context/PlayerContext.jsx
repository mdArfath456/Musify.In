import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { recordPlay } from "../api/music.api";
import { loadYoutubeApi } from "../utils/youtubeApiLoader";

const PlayerContext = createContext(null);
const STORAGE_KEY = "musify.player";
const YT_CONTAINER_ID = "musify-global-yt-player";

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// YouTube search results the listener hasn't added to their library yet get
// a synthetic "yt-<videoId>" id so the queue/player can treat them like any
// other track — but we never send that fake id to the backend (recordPlay,
// likes) since no real DB row exists until "Add to Liked Songs" is clicked.
function isEphemeralId(id) {
  return typeof id === "string" && id.startsWith("yt-");
}

export function PlayerProvider({ children }) {
  // Two playback engines share one set of controls: an <audio> element for
  // uploaded tracks, and a single hidden YouTube iframe (mounted once below,
  // so it survives route changes) for YouTube tracks. Which one is "live" is
  // derived from the current track's source — everything else (PlayerBar,
  // progress, seek, prev/next) stays engine-agnostic.
  const audioRef = useRef(new Audio());
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const pendingVideoRef = useRef(null); // { videoId, seekTo, autoplay } — queued until the iframe API finishes loading
  const progressRef = useRef(0);
  const playNextRef = useRef(() => {});
  const volumeRef = useRef(0.8);
  const mutedRef = useRef(false);

  const [track, setTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // seconds
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const engine = track?.source === "youtube" ? "youtube" : "upload";

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // --- YouTube engine: one hidden iframe player for the whole app ---
  useEffect(() => {
    let cancelled = false;
    loadYoutubeApi().then((YT) => {
      if (cancelled) return;
      ytPlayerRef.current = new YT.Player(YT_CONTAINER_ID, {
        height: "1",
        width: "1",
        playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => {
            ytReadyRef.current = true;
            ytPlayerRef.current.setVolume(Math.round(volumeRef.current * 100));
            if (mutedRef.current) ytPlayerRef.current.mute();
            const pending = pendingVideoRef.current;
            if (!pending) return;
            if (pending.autoplay) {
              ytPlayerRef.current.loadVideoById(pending.videoId);
            } else {
              ytPlayerRef.current.cueVideoById(pending.videoId, pending.seekTo || 0);
              setProgress(pending.seekTo || 0);
            }
            pendingVideoRef.current = null;
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setDuration(ytPlayerRef.current.getDuration() || 0);
            } else if (e.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (e.data === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              playNextRef.current?.();
            }
          }
        }
      });
    });
    return () => {
      cancelled = true;
      ytPlayerRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // YouTube's iframe API has no timeupdate event — poll it while it's the
  // active engine. Harmless no-op while an upload track is playing.
  useEffect(() => {
    const interval = setInterval(() => {
      if (engine === "youtube" && ytPlayerRef.current?.getCurrentTime) {
        setProgress(ytPlayerRef.current.getCurrentTime());
      }
    }, 500);
    return () => clearInterval(interval);
  }, [engine]);

  // Restore whatever was playing before a refresh: same track, same queue,
  // seeked back to the last known position. We deliberately do NOT start
  // playback here — browsers block autoplay without a user gesture, and
  // silently trying (and failing) is worse UX than just leaving it
  // paused-but-ready.
  useEffect(() => {
    const saved = loadPersisted();
    if (!saved?.track) return;
    setTrack(saved.track);
    setQueue(saved.queue || []);
    const resumeAt = saved.progress || 0;

    if (saved.track.source === "youtube") {
      if (ytReadyRef.current && ytPlayerRef.current?.cueVideoById) {
        ytPlayerRef.current.cueVideoById(saved.track.youtubeVideoId, resumeAt);
        setProgress(resumeAt);
      } else {
        pendingVideoRef.current = { videoId: saved.track.youtubeVideoId, seekTo: resumeAt, autoplay: false };
      }
    } else {
      const audio = audioRef.current;
      audio.src = saved.track.uri;
      const onLoaded = () => {
        audio.currentTime = resumeAt;
        setProgress(resumeAt);
        setDuration(audio.duration || 0);
        audio.removeEventListener("loadedmetadata", onLoaded);
      };
      audio.addEventListener("loadedmetadata", onLoaded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const onTime = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => playNext();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, track]);

  // Keep sessionStorage in sync: on every track/queue change, every few
  // seconds while listening, and right before the tab unloads/refreshes.
  useEffect(() => {
    if (!track) return;
    const persist = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ track, queue, progress: progressRef.current }));
      } catch {
        // sessionStorage can throw in private-browsing edge cases — losing
        // resume position isn't worth crashing playback over.
      }
    };
    persist();
    const interval = setInterval(persist, 4000);
    window.addEventListener("beforeunload", persist);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", persist);
    };
  }, [track, queue]);

  const playTrack = useCallback((nextTrack, trackQueue = []) => {
    setTrack(nextTrack);
    if (trackQueue.length) setQueue(trackQueue);
    setDuration(0);
    setProgress(0);

    if (nextTrack.source === "youtube") {
      audioRef.current.pause();
      if (ytReadyRef.current && ytPlayerRef.current?.loadVideoById) {
        ytPlayerRef.current.loadVideoById(nextTrack.youtubeVideoId);
      } else {
        pendingVideoRef.current = { videoId: nextTrack.youtubeVideoId, autoplay: true };
      }
      setIsPlaying(true);
    } else {
      ytPlayerRef.current?.pauseVideo?.();
      const audio = audioRef.current;
      audio.src = nextTrack.uri;
      audio.play();
      setIsPlaying(true);
    }

    // Fire-and-forget: updates play count + recently-played on the backend.
    // Skipped for YouTube results that haven't been added to the library
    // yet (no real track id exists for the backend to record against).
    if (!isEphemeralId(nextTrack._id)) {
      recordPlay(nextTrack._id).catch(() => {});
    }
  }, []);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    ytPlayerRef.current?.stopVideo?.();
    pendingVideoRef.current = null;
    progressRef.current = 0;

    setTrack(null);
    setQueue([]);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);

    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures; stopping audio is the important part.
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!track) return;
    if (engine === "youtube") {
      if (!ytPlayerRef.current) return;
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      const audio = audioRef.current;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying, track, engine]);

  const seek = useCallback(
    (seconds) => {
      if (engine === "youtube") {
        ytPlayerRef.current?.seekTo?.(seconds, true);
      } else {
        audioRef.current.currentTime = seconds;
      }
      setProgress(seconds);
    },
    [engine]
  );

  const applyVolume = useCallback(() => {
    const audio = audioRef.current;
    audio.volume = volumeRef.current;
    audio.muted = mutedRef.current;
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    ytPlayerRef.current.setVolume(Math.round(volumeRef.current * 100));
    if (mutedRef.current) ytPlayerRef.current.mute();
    else ytPlayerRef.current.unMute();
  }, []);

  const setVolume = useCallback((nextVolume) => {
    const normalized = Math.min(1, Math.max(0, Number(nextVolume) || 0));
    volumeRef.current = normalized;
    mutedRef.current = normalized === 0;
    setVolumeState(normalized);
    setIsMuted(normalized === 0);
    applyVolume();
  }, [applyVolume]);

  const toggleMute = useCallback(() => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setIsMuted(nextMuted);
    applyVolume();
  }, [applyVolume]);

  const playNext = useCallback(() => {
    if (!track || queue.length === 0) return;
    const idx = queue.findIndex((t) => t._id === track._id);
    const next = queue[idx + 1];
    if (next) playTrack(next, queue);
    else setIsPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, queue, playTrack]);

  const playPrev = useCallback(() => {
    if (!track || queue.length === 0) return;
    const idx = queue.findIndex((t) => t._id === track._id);
    const prev = queue[idx - 1];
    if (prev) playTrack(prev, queue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, queue, playTrack]);

  // Called after "Add to Liked Songs" succeeds for the track that's
  // currently playing (e.g. from the PlayerBar's like button while a
  // not-yet-added YouTube result is playing). Swaps the ephemeral "yt-..."
  // id for the real one everywhere it appears — the current track, and any
  // matching entry in the queue — then records the play that was skipped
  // while it was still ephemeral, so it shows up in Recently Played too.
  const markCurrentTrackAdded = useCallback((realTrack) => {
    setTrack((prev) => {
      if (!prev || prev.youtubeVideoId !== realTrack.youtubeVideoId) return prev;
      return { ...prev, _id: realTrack._id };
    });
    setQueue((prevQueue) =>
      prevQueue.map((t) => (t.youtubeVideoId === realTrack.youtubeVideoId ? { ...t, _id: realTrack._id } : t))
    );
    recordPlay(realTrack._id).catch(() => {});
  }, []);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  return (
    <PlayerContext.Provider
      value={{
        track,
        isPlaying,
        progress,
        duration,
        volume,
        isMuted,
        engine,
        playTrack,
        stopPlayback,
        togglePlay,
        seek,
        playNext,
        playPrev,
        setVolume,
        toggleMute,
        markCurrentTrackAdded
      }}
    >
      {children}
      {/* One hidden YouTube iframe for the whole app — kept at a tiny
          non-zero size (not display:none) since some browsers pause media
          on fully-hidden elements. Never shows video, audio only. */}
      <div id={YT_CONTAINER_ID} style={{ position: "fixed", width: 1, height: 1, left: -9999, top: -9999, overflow: "hidden" }} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
