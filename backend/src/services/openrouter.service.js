
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL = "openai/gpt-4o-mini";

async function askForSongList({ systemPrompt, userPrompt }) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is not set");
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