const { createClient } = require("@supabase/supabase-js")
const dotenv = require("dotenv").config()

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — Supabase calls will fail until they're configured."
    )
}

// Service-role key on purpose: this backend is the only thing that ever
// talks to Postgres (no client-side Supabase access, no Supabase Auth), so
// there's no anon-key/RLS boundary to worry about — same trust model as the
// old private MONGODB_URI connection string.
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: { persistSession: false }
    }
)

module.exports = supabase
