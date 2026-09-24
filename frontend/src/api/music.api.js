import { api } from "./axios";

// --- User-role endpoints (require role "user") ---

export async function getAllMusics() {
  const { data } = await api.get("/music");
  return data.musics || [];
}

export async function getAllAlbums() {
  const { data } = await api.get("/music/albums");
  return data.albums || [];
}

export async function getAlbumById(albumId) {
  const { data } = await api.get(`/music/albums/${albumId}`);
  return data.album;
}

export async function getLikedTracks() {
  const { data } = await api.get("/music/liked");
  return data.musics || [];
}

export async function toggleLikeTrack(trackId) {
  const { data } = await api.post(`/music/${trackId}/like`);
  return data; // { message, liked }
}

export async function getRecentlyPlayed() {
  const { data } = await api.get("/music/recent");
  return data.recentlyPlayed || [];
}

export async function recordPlay(trackId) {
  const { data } = await api.post(`/music/${trackId}/play`);
  return data; // { message, playCount }
}

export async function getArtistProfile(artistId) {
  const { data } = await api.get(`/music/artist/${artistId}`);
  return data; // { artist, musics, albums }
}

// --- Artist-role endpoints (require role "artist") ---

export async function uploadMusic({ title, file }) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("music", file);
  const { data } = await api.post("/music/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.music;
}

export async function createAlbum({ title, musicIds }) {
  const { data } = await api.post("/music/album", { title, musics: musicIds });
  return data.album;
}

export async function addMusicToAlbum({ albumId, musicId }) {
  const { data } = await api.post(`/music/album/${albumId}/add-music`, { musicId });
  return data.album;
}


export async function getMyTracks() {
  const { data } = await api.get("/music/mine");
  return data.musics || [];
}

// Finds-or-creates the shared library row for a YouTube video and likes it
// for the current user, in one request.
export async function addYoutubeTrackToLiked({ videoId, title, channelTitle, thumbnail }) {
  const { data } = await api.post("/music/youtube/add-liked", { videoId, title, channelTitle, thumbnail });
  return data.music;
}