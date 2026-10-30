# Backend integration status

Implemented:

- `POST /api/roadmaps/generate`: validated request, server LLM gateway,
  temporary-ID normalization, graph and per-day XP checks.
- `POST /api/roadmaps/skeleton`: Kaufman/Dreyfus/Maurer roadmap metadata for a
  20-hour/66-day plan; only Day 1 receives generated TaskNodes.
- `POST /api/tasks/split`: validated graph ownership boundary, server-owned
  child IDs/XP/parents/dependencies, atomic graph candidate and cycle checks.
- Server services under `lib/server/services/` and validation under
  `lib/server/validation/`.
- LLM timeout, cancellation, bounded input/output, malformed JSON handling,
  schema validation, safe correlation logging, and three total attempts.
- Repository/shelf service contracts, demo atomic repository, quota policy, and
  idempotency boundary.
- API adapters in `lib/api-client.ts`; real backend mode is the default.
  Set `NEXT_PUBLIC_BACKEND_MODE=mock` to use local demo generation/splitting.
- Zustand persistence/migration and a non-destructive server-progress merge.

Not production-ready without deployment work:

- No authentication/authorization provider is configured.
- The repository and rate limit/idempotency store are process-local demo
  adapters; use a durable transactional database and distributed atomic store
  for multiple instances.
- Repository/Shelf HTTP endpoints and server progress endpoint are contracts,
  not yet exposed routes; the current UI still uses its existing local demo
  repository for browsing/shelf interactions.
- User timezone-aware quota accounting, durable usage records, and durable
  request replay require authenticated user/session data.
