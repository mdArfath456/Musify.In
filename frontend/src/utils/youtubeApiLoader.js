// Loads the YouTube IFrame Player API script exactly once, no matter how
// many things end up wanting it. No API key required for this part — only
// the Data API (search) needs a key; playback control is a free, public script.
let apiPromise = null;

export function loadYoutubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;

    apiPromise = new Promise((resolve) => {
        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prevCallback?.();
            resolve(window.YT);
        };
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
    });
    return apiPromise;
}
