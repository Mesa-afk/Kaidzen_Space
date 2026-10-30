import { completedLeafXp } from "./graph";
import type { TaskNode } from "./graph";

/**
 * Calculate total XP across all focus graphs
 */
export function calculateTotalXp(focusGraphs: Record<string, TaskNode[]>): number {
  return Object.values(focusGraphs).reduce((total, graph) => {
    return total + completedLeafXp(graph);
  }, 0);
}

/**
 * Calculate XP earned today (simplified - counts all completed XP)
 * In production, this would filter by completion timestamp
 */
export function calculateTodayXp(focusGraphs: Record<string, TaskNode[]>): number {
  // For now, return total XP (in production, filter by today's date)
  return calculateTotalXp(focusGraphs);
}
