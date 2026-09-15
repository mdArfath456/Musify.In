const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

async function searchYoutube(query) {
    if (!process.env.YOUTUBE_API_KEY) {
        throw new Error("YOUTUBE_API_KEY is not set");
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