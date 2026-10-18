import type { TaskNode } from "./graph";

/**
 * Mock LLM split - generates 3 microtasks for demo purposes
 * In production, this would call the actual LLM API
 */
export function mockSplitTask(parentTask: TaskNode): TaskNode[] {
  const mockMicrotasks = [
    {
      title: `Подготовиться: ${parentTask.title.toLowerCase()}`,
      duration_minutes: Math.max(2, Math.floor(parentTask.duration_minutes * 0.3)),
    },
    {
      title: `Выполнить основную часть: ${parentTask.title.toLowerCase()}`,
      duration_minutes: Math.max(2, Math.floor(parentTask.duration_minutes * 0.5)),
    },
    {
      title: `Завершить: ${parentTask.title.toLowerCase()}`,
      duration_minutes: Math.max(2, Math.floor(parentTask.duration_minutes * 0.2)),
    },
  ];

  return mockMicrotasks.map((mock, index) => ({
    id: `temp-${Date.now()}-${index}`,
    parent_id: null, // Will be set by splitTask function
    type: "task" as const,
    status: "pending" as const,
    title: mock.title,
    duration_minutes: mock.duration_minutes,
    xp_weight: 0, // Will be calculated by splitTask function
    dependencies: [],
  }));
}
