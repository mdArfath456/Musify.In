const supabase = require("../db/supabaseClient")

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "music-files"

// Uploads an audio file buffer (from multer's memoryStorage) to a Supabase
// Storage bucket and returns its public URL. Replaces the old ImageKit
// integration — same "upload a buffer, get a URL back" shape, so the
// caller (music.controller.js) barely changed.
const uploadFile = async (buffer, originalName = "track", mimeType = "audio/mpeg") => {
    const safeExt = (originalName.split(".").pop() || "mp3").toLowerCase()
    const path = `music/music_${Date.now()}.${safeExt}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: mimeType,
        upsert: false
    })
    if (uploadError) {
        throw new Error(`Supabase Storage upload failed: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, path }
}

module.exports = { uploadFile }
