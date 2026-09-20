const supabase = require("./supabaseClient")

const isFetchFailure = (error) =>
    error instanceof TypeError && /fetch failed/i.test(error.message || "")

// No persistent "connection" to open with Postgres over HTTP the way
// Mongoose needs one — this just does a cheap sanity check on boot so a
// bad SUPABASE_URL / key fails loudly at startup instead of on the first
// request.
const connectDB = async () => {
    try {
        const { error } = await supabase.from("users").select("id").limit(1)
        if (error) throw error
        console.log("connected to Supabase")
    } catch (error) {
        const hint = isFetchFailure(error)
            ? "Check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DNS/proxy/firewall access, and that the Supabase project is not paused."
            : "Run backend/supabase/schema.sql in the connected Supabase project's SQL Editor."

        console.error("Supabase connection check failed:", error.message, hint)
    }
}

module.exports = connectDB
