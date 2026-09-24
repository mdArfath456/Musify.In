import { api } from "./axios";

export async function searchOnline(query) {
  const { data } = await api.get("/youtube/search", { params: { q: query } });
  return data.results || [];
}