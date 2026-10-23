const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const hasValidSupabaseConfig =
    Boolean(process.env.SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    process.env.SUPABASE_URL.startsWith("http") &&
    !process.env.SUPABASE_URL.includes("your-project-ref") &&
    !process.env.SUPABASE_URL.includes("example.com");

let supabase;

if (hasValidSupabaseConfig) {
    try {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
        );
    } catch (err) {
        console.warn("Failed to initialize live Supabase client, falling back to mock:", err.message);
    }
}

if (!supabase) {
    console.log("[AI Studio] Supabase not configured — using in-memory store with demo data");

    const ARTIST_ID = "00000000-0000-0000-0000-000000000001";
    const USER_ID = "00000000-0000-0000-0000-000000000002";
    const defaultPasswordHash = bcrypt.hashSync("password123", 10);

    const tables = {
        users: [
            {
                id: ARTIST_ID,
                username: "artist",
                email: "artist@musify.local",
                password: defaultPasswordHash,
                role: "artist",
                is_verified: true,
                first_login_verified: true,
                otp_hash: null,
                otp_purpose: null,
                otp_expiry: null,
                otp_attempts: 0,
                reset_token_hash: null,
                reset_token_expires_at: null,
                failed_login_attempts: 0,
                lock_until: null,
                token_version: 0,
                age: 25,
                accepted_terms: true,
                created_at: new Date().toISOString()
            },
            {
                id: USER_ID,
                username: "listener",
                email: "listener@musify.local",
                password: defaultPasswordHash,
                role: "user",
                is_verified: true,
                first_login_verified: true,
                otp_hash: null,
                otp_purpose: null,
                otp_expiry: null,
                otp_attempts: 0,
                reset_token_hash: null,
                reset_token_expires_at: null,
                failed_login_attempts: 0,
                lock_until: null,
                token_version: 0,
                age: 22,
                accepted_terms: true,
                created_at: new Date().toISOString()
            }
        ],
        tracks: [
            {
                id: "10000000-0000-0000-0000-000000000001",
                title: "Neon Nights",
                artist_id: ARTIST_ID,
                source: "upload",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                youtube_video_id: null,
                thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
                channel_title: "Aura",
                play_count: 142,
                created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
                id: "10000000-0000-0000-0000-000000000002",
                title: "Cyber City Vibes",
                artist_id: ARTIST_ID,
                source: "upload",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                youtube_video_id: null,
                thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
                channel_title: "Aura",
                play_count: 98,
                created_at: new Date(Date.now() - 3600000 * 20).toISOString()
            },
            {
                id: "10000000-0000-0000-0000-000000000003",
                title: "Midnight Echoes",
                artist_id: ARTIST_ID,
                source: "upload",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                youtube_video_id: null,
                thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
                channel_title: "Aura",
                play_count: 230,
                created_at: new Date(Date.now() - 3600000 * 16).toISOString()
            },
            {
                id: "10000000-0000-0000-0000-000000000004",
                title: "Electric Sunset",
                artist_id: ARTIST_ID,
                source: "upload",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                youtube_video_id: null,
                thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
                channel_title: "Aura",
                play_count: 310,
                created_at: new Date(Date.now() - 3600000 * 12).toISOString()
            },
            {
                id: "10000000-0000-0000-0000-000000000005",
                title: "Lo-Fi Waves",
                artist_id: ARTIST_ID,
                source: "upload",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
                youtube_video_id: null,
                thumbnail: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop",
                channel_title: "Aura",
                play_count: 77,
                created_at: new Date(Date.now() - 3600000 * 8).toISOString()
            },
            {
                id: "10000000-0000-0000-0000-000000000006",
                title: "Solar Beats",
                artist_id: ARTIST_ID,
                source: "upload",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
                youtube_video_id: null,
                thumbnail: "https://images.unsplash.com/photo-1445985543470-41fba5c3144a?w=300&h=300&fit=crop",
                channel_title: "Aura",
                play_count: 185,
                created_at: new Date(Date.now() - 3600000 * 4).toISOString()
            }
        ],
        albums: [
            {
                id: "20000000-0000-0000-0000-000000000001",
                title: "Synthetica Vol. 1",
                artist_id: ARTIST_ID,
                created_at: new Date(Date.now() - 3600000 * 48).toISOString()
            },
            {
                id: "20000000-0000-0000-0000-000000000002",
                title: "Sunset Horizons",
                artist_id: ARTIST_ID,
                created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            }
        ],
        album_tracks: [
            { album_id: "20000000-0000-0000-0000-000000000001", track_id: "10000000-0000-0000-0000-000000000001" },
            { album_id: "20000000-0000-0000-0000-000000000001", track_id: "10000000-0000-0000-0000-000000000002" },
            { album_id: "20000000-0000-0000-0000-000000000001", track_id: "10000000-0000-0000-0000-000000000003" },
            { album_id: "20000000-0000-0000-0000-000000000002", track_id: "10000000-0000-0000-0000-000000000004" },
            { album_id: "20000000-0000-0000-0000-000000000002", track_id: "10000000-0000-0000-0000-000000000005" },
            { album_id: "20000000-0000-0000-0000-000000000002", track_id: "10000000-0000-0000-0000-000000000006" }
        ],
        likes: [
            { user_id: USER_ID, track_id: "10000000-0000-0000-0000-000000000001" },
            { user_id: USER_ID, track_id: "10000000-0000-0000-0000-000000000004" }
        ],
        recently_played: [
            {
                id: crypto.randomUUID(),
                user_id: USER_ID,
                track_id: "10000000-0000-0000-0000-000000000001",
                played_at: new Date(Date.now() - 100000).toISOString()
            }
        ]
    };

    function attachRelations(tableName, row) {
        if (!row) return row;
        const copy = { ...row };
        if (tableName === "tracks") {
            const artist = tables.users.find((u) => u.id === copy.artist_id);
            copy.artist = artist ? { id: artist.id, username: artist.username, email: artist.email } : null;
        } else if (tableName === "albums") {
            const artist = tables.users.find((u) => u.id === copy.artist_id);
            copy.artist = artist ? { id: artist.id, username: artist.username, email: artist.email } : null;
            const trackLinks = tables.album_tracks.filter((at) => at.album_id === copy.id);
            copy.album_tracks = trackLinks.map((tl) => {
                const tr = tables.tracks.find((t) => t.id === tl.track_id);
                return { track: attachRelations("tracks", tr) };
            });
        } else if (tableName === "recently_played") {
            const tr = tables.tracks.find((t) => t.id === copy.track_id);
            copy.track = attachRelations("tracks", tr);
        }
        return copy;
    }

    class MockQueryBuilder {
        constructor(tableName) {
            this.tableName = tableName;
            this.filters = [];
            this.sortFn = null;
            this.limitCount = null;
            this.operation = "select";
            this.insertRows = [];
            this.updatePatch = null;
            this.isCountOnly = false;
        }

        select(fields, options) {
            if (options?.count === "exact" && options?.head) {
                this.isCountOnly = true;
            }
            return this;
        }

        insert(data) {
            this.operation = "insert";
            this.insertRows = Array.isArray(data) ? data : [data];
            return this;
        }

        update(patch) {
            this.operation = "update";
            this.updatePatch = patch;
            return this;
        }

        delete() {
            this.operation = "delete";
            return this;
        }

        eq(field, val) {
            this.filters.push((row) => row[field] === val);
            return this;
        }

        or(filterStr) {
            // Parses e.g. "username.eq.john,email.eq.john@example.com"
            const parts = filterStr.split(",").map((s) => s.trim());
            this.filters.push((row) =>
                parts.some((part) => {
                    const match = part.match(/^([^.]+)\.eq\.(.*)$/);
                    if (!match) return false;
                    const [, field, expected] = match;
                    return String(row[field] || "").toLowerCase() === String(expected).toLowerCase();
                })
            );
            return this;
        }

        in(field, arr) {
            const set = new Set(arr);
            this.filters.push((row) => set.has(row[field]));
            return this;
        }

        gt(field, val) {
            this.filters.push((row) => {
                const v = row[field];
                return v !== null && v !== undefined && v > val;
            });
            return this;
        }

        order(field, { ascending = true } = {}) {
            this.sortFn = (a, b) => {
                if (a[field] < b[field]) return ascending ? -1 : 1;
                if (a[field] > b[field]) return ascending ? 1 : -1;
                return 0;
            };
            return this;
        }

        limit(n) {
            this.limitCount = n;
            return this;
        }

        _execute() {
            const table = tables[this.tableName] || [];

            if (this.operation === "insert") {
                const inserted = [];
                for (const row of this.insertRows) {
                    const newRow = {
                        id: row.id || crypto.randomUUID(),
                        created_at: new Date().toISOString(),
                        ...row
                    };
                    table.push(newRow);
                    inserted.push(attachRelations(this.tableName, newRow));
                }
                const result = Array.isArray(this.insertRows) && this.insertRows.length > 1 ? inserted : inserted[0];
                return { data: result, error: null };
            }

            if (this.operation === "update") {
                let updated = null;
                for (let i = 0; i < table.length; i++) {
                    if (this.filters.every((f) => f(table[i]))) {
                        table[i] = { ...table[i], ...this.updatePatch };
                        updated = attachRelations(this.tableName, table[i]);
                    }
                }
                return { data: updated, error: null };
            }

            if (this.operation === "delete") {
                const toKeep = [];
                for (const row of table) {
                    if (!this.filters.every((f) => f(row))) {
                        toKeep.push(row);
                    }
                }
                tables[this.tableName] = toKeep;
                return { data: null, error: null };
            }

            // Select
            let matches = table.filter((row) => this.filters.every((f) => f(row)));
            if (this.sortFn) matches.sort(this.sortFn);
            if (this.limitCount !== null) matches = matches.slice(0, this.limitCount);

            if (this.isCountOnly) {
                return { count: matches.length, error: null };
            }

            const data = matches.map((row) => attachRelations(this.tableName, row));
            return { data, count: data.length, error: null };
        }

        async single() {
            const { data, error } = this._execute();
            if (error) return { data: null, error };
            const item = Array.isArray(data) ? data[0] : data;
            return { data: item || null, error: null };
        }

        async maybeSingle() {
            const { data, error } = this._execute();
            if (error) return { data: null, error };
            const item = Array.isArray(data) ? data[0] : data;
            return { data: item || null, error: null };
        }

        then(resolve, reject) {
            try {
                const result = this._execute();
                resolve(result);
            } catch (err) {
                if (reject) reject(err);
                else resolve({ data: null, error: err });
            }
        }
    }

    supabase = {
        from: (tableName) => new MockQueryBuilder(tableName),
        storage: {
            from: (bucket) => ({
                upload: async (filePath, buffer, options) => {
                    return { data: { path: filePath }, error: null };
                },
                getPublicUrl: (filePath) => {
                    return {
                        data: {
                            publicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                        }
                    };
                }
            })
        }
    };
}

module.exports = supabase;
