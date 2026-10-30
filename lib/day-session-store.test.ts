import { describe, expect, it } from "vitest";
import { adaptLegacyTaskGraphToSession, canReplaceUnstartedDayGraph, creditedSecondsForCompletedTasks, migrateDaySessionState, storeGeneratedDaySession } from "./day-session-store";
import type { TaskNode } from "./graph";

const node = (id: string, status: TaskNode["status"]): TaskNode => ({
  id, parent_id: null, type: "task", status, title: id,
  duration_minutes: 1, xp_weight: 50, dependencies: [],
});

describe("stored day-session metadata", () => {
  it("only replaces pristine graphs and protects existing progress", () => {
    expect(canReplaceUnstartedDayGraph([])).toBe(true);
    expect(canReplaceUnstartedDayGraph([node("pending", "pending")])).toBe(true);
    expect(canReplaceUnstartedDayGraph([node("done", "completed")])).toBe(false);
    expect(canReplaceUnstartedDayGraph([node("skip", "skipped")])).toBe(false);
    expect(canReplaceUnstartedDayGraph([{ ...node("container", "pending"), type: "container" }])).toBe(false);
  });

  it("migrates v4 progress without changing graphs or roadmap records", () => {
    const oldState = {
      myRoadmaps: [{ id: "old-roadmap", title: "Old" }],
      focusGraphs: { "old-roadmap:1": [node("old-task", "completed")] },
      themeMode: "dark",
    };
    const migrated = migrateDaySessionState(oldState);
    expect(migrated.daySessions).toEqual({});
    expect(migrated.daySessionRequestKeys).toEqual({});
    expect(migrated.focusGraphs).toBe(oldState.focusGraphs);
    expect(migrated.myRoadmaps).toBe(oldState.myRoadmaps);
    expect(migrated.themeMode).toBe("dark");
  });

  it("links generated metadata by TaskNode ID without extending TaskNode", () => {
    const session = storeGeneratedDaySession({
      roadmapId: "r1", dayNumber: 1, effectiveDay: 1, phase: "AMYGDALA_BYPASS",
      subskill: { id: "s1", title: "Основы", description: "Начало практики." },
      dailyBudgetSeconds: 120, creditedSecondsBefore: 0, projectedCreditedSeconds: 120,
      taskCount: 2, repeatedSubskill: null, modifiersRecycled: false,
      tasks: [
        { task: node("t1", "pending"), durationSeconds: 60, cognitiveRole: "SCAFFOLD_SETUP", icnuTrigger: { id: "i", category: "INTEREST", label: "I", instruction: "I" }, instruction: "Do it", evidenceMethod: "Save it" },
        { task: node("t2", "pending"), durationSeconds: 60, cognitiveRole: "MIND_SCULPT_ANCHOR", icnuTrigger: { id: "c", category: "CHALLENGE", label: "C", instruction: "C" }, instruction: "Do next", evidenceMethod: "Check it" },
      ],
    });

    expect(session.tasks.map((task) => task.taskId)).toEqual(["t1", "t2"]);
    expect(session.tasks[0]).not.toHaveProperty("task");
    expect(creditedSecondsForCompletedTasks(session, [node("t1", "completed"), node("t2", "skipped")])).toBe(60);
    expect(creditedSecondsForCompletedTasks(session, [node("t1", "completed"), node("t2", "completed")])).toBe(120);
  });

  it("adapts an old TaskNode graph without changing status, XP, or IDs", () => {
    const oldGraph = [node("old-1", "completed"), node("old-2", "pending")];
    const session = adaptLegacyTaskGraphToSession({
      roadmapId: "old-roadmap",
      roadmapTitle: "Old title",
      dayNumber: 1,
      dayTitle: "Old day",
      graph: oldGraph,
      createdAt: "2026-10-19T00:00:00.000Z",
    });
    expect(session.tasks.map((task) => task.taskId)).toEqual(["old-1", "old-2"]);
    expect(session.completedAt).toBeUndefined();
    expect(oldGraph).toMatchObject([{ status: "completed", xp_weight: 50 }, { status: "pending", xp_weight: 50 }]);
  });
});
