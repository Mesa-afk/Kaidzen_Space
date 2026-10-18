import { findCycle, type TaskNode } from "@/lib/graph";
import { ApiError } from "./errors";

export function validateServerGraph(graph: TaskNode[], options: { requireDayXp?: boolean } = {}) {
  if (graph.length > 100) throw new ApiError("GRAPH_TOO_LARGE", "Graph contains too many nodes", 422);
  const ids = new Set<string>();
  for (const node of graph) {
    if (ids.has(node.id)) throw new ApiError("GRAPH_INVALID", "Node IDs must be unique", 422);
    ids.add(node.id);
  }
  for (const node of graph) {
    if (node.parent_id !== null && !ids.has(node.parent_id)) throw new ApiError("GRAPH_INVALID", "Unknown parent reference", 422);
    if (node.dependencies.includes(node.id)) throw new ApiError("GRAPH_INVALID", "A node cannot depend on itself", 422);
    for (const dependency of node.dependencies) {
      if (!ids.has(dependency)) throw new ApiError("GRAPH_INVALID", "Unknown dependency reference", 422);
    }
  }
  const dependencyCycle = findCycle(graph);
  if (dependencyCycle) throw new ApiError("GRAPH_CYCLE", "Dependency cycle detected", 422);
  const parentById = new Map(graph.map((node) => [node.id, node.parent_id]));
  for (const node of graph) {
    const seen = new Set<string>();
    let parent = node.parent_id;
    while (parent !== null) {
      if (seen.has(parent)) throw new ApiError("GRAPH_CYCLE", "Parent cycle detected", 422);
      seen.add(parent);
      parent = parentById.get(parent) ?? null;
    }
  }
  if (options.requireDayXp) {
    const leaves = graph.filter((node) => node.type === "task");
    if (leaves.some((node) => !Number.isInteger(node.xp_weight) || node.xp_weight < 1)) {
      throw new ApiError("XP_INVARIANT_FAILED", "Every leaf task must have at least 1 XP", 422);
    }
    if (leaves.reduce((sum, node) => sum + node.xp_weight, 0) !== 100) {
      throw new ApiError("XP_INVARIANT_FAILED", "Leaf task XP must total exactly 100", 422);
    }
  }
  return graph;
}

export function assertXpInvariant(graph: TaskNode[]) {
  const leaves = graph.filter((node) => node.type === "task");
  if (leaves.some((node) => !Number.isSafeInteger(node.xp_weight) || node.xp_weight < 1)) {
    throw new ApiError("XP_INVARIANT_FAILED", "Every leaf task must have a positive integer XP weight", 422);
  }
  if (leaves.reduce((sum, node) => sum + node.xp_weight, 0) !== 100) {
    throw new ApiError("XP_INVARIANT_FAILED", "Leaf task XP must total exactly 100", 422);
  }
}
