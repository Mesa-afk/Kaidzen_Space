import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  validateLoginInput,
  validateRegistration,
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

  it("validates login input", () => {
    expect(validateLoginInput({ email: "bad", password: "x" })).toMatch(/email/);
    expect(validateLoginInput({ email: "a@b.co", password: "" })).toMatch(/пароль/);
    expect(validateLoginInput({ email: "a@b.co", password: "x" })).toBeNull();
  });
});
