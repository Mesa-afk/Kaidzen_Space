import { describe, expect, it } from "vitest";
import { generateDaySessionRequestSchema, dailySessionResponseSchema } from "./day-session-contract";

const task = (id: string, durationSeconds: number) => ({
  task: {
    id,
    parent_id: null,
    type: "task" as const,
    status: "pending" as const,
    title: `Task ${id}`,
    duration_minutes: Math.ceil(durationSeconds / 60),
    xp_weight: 50,
    dependencies: [],
  },
  durationSeconds,
  cognitiveRole: "SCAFFOLD_SETUP" as const,
  icnuTrigger: { id: "interest-favorite-topic", category: "INTEREST" as const, label: "Тема", instruction: "Свяжи с интересом." },
  instruction: "Выполни один конкретный шаг.",
  evidenceMethod: "Сохрани результат.",
});

describe("day session contracts", () => {
  it("accepts legacy roadmap context without newly added roadmap metadata", () => {
    expect(generateDaySessionRequestSchema.safeParse({
      roadmapId: "old-roadmap",
      roadmapTitle: "Английский",
      roadmapDescription: "Старый roadmap без skeleton metadata.",
      dayNumber: 3,
      dayTitle: "Первые фразы",
    }).success).toBe(true);
  });

  it("rejects client-computed planning values", () => {
    expect(generateDaySessionRequestSchema.safeParse({
      roadmapId: "roadmap",
      roadmapTitle: "Навык",
      dayNumber: 1,
      dayTitle: "День 1",
      dailyBudgetSeconds: 120,
      cognitiveRoles: ["PROJECT_BUILD"],
    }).success).toBe(false);
  });

  it("requires task durations to match budget and XP to total 100", () => {
    const valid = {
      roadmapId: "roadmap",
      dayNumber: 1,
      effectiveDay: 1,
      phase: "AMYGDALA_BYPASS",
      dailyBudgetSeconds: 120,
      creditedSecondsBefore: 0,
      projectedCreditedSeconds: 120,
      taskCount: 2,
      repeatedSubskill: null,
      modifiersRecycled: false,
      tasks: [task("one", 60), task("two", 60)],
    };
    expect(dailySessionResponseSchema.safeParse(valid).success).toBe(true);
    expect(dailySessionResponseSchema.safeParse({ ...valid, tasks: [task("one", 30), task("two", 60)] }).success).toBe(false);
    expect(dailySessionResponseSchema.safeParse({ ...valid, tasks: [task("one", 60), { ...task("two", 60), task: { ...task("two", 60).task, xp_weight: 49 } }] }).success).toBe(false);
  });
});
