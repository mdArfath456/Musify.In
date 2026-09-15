const { createClerkClient } = require("@clerk/backend")
const dotenv = require("dotenv").config()

if (!process.env.CLERK_SECRET_KEY) {
    console.warn("CLERK_SECRET_KEY is not set — email verification via Clerk will fail until it's configured.")
}

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

// The frontend runs the actual OTP exchange with Clerk (sending the code,
// letting the user type it in, checking it) using Clerk's own client SDK —
// that's the only place Clerk's code-verification API is reachable from.
// What lands here afterwards is just a claim: "this Clerk user's email is
// verified now". We never trust that claim as-is — we go back to Clerk's
// Backend API ourselves and check the real EmailAddress.verification.status
// for that user before marking anything verified on our side.
async function isEmailVerifiedOnClerk(clerkUserId, expectedEmail) {
    if (!clerkUserId || !expectedEmail) return false

    let clerkUser
    try {
        clerkUser = await clerkClient.users.getUser(clerkUserId)
    } catch (error) {
        return false // unknown/deleted Clerk user — never treat as verified
    }

    const normalizedExpected = expectedEmail.trim().toLowerCase()
    const match = (clerkUser.emailAddresses || []).find(
        (entry) => entry.emailAddress?.toLowerCase() === normalizedExpected
    )

    return Boolean(match && match.verification?.status === "verified")
}

module.exports = { isEmailVerifiedOnClerk }
