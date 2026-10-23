const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

const FALLBACK_TRACKS = [
    {
        videoId: "jfKfPfyJRdk",
        title: "lofi hip hop radio 📚 - beats to relax/study to",
        channelTitle: "Lofi Girl",
        thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg"
    },
    {
        videoId: "5qap5aO4i9A",
        title: "Lofi Hip Hop Radio 24/7 🔴 Chill Study / Relax / Gaming Beats",
        channelTitle: "Lofi Girl",
        thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg"
    },
    {
        videoId: "4xDzrJKXOOY",
        title: "synthwave radio 🌌 - chill synth / retro beats",
        channelTitle: "Lofi Girl",
        thumbnail: "https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg"
    },
    {
        videoId: "kJQP7kiw5Fk",
        title: "Luis Fonsi - Despacito ft. Daddy Yankee",
        channelTitle: "Luis Fonsi",
        thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg"
    },
    {
        videoId: "fJ9rUzIMcZQ",
        title: "Queen – Bohemian Rhapsody (Official Video Remastered)",
        channelTitle: "Queen Official",
        thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg"
    },
    {
        videoId: "JGwWNGJdvx8",
        title: "Ed Sheeran - Shape of You (Official Music Video)",
        channelTitle: "Ed Sheeran",
        thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg"
    }
];

async function searchYoutube(query) {
    if (!process.env.YOUTUBE_API_KEY) {
        const lower = query.toLowerCase();
        const filtered = FALLBACK_TRACKS.filter((t) =>
            t.title.toLowerCase().includes(lower) || t.channelTitle.toLowerCase().includes(lower)
        );
        return filtered.length > 0 ? filtered : FALLBACK_TRACKS;
    }

    const url = new URL(YOUTUBE_SEARCH_URL);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("videoCategoryId", "10"); // Music category
    url.searchParams.set("maxResults", "12");
    url.searchParams.set("q", query);
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`YouTube search failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return (data.items || []).map((item) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
    }));
}

module.exports = { searchYoutube };