/** Fixed learning-sprint targets based on the Kaufman 20-hour method. */
export const KAUFMAN_SPRINT_HOURS = 20;
export const KAUFMAN_SPRINT_MINUTES = KAUFMAN_SPRINT_HOURS * 60;
export const KAUFMAN_SPRINT_DAYS = 66;

export type SchedulerPhase =
  | "AMYGDALA_BYPASS"
  | "RAMP_UP"
  | "KAUFMAN_CRUISE"
  | "RSD_RECOVERY";

export type RsdRecovery = {
  effectiveDay: number;
  phase: SchedulerPhase;
};

export type SpacedRepetitionEntry = {
  day: number;
  subskillId: string;
};

const DAY_ONE_BUDGET_MINUTES = 2;
const DAILY_RAMP_MINUTES = 1.5;
const CRUISE_BUDGET_MINUTES = 20;

function assertEffectiveDay(day: number): void {
  if (!Number.isSafeInteger(day) || day < 1) {
    throw new RangeError("Effective day must be a positive integer");
  }
}

export function getSchedulerPhase(effectiveDay: number): Exclude<SchedulerPhase, "RSD_RECOVERY"> {
  assertEffectiveDay(effectiveDay);
  if (effectiveDay <= 7) return "AMYGDALA_BYPASS";
  if (effectiveDay <= 13) return "RAMP_UP";
  return "KAUFMAN_CRUISE";
}

/** Daily planned work budget, in minutes, for the effective sprint day. */
export function calculateDailyBudget(d: number): number {
  assertEffectiveDay(d);
  if (d === 1) return DAY_ONE_BUDGET_MINUTES;
  if (d <= 7) return DAY_ONE_BUDGET_MINUTES + DAILY_RAMP_MINUTES * (d - 1);
  if (d <= 13) return 11 + DAILY_RAMP_MINUTES * (d - 7);
  return CRUISE_BUDGET_MINUTES;
}

/**
 * Rewinds the effective day after a difficult/missed streak. This only returns
 * scheduling metadata: accumulated minutes and XP are deliberately untouched.
 */
export function applyRsdRecovery(
  currentEffectiveDay: number,
  daysMissed: number,
  wasTooHard = false,
): RsdRecovery {
  assertEffectiveDay(currentEffectiveDay);
  if (!Number.isSafeInteger(daysMissed) || daysMissed < 0) {
    throw new RangeError("Days missed must be a non-negative integer");
  }

  if (daysMissed >= 2 || wasTooHard) {
    return {
      effectiveDay: Math.max(1, currentEffectiveDay - 3),
      phase: "RSD_RECOVERY",
    };
  }

  return {
    effectiveDay: currentEffectiveDay,
    phase: getSchedulerPhase(currentEffectiveDay),
  };
}

export function calculateTaskCount(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes < 0) {
    throw new RangeError("Minutes must be a finite non-negative number");
  }
  return Math.min(10, Math.max(2, Math.round(minutes / 2.2)));
}

const KAUFMAN_ROLE_SEQUENCE = [
  "SCAFFOLD_SETUP",
  "MIND_SCULPT_ANCHOR",
  "MENTAL_HOOK",
  "FAST_FEEDBACK_DRILL",
  "INVERSION_PLAY",
  "SPACED_RETRIEVAL",
  "SPEED_SPRINT",
  "BIO_RESET",
  "CHALLENGE_TWIST",
  "PROJECT_BUILD",
] as const;

export type CognitiveRole = (typeof KAUFMAN_ROLE_SEQUENCE)[number];

/** Returns the first N Kaufman cognitive roles in their prescribed order. */
export function selectCognitiveRoles(taskCount: number): CognitiveRole[] {
  if (!Number.isSafeInteger(taskCount) || taskCount < 2 || taskCount > 10) {
    throw new RangeError("Task count must be an integer from 2 through 10");
  }
  return KAUFMAN_ROLE_SEQUENCE.slice(0, taskCount);
}

/**
 * Returns the most overdue subskill due for review, prioritizing day-30,
 * then day-7, then day-1 repetition. History is read-only and never mutated.
 */
export function getSpacedRepetitionSubskill(
  currentDay: number,
  history: readonly SpacedRepetitionEntry[],
): string | null {
  assertEffectiveDay(currentDay);
  const reviewDays = [currentDay - 30, currentDay - 7, currentDay - 1];
  for (const reviewDay of reviewDays) {
    if (reviewDay < 1) continue;
    const entry = history.find((item) => item.day === reviewDay && item.subskillId.length > 0);
    if (entry) return entry.subskillId;
  }
  return null;
}
