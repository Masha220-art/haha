
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  login          VARCHAR(64)  NOT NULL UNIQUE,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(255) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  role           VARCHAR(32)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id       INTEGER NOT NULL REFERENCES courses (id) ON DELETE RESTRICT,
  start_date      DATE NOT NULL,
  payment_method  VARCHAR(32) NOT NULL CHECK (payment_method IN ('cash', 'phone_transfer')),
  status          VARCHAR(32) NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'in_progress', 'completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);

CREATE TABLE IF NOT EXISTS reviews (
  id                  SERIAL PRIMARY KEY,
  application_id      INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  user_id             INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rating              SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body                TEXT NOT NULL,
  moderation_status   VARCHAR(32) NOT NULL DEFAULT 'pending'
                      CHECK (moderation_status IN ('pending', 'published', 'rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_mod ON reviews (moderation_status);

CREATE TABLE IF NOT EXISTS "session" (
  "sid"    VARCHAR NOT NULL COLLATE "default",
  "sess"   JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

CREATE OR REPLACE FUNCTION set_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applications_updated ON applications;
CREATE TRIGGER trg_applications_updated
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION set_applications_updated_at();
