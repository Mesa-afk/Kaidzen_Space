import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/lib/server/db";
import {
  createSession,
  createUser,
  deleteSession,
  getSessionUser,
  updateUserProfile,
  verifyCredentials,
} from "./auth-service";
import {
  assertLoginAllowed,
  recordLoginFailure,
  resetAuthRateLimit,
} from "@/lib/server/auth-rate-limit";

let dir: string;
let db: DatabaseSync;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "kaizen-auth-test-"));
  db = createDatabase(join(dir, "test.db"));
  resetAuthRateLimit();
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("auth service (SQLite)", () => {
  it("creates a user with scrypt hash, never plaintext", async () => {
    const user = await createUser(db, { name: "Аня", email: "A@B.co", password: "secret1" });

    expect(user.email).toBe("a@b.co");
    expect(user.avatarDataUrl).toBeNull();
    const row = db.prepare("SELECT password_hash FROM users WHERE email = ?").get("a@b.co") as { password_hash: string };
    expect(row.password_hash.startsWith("scrypt$")).toBe(true);
    expect(row.password_hash).not.toContain("secret1");
  });

  it("rejects duplicate email with 409 AUTH_EMAIL_TAKEN", async () => {
    await createUser(db, { name: "Аня", email: "a@b.co", password: "secret1" });
    await expect(createUser(db, { name: "Борис", email: "A@b.co", password: "secret2" }))
      .rejects.toMatchObject({ code: "AUTH_EMAIL_TAKEN", status: 409 });
  });

  it("verifies credentials; wrong password and unknown email both return null", async () => {
    await createUser(db, { name: "Аня", email: "a@b.co", password: "secret1" });

    expect((await verifyCredentials(db, "a@b.co", "secret1"))?.name).toBe("Аня");
    expect(await verifyCredentials(db, "a@b.co", "wrong-pass")).toBeNull();
    expect(await verifyCredentials(db, "ghost@b.co", "secret1")).toBeNull();
  });

  it("session lifecycle: create, resolve user, expire, delete", async () => {
    const user = await createUser(db, { name: "Аня", email: "a@b.co", password: "secret1" });
    const { token } = createSession(db, user.id);

    expect(getSessionUser(db, token)?.id).toBe(user.id);
    expect(getSessionUser(db, "not-a-token")).toBeNull();
    expect(getSessionUser(db, undefined)).toBeNull();

    // Истёкшая сессия не работает и подчищается.
    db.prepare("UPDATE sessions SET expires_at = ?").run(new Date(Date.now() - 1000).toISOString());
    expect(getSessionUser(db, token)).toBeNull();

    const second = createSession(db, user.id);
    deleteSession(db, second.token);
    expect(getSessionUser(db, second.token)).toBeNull();
  });

  it("updates nickname and avatar in profile", async () => {
    const user = await createUser(db, { name: "Аня", email: "a@b.co", password: "secret1" });

    const renamed = updateUserProfile(db, user.id, { name: "Анна" });
    expect(renamed.name).toBe("Анна");

    const withAvatar = updateUserProfile(db, user.id, { avatarDataUrl: "data:image/jpeg;base64,AAA=" });
    expect(withAvatar.avatarDataUrl).toContain("data:image/jpeg");

    const cleared = updateUserProfile(db, user.id, { avatarDataUrl: null });
    expect(cleared.avatarDataUrl).toBeNull();
    expect(cleared.name).toBe("Анна");
  });
});

describe("auth rate limit", () => {
  it("blocks after 10 failed login attempts", () => {
    const key = "127.0.0.1:a@b.co";
    for (let i = 0; i < 10; i += 1) recordLoginFailure(key);
    expect(() => assertLoginAllowed(key)).toThrowError(/Too many/);
  });

  it("allows attempts below the threshold", () => {
    const key = "127.0.0.2:a@b.co";
    recordLoginFailure(key);
    expect(() => assertLoginAllowed(key)).not.toThrow();
  });
});
