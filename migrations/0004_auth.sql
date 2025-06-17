CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified INTEGER,
  image TEXT
);

CREATE TABLE IF NOT EXISTS account (
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  FOREIGN KEY(userId) REFERENCES user(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS session (
  sessionToken TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expires INTEGER NOT NULL,
  FOREIGN KEY(userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verificationToken (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS authenticator (
  credentialID TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  credentialPublicKey TEXT NOT NULL,
  counter INTEGER NOT NULL,
  credentialDeviceType TEXT NOT NULL,
  credentialBackedUp INTEGER NOT NULL,
  transports TEXT,
  FOREIGN KEY(userId) REFERENCES user(id) ON DELETE CASCADE,
  PRIMARY KEY (userId, credentialID)
);
