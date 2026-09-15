const supabase = require("../db/supabaseClient")

const WITH_ARTIST = "*, artist:users(id, username, email)"
const WITH_ARTIST_AND_TRACKS =
    "*, artist:users(id, username, email), album_tracks(track:tracks(*, artist:users(id, username, email)))"

function flattenTracks(row) {
    if (!row) return row
    const { album_tracks, ...rest } = row
    return { ...rest, tracks: (album_tracks || []).map((entry) => entry.track).filter(Boolean) }
}

async function create({ title, artistId, trackIds = [] }) {
    const { data: album, error } = await supabase
        .from("albums")
        .insert({ title, artist_id: artistId })
        .select(WITH_ARTIST)
        .single()
    if (error) throw error

    if (trackIds.length) {
        const rows = trackIds.map((trackId) => ({ album_id: album.id, track_id: trackId }))
        const { error: linkError } = await supabase.from("album_tracks").insert(rows)
        if (linkError) throw linkError
    }

    return findByIdWithTracksAndArtist(album.id)
}

async function findAllWithArtist() {
    const { data, error } = await supabase.from("albums").select(WITH_ARTIST)
    if (error) throw error
    return data || []
}

async function findByArtist(artistId) {
    const { data, error } = await supabase.from("albums").select(WITH_ARTIST).eq("artist_id", artistId)
    if (error) throw error
    return data || []
}

async function findByIdWithTracksAndArtist(id) {
    const { data, error } = await supabase.from("albums").select(WITH_ARTIST_AND_TRACKS).eq("id", id).maybeSingle()
    if (error) throw error
    return flattenTracks(data)
}

// $addToSet equivalent — the composite primary key on album_tracks means a
// duplicate insert just fails uniqueness, so treat that as a no-op success.
async function addTrack(albumId, trackId) {
    const { error } = await supabase.from("album_tracks").insert({ album_id: albumId, track_id: trackId })
    if (error && error.code !== "23505") throw error // 23505 = unique_violation, i.e. already added
    return findByIdWithTracksAndArtist(albumId)
}

module.exports = {
    create,
    findAllWithArtist,
    findByArtist,
    findByIdWithTracksAndArtist,
    addTrack
}
