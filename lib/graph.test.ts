import { describe, expect, it } from "vitest";
import { distributeXp, findCycle, GraphInvariantError, replaceTemporaryIds, splitTask, type TaskNode } from "./graph";

const task = (id: string, dependencies: string[] = [], xp_weight = 10): TaskNode => ({
  id, parent_id: null, type: "task", status: "pending", title: id,
  duration_minutes: 5, xp_weight, dependencies,
});

describe("XP distribution", () => {
  it("distributes integer XP and assigns the remainder to the last child", () => {
    expect(distributeXp(100, 3)).toEqual([33, 33, 34]);
    expect(distributeXp(10, 4)).toEqual([2, 2, 2, 4]);
    expect(distributeXp(100, 3).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  });

  it("refuses to split when any child would get zero XP", () => {
    expect(() => distributeXp(2, 3)).toThrow(GraphInvariantError);
    expect(() => distributeXp(2, 3)).toThrow("each child must receive at least 1 XP");
  });
});

describe("ID replacement", () => {
  it("replaces temporary IDs and rewrites parent and dependency references", () => {
    const incoming = [task("temp-a"), { ...task("temp-b", ["temp-a"]), parent_id: "temp-a" }];
    let next = 0;
    const result = replaceTemporaryIds(incoming, [], () => `uuid-${++next}`);
    expect(result.map((node) => node.id)).toEqual(["uuid-1", "uuid-2"]);
    expect(result[1].parent_id).toBe("uuid-1");
    expect(result[1].dependencies).toEqual(["uuid-1"]);
  });

  it("rejects duplicate generated IDs instead of producing a partial graph", () => {
    expect(() => replaceTemporaryIds([task("one"), task("two")], [], () => "same-id"))
      .toThrow("not unique");
  });
});

describe("dependency graph", () => {
  it("finds a dependency cycle and returns its path", () => {
    expect(findCycle([task("a", ["c"]), task("b", ["a"]), task("c", ["b"])]))
      .toEqual(["a", "c", "b", "a"]);
    expect(findCycle([task("a"), task("b", ["a"])] )).toBeNull();
  });

  it("splits atomically, transfers parent dependencies and rewires dependants", () => {
    const graph = [task("prerequisite"), task("parent", ["prerequisite"], 10), task("following", ["parent"])];
    const children = [task("temp-left"), task("temp-right")];
    let next = 0;
    const candidate = splitTask(graph, "parent", children, () => `uuid-${++next}`);
    const parent = candidate.find((node) => node.id === "parent")!;
    const left = candidate.find((node) => node.id === "uuid-1")!;
    const right = candidate.find((node) => node.id === "uuid-2")!;
    const following = candidate.find((node) => node.id === "following")!;
    expect(parent).toMatchObject({ type: "container", xp_weight: 0 });
    expect(left).toMatchObject({ parent_id: "parent", xp_weight: 5, dependencies: ["prerequisite"] });
    expect(right).toMatchObject({ parent_id: "parent", xp_weight: 5, dependencies: ["prerequisite"] });
    expect(following.dependencies).toEqual(["uuid-1", "uuid-2"]);
    expect(graph.find((node) => node.id === "parent")?.type).toBe("task");
  });

  it("rejects an invalid split without mutating the source graph", () => {
    const graph = [task("parent", [], 1)];
    expect(() => splitTask(graph, "parent", [task("a"), task("b")], () => crypto.randomUUID()))
      .toThrow("each child must receive at least 1 XP");
    expect(graph[0]).toMatchObject({ type: "task", xp_weight: 1 });
  });

  it("rejects a cycle in the candidate graph", () => {
    expect(() => replaceTemporaryIds([task("new", ["new"])], [task("existing")], () => "fresh"))
      .toThrow("Dependency cycle detected");
  });
});
