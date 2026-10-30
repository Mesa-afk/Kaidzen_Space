import { afterEach, describe, expect, it, vi } from "vitest";
import { generateRoadmapSkeleton } from "./roadmap-skeleton-service";

const subskills = [
  { id: "foundation", title: "Основа", description: "Базовые элементы и безопасность.", day_start: 1, day_end: 11 },
  { id: "practice", title: "Практика", description: "Уверенное выполнение простых действий.", day_start: 12, day_end: 22 },
  { id: "patterns", title: "Паттерны", description: "Распознавание повторяющихся ситуаций.", day_start: 23, day_end: 33 },
  { id: "combination", title: "Комбинации", description: "Соединение освоенных элементов.", day_start: 34, day_end: 44 },
  { id: "application", title: "Применение", description: "Практика на реальных примерах.", day_start: 45, day_end: 55 },
  { id: "project", title: "Проект", description: "Сборка законченного мини-проекта.", day_start: 56, day_end: 66 },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("generateRoadmapSkeleton", () => {
  it("creates 66 linked day records and tasks only for day 1", async () => {
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubEnv("LLM_BASE_URL", "https://llm.test/v1");
    vi.stubEnv("LLM_MODEL", "test-model");

    const responses = [
      {
        folder_title: "Гончарное дело: первая кружка",
        emoji: "🏺",
        lovable_project: "Сделать удобную небольшую кружку для дома.",
        target_performance_level: "Пользователь самостоятельно сформует, высушит и покроет глазурью простую кружку.",
        estimated_global_hours: 400,
        subskills,
      },
      { tasks: ["Подготовить глину и рабочее место", "Сформовать первый небольшой цилиндр"] },
    ];
    const requestBodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      requestBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      const content = JSON.stringify(responses.shift());
      return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));

    const result = await generateRoadmapSkeleton("Освоить гончарное дело", { requestId: "test-request" });

    expect(result.days).toHaveLength(66);
    expect(result.planned_minutes).toBe(1200);
    expect(result.planned_days).toBe(66);
    expect(result.days[0].subskill_id).toBe("foundation");
    expect(result.days[0].tasks).toHaveLength(2);
    expect(result.days[0].tasks.map((task) => task.xp_weight)).toEqual([50, 50]);
    expect(result.days[0].tasks[0].dependencies).toEqual([]);
    expect(result.days[0].tasks[1].dependencies).toEqual([result.days[0].tasks[0].id]);
    expect(result.days.slice(1).every((day) => day.tasks.length === 0)).toBe(true);
    expect(requestBodies).toHaveLength(2);
    expect(requestBodies.every((body) => Boolean(body.response_format))).toBe(true);
  });
});
