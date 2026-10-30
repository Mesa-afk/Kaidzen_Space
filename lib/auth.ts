/**
 * Локальные аккаунты Kaizen Space.
 *
 * Бэкенда с пользователями у приложения нет: все данные (роудмапы,
 * прогресс, профиль) живут в localStorage через zustand-persist.
 * Аккаунты устроены так же — запись по email + SHA-256 хэш пароля
 * (пароль в открытом виде нигде не хранится). Это не замена серверной
 * авторизации, а персональный профиль на этом устройстве.
 */

export type AccountRecord = {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type AccountsMap = Record<string, AccountRecord>;

export type AuthResult =
  | { ok: true; account: AccountRecord }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Имя должно быть не короче 2 символов.";
  if (trimmed.length > 30) return "Имя должно быть не длиннее 30 символов.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_PATTERN.test(normalizeEmail(email))) {
    return "Введите корректный email, например name@example.com.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "Пароль должен быть не короче 6 символов.";
  if (password.length > 72) return "Пароль должен быть не длиннее 72 символов.";
  return null;
}

export function validateRegistration(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  return (
    validateName(input.name)
    ?? validateEmail(input.email)
    ?? validatePassword(input.password)
    ?? (input.password !== input.confirmPassword ? "Пароли не совпадают." : null)
  );
}

export function validateLoginInput(input: { email: string; password: string }): string | null {
  if (validateEmail(input.email)) return validateEmail(input.email);
  if (!input.password) return "Введите пароль.";
  return null;
}

/** SHA-256 (с доменной солью) в hex. Fallback — FNV-1a, если SubtleCrypto недоступен. */
export async function hashPassword(password: string): Promise<string> {
  const payload = `kaizen-space\0${password}`;
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(payload));
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16)}`;
}

export function tryRegister(
  accounts: AccountsMap,
  input: { name: string; email: string; passwordHash: string },
): AuthResult {
  const email = normalizeEmail(input.email);
  if (accounts[email]) {
    return { ok: false, error: "Аккаунт с таким email уже существует — войдите в него." };
  }
  const account: AccountRecord = {
    name: input.name.trim(),
    email,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  return { ok: true, account };
}

export function tryLogin(
  accounts: AccountsMap,
  email: string,
  passwordHash: string,
): AuthResult {
  const account = accounts[normalizeEmail(email)];
  if (!account || account.passwordHash !== passwordHash) {
    return { ok: false, error: "Неверный email или пароль." };
  }
  return { ok: true, account };
}
