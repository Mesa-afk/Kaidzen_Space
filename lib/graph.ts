export type TaskStatus = "pending" | "completed" | "skipped";
export type TaskNode = {
  id: string;
  parent_id: string | null;
  type: "task" | "container";
  status: TaskStatus;
  title: string;
  duration_minutes: number;
  xp_weight: number;
  dependencies: string[];
};

export class GraphInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphInvariantError";
  }
}

export function completedLeafXp(graph: TaskNode[]) {
  return graph.filter((node) => node.type === "task" && node.status === "completed").reduce((sum, node) => sum + node.xp_weight, 0);
}

export function completesDayAt100Xp(graph: TaskNode[], taskId: string) {
  const task = graph.find((node) => node.id === taskId);
  return Boolean(task && task.type === "task" && task.status === "pending" && completedLeafXp(graph) + task.xp_weight === 100);
}

export function distributeXp(parentWeight: number, childCount: number): number[] {
  if (!Number.isInteger(parentWeight) || parentWeight < 0) {
    throw new GraphInvariantError("XP weight must be a non-negative integer");
  }
  if (!Number.isInteger(childCount) || childCount < 1) {
    throw new GraphInvariantError("At least one child task is required");
  }
  if (parentWeight < childCount) {
    throw new GraphInvariantError("Cannot split task: each child must receive at least 1 XP");
  }
  const base = Math.floor(parentWeight / childCount);
  return Array.from({ length: childCount }, (_, index) =>
    index === childCount - 1 ? parentWeight - base * (childCount - 1) : base,
  );
}

export function findCycle(nodes: TaskNode[]): string[] | null {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    if (!byId.has(id)) throw new GraphInvariantError(`Unknown dependency: ${id}`);
    if (state.get(id) === 1) return [...stack.slice(stack.indexOf(id)), id];
    if (state.get(id) === 2) return null;
    state.set(id, 1);
    stack.push(id);
    for (const dependency of byId.get(id)!.dependencies) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, 2);
    return null;
  };

  for (const node of nodes) {
    const cycle = visit(node.id);
    if (cycle) return cycle;
  }
  return null;
}

function assertUniqueIds(nodes: TaskNode[]) {
  const ids = nodes.map((node) => node.id);
  if (new Set(ids).size !== ids.length) throw new GraphInvariantError("Node IDs must be unique");
}

/** Replaces every incoming temporary ID and atomically rewrites dependency/parent references. */
export function replaceTemporaryIds(
  incoming: TaskNode[],
  existing: TaskNode[] = [],
  makeId: () => string = () => crypto.randomUUID(),
): TaskNode[] {
  const idMap = new Map<string, string>();
  const occupied = new Set(existing.map((node) => node.id));
  for (const node of incoming) {
    if (idMap.has(node.id)) throw new GraphInvariantError(`Duplicate temporary ID: ${node.id}`);
    const id = makeId();
    if (occupied.has(id) || [...idMap.values()].includes(id)) {
      throw new GraphInvariantError(`Generated UUID is not unique: ${id}`);
    }
    idMap.set(node.id, id);
  }

  const candidate = incoming.map((node) => ({
    ...node,
    id: idMap.get(node.id)!,
    parent_id: node.parent_id === null ? null : idMap.get(node.parent_id) ?? node.parent_id,
    dependencies: node.dependencies.map((id) => idMap.get(id) ?? id),
  }));
  assertUniqueIds([...existing, ...candidate]);
  const cycle = findCycle([...existing, ...candidate]);
  if (cycle) throw new GraphInvariantError(`Dependency cycle detected: ${cycle.join(" -> ")}`);
  return candidate;
}

/** Splits a leaf into children, lifting its dependencies to every child and rewiring dependants. */
export function splitTask(
  graph: TaskNode[],
  parentId: string,
  children: TaskNode[],
  makeId: () => string = () => crypto.randomUUID(),
): TaskNode[] {
  const parent = graph.find((node) => node.id === parentId);
  if (!parent || parent.type !== "task") throw new GraphInvariantError("Parent task not found or already split");
  if (parent.status !== "pending") throw new GraphInvariantError("Only pending tasks can be split");
  if (children.length < 2) throw new GraphInvariantError("Splitting requires at least two child tasks");
  const weights = distributeXp(parent.xp_weight, children.length);
  if (graph.some((node) => node.parent_id === parentId)) throw new GraphInvariantError("Task already has children");

  const normalizedChildren = replaceTemporaryIds(children, graph, makeId).map((child, index) => ({
    ...child,
    parent_id: parentId,
    type: "task" as const,
    status: "pending" as const,
    xp_weight: weights[index],
    dependencies: [...new Set([...parent.dependencies, ...child.dependencies])],
  }));
  const childIds = normalizedChildren.map((child) => child.id);
  normalizedChildren.forEach((child, index) => {
    if (index > 0) child.dependencies = [...new Set([...child.dependencies, childIds[index - 1]])];
  });
  const candidate = [
    ...graph.map((node) => node.id === parentId
      ? { ...node, type: "container" as const, xp_weight: 0, status: "pending" as const }
      : { ...node, dependencies: node.dependencies.flatMap((id) => id === parentId ? childIds : [id]) }),
    ...normalizedChildren,
  ];
  assertUniqueIds(candidate);
  const cycle = findCycle(candidate);
  if (cycle) throw new GraphInvariantError(`Dependency cycle detected: ${cycle.join(" -> ")}`);
  return candidate;
}
