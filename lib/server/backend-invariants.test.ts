import { describe, expect, it } from "vitest";
import { distributeXp, type TaskNode } from "@/lib/graph";
import { assertXpInvariant, validateServerGraph } from "./validation/graph";
import { DemoRoadmapRepository } from "./repositories/demo-roadmap-repository";

const task = (id: string, xp = 100, dependencies: string[] = []): TaskNode => ({
  id, parent_id: null, type: "task", status: "pending", title: id,
  duration_minutes: 5, xp_weight: xp, dependencies,
});

describe("server graph invariants", () => {
  it("uses floor distribution and gives the remainder to the last child", () => {
    expect(distributeXp(100, 1)).toEqual([100]);
    expect(distributeXp(100, 2)).toEqual([50, 50]);
    expect(distributeXp(100, 3)).toEqual([33, 33, 34]);
    expect(distributeXp(100, 6)).toEqual([16, 16, 16, 16, 16, 20]);
  });

  it("rejects zero, negative, fractional and non-100 XP", () => {
    expect(() => assertXpInvariant([task("a", 0), task("b", 100)])).toThrow("positive integer");
    expect(() => assertXpInvariant([task("a", -1), task("b", 101)])).toThrow();
    expect(() => assertXpInvariant([task("a", 10.5), task("b", 89.5)])).toThrow();
    expect(() => assertXpInvariant([task("a", 99)])).toThrow("exactly 100");
  });

  it("rejects unknown references and dependency cycles", () => {
    expect(() => validateServerGraph([task("a", 100, ["missing"])]))
      .toThrow("Unknown dependency");
    expect(() => validateServerGraph([task("a", 50, ["b"]), task("b", 50, ["a"])]))
      .toThrow("cycle");
  });
});

describe("demo repository atomicity", () => {
  it("rolls back a failed transaction", async () => {
    const repository = new DemoRoadmapRepository();
    const record = {
      id: "r1", sourceId: "source", owner: { userId: "u1" }, projectTitle: "Roadmap", projectEmoji: "✨",
      days: [], createdAt: new Date(), updatedAt: new Date(),
    };
    await repository.save(record);
    await expect(repository.transaction(async (tx) => {
      await tx.replaceGraph("r1", { userId: "u1" }, [{ dayNumber: 1, tasks: [] }]);
      throw new Error("rollback");
    })).rejects.toThrow("rollback");
    expect((await repository.get("r1", { userId: "u1" }))?.days).toEqual([]);
  });

  it("deduplicates shelf additions and enforces owner access", async () => {
    const repository = new DemoRoadmapRepository();
    await repository.addToShelf("source", { userId: "u1" });
    await repository.addToShelf("source", { userId: "u1" });
    await expect(repository.replaceGraph("unknown", { userId: "u2" }, [])).rejects.toThrow("not found");
  });
});
