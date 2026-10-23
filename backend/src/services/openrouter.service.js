const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";

async function askForSongList({ systemPrompt, userPrompt }) {
    if (!process.env.OPENROUTER_API_KEY) {
        // Fallback: extract available song titles from the prompt and return relevant matches
        const lines = userPrompt.split("\n");
        const availableTitles = [];
        for (const line of lines) {
            const m = line.match(/^\d+\.\s*(.+)$/);
            if (m) availableTitles.push(m[1].trim());
        }

        if (availableTitles.length === 0) return "[]";

        // Filter by keywords or return first 3-5 songs
        const lowerPrompt = userPrompt.toLowerCase();
        const matches = availableTitles.filter((title) => {
            const words = title.toLowerCase().split(/\s+/);
            return words.some((w) => w.length > 2 && lowerPrompt.includes(w));
        });

        const selected = matches.length > 0 ? matches.slice(0, 5) : availableTitles.slice(0, 4);
        return JSON.stringify(selected);
    }

    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.FRONTEND_URL || "https://musify-frontend-eight.vercel.app",
            "X-Title": "Musify"
        },
        body: JSON.stringify({
            model: MODEL,
            temperature: 0.4,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`OpenRouter request failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

module.exports = { askForSongList };