import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Серверная SQLite-база (встроенный node:sqlite, без зависимостей).
 * Файл по умолчанию: ./data/kaizen.db от корня проекта, путь можно
 * переопределить серверной переменной KAIZEN_DB_PATH.
 * Каталог data/ в .gitignore — в git база не попадает.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_data_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`;

export function createDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  return db;
}

export function defaultDatabasePath(): string {
  return process.env.KAIZEN_DB_PATH ?? join(process.cwd(), "data", "kaizen.db");
}

type DatabaseGlobal = typeof globalThis & { __kaizenDatabase?: DatabaseSync };

/** Синглтон подключения; переживает HMR-перезагрузки dev-сервера. */
export function getDatabase(): DatabaseSync {
  const globalRef = globalThis as DatabaseGlobal;
  globalRef.__kaizenDatabase ??= createDatabase(defaultDatabasePath());
  return globalRef.__kaizenDatabase;
}
