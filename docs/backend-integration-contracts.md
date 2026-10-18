# Backend integration contracts

## Audit baseline

The frontend baseline is commit `46b809b`. The current Next.js version is 16.4.2.
Route Handlers use the Web `Request`/`Response` APIs, are public endpoints, and
must not expose sensitive error details. Non-`NEXT_PUBLIC_` environment variables
are server-only; `LLM_API_KEY` must remain in the server runtime.

## Contracts that must remain stable

- `TaskNode` in `lib/graph.ts`: `id`, nullable `parent_id`, `type`, `status`,
  `title`, `duration_minutes`, integer `xp_weight`, and `dependencies`.
- Roadmap generation response: `project_title`, `project_emoji`, and numbered
  days containing task nodes.
- Split response: `{ tasks: TaskNode[] }` containing normalized child tasks.
- `lib/graph.ts` remains the domain reference for XP distribution, cycle checks,
  temporary-ID replacement, and atomic split candidate construction.
- `lib/mock-generate.ts` and `lib/mock-split.ts` remain available for local demo
  mode until real adapters are connected and verified.
- Zustand persistence name `kaizen-roadmaps`, version 4, migration behavior,
  local hydration, and the existing `focusGraphs` key format remain compatible.

## Current implementation and gaps

- `app/api/roadmaps/generate/route.ts` and `app/api/tasks/split/route.ts`
  currently validate only shared schemas and call LLM/graph code directly.
- `lib/llm.ts` already has a timeout and three attempts, but needs a server-only
  gateway boundary, bounded inputs, safe correlation logging, typed provider
  errors, and strict response parsing/normalization.
- Shared schemas enforce basic shape and per-day XP=100, but do not yet enforce
  all server trust boundaries (ownership, authoritative status/XP, graph size,
  headers, idempotency, and request identity).
- Client generation in `app/page.tsx` and splitting in `components/day-focus.tsx`
  use mock adapters and preserve their loading/error/success UX.
- No database, transaction provider, authentication, or distributed rate limit
  is configured. A server-side repository abstraction and explicit demo-mode
  adapter are therefore required; an in-memory adapter is not production
  persistence.

## Integration decisions

1. Routes remain thin and delegate to server-only validation, services, and
   repositories.
2. The LLM may provide only temporary IDs. The server assigns UUIDs, rewrites
   references, validates the complete DAG, and owns XP allocation.
3. Client-supplied graph data is treated as an untrusted candidate. Until auth
   and durable persistence are configured, demo mode can validate and return a
   candidate but must not claim durable ownership.
4. Idempotency and quota policies are explicit server concerns and must not be
   inferred from client state.

## Environment

Required server variables are `LLM_API_KEY`, optional `LLM_BASE_URL`, and
`LLM_MODEL`. `.env.local` is local-only and must never be committed or sent to
the browser. A durable repository and authentication provider are not present
in this baseline and remain explicit deployment prerequisites.
