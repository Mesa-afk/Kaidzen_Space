# Авторизация: серверные аккаунты и сессии

Вход на сайт — только через регистрацию/вход. Аккаунты и сессии живут на
сервере в SQLite; клиент хранит лишь зеркало публичного профиля в zustand.

## Реализация

- **База**: `lib/server/db.ts` — SQLite через встроенный `node:sqlite`
  (без новых зависимостей). Файл `data/kaizen.db` (в `.gitignore`), путь
  переопределяется `KAIZEN_DB_PATH`. Таблицы `users`, `sessions`; WAL;
  синглтон на `globalThis` (переживает HMR). Рантайм-типы —
  `lib/server/sqlite-types.d.ts` (ambient, т.к. `@types/node@20` модуля
  не знает).
- **Пароли**: scrypt с персональной солью, формат
  `scrypt$<saltHex>$<hashHex>` в `users.password_hash`. Проверка —
  `timingSafeEqual`; для неизвестного email сравнивается dummy-хэш,
  чтобы ответ не выдавал существование аккаунта.
- **Сессии**: токен 32 байта (base64url); в БД хранится только его
  SHA-256. TTL 30 дней. Cookie `kaizen_session`: HttpOnly,
  SameSite=Lax, Path=/, Secure при https (приоритет у
  `x-forwarded-proto`, иначе протокол `request.url`).
- **Rate-limit**: `lib/server/auth-rate-limit.ts` (in-memory) —
  10 неудачных входов / 15 мин на пару IP+email; 5 регистраций / час на IP.
- **Сервис**: `lib/server/services/auth-service.ts` (тесты —
  `auth-service.test.ts` на временной БД).

## Маршруты (`app/api/auth/*`)

По конвенциям проекта: `requestId`, лимит тела 128 KiB, zod-схемы из
`lib/api-schemas.ts`, ошибки `{ error: { code, message, details } }`,
`Cache-Control: no-store`. Успех возвращает `{ user: PublicUser }`
(`id, name, email, avatarDataUrl, createdAt`).

| Метод | Путь | Что делает |
| --- | --- | --- |
| POST | `/api/auth/register` | Создаёт аккаунт + сессию, 201 |
| POST | `/api/auth/login` | Проверяет пароль, создаёт сессию |
| POST | `/api/auth/logout` | Удаляет сессию, чистит cookie |
| GET | `/api/auth/me` | Текущий пользователь по cookie |
| PATCH | `/api/auth/profile` | Ник и/или аватар (data URL jpeg/png/webp ≤ 90 000 символов) |

Коды ошибок: `AUTH_REQUIRED` 401, `AUTH_INVALID_CREDENTIALS` 401,
`AUTH_EMAIL_TAKEN` 409, `AUTH_TOO_MANY_ATTEMPTS` 429,
`VALIDATION_ERROR` 400.

## Клиент

- **Гейт**: `app/page.tsx` после гидратации зовёт `fetchMeApi()`; при
  ошибке — `router.replace("/login")`, приложение не рендерится
  (показывается загрузочная оболочка).
- **API-адаптер**: `registerApi/loginApi/logoutApi/fetchMeApi/
  updateProfileApi` в `lib/api-client.ts`.
- **Стор**: persist v8. `userName/currentUserEmail/avatarDataUrl` —
  зеркало сервера, обновляется экшеном `setAuthUser(user | null)`.
  Локальные аккаунты v7 удалены при миграции (клиентские SHA-256
  несовместимы со scrypt) — требуется повторная регистрация; локальный
  аватар при первом входе одноразово переносится на сервер.
  Роадмапы и прогресс по-прежнему в localStorage.
- Валидация формы — `lib/auth.ts` (те же правила продублированы
  zod-схемами на сервере).

## Ограничения и следующие шаги

- Эндпоинты генерации (`/api/roadmaps/*`, `/api/tasks/*`) пока публичны
  по контракту `backend-integration-contracts.md`; сессией закрыт вход
  в UI и все auth-операции. Закрытие генерации сессией — следующий этап.
- БД — один SQLite-файл: для нескольких инстансов нужна полноценная БД.
- Rate-limit in-memory: сбрасывается при рестарте процесса.
