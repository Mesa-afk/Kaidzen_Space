import { completedLeafXp } from "./graph";
import type { TaskNode } from "./graph";
import type { DailySessionResponse, StoredDaySession, StoredDailySessionTask } from "./day-session-contract";
import { getSchedulerPhase, selectCognitiveRoles } from "./kaizenScheduler";
import { ICNU_MODIFIERS, pickDailyModifiers } from "./icnuModifiers";

/** A pristine pending graph may be replaced by its first saved session; progress may not. */
export function canReplaceUnstartedDayGraph(graph: TaskNode[]): boolean {
  return graph.every((node) => node.type === "task" && node.status === "pending");
}

export function migrateDaySessionState<T extends object>(state: T): T & {
  daySessions: Record<string, StoredDaySession>;
  daySessionRequestKeys: Record<string, string>;
} {
  const withSessionFields = state as T & {
    daySessions?: Record<string, StoredDaySession>;
    daySessionRequestKeys?: Record<string, string>;
  };
  return {
    ...state,
    daySessions: withSessionFields.daySessions ?? {},
    daySessionRequestKeys: withSessionFields.daySessionRequestKeys ?? {},
  };
}

export function storeGeneratedDaySession(response: DailySessionResponse, createdAt = new Date().toISOString()): StoredDaySession {
  const { tasks, ...session } = response;
  return {
    ...session,
    createdAt,
    tasks: tasks.map(({ task, ...metadata }) => ({ ...metadata, taskId: task.id })),
  };
}

/** Build display metadata for a pre-session TaskNode graph without replacing it. */
export function adaptLegacyTaskGraphToSession(input: {
  roadmapId: string;
  roadmapTitle: string;
    dayNumber: number;
    dayTitle: string;
    subskillId?: string;
    subskillDescription?: string;
    graph: TaskNode[];
  createdAt?: string;
}): StoredDaySession {
  const leafTasks = input.graph.filter((node) => node.type === "task");
  const effectiveDay = Math.min(66, Math.max(1, input.dayNumber));
  const roles = selectCognitiveRoles(Math.min(10, Math.max(2, leafTasks.length)));
  const modifiers = pickDailyModifiers([], Math.min(2, Math.max(1, leafTasks.length)));
  const metadata: StoredDailySessionTask[] = leafTasks.map((task, index) => ({
    taskId: task.id,
    durationSeconds: Math.max(30, task.duration_minutes * 60),
    cognitiveRole: roles[index % roles.length],
    icnuTrigger: modifiers[index % modifiers.length] ?? ICNU_MODIFIERS[index % ICNU_MODIFIERS.length],
    instruction: task.title,
    evidenceMethod: `Отметь выполнение шага «${task.title}» в графе.`,
  }));
  const creditedSeconds = metadata.reduce((sum, item) => {
    const node = input.graph.find((task) => task.id === item.taskId);
    return sum + (node?.status === "completed" ? item.durationSeconds : 0);
  }, 0);

  return {
    roadmapId: input.roadmapId,
    dayNumber: input.dayNumber,
    effectiveDay,
    phase: getSchedulerPhase(effectiveDay),
    subskill: {
      id: input.subskillId ?? `legacy-day-${input.dayNumber}`,
      title: input.dayTitle,
      description: input.subskillDescription ?? `Практика дня «${input.dayTitle}» в роудмапе «${input.roadmapTitle}».`,
    },
    dailyBudgetSeconds: metadata.reduce((sum, item) => sum + item.durationSeconds, 0),
    creditedSecondsBefore: 0,
    projectedCreditedSeconds: Math.min(72_000, creditedSeconds),
    taskCount: metadata.length,
    repeatedSubskill: null,
    modifiersRecycled: false,
    tasks: metadata,
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...(completedLeafXp(input.graph) >= 100 ? { completedAt: input.createdAt ?? new Date().toISOString() } : {}),
  };
}

/** Derive planned-time credit from graph status, so retries cannot double-count. */
export function creditedSecondsForCompletedTasks(session: StoredDaySession, graph: TaskNode[]): number {
  const statusById = new Map(graph.map((task) => [task.id, task.status]));
  return session.tasks.reduce((total, item) => total + (statusById.get(item.taskId) === "completed" ? item.durationSeconds : 0), 0);
}
