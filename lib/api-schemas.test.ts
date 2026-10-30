import { describe, expect, it } from "vitest";
import { roadmapResponseSchema, roadmapSkeletonResponseSchema } from "./api-schemas";

const task = (id: string, xp_weight: number) => ({
  id, parent_id: null, type: "task" as const, status: "pending" as const,
  title: `Step ${id}`, duration_minutes: 5, xp_weight, dependencies: [],
});

describe("roadmap response validation", () => {
  it("accepts a roadmap only when every separate day totals 100 XP", () => {
    const valid = {
      project_title: "Learn to draw", project_emoji: "🎨",
      days: [
        { day_number: 1, tasks: [task("a", 40), task("b", 60)] },
        { day_number: 2, tasks: [task("c", 100)] },
      ],
    };
    expect(roadmapResponseSchema.safeParse(valid).success).toBe(true);
    expect(roadmapResponseSchema.safeParse({ ...valid, days: [valid.days[0], { day_number: 2, tasks: [task("c", 99)] }] }).success).toBe(false);
  });

  it("rejects missing dependencies and duplicate IDs within a day", () => {
    const invalid = {
      project_title: "Learn", project_emoji: "🌱",
      days: [{ day_number: 1, tasks: [{ ...task("a", 100), dependencies: ["missing"] }] }],
    };
    expect(roadmapResponseSchema.safeParse(invalid).success).toBe(false);
    const duplicate = { ...invalid, days: [{ day_number: 1, tasks: [task("same", 50), task("same", 50)] }] };
    expect(roadmapResponseSchema.safeParse(duplicate).success).toBe(false);
  });
});

describe("roadmap skeleton response validation", () => {
  const subskills = [
    { id: "foundation", title: "Основа", description: "Базовые элементы и безопасность.", day_start: 1, day_end: 11 },
    { id: "practice", title: "Практика", description: "Уверенное выполнение простых действий.", day_start: 12, day_end: 22 },
    { id: "patterns", title: "Паттерны", description: "Распознавание повторяющихся ситуаций.", day_start: 23, day_end: 33 },
    { id: "combination", title: "Комбинации", description: "Соединение освоенных элементов.", day_start: 34, day_end: 44 },
    { id: "application", title: "Применение", description: "Практика на реальных примерах.", day_start: 45, day_end: 55 },
    { id: "project", title: "Проект", description: "Сборка законченного мини-проекта.", day_start: 56, day_end: 66 },
  ];

  it("accepts exactly 66 linked days with only day 1 populated", () => {
    const days = Array.from({ length: 66 }, (_, index) => {
      const dayNumber = index + 1;
      const subskill = subskills.find((item) => dayNumber >= item.day_start && dayNumber <= item.day_end)!;
      return {
        day_number: dayNumber,
        title: `День ${dayNumber}`,
        subskill_id: subskill.id,
        tasks: dayNumber === 1 ? [task("a", 50), task("b", 50)] : [],
      };
    });
    const valid = {
      folder_title: "Мини-проект",
      emoji: "✨",
      lovable_project: "Собрать законченную вещь для собственного использования.",
      target_performance_level: "Пользователь самостоятельно соберёт и проверит свой первый работающий проект.",
      estimated_global_hours: 300,
      subskills,
      planned_minutes: 1200,
      planned_days: 66,
      days,
    };

    expect(roadmapSkeletonResponseSchema.safeParse(valid).success).toBe(true);
    expect(roadmapSkeletonResponseSchema.safeParse({
      ...valid,
      days: days.map((day) => day.day_number === 2 ? { ...day, tasks: [task("extra", 100)] } : day),
    }).success).toBe(false);
    expect(roadmapSkeletonResponseSchema.safeParse({ ...valid, days: days.slice(0, 65) }).success).toBe(false);
  });
});
