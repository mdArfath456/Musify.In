-- ============================================================
-- 0004_add_reset_password_otp
-- Re-enables password-reset OTPs for the explicit mobile OTP flow
-- while keeping the web reset link flow untouched.
-- ============================================================

alter table users drop constraint if exists users_otp_purpose_check;
alter table users
  add constraint users_otp_purpose_check
  check (otp_purpose in ('verify-email', 'first-login', 'reset-password'));

comment on column users.otp_purpose is 'Which flow the current otp_hash belongs to: verify-email, first-login, or reset-password. The mobile reset flow reuses the same OTP fields instead of creating a second auth table.';
