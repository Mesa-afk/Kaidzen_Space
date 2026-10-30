# Mock day-session E2E report

Run against an isolated production build with `NEXT_PUBLIC_BACKEND_MODE=mock`
on port 3101. No `LLM_API_KEY` was used.

Verified in browser:

1. Created a mock roadmap from the existing Catalog form.
2. Opened Day 1 and saw the generated mock session metadata beside the graph:
   role, ICNU label, planned duration, instruction, and evidence method.
3. Completed both Day 1 tasks: graph statuses became `completed`, XP reached
   100, and planned credited seconds reached 1200 for the mock session.
4. Opened Day 2, skipped the available task, and confirmed XP stayed at 0.
5. Reloaded the page, reopened the saved roadmap/day, and confirmed the graph
   statuses and `daySessions` metadata remained in localStorage.
6. Reopened the same day and observed no second `/api/roadmaps/day/generate`
   request because the saved session was reused.
7. Verified that a saved legacy graph can be adapted to session metadata without
   changing its TaskNode IDs, statuses, XP, or dependencies via unit tests.

The live LLM flow was not tested. It requires valid `LLM_API_KEY`,
`LLM_BASE_URL`, and `LLM_MODEL`; this report intentionally covers mock mode
only.
