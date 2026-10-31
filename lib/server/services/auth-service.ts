import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { DatabaseSync } from "node:sqlite";
import { normalizeEmail } from "@/lib/auth";
import { getDatabase } from "@/lib/server/db";
import { ApiError } from "@/lib/server/validation/errors";

/**
 * Серверная авторизация: пользователи в SQLite (lib/server/db.ts),
 * пароли — scrypt с персональной солью, сессии — случайные токены,
 * в БД хранится только SHA-256 хэш токена, клиенту — httpOnly cookie.
 */

export const SESSION_COOKIE_NAME = "kaizen_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  avatarDataUrl: string | null;
  createdAt: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar_data_url: string | null;
  created_at: string;
};

const scryptAsync = promisify(scrypt);
const SCRYPT_KEY_LENGTH = 32;
// Фиктивный хэш для выравнивания времени ответа, когда пользователя нет:
// проверка пароля всё равно выполняет scrypt и не выдаёт существование email.
const DUMMY_STORED_HASH = `scrypt$${"0".repeat(32)}$${"0".repeat(SCRYPT_KEY_LENGTH * 2)}`;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(password, Buffer.from(saltHex, "hex"), SCRYPT_KEY_LENGTH)) as Buffer;
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarDataUrl: row.avatar_data_url,
    createdAt: row.created_at,
  };
}

function findUserByEmail(db: DatabaseSync, email: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
}

export async function createUser(
  db: DatabaseSync,
  input: { name: string; email: string; password: string },
): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  if (findUserByEmail(db, email)) {
    throw new ApiError("AUTH_EMAIL_TAKEN", "An account with this email already exists", 409);
  }

  const row: UserRow = {
    id: randomUUID(),
    name: input.name.trim(),
    email,
    password_hash: await hashPassword(input.password),
    avatar_data_url: null,
    created_at: new Date().toISOString(),
  };

  try {
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, avatar_data_url, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(row.id, row.name, row.email, row.password_hash, row.avatar_data_url, row.created_at);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new ApiError("AUTH_EMAIL_TAKEN", "An account with this email already exists", 409);
    }
    throw error;
  }
  return toPublicUser(row);
}

export async function verifyCredentials(
  db: DatabaseSync,
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const row = findUserByEmail(db, normalizeEmail(email));
  const matches = await verifyPassword(password, row?.password_hash ?? DUMMY_STORED_HASH);
  return row && matches ? toPublicUser(row) : null;
}

export function getUserById(db: DatabaseSync, id: string): PublicUser | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? toPublicUser(row) : null;
}

export function updateUserProfile(
  db: DatabaseSync,
  userId: string,
  patch: { name?: string; avatarDataUrl?: string | null },
): PublicUser {
  if (patch.name !== undefined) {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(patch.name.trim(), userId);
  }
  if (patch.avatarDataUrl !== undefined) {
    db.prepare("UPDATE users SET avatar_data_url = ? WHERE id = ?").run(patch.avatarDataUrl, userId);
  }
  const user = getUserById(db, userId);
  if (!user) throw new ApiError("AUTH_REQUIRED", "Authentication required", 401);
  return user;
}

/* ---------------- Сессии ---------------- */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(db: DatabaseSync, userId: string): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  db.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(hashToken(token), userId, now.toISOString(), expiresAt);
  return { token, expiresAt };
}

export function getSessionUser(db: DatabaseSync, token: string | undefined): PublicUser | null {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = db.prepare(
    "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?",
  ).get(tokenHash) as (UserRow & { expires_at?: string }) | undefined;
  if (!row) return null;

  const session = db.prepare("SELECT expires_at FROM sessions WHERE token_hash = ?")
    .get(tokenHash) as { expires_at: string } | undefined;
  if (!session || session.expires_at <= new Date().toISOString()) {
    deleteSession(db, token);
    return null;
  }
  return toPublicUser(row);
}

export function deleteSession(db: DatabaseSync, token: string | undefined): void {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

/* ---------------- HTTP: cookie и текущий пользователь ---------------- */

export function readSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) {
      const value = valueParts.join("=").trim();
      return value ? decodeURIComponent(value) : undefined;
    }
  }
  return undefined;
}

function isSecureRequest(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (proto) return proto === "https";
  return request.url.startsWith("https://");
}

function sessionCookieAttributes(request: Request): string[] {
  // Приложение может открываться в iframe на чужом домене (превью песочницы:
  // arena.ai -> sbx-*.arena.site) — браузеры отклоняют там SameSite=Lax.
  // На https используем SameSite=None + Secure + Partitioned (CHIPS):
  // работает и в межсайтовом iframe, и в обычной вкладке. На http
  // (локальная разработка) None без Secure запрещён — остаёмся на Lax.
  return isSecureRequest(request)
    ? ["SameSite=None", "Secure", "Partitioned"]
    : ["SameSite=Lax"];
}

export function buildSessionCookie(request: Request, token: string): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    ...sessionCookieAttributes(request),
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ].join("; ");
}

export function buildClearSessionCookie(request: Request): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    ...sessionCookieAttributes(request),
    "Max-Age=0",
  ].join("; ");
}

export function requireUser(request: Request, db: DatabaseSync = getDatabase()): PublicUser {
  const user = getSessionUser(db, readSessionToken(request));
  if (!user) throw new ApiError("AUTH_REQUIRED", "Authentication required", 401);
  return user;
}
