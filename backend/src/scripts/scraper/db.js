import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../../../../scraper.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS scraping_runs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT,
    start_time  TEXT NOT NULL,
    end_time    TEXT
  );

  CREATE TABLE IF NOT EXISTS results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      INTEGER NOT NULL REFERENCES scraping_runs(id),
    tag         TEXT,
    title       TEXT,
    description TEXT,
    url         TEXT,
    email       TEXT,
    phones      TEXT,
    facebook    TEXT,
    instagram   TEXT,
    twitter     TEXT,
    linkedin    TEXT,
    meta        TEXT
  );
`);

// Migrate existing databases that predate the name column
try {
  db.exec('ALTER TABLE scraping_runs ADD COLUMN name TEXT');
} catch (_) {
  // column already exists — safe to ignore
}

export const createRun = (name) => {
  const result = db
    .prepare('INSERT INTO scraping_runs (name, start_time) VALUES (?, ?)')
    .run(name ?? null, new Date().toISOString());
  return result.lastInsertRowid;
};

export const finalizeRun = (runId) => {
  db.prepare('UPDATE scraping_runs SET end_time = ? WHERE id = ?').run(new Date().toISOString(), runId);
};

export const insertResult = (runId, record) => {
  db.prepare(`
    INSERT INTO results (run_id, tag, title, description, url, email, phones, facebook, instagram, twitter, linkedin, meta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    runId,
    record.tag ?? null,
    record.title ?? null,
    record.description ?? null,
    record.url ?? null,
    record.email ?? null,
    record.phones ?? null,
    record.facebook ?? null,
    record.instagram ?? null,
    record.twitter ?? null,
    record.linkedin ?? null,
    record.meta ?? null,
  );
};

export default db;
