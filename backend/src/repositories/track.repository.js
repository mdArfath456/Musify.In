const supabase = require("../db/supabaseClient")

const WITH_ARTIST = "*, artist:users!tracks_artist_id_fkey(id, username, email)"

async function create({ title, artistId, uri }) {
    const { data, error } = await supabase
        .from("tracks")
        .insert({ title, artist_id: artistId, uri, source: "upload" })
        .select(WITH_ARTIST)
        .single()
    if (error) throw error
    return data
}

async function findAllWithArtist() {
    const { data, error } = await supabase.from("tracks").select(WITH_ARTIST)
    if (error) throw error
    return data || []
}

async function findByArtist(artistId) {
    const { data, error } = await supabase
        .from("tracks")
        .select(WITH_ARTIST)
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false })
    if (error) throw error
    return data || []
}

async function findById(id) {
    const { data, error } = await supabase.from("tracks").select(WITH_ARTIST).eq("id", id).maybeSingle()
    if (error) throw error
    return data
}

async function findByIds(ids) {
    if (!ids || ids.length === 0) return []
    const { data, error } = await supabase.from("tracks").select(WITH_ARTIST).in("id", ids)
    if (error) throw error
    return data || []
}

async function incrementPlayCount(id) {
    const { data: current, error: fetchError } = await supabase
        .from("tracks")
        .select("play_count")
        .eq("id", id)
        .maybeSingle()
    if (fetchError) throw fetchError
    if (!current) return null

    const { data, error } = await supabase
        .from("tracks")
        .update({ play_count: current.play_count + 1 })
        .eq("id", id)
        .select(WITH_ARTIST)
        .single()
    if (error) throw error
    return data
}

// Used by the "Add to Liked Songs" button on YouTube search results — the
// shared library only ever holds one row per video, so a second user
// adding the same song reuses the existing track instead of duplicating it.
async function findOrCreateYoutubeTrack({ videoId, title, channelTitle, thumbnail, addedByUserId }) {
    const { data: existing, error: findError } = await supabase
        .from("tracks")
        .select(WITH_ARTIST)
        .eq("youtube_video_id", videoId)
        .maybeSingle()
    if (findError) throw findError
    if (existing) return existing

    const { data, error } = await supabase
        .from("tracks")
        .insert({
            title,
            artist_id: addedByUserId,
            source: "youtube",
            youtube_video_id: videoId,
            channel_title: channelTitle,
            thumbnail
        })
        .select(WITH_ARTIST)
        .single()
    if (error) throw error
    return data
}

module.exports = {
    create,
    findAllWithArtist,
    findByArtist,
    findById,
    findByIds,
    incrementPlayCount,
    findOrCreateYoutubeTrack
}
