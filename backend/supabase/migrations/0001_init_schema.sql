-- Musify — initial schema
-- Run via `supabase db push` / `supabase migration up`, or paste into the
-- Supabase SQL Editor for a manual one-off apply.
--
-- Naming convention for anything added later: NNNN_short_description.sql,
-- numbered in order, never edited after it's been applied anywhere — a
-- schema change ships as a NEW migration file, the same discipline any
-- team running Postgres in production follows so every environment's
-- history stays replayable and auditable.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive email/username comparisons at the DB level

-- ============================================================
-- Shared trigger: keep updated_at current on every UPDATE
-- ============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- users
-- ============================================================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,
  email citext not null unique,
  password text not null,
  role text not null default 'user' check (role in ('user', 'artist')),
  is_verified boolean not null default false,
  otp_hash text,
  otp_purpose text check (otp_purpose in ('verify-email', 'reset-password')),
  otp_expiry timestamptz,
  failed_login_attempts int not null default 0 check (failed_login_attempts >= 0),
  lock_until timestamptz,
  token_version int not null default 0 check (token_version >= 0),
  age int check (age is null or (age >= 0 and age <= 150)),
  accepted_terms boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table users is 'App accounts. Password authentication and JWT sessions are handled entirely by the backend.';
comment on column users.otp_purpose is 'Which flow the current otp_hash belongs to; reset-password OTPs are emailed via Brevo/Resend.';

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

-- ============================================================
-- tracks (was "music")
-- ============================================================
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  artist_id uuid not null references users(id) on delete cascade,
  source text not null default 'upload' check (source in ('upload', 'youtube')),
  uri text,                     -- Supabase Storage public URL, required when source = 'upload'
  youtube_video_id text,        -- required when source = 'youtube'
  thumbnail text,
  channel_title text,
  play_count int not null default 0 check (play_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uri_or_youtube check (
    (source = 'upload' and uri is not null) or
    (source = 'youtube' and youtube_video_id is not null)
  )
);

comment on table tracks is 'Shared library of playable tracks — either an uploaded audio file (Supabase Storage) or a YouTube video someone added via Online Search. One row per YouTube video app-wide (see tracks_youtube_video_id_unique) so multiple users adding the same song never duplicates it.';

create trigger tracks_set_updated_at
  before update on tracks
  for each row execute function set_updated_at();

create unique index if not exists tracks_youtube_video_id_unique
  on tracks (youtube_video_id) where source = 'youtube';

create index if not exists idx_tracks_artist on tracks (artist_id);
create index if not exists idx_tracks_source on tracks (source);
create index if not exists idx_tracks_created_at on tracks (created_at desc);

-- ============================================================
-- albums
-- ============================================================
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  artist_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger albums_set_updated_at
  before update on albums
  for each row execute function set_updated_at();

create index if not exists idx_albums_artist on albums (artist_id);

create table if not exists album_tracks (
  album_id uuid not null references albums(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (album_id, track_id)
);

create index if not exists idx_album_tracks_album on album_tracks (album_id);
create index if not exists idx_album_tracks_track on album_tracks (track_id);

-- ============================================================
-- likes
-- ============================================================
create table if not exists likes (
  user_id uuid not null references users(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create index if not exists idx_likes_user on likes (user_id);
create index if not exists idx_likes_track on likes (track_id);

-- ============================================================
-- recently_played
-- ============================================================
create table if not exists recently_played (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  played_at timestamptz not null default now()
);

create index if not exists idx_recently_played_user on recently_played (user_id, played_at desc);
create index if not exists idx_recently_played_track on recently_played (track_id);

-- ============================================================
-- Row Level Security — defense in depth
-- ============================================================
-- The backend talks to Postgres with the SERVICE ROLE key only; the
-- service role bypasses RLS entirely regardless of policies, so nothing
-- below changes how the app behaves today. What it does do: if the anon
-- key were ever accidentally shipped to the frontend, or a future
-- teammate wires up a client-side Supabase call without thinking it
-- through, these tables stay completely inaccessible by default instead
-- of silently exposing every user's data. No policies are defined for
-- anon/authenticated on purpose — add one explicitly, deliberately, the
-- day the app actually needs direct client-to-Supabase access.
alter table users enable row level security;
alter table tracks enable row level security;
alter table albums enable row level security;
alter table album_tracks enable row level security;
alter table likes enable row level security;
alter table recently_played enable row level security;
