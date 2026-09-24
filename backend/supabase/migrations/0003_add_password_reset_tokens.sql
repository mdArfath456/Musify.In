-- ============================================================
-- 0003_add_password_reset_tokens
-- Replace password-reset OTPs with short-lived single-use tokens.
-- ============================================================

alter table users
  add COLUMN if not exists reset_token_hash text,
  add column if not exists reset_token_expires_at timestamptz;

alter table users drop constraint if exists users_otp_purpose_check;
alter table users
  add constraint users_otp_purpose_check
  check (otp_purpose in ('verify-email', 'first-login'));

comment on column users.reset_token_hash is 'SHA-256 hash of the one-time password reset token.';
comment on column users.reset_token_expires_at is 'Expiry timestamp for the one-time password reset token.';
comment on column users.otp_purpose is 'Which OTP flow the current otp_hash belongs to: verify-email or first-login.';
