<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Контекст проекта для ИИ-агентов

Вся проектная документация для агентов лежит в папке **`ai-context/`**
(индекс и порядок чтения — `ai-context/README.md`). Перед работой прочитай
документы под свою задачу:

- UI / дизайн / анимации: `ai-context/material_design_3_dark_theme_guide.md`,
  затем `ai-context/m3-motion.md`.
- Бэкенд / API / LLM-генерация: `ai-context/backend-integration-contracts.md`,
  `ai-context/backend-integration-status.md`, `ai-context/backend-security.md`,
  `ai-context/day-session-generation.md`.

Новые агентные документы складывай в `ai-context/` и обновляй её индекс —
не создавай md-файлы в корне репозитория (в корне остаются только этот
`AGENTS.md` и человеческий `README.md`).
