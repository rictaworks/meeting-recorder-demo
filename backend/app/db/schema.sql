CREATE TABLE IF NOT EXISTS system_config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO system_config (key, value) VALUES ('maintenance_mode', '0');

CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL REFERENCES sessions(id),
    title        TEXT NOT NULL DEFAULT '',
    recorded_at  DATETIME NOT NULL DEFAULT (datetime('now')),
    audio_path   TEXT NOT NULL DEFAULT '',
    duration_sec INTEGER NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'recording',
    created_at   DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transcripts (
    id               TEXT PRIMARY KEY,
    meeting_id       TEXT NOT NULL REFERENCES meetings(id),
    session_id       TEXT NOT NULL REFERENCES sessions(id),
    raw_text         TEXT NOT NULL DEFAULT '',
    edited_text      TEXT,
    vosk_confidence  REAL NOT NULL DEFAULT 0.0,
    created_at       DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at       DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS minutes (
    id           TEXT PRIMARY KEY,
    meeting_id   TEXT NOT NULL REFERENCES meetings(id),
    session_id   TEXT NOT NULL REFERENCES sessions(id),
    section_type TEXT NOT NULL,
    content      TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS todos (
    id          TEXT PRIMARY KEY,
    meeting_id  TEXT NOT NULL REFERENCES meetings(id),
    session_id  TEXT NOT NULL REFERENCES sessions(id),
    todo_text   TEXT NOT NULL DEFAULT '',
    due_keyword TEXT,
    is_checked  INTEGER NOT NULL DEFAULT 0,
    is_manual   INTEGER NOT NULL DEFAULT 0,
    is_deleted  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS summaries (
    id           TEXT PRIMARY KEY,
    meeting_id   TEXT NOT NULL REFERENCES meetings(id),
    session_id   TEXT NOT NULL REFERENCES sessions(id),
    summary_text TEXT NOT NULL DEFAULT '',
    created_at   DATETIME NOT NULL DEFAULT (datetime('now'))
);
