# Day-session generation contract (Stage 2)

## Product rules agreed for this stage

- The 66 roadmap days are **learning sessions**, not calendar dates. Calendar
  gaps do not advance the effective learning day; `daysMissed` is calendar-day
  context used only by RSD recovery.
- The nominal scheduler totals 1,203 minutes over days 1–66. To keep the sprint
  invariant at exactly 1,200 credited/planned minutes, effective day 66 is
  capped at the remaining budget (17 minutes on an uninterrupted path).
- Task duration may be as short as 30 seconds. Planned seconds are credited
  only when a task is completed; this is planned learning credit, not measured
  wall-clock time. The current UI has no timer or persistence for that credit.
- If only 30 seconds remain in the sprint, a single terminal task is allowed;
  otherwise the scheduler's minimum task count remains two.
- SRS intervals 1, 7, and 30 are measured in effective learning sessions.

## Endpoint

`POST /api/roadmaps/day/generate`

The request contains roadmap/day context, effective-day and RSD context,
completed-session history, and used modifier IDs. It does not accept a task
count, budget, role list, selected repetition, or selected modifiers. The
service recomputes those from `lib/kaizenScheduler.ts` and
`lib/icnuModifiers.ts` before asking the existing server-only LLM gateway for
task text.

TaskNodes remain unchanged. A generated session wraps each graph node in a
separate `DailySessionTask` with seconds, cognitive role, ICNU trigger,
instruction, and evidence method. The current request history is a local-demo
snapshot; without auth and durable user/session storage, it is validated but
cannot be treated as authoritative. Idempotency and rate limits also use the
existing process-local demo adapter and are not production guarantees.

This endpoint is not wired into UI opening/completion yet; that integration and
durable session history belong to a later stage.
