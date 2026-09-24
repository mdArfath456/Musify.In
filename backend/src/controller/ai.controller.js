const trackRepository = require("../repositories/track.repository")
const { mapTrack } = require("../repositories/mappers")
const { askForSongList } = require("../services/openrouter.service")

// Pulls the first JSON array out of a model's reply, tolerating stray text
// or markdown code fences the model might add despite instructions not to.
function extractJsonArray(text) {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
        return [];
    }
}

// Given the titles the model chose, resolve them back to real DB rows.
// This is the step that makes recommendations "database-aware" — the model
// only ever sees and returns titles, never invents a track that doesn't exist.
function resolveTitlesToTracks(candidateTracks, titles) {
    const lowerTitles = titles.map((t) => t.toLowerCase());
    return candidateTracks.filter((t) => lowerTitles.includes(t.title.toLowerCase()));
}

// POST /api/ai/recommend  { prompt: "romantic bollywood songs" | "workout playlist" | ... }
// Covers the music-assistant, playlist-generator, and natural-language-search
// use cases — they're all the same shape: free-text mood/request in, a
// constrained list of real tracks out.
const recommend = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                message: "A prompt is required"
            })
        }

        // Cap at 300 titles so the prompt stays a reasonable size as the
        // catalog grows; fine for a fresher-project scale library.
        const allTracks = (await trackRepository.findAllWithArtist()).slice(0, 300);
        if (allTracks.length === 0) {
            return res.status(200).json({
                message: "No tracks available yet",
                tracks: []
            })
        }

        const numbered = allTracks.map((t, i) => `${i + 1}. ${t.title}`).join("\n");
        const systemPrompt =
            "You are a music recommendation assistant for a streaming app called Musify. " +
            "You must only recommend songs from the numbered list the user gives you — never invent a title, " +
            "artist, or song that isn't explicitly listed. " +
            "Reply with ONLY a JSON array of song title strings, exactly as written in the list, nothing else — " +
            "no markdown fences, no explanation, no numbering.";
        const userPrompt =
            `Available songs:\n${numbered}\n\nRequest: ${prompt}\n\n` +
            "Return up to 8 matching songs as a JSON array of exact titles from the list above.";

        const raw = await askForSongList({ systemPrompt, userPrompt });
        const titles = extractJsonArray(raw);
        const tracks = resolveTitlesToTracks(allTracks, titles);

        return res.status(200).json({
            message: "Recommendations generated",
            tracks: tracks.map(mapTrack)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Could not generate recommendations right now"
        })
    }
}

// GET /api/ai/similar/:trackId — "more like this" for a specific track.
const similar = async (req, res) => {
    try {
        const { trackId } = req.params;
        const source = await trackRepository.findById(trackId);
        if (!source) {
            return res.status(404).json({
                message: "Track not found"
            })
        }

        const allTracks = await trackRepository.findAllWithArtist();
        const others = allTracks.filter((t) => t.id !== trackId).slice(0, 300);
        if (others.length === 0) {
            return res.status(200).json({
                message: "No other tracks to compare",
                tracks: []
            })
        }

        const numbered = others.map((t, i) => `${i + 1}. ${t.title}`).join("\n");
        const systemPrompt =
            "You are a music recommendation assistant for a streaming app called Musify. " +
            "You must only recommend songs from the numbered list — never invent a title. " +
            "Reply with ONLY a JSON array of song title strings, exactly as written in the list, nothing else.";
        const userPrompt =
            `A listener just played "${source.title}".\n\nOther available songs:\n${numbered}\n\n` +
            `Return up to 5 songs from the list most similar in mood, genre, or language to "${source.title}", ` +
            "as a JSON array of exact titles.";

        const raw = await askForSongList({ systemPrompt, userPrompt });
        const titles = extractJsonArray(raw);
        const tracks = resolveTitlesToTracks(others, titles);

        return res.status(200).json({
            message: "Similar tracks generated",
            tracks: tracks.map(mapTrack)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Could not generate similar tracks right now"
        })
    }
}

module.exports = { recommend, similar }
