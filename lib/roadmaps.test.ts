import { describe, expect, it } from "vitest";
import { dedupeRoadmaps, roadmapSourceId, type Roadmap } from "./roadmaps";

const roadmap = (id: string, sourceId?: string): Roadmap => ({
  id, sourceId, title: "Learn to draw", emoji: "🎨", description: "A gentle plan",
  level: "Beginner", days: [], likes: 0, rating: 0, author: "Alex", color: "mint",
});

describe("saved roadmap identity", () => {
  it("recognizes old copies stored as source ID plus timestamp", () => {
    expect(roadmapSourceId(roadmap("draw-1760700000000"))).toBe("draw");
  });

  it("deduplicates legacy and current saved copies during migration", () => {
    const result = dedupeRoadmaps([
      roadmap("draw-1760700000000"),
      roadmap("another-copy", "draw"),
      roadmap("my-roadmap"),
    ]);
    expect(result.map((item) => item.sourceId)).toEqual(["draw", "my-roadmap"]);
  });
});
