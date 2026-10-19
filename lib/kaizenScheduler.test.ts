import { describe, expect, it } from "vitest";
import {
  applyRsdRecovery,
  calculateDailyBudget,
  calculateTaskCount,
  getSchedulerPhase,
  getSpacedRepetitionSubskill,
  KAUFMAN_SPRINT_DAYS,
  KAUFMAN_SPRINT_HOURS,
  KAUFMAN_SPRINT_MINUTES,
  selectCognitiveRoles,
} from "./kaizenScheduler";
import { ICNU_MODIFIERS, pickDailyModifiers } from "./icnuModifiers";

describe("Kaufman scheduler", () => {
  it("exports fixed sprint targets and phase budgets", () => {
    expect([KAUFMAN_SPRINT_HOURS, KAUFMAN_SPRINT_MINUTES, KAUFMAN_SPRINT_DAYS]).toEqual([20, 1200, 66]);
    expect([1, 2, 7, 8, 13, 14, 66].map(calculateDailyBudget)).toEqual([2, 3.5, 11, 12.5, 20, 20, 20]);
    expect([1, 7, 8, 13, 14].map(getSchedulerPhase)).toEqual([
      "AMYGDALA_BYPASS", "AMYGDALA_BYPASS", "RAMP_UP", "RAMP_UP", "KAUFMAN_CRUISE",
    ]);
  });

  it("rewinds only the effective day for RSD recovery", () => {
    expect(applyRsdRecovery(12, 2)).toEqual({ effectiveDay: 9, phase: "RSD_RECOVERY" });
    expect(applyRsdRecovery(2, 0, true)).toEqual({ effectiveDay: 1, phase: "RSD_RECOVERY" });
    expect(applyRsdRecovery(8, 1)).toEqual({ effectiveDay: 8, phase: "RAMP_UP" });
  });

  it("calculates task count and returns the role prefix for each task count", () => {
    expect([0, 4.4, 100].map(calculateTaskCount)).toEqual([2, 2, 10]);
    expect(selectCognitiveRoles(2)).toEqual(["SCAFFOLD_SETUP", "MIND_SCULPT_ANCHOR"]);
    expect(selectCognitiveRoles(3)).toEqual(["SCAFFOLD_SETUP", "MIND_SCULPT_ANCHOR", "MENTAL_HOOK"]);
    expect(selectCognitiveRoles(10)).toHaveLength(10);
  });

  it("selects the most overdue spaced repetition subskill", () => {
    const history = [
      { day: 30, subskillId: "yesterday" },
      { day: 3, subskillId: "week-from-day-10" },
      { day: 23, subskillId: "week" },
      { day: 1, subskillId: "month" },
    ];
    expect(getSpacedRepetitionSubskill(31, history)).toBe("month");
    expect(getSpacedRepetitionSubskill(10, history)).toBe("week-from-day-10");
    expect(getSpacedRepetitionSubskill(30, [])).toBeNull();
  });
});

describe("ICNU modifier catalog", () => {
  it("contains 60 unique modifiers and deterministically avoids used IDs", () => {
    expect(ICNU_MODIFIERS).toHaveLength(60);
    expect(new Set(ICNU_MODIFIERS.map((modifier) => modifier.id)).size).toBe(60);
    const used = ICNU_MODIFIERS.slice(0, 2).map((modifier) => modifier.id);
    const picked = pickDailyModifiers(used);
    expect(picked).toEqual(ICNU_MODIFIERS.slice(2, 4));
    expect(pickDailyModifiers(used)).toEqual(picked);
    expect(pickDailyModifiers(ICNU_MODIFIERS.map((modifier) => modifier.id))).toEqual([]);
  });
});
