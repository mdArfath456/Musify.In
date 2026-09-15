const supabase = require("../db/supabaseClient")

const COLUMNS =
    "id, username, email, password, role, is_verified, otp_hash, otp_purpose, otp_expiry, failed_login_attempts, lock_until, token_version, age, accepted_terms, created_at"

// Postgres is snake_case, the rest of the app (and the frontend, via the
// track/album mappers) expects the same camelCase field names Mongoose
// used to hand back — this keeps that translation in exactly one place.
function mapUser(row) {
    if (!row) return null
    return {
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password,
        role: row.role,
        isVerified: row.is_verified,
        otpHash: row.otp_hash,
        otpPurpose: row.otp_purpose,
        otpExpiry: row.otp_expiry ? new Date(row.otp_expiry) : null,
        failedLoginAttempts: row.failed_login_attempts,
        lockUntil: row.lock_until ? new Date(row.lock_until) : null,
        tokenVersion: row.token_version,
        age: row.age,
        acceptedTerms: row.accepted_terms
    }
}

const PATCH_TO_COLUMN = {
    username: "username",
    email: "email",
    password: "password",
    role: "role",
    isVerified: "is_verified",
    otpHash: "otp_hash",
    otpPurpose: "otp_purpose",
    otpExpiry: "otp_expiry",
    failedLoginAttempts: "failed_login_attempts",
    lockUntil: "lock_until",
    tokenVersion: "token_version",
    age: "age",
    acceptedTerms: "accepted_terms"
}

function toColumns(patch) {
    const columns = {}
    for (const [key, value] of Object.entries(patch)) {
        const column = PATCH_TO_COLUMN[key]
        if (!column) continue
        columns[column] = value
    }
    return columns
}

async function findByUsernameOrEmail({ username, email }) {
    let query = supabase.from("users").select(COLUMNS)
    const filters = []
    if (username) filters.push(`username.eq.${username}`)
    if (email) filters.push(`email.eq.${email}`)
    if (filters.length === 0) return null

    const { data, error } = await query.or(filters.join(",")).maybeSingle()
    if (error) throw error
    return mapUser(data)
}

async function findById(id) {
    const { data, error } = await supabase.from("users").select(COLUMNS).eq("id", id).maybeSingle()
    if (error) throw error
    return mapUser(data)
}

async function findByEmail(email) {
    const { data, error } = await supabase.from("users").select(COLUMNS).eq("email", email).maybeSingle()
    if (error) throw error
    return mapUser(data)
}

async function existsByUsername(username) {
    const { count, error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("username", username)
    if (error) throw error
    return (count || 0) > 0
}

async function existsByEmail(email) {
    const { count, error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
    if (error) throw error
    return (count || 0) > 0
}

async function create({ username, email, password, role, age, acceptedTerms, isVerified, otpHash, otpPurpose, otpExpiry }) {
    const { data, error } = await supabase
        .from("users")
        .insert({
            username,
            email,
            password,
            role,
            age: age || null,
            accepted_terms: acceptedTerms,
            is_verified: isVerified,
            otp_hash: otpHash,
            otp_purpose: otpPurpose,
            otp_expiry: otpExpiry
        })
        .select(COLUMNS)
        .single()
    if (error) throw error
    return mapUser(data)
}

// Replaces the old Mongoose "mutate the doc, then user.save()" pattern —
// pass only the fields that changed.
async function updateById(id, patch) {
    const { data, error } = await supabase
        .from("users")
        .update(toColumns(patch))
        .eq("id", id)
        .select(COLUMNS)
        .single()
    if (error) throw error
    return mapUser(data)
}

// --- likes ---

async function getLikedTrackIds(userId) {
    const { data, error } = await supabase.from("likes").select("track_id").eq("user_id", userId)
    if (error) throw error
    return (data || []).map((row) => row.track_id)
}

async function isTrackLiked(userId, trackId) {
    const { data, error } = await supabase
        .from("likes")
        .select("user_id")
        .eq("user_id", userId)
        .eq("track_id", trackId)
        .maybeSingle()
    if (error) throw error
    return Boolean(data)
}

async function likeTrack(userId, trackId) {
    const { error } = await supabase.from("likes").insert({ user_id: userId, track_id: trackId })
    if (error) throw error
}

async function unlikeTrack(userId, trackId) {
    const { error } = await supabase.from("likes").delete().eq("user_id", userId).eq("track_id", trackId)
    if (error) throw error
}

// --- recently played ---

async function recordRecentlyPlayed(userId, trackId) {
    // Mirrors the old behaviour: drop any existing entry for this track,
    // insert a fresh one at the top, keep only the most recent 20.
    const { error: deleteError } = await supabase
        .from("recently_played")
        .delete()
        .eq("user_id", userId)
        .eq("track_id", trackId)
    if (deleteError) throw deleteError

    const { error: insertError } = await supabase
        .from("recently_played")
        .insert({ user_id: userId, track_id: trackId })
    if (insertError) throw insertError

    const { data: rows, error: listError } = await supabase
        .from("recently_played")
        .select("id")
        .eq("user_id", userId)
        .order("played_at", { ascending: false })
    if (listError) throw listError

    const staleIds = (rows || []).slice(20).map((row) => row.id)
    if (staleIds.length) {
        const { error: trimError } = await supabase.from("recently_played").delete().in("id", staleIds)
        if (trimError) throw trimError
    }
}

async function getRecentlyPlayed(userId, limit = 20) {
    const { data, error } = await supabase
        .from("recently_played")
        .select("played_at, track:tracks(*, artist:users!tracks_artist_id_fkey(id, username, email))")
        .eq("user_id", userId)
        .order("played_at", { ascending: false })
        .limit(limit)
    if (error) throw error
    return data || []
}

module.exports = {
    findByUsernameOrEmail,
    findById,
    findByEmail,
    existsByUsername,
    existsByEmail,
    create,
    updateById,
    getLikedTrackIds,
    isTrackLiked,
    likeTrack,
    unlikeTrack,
    recordRecentlyPlayed,
    getRecentlyPlayed
}
