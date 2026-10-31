"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKaizenStore } from "@/lib/store";
import {
  ApiClientError,
  fetchMeApi,
  loginApi,
  logoutApi,
  registerApi,
  updateProfileApi,
} from "@/lib/api-client";
import { validateLoginInput, validateRegistration } from "@/lib/auth";
import type { AuthPublicUser } from "@/lib/api-schemas";

type AuthFormProps = {
  mode: "login" | "register";
};

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {hidden && <path d="M4 4l16 16" />}
    </svg>
  );
}

/** Серверные коды ошибок — в понятные русские сообщения формы. */
function authErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case "AUTH_INVALID_CREDENTIALS":
        return "Неверный email или пароль.";
      case "AUTH_EMAIL_TAKEN":
        return "Аккаунт с таким email уже существует — войдите в него.";
      case "AUTH_TOO_MANY_ATTEMPTS":
        return "Слишком много попыток. Подождите немного и попробуйте снова.";
      case "VALIDATION_ERROR":
        return "Проверьте введённые данные.";
      default:
        break;
    }
  }
  return "Что-то пошло не так. Попробуйте ещё раз.";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const setAuthUser = useKaizenStore((state) => state.setAuthUser);

  // undefined — проверяем серверную сессию; null — не вошёл.
  const [existingUser, setExistingUser] = useState<AuthPublicUser | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    let cancelled = false;
    fetchMeApi()
      .then((user) => {
        if (!cancelled) setExistingUser(user);
      })
      .catch(() => {
        if (!cancelled) setExistingUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const validationError = isLogin
      ? validateLoginInput({ email, password })
      : validateRegistration({ name, email, password, confirmPassword });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const user = isLogin
        ? await loginApi({ email, password })
        : await registerApi({ name, email, password });

      // Одноразовый перенос локального аватара времён клиентских аккаунтов:
      // если на сервере аватара ещё нет, а в этом браузере он был — загрузим.
      const localAvatar = useKaizenStore.getState().avatarDataUrl;
      setAuthUser(user);
      if (!user.avatarDataUrl && localAvatar) {
        updateProfileApi({ avatarDataUrl: localAvatar })
          .then((updated) => setAuthUser(updated))
          .catch(() => undefined);
      }

      router.push("/");
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Даже если сервер недоступен, локально выходим и показываем форму.
    }
    setAuthUser(null);
    setExistingUser(null);
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-brand" aria-label="Kaizen Space — на главную">
          <span className="opus-brand-mark" aria-hidden="true">К</span>
          <span>Kaizen Space</span>
        </Link>

        {existingUser === undefined ? (
          <p className="auth-subtitle">Загрузка…</p>
        ) : existingUser ? (
          <>
            <h1 className="auth-title">Вы уже вошли</h1>
            <p className="auth-subtitle">
              {existingUser.name} · {existingUser.email}
            </p>
            <div className="auth-actions">
              <Link href="/" className="btn btn-primary">
                На главную
              </Link>
              <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                Выйти из аккаунта
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="auth-title">{isLogin ? "С возвращением" : "Создать аккаунт"}</h1>
            <p className="auth-subtitle">
              {isLogin
                ? "Войдите, чтобы продолжить свой путь маленькими шагами."
                : "Пара полей — и ваш профиль, аватар и прогресс будут под одним именем."}
            </p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className="auth-field">
                  <label htmlFor="auth-name">Имя</label>
                  <input
                    id="auth-name"
                    className="input"
                    type="text"
                    autoComplete="name"
                    placeholder="Как к вам обращаться"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={30}
                    autoFocus
                  />
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoFocus={isLogin}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="auth-password">Пароль</label>
                <div className="auth-password-wrap">
                  <input
                    id="auth-password"
                    className="input"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder={isLogin ? "Ваш пароль" : "Минимум 6 символов"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="auth-field">
                  <label htmlFor="auth-confirm">Повторите пароль</label>
                  <input
                    id="auth-confirm"
                    className="input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Ещё раз тот же пароль"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
                {submitting ? "Секунду…" : isLogin ? "Войти" : "Зарегистрироваться"}
              </button>
            </form>

            <p className="auth-switch">
              {isLogin ? (
                <>Нет аккаунта? <Link href="/register">Зарегистрироваться</Link></>
              ) : (
                <>Уже есть аккаунт? <Link href="/login">Войти</Link></>
              )}
            </p>

            <p className="auth-note">
              Аккаунт хранится на сервере приложения, пароль — только в виде
              scrypt-хэша. Сессия держится в защищённой httpOnly-куке.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
