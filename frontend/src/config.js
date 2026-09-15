// Central app configuration.
// Use Vercel's same-origin rewrite in production; local development can still
// override this with VITE_API_URL in a .env file.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
