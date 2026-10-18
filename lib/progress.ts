import type { TaskNode } from "./graph";
import { completedLeafXp } from "./graph";

/**
 * Calculate progress statistics for a roadmap day
 */
export function calculateDayProgress(graph: TaskNode[]): {
  completedXp: number;
  totalXp: number;
  percentage: number;
  isCompleted: boolean;
} {
  const completedXp = completedLeafXp(graph);
  const totalXp = 100;
  const percentage = Math.min(100, Math.round(completedXp));
  const isCompleted = completedXp >= 100;
  
  return {
    completedXp,
    totalXp,
    percentage,
    isCompleted,
  };
}

/**
 * Calculate completed days for a roadmap
 */
export function calculateCompletedDays(
  roadmapId: string,
  dayCount: number,
  focusGraphs: Record<string, TaskNode[]>
): number[] {
  const completed: number[] = [];
  
  for (let dayNumber = 1; dayNumber <= dayCount; dayNumber++) {
    const storageKey = `${roadmapId}:${dayNumber}`;
    const graph = focusGraphs[storageKey];
    
    if (graph) {
      const progress = calculateDayProgress(graph);
      if (progress.isCompleted) {
        completed.push(dayNumber);
      }
    }
  }
  
  return completed;
}

/**
 * Find the current active day for a roadmap
 */
export function findCurrentDay(
  roadmapId: string,
  dayCount: number,
  focusGraphs: Record<string, TaskNode[]>
): number {
  for (let dayNumber = 1; dayNumber <= dayCount; dayNumber++) {
    const storageKey = `${roadmapId}:${dayNumber}`;
    const graph = focusGraphs[storageKey];
    
    if (!graph) {
      // Day not started yet
      return dayNumber;
    }
    
    const progress = calculateDayProgress(graph);
    if (!progress.isCompleted) {
      // Day in progress
      return dayNumber;
    }
  }
  
  // All days completed, return last day
  return dayCount;
}
