import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import SearchInput from "../../components/SearchInput/SearchInput";
import { uploadMusic, createAlbum, addMusicToAlbum, getMyTracks } from "../../api/music.api";
import "./Studio.css";

export default function Studio() {
  // --- Your tracks (full catalog, not just this session) ---
  const [myTracks, setMyTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [tracksError, setTracksError] = useState("");
  const [trackQuery, setTrackQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyTracks()
      .then((data) => {
        if (!cancelled) setMyTracks(data);
      })
      .catch((err) => {
        if (!cancelled) setTracksError(err.message || "Could not load your tracks.");
      })
      .finally(() => {
        if (!cancelled) setTracksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTracks = useMemo(() => {
    const q = trackQuery.trim().toLowerCase();
    if (!q) return myTracks;
    return myTracks.filter((t) => t.title.toLowerCase().includes(q));
  }, [myTracks, trackQuery]);

  // --- Upload track ---
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const music = await uploadMusic({ title, file });
      setMyTracks((prev) => [music, ...prev]);
      setTitle("");
      setFile(null);
      e.target.reset();
    } catch (err) {
      setUploadError(err.message || "Upload failed. Try a different file.");
    } finally {
      setUploading(false);
    }
  };

  // --- Create album ---
  const [albumTitle, setAlbumTitle] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [albumError, setAlbumError] = useState("");
  const [albumSuccess, setAlbumSuccess] = useState("");

  const toggleTrack = (id) => {
    setSelectedTrackIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    setAlbumError("");
    setAlbumSuccess("");
    setCreatingAlbum(true);
    try {
      const album = await createAlbum({ title: albumTitle, musicIds: selectedTrackIds });
      setAlbumSuccess(`"${album.title}" created with ${selectedTrackIds.length} track(s).`);
      setAlbumTitle("");
      setSelectedTrackIds([]);
    } catch (err) {
      setAlbumError(err.message || "Could not create album.");
    } finally {
      setCreatingAlbum(false);
    }
  };

  // --- Add track to an existing album by ID ---
  const [addAlbumId, setAddAlbumId] = useState("");
  const [addMusicId, setAddMusicId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const handleAddToAlbum = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAdding(true);
    try {
      await addMusicToAlbum({ albumId: addAlbumId, musicId: addMusicId });
      setAddSuccess("Track added to album.");
      setAddAlbumId("");
      setAddMusicId("");
    } catch (err) {
      setAddError(err.message || "Could not add track to that album.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page">
      <Navbar title="Studio" subtitle="Upload tracks and build them into albums." />

      <div className="page-body studio-body">
        <section className="studio-panel">
          <h2 className="studio-panel-title">Upload a track</h2>
          <p className="studio-panel-hint">Audio file goes to storage; the track then appears in everyone's library.</p>
          <form className="studio-form" onSubmit={handleUpload}>
            <div className="field">
              <label htmlFor="track-title">Track title</label>
              <input id="track-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="track-file">Audio file</label>
              <input
                id="track-file"
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            {uploadError && <p className="error-text">{uploadError}</p>}
            <button className="btn btn-primary" type="submit" disabled={uploading}>
              {uploading ? "Uploading…" : "Upload track"}
            </button>
          </form>
        </section>

        <section className="studio-panel">
          <h2 className="studio-panel-title">Build an album</h2>
          <p className="studio-panel-hint">Search your uploads and pick which tracks belong on the album.</p>
          <form className="studio-form" onSubmit={handleCreateAlbum}>
            <div className="field">
              <label htmlFor="album-title">Album title</label>
              <input id="album-title" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} required />
            </div>

            {tracksLoading && <p className="studio-empty-hint">Loading your tracks…</p>}
            {!tracksLoading && tracksError && <p className="error-text">{tracksError}</p>}

            {!tracksLoading && !tracksError && myTracks.length === 0 && (
              <p className="studio-empty-hint">Upload a track above to see it appear here.</p>
            )}

            {!tracksLoading && !tracksError && myTracks.length > 0 && (
              <>
                <SearchInput value={trackQuery} onChange={setTrackQuery} placeholder="Search your tracks..." />
                {filteredTracks.length === 0 ? (
                  <p className="studio-empty-hint">{`Nothing matches "${trackQuery}".`}</p>
                ) : (
                  <div className="studio-track-picker">
                    {filteredTracks.map((t) => (
                      <label key={t._id} className="studio-track-option">
                        <input
                          type="checkbox"
                          checked={selectedTrackIds.includes(t._id)}
                          onChange={() => toggleTrack(t._id)}
                        />
                        <span>{t.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}

            {albumError && <p className="error-text">{albumError}</p>}
            {albumSuccess && <p className="success-text">{albumSuccess}</p>}
            <button className="btn btn-primary" type="submit" disabled={creatingAlbum || selectedTrackIds.length === 0}>
              {creatingAlbum ? "Creating…" : "Create album"}
            </button>
          </form>
        </section>

        <section className="studio-panel">
          <h2 className="studio-panel-title">Add a track to an album</h2>
          <p className="studio-panel-hint">
            Useful for adding a track to an album that already exists. Copy the album ID from its detail page URL.
          </p>
          <form className="studio-form" onSubmit={handleAddToAlbum}>
            <div className="field">
              <label htmlFor="add-album-id">Album ID</label>
              <input id="add-album-id" value={addAlbumId} onChange={(e) => setAddAlbumId(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="add-music-id">Track ID</label>
              <input id="add-music-id" value={addMusicId} onChange={(e) => setAddMusicId(e.target.value)} required />
            </div>
            {addError && <p className="error-text">{addError}</p>}
            {addSuccess && <p className="success-text">{addSuccess}</p>}
            <button className="btn btn-ghost" type="submit" disabled={adding}>
              {adding ? "Adding…" : "Add to album"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}