# Backend security boundary

- `LLM_API_KEY` is read only by the server gateway. It is not `NEXT_PUBLIC_*`,
  never included in JSON responses, and provider response bodies are not logged.
- JSON request bodies are capped at 128 KiB and checked before parsing.
- Topic, level, title, day/task counts, graph size, and dependency arrays have
  bounded Zod schemas; graph references and cycles are checked again server-side.
- Client-supplied XP, status, parent ownership, user identity, and dependencies
  are not authoritative. Split normalization overwrites these fields.
- Error responses use `{ error: { code, message, details } }`; unexpected errors
  receive a generic message and a correlation ID header only.
- Current quota/idempotency and demo repository adapters are process-local. They
  are not sufficient for multi-instance production deployment and require a
  distributed atomic store plus real authentication.
