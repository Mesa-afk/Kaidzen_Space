"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKaizenStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  hashPassword,
  tryLogin,
  tryRegister,
  validateLoginInput,
  validateRegistration,
} from "@/lib/auth";

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

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const currentUserEmail = useKaizenStore((state) => state.currentUserEmail);
  const userName = useKaizenStore((state) => state.userName);
  const logoutAccount = useKaizenStore((state) => state.logoutAccount);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

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
      const passwordHash = await hashPassword(password);
      const state = useKaizenStore.getState();

      if (isLogin) {
        const result = tryLogin(state.accounts, email, passwordHash);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        state.loginAccount(result.account);
      } else {
        const result = tryRegister(state.accounts, { name, email, passwordHash });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        state.registerAccount(result.account);
      }

      router.push("/");
    } catch {
      setError("Что-то пошло не так. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-brand" aria-label="Kaizen Space — на главную">
          <span className="opus-brand-mark" aria-hidden="true">К</span>
          <span>Kaizen Space</span>
        </Link>

        {!hydrated ? (
          <p className="auth-subtitle">Загрузка…</p>
        ) : currentUserEmail ? (
          <>
            <h1 className="auth-title">Вы уже вошли</h1>
            <p className="auth-subtitle">
              {userName} · {currentUserEmail}
            </p>
            <div className="auth-actions">
              <Link href="/" className="btn btn-primary">
                На главную
              </Link>
              <button type="button" className="btn btn-secondary" onClick={logoutAccount}>
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
              Аккаунт хранится локально в этом браузере — как и все ваши
              роудмапы и прогресс. Пароль сохраняется только в виде хэша.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
