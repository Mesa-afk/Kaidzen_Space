import { describe, expect, it } from "vitest";
import { roadmapResponseSchema } from "./api-schemas";

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
