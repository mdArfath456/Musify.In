# Database

Postgres, hosted on Supabase. Schema lives here as numbered migration files —
not a single `schema.sql` — so every change is a reviewable, replayable step,
the same discipline any team running Postgres in production uses.

## Applying migrations

**First-time setup (no Supabase CLI):** open your project's SQL Editor and
run `migrations/0001_init_schema.sql` once.

**With the Supabase CLI** (recommended once you're past the first setup):
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```
This applies any migration in this folder that hasn't been run against that
project yet, in order.

## Adding a schema change later

1. Create a new file: `migrations/000N_short_description.sql` (next number,
   short present-tense description — e.g. `0002_add_track_genre.sql`).
2. Never edit a migration that's already been applied anywhere (locally,
   staging, production) — ship the change as a new file instead. Editing
   history in place is how a team's local schema and production schema
   quietly drift apart.
3. Run it the same way as above.

## Design notes

- **UUID primary keys** everywhere (`gen_random_uuid()`) — safe to generate
  client- or server-side without a round trip, and don't leak row counts the
  way serial IDs do.
- **`citext`** on `users.username`/`email` — case-insensitive uniqueness and
  lookups at the database level, so `Arfath@x.com` and `arfath@x.com` can't
  both register.
- **`updated_at` triggers** on `users`, `tracks`, `albums` — automatic audit
  trail; the app doesn't need to remember to set it on every update.
- **RLS enabled on every table, no policies** — the backend uses the
  Supabase *service role* key exclusively, which bypasses RLS regardless of
  policy, so this changes nothing about how the app runs today. It's there
  so that if the anon key ever ends up in frontend code, every table is
  locked down by default rather than wide open.
- **One shared library, not per-user copies** — `tracks.youtube_video_id`
  has a unique index, so the same YouTube video added by five different
  users is still one row with five `likes` rows pointing at it, not five
  duplicate tracks.
