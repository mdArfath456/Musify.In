-- Musify — Supabase Postgres schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Replaces the old MongoDB collections: users, music, albums.
--
-- Access model: this app has NO Supabase Auth / anon-key client access —
-- the Express backend talks to Postgres using the SERVICE ROLE key only,
-- so Row Level Security is left disabled (the backend is the only caller,
-- same trust boundary you had with Mongoose + a private Mongo URI).

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ---------- users ----------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password text not null,
  role text not null default 'user' check (role in ('user', 'artist')),
  is_verified boolean not null default false,
  otp_hash text,
  otp_purpose text check (otp_purpose in ('verify-email', 'reset-password')),
  otp_expiry timestamptz,
  failed_login_attempts int not null default 0,
  lock_until timestamptz,
  token_version int not null default 0,
  age int,
  accepted_terms boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- tracks (was "music") ----------
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid not null references users(id) on delete cascade,
  source text not null default 'upload' check (source in ('upload', 'youtube')),
  uri text,                     -- Supabase Storage public URL, required when source = 'upload'
  youtube_video_id text,        -- required when source = 'youtube'
  thumbnail text,               -- YouTube thumbnail URL, null for uploads
  channel_title text,           -- YouTube channel name, null for uploads
  play_count int not null default 0,
  created_at timestamptz not null default now(),
  constraint uri_or_youtube check (
    (source = 'upload' and uri is not null) or
    (source = 'youtube' and youtube_video_id is not null)
  )
);

-- A given YouTube video should only ever exist once in the shared library.
create unique index if not exists tracks_youtube_video_id_unique
  on tracks (youtube_video_id) where source = 'youtube';

-- ---------- albums ----------
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists album_tracks (
  album_id uuid not null references albums(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  primary key (album_id, track_id)
);

-- ---------- likes ----------
create table if not exists likes (
  user_id uuid not null references users(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

-- ---------- recently played ----------
create table if not exists recently_played (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  played_at timestamptz not null default now()
);

create index if not exists idx_tracks_artist on tracks (artist_id);
create index if not exists idx_album_tracks_album on album_tracks (album_id);
create index if not exists idx_likes_user on likes (user_id);
create index if not exists idx_recently_played_user on recently_played (user_id, played_at desc);
