import { describe, expect, it } from "vitest";
import {
  hashPassword,
  normalizeEmail,
  tryLogin,
  tryRegister,
  validateLoginInput,
  validateRegistration,
  type AccountsMap,
} from "./auth";

describe("auth validation", () => {
  it("normalizes email case and spaces", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("rejects invalid registration input", () => {
    expect(validateRegistration({
      name: "Я", email: "a@b.co", password: "secret1", confirmPassword: "secret1",
    })).toMatch(/Имя/);
    expect(validateRegistration({
      name: "Аня", email: "not-email", password: "secret1", confirmPassword: "secret1",
    })).toMatch(/email/);
    expect(validateRegistration({
      name: "Аня", email: "a@b.co", password: "123", confirmPassword: "123",
    })).toMatch(/Пароль/);
    expect(validateRegistration({
      name: "Аня", email: "a@b.co", password: "secret1", confirmPassword: "secret2",
    })).toMatch(/не совпадают/);
    expect(validateRegistration({
      name: "Аня", email: "a@b.co", password: "secret1", confirmPassword: "secret1",
    })).toBeNull();
  });

  it("validates login input without leaking which field is wrong later", () => {
    expect(validateLoginInput({ email: "bad", password: "x" })).toMatch(/email/);
    expect(validateLoginInput({ email: "a@b.co", password: "" })).toMatch(/пароль/);
    expect(validateLoginInput({ email: "a@b.co", password: "x" })).toBeNull();
  });
});

describe("auth accounts", () => {
  it("hashes passwords deterministically and never returns plaintext", async () => {
    const hashA = await hashPassword("secret1");
    const hashB = await hashPassword("secret1");
    const other = await hashPassword("secret2");

    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(other);
    expect(hashA).not.toContain("secret1");
  });

  it("registers once and rejects duplicates (case-insensitive email)", async () => {
    const passwordHash = await hashPassword("secret1");
    const first = tryRegister({}, { name: "Аня", email: "A@B.co", passwordHash });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const accounts: AccountsMap = { [first.account.email]: first.account };
    const duplicate = tryRegister(accounts, { name: "Аня", email: "a@b.co", passwordHash });
    expect(duplicate.ok).toBe(false);
  });

  it("logs in with correct password and rejects wrong one with generic error", async () => {
    const passwordHash = await hashPassword("secret1");
    const registered = tryRegister({}, { name: "Аня", email: "a@b.co", passwordHash });
    if (!registered.ok) throw new Error("setup failed");
    const accounts: AccountsMap = { [registered.account.email]: registered.account };

    expect(tryLogin(accounts, "A@B.co", passwordHash).ok).toBe(true);

    const wrongPassword = tryLogin(accounts, "a@b.co", await hashPassword("nope123"));
    expect(wrongPassword).toEqual({ ok: false, error: "Неверный email или пароль." });

    const unknownUser = tryLogin(accounts, "ghost@b.co", passwordHash);
    expect(unknownUser).toEqual({ ok: false, error: "Неверный email или пароль." });
  });
});
