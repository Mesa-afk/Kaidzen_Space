import { ApiError } from "./validation/errors";

/**
 * Процесс-локальный ограничитель попыток входа/регистрации
 * (анти-брутфорс). Для мульти-инстанс продакшена заменить на
 * распределённый атомарный стор — как и demoRateLimit рядом.
 */

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_ATTEMPTS = 5;

type Counter = { count: number; expiresAt: number };

const loginFailures = new Map<string, Counter>();
const registerAttempts = new Map<string, Counter>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded && forwarded.length <= 64 ? forwarded : "anonymous";
}

function bump(map: Map<string, Counter>, key: string, windowMs: number, now: number): Counter {
  const current = map.get(key);
  if (!current || current.expiresAt <= now) {
    const fresh = { count: 1, expiresAt: now + windowMs };
    map.set(key, fresh);
    return fresh;
  }
  current.count += 1;
  return current;
}

export function loginThrottleKey(request: Request, email: string): string {
  return `${clientIp(request)}:${email.trim().toLowerCase()}`;
}

export function assertLoginAllowed(key: string, now = Date.now()): void {
  const current = loginFailures.get(key);
  if (current && current.expiresAt > now && current.count >= LOGIN_MAX_FAILURES) {
    throw new ApiError("AUTH_TOO_MANY_ATTEMPTS", "Too many failed attempts. Try again later.", 429);
  }
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  bump(loginFailures, key, LOGIN_WINDOW_MS, now);
}

export function clearLoginFailures(key: string): void {
  loginFailures.delete(key);
}

export function assertAndRecordRegisterAttempt(request: Request, now = Date.now()): void {
  const counter = bump(registerAttempts, clientIp(request), REGISTER_WINDOW_MS, now);
  if (counter.count > REGISTER_MAX_ATTEMPTS) {
    throw new ApiError("AUTH_TOO_MANY_ATTEMPTS", "Too many attempts. Try again later.", 429);
  }
}

/** Только для тестов. */
export function resetAuthRateLimit(): void {
  loginFailures.clear();
  registerAttempts.clear();
}
