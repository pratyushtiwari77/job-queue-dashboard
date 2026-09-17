import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || './db.sqlite';
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_status_history (
    id TEXT PRIMARY KEY,
    jobId TEXT NOT NULL,
    fromStatus TEXT NOT NULL,
    toStatus TEXT NOT NULL,
    changedAt TEXT NOT NULL
  );
`);

export default db;
