CREATE TABLE notes_next (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  type TEXT NOT NULL,
  body TEXT,
  file_key TEXT,
  file_size INTEGER,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

INSERT INTO notes_next (
  id,
  room_id,
  type,
  body,
  file_key,
  file_size,
  created_at,
  expires_at
)
SELECT
  id,
  room_id,
  CASE
    WHEN kind = 'file' THEN COALESCE(file_type, 'application/octet-stream')
    ELSE 'text/plain'
  END AS type,
  CASE
    WHEN kind = 'file' THEN COALESCE(file_name, body, 'file.bin')
    ELSE body
  END AS body,
  file_key,
  file_size,
  created_at,
  expires_at
FROM notes;

DROP TABLE notes;
ALTER TABLE notes_next RENAME TO notes;

CREATE INDEX idx_notes_room_created ON notes (room_id, created_at);
CREATE INDEX idx_notes_expires ON notes (expires_at);
