import { api } from "./axios";

export async function getAIRecommendations(prompt) {
    const { data } = await api.post("/ai/recommend", { prompt });
    return data.tracks || [];
}

export async function getSimilarTracks(trackId) {
    const { data } = await api.get(`/ai/similar/${trackId}`);
    return data.tracks || [];
}