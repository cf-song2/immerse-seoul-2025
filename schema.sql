-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  is_verified INTEGER DEFAULT 0,
  verification_token TEXT
);

-- Sessions table (backup for KV)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Images table with user association
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_public BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User rate limiting
CREATE TABLE IF NOT EXISTS user_rate_limits (
  user_id TEXT PRIMARY KEY,
  daily_count INTEGER DEFAULT 0,
  last_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_session_token ON sessions(token);
CREATE INDEX idx_image_user ON images(user_id);
CREATE INDEX idx_image_created ON images(created_at DESC);
CREATE INDEX idx_image_public ON images(is_public);