/**
 * Валидация полей авторизации (клиентская форма + normalizeEmail для сервера).
 * Сами аккаунты, пароли и сессии живут на сервере:
 * lib/server/services/auth-service.ts, маршруты app/api/auth/*.
 */

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
