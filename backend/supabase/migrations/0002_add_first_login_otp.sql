-- ============================================================
-- 0002_add_first_login_otp
-- Adds first-login OTP verification (distinct from email verification
-- at registration) and OTP attempt/lockout tracking.
-- ============================================================

alter table users
  add column if not exists first_login_verified boolean not null default false;

alter table users
  add column if not exists otp_attempts int not null default 0 check (otp_attempts >= 0);

-- Widen the otp_purpose enum to include the new "first-login" purpose.
alter table users drop constraint if exists users_otp_purpose_check;
alter table users
  add constraint users_otp_purpose_check
  check (otp_purpose in ('verify-email', 'first-login', 'reset-password'));

comment on column users.first_login_verified is 'Set true once the user has completed the one-time first-login OTP check, in addition to registration email verification.';
comment on column users.otp_attempts is 'Failed verification attempts against the current otp_hash; reset to 0 whenever a new OTP is issued or verification succeeds.';
comment on column users.otp_purpose is 'Which flow the current otp_hash belongs to: verify-email (registration), first-login (one-time post-registration login check), or reset-password. Emailed via EmailJS.';
