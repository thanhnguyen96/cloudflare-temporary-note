CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('text', 'file')),
  body TEXT,
  file_key TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_room_created ON notes (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notes_expires ON notes (expires_at);

