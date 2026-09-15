// The frontend was built against Mongoose's document shape (`_id`, a
// nested `artist: { _id, username, email }` object, etc). Rather than
// touch every page/component, these mappers translate Postgres rows back
// into that exact shape so the whole existing frontend keeps working
// unmodified.

function mapUserPublic(row) {
    if (!row) return null
    return {
        _id: row.id,
        username: row.username,
        email: row.email
    }
}

function mapTrack(row) {
    if (!row) return null
    return {
        _id: row.id,
        title: row.title,
        uri: row.uri,
        source: row.source,
        youtubeVideoId: row.youtube_video_id,
        thumbnail: row.thumbnail,
        channelTitle: row.channel_title,
        playCount: row.play_count,
        artist: row.artist ? mapUserPublic(row.artist) : row.artist_id
    }
}

function mapAlbumSummary(row) {
    if (!row) return null
    return {
        _id: row.id,
        title: row.title,
        artist: row.artist ? mapUserPublic(row.artist) : row.artist_id
    }
}

function mapAlbumFull(row) {
    if (!row) return null
    return {
        ...mapAlbumSummary(row),
        musics: (row.tracks || []).map(mapTrack)
    }
}

module.exports = { mapUserPublic, mapTrack, mapAlbumSummary, mapAlbumFull }
