import { afterEach, describe, expect, it, vi } from "vitest";
import { generateDaySession } from "./day-session-service";
import { demoRateLimit } from "@/lib/server/rate-limit";
import type { GenerateDaySessionRequest } from "@/lib/day-session-contract";

function stubLlmResponse(fixedTaskCount?: number) {
  vi.stubEnv("LLM_API_KEY", "test-key");
  vi.stubEnv("LLM_BASE_URL", "https://llm.test/v1");
  vi.stubEnv("LLM_MODEL", "test-model");
  const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    const userContent = body.messages.find((message: { role: string }) => message.role === "user")?.content as string;
    const contextJson = JSON.parse(userContent.slice(userContent.lastIndexOf("\n{") + 1)) as { tasks?: unknown[] };
    const taskCount = fixedTaskCount ?? contextJson.tasks?.length ?? 2;
    const payload = {
      tasks: Array.from({ length: taskCount }, (_, index) => ({
        title: `Действие ${index + 1}`,
        instruction: `Выполни конкретное действие ${index + 1} и проверь результат.`,
        evidenceMethod: `Зафиксируй результат действия ${index + 1}.`,
      })),
    };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const legacyInput: GenerateDaySessionRequest = {
  roadmapId: "legacy-roadmap",
  roadmapTitle: "Английский",
  roadmapDescription: "Старый roadmap без Kaufman metadata.",
  dayNumber: 10,
  dayTitle: "Первые фразы",
  completedHistory: [
    { effectiveDay: 3, dayNumber: 3, creditedSeconds: 180 },
  ],
  usedModifierIds: ["interest-favorite-topic", "interest-real-life"],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("generateDaySession", () => {
  it("recomputes budget, phase, roles and review for a legacy roadmap", async () => {
    const fetchMock = stubLlmResponse(7);
    const session = await generateDaySession({
      ...legacyInput,
      effectiveDay: 10,
      phase: "AMYGDALA_BYPASS", // untrusted phase hint is ignored
    });

    expect(session.effectiveDay).toBe(10);
    expect(session.phase).toBe("RAMP_UP");
    expect(session.dailyBudgetSeconds).toBe(15.5 * 60);
    expect(session.taskCount).toBe(7);
    expect(session.tasks.map((task) => task.cognitiveRole)).toEqual([
      "SCAFFOLD_SETUP", "MIND_SCULPT_ANCHOR", "MENTAL_HOOK", "FAST_FEEDBACK_DRILL",
      "INVERSION_PLAY", "SPACED_RETRIEVAL", "SPEED_SPRINT",
    ]);
    expect(session.repeatedSubskill).toMatchObject({ id: "legacy-day-3", title: "День 3" });
    expect(session.tasks[0].icnuTrigger.id).not.toBe("interest-favorite-topic");
    expect(session.tasks.reduce((sum, task) => sum + task.durationSeconds, 0)).toBe(session.dailyBudgetSeconds);
    expect(session.tasks.reduce((sum, task) => sum + task.task.xp_weight, 0)).toBe(100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("applies RSD rewind, day-66 cap, and the terminal 30-second task exception", async () => {
    stubLlmResponse();
    const recovery = await generateDaySession({
      roadmapId: "roadmap",
      roadmapTitle: "Навык",
      dayNumber: 12,
      dayTitle: "Шаг",
      effectiveDay: 12,
      daysMissed: 2,
      completedHistory: [],
    });
    expect(recovery).toMatchObject({ effectiveDay: 9, phase: "RSD_RECOVERY", dailyBudgetSeconds: 840 });

    stubLlmResponse();
    const finalSlice = await generateDaySession({
      roadmapId: "roadmap-final",
      roadmapTitle: "Навык",
      dayNumber: 66,
      dayTitle: "Финальный шаг",
      effectiveDay: 66,
      completedHistory: [{ effectiveDay: 65, creditedSeconds: 71_970 }],
    });
    expect(finalSlice).toMatchObject({ effectiveDay: 66, dailyBudgetSeconds: 30, taskCount: 1 });
    expect(finalSlice.tasks[0].durationSeconds).toBe(30);
    expect(finalSlice.projectedCreditedSeconds).toBe(72_000);
  });

  it("rejects malformed task plans after the gateway retry budget", async () => {
    const fetchMock = stubLlmResponse(1); // Day 10 requires seven tasks.
    await expect(generateDaySession({ ...legacyInput, effectiveDay: 10 })).rejects.toMatchObject({
      code: "LLM_SCHEMA_INVALID",
      status: 502,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("replays an idempotent day request without calling the provider twice", async () => {
    const fetchMock = stubLlmResponse(2);
    const identity = `session-test-${Date.now()}`;
    let serviceCalls = 0;
    const create = () => demoRateLimit.run("day-session", identity, "same-day-request", async () => {
      serviceCalls += 1;
      return generateDaySession({
        roadmapId: "idempotent-roadmap",
        roadmapTitle: "Навык",
        dayNumber: 1,
        dayTitle: "Старт",
      });
    });

    const first = await create();
    const replay = await create();
    expect(replay).toEqual(first);
    expect(serviceCalls).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
