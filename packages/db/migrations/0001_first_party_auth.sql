BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash varchar,
  ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'operator',
  ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

ALTER TABLE sessions
  ALTER COLUMN expire TYPE timestamptz
  USING expire AT TIME ZONE 'UTC';

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

COMMIT;
