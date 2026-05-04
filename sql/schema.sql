

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(255) NOT NULL,
  role           VARCHAR(32)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  item_id     INTEGER NOT NULL REFERENCES items (id) ON DELETE RESTRICT,
  status      VARCHAR(32) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_user ON entries (user_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries (status);

CREATE TABLE IF NOT EXISTS ratings (
  id                  SERIAL PRIMARY KEY,
  entry_id            INTEGER NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
  user_id             INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rating              SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body                TEXT NOT NULL,
  moderation_status   VARCHAR(32) NOT NULL DEFAULT 'pending'
                      CHECK (moderation_status IN ('pending', 'published', 'rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_mod ON ratings (moderation_status);

CREATE TABLE IF NOT EXISTS "session" (
  "sid"    VARCHAR NOT NULL COLLATE "default",
  "sess"   JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

CREATE OR REPLACE FUNCTION set_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entries_updated ON entries;
CREATE TRIGGER trg_entries_updated
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION set_entries_updated_at();
