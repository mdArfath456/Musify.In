// Central app configuration.
// Accept either a same-origin `/api` value or a deployed backend origin so a
// hosting provider cannot accidentally drop the backend's `/api` prefix.
const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export const API_BASE_URL = configuredApiUrl
	? configuredApiUrl.endsWith("/api")
		? configuredApiUrl
		: `${configuredApiUrl}/api`
	: "/api";
