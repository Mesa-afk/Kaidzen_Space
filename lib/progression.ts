/**
 * Progression system for Kaizen: Levels, XP curves, and Streaks
 */

export type LevelInfo = {
  level: number;
  title: string;
  totalXp: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  xpRemaining: number;
  progressPercent: number;
  nextLevel: number;
};

export type WeekDayStatus = {
  dayName: string;
  dateStr: string;
  isToday: boolean;
  isCompleted: boolean;
};

export type StreakInfo = {
  currentStreak: number;
  isLitToday: boolean;
  needsPracticeToday: boolean;
  weekDays: WeekDayStatus[];
  motivation: string;
};

const LEVEL_TITLES: Record<number, string> = {
  1: "Новичок",
  2: "Искатель",
  3: "Ученик",
  4: "Практик",
  5: "Энтузиаст",
  6: "Мастер шагов",
  7: "Кайдзен-адепт",
  8: "Наставник",
  9: "Гуру фокуса",
  10: "Легенда Кайдзен",
};

/**
 * Calculate required XP to advance from `level` to `level + 1`.
 * Each level requires 50 more XP than the previous one:
 * L1 -> L2: 100 XP
 * L2 -> L3: 150 XP
 * L3 -> L4: 200 XP
 * L4 -> L5: 250 XP
 * L5 -> L6: 300 XP
 * L6 -> L7: 350 XP
 */
export function getXpRequiredForLevel(level: number): number {
  if (level < 1) return 100;
  return 100 + (level - 1) * 50;
}

/**
 * Calculates user level and progress towards the next level from total XP.
 */
export function calculateLevel(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  
  let currentLevel = 1;
  let accumulatedXp = 0;
  
  while (true) {
    const required = getXpRequiredForLevel(currentLevel);
    if (safeXp < accumulatedXp + required) {
      const currentLevelXp = safeXp - accumulatedXp;
      const xpRemaining = required - currentLevelXp;
      const progressPercent = Math.min(100, Math.max(0, Math.round((currentLevelXp / required) * 100)));
      const title = LEVEL_TITLES[currentLevel] || (currentLevel >= 10 ? "Легенда Кайдзен" : "Мастер");
      
      return {
        level: currentLevel,
        title,
        totalXp: safeXp,
        currentLevelXp,
        xpForNextLevel: required,
        xpRemaining,
        progressPercent,
        nextLevel: currentLevel + 1,
      };
    }
    accumulatedXp += required;
    currentLevel++;
  }
}

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates current streak and 7-day week schedule from active dates
 */
export function calculateStreak(activeDates: string[] = [], totalXp: number = 0, currentDate?: Date): StreakInfo {
  // Use provided date or stable fallback during SSR to avoid Next.js prerender error
  const now = currentDate ?? (typeof window !== "undefined" ? new Date() : new Date("2026-10-30T00:00:00Z"));
  const todayStr = formatDateKey(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);
  
  const dateSet = new Set(activeDates);
  
  // If user has total XP but no logged dates yet (legacy data), treat today as active
  if (totalXp > 0 && activeDates.length === 0) {
    dateSet.add(todayStr);
  }
  
  const isLitToday = dateSet.has(todayStr);
  const isLitYesterday = dateSet.has(yesterdayStr);
  const needsPracticeToday = !isLitToday && isLitYesterday;
  
  let currentStreak = 0;
  
  if (isLitToday || isLitYesterday) {
    // Count consecutive days going backwards
    const cursor = new Date(now);
    if (!isLitToday && isLitYesterday) {
      cursor.setDate(cursor.getDate() - 1);
    }
    
    while (true) {
      const cursorStr = formatDateKey(cursor);
      if (dateSet.has(cursorStr)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  // Build week calendar (Monday to Sunday containing today)
  const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - currentDayOfWeek);
  
  const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const weekDays: WeekDayStatus[] = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = formatDateKey(d);
    weekDays.push({
      dayName: DAY_NAMES[i],
      dateStr,
      isToday: dateStr === todayStr,
      isCompleted: dateSet.has(dateStr),
    });
  }
  
  let motivation = "Начни свой стрик! Сделай один шаг сегодня 🔥";
  if (currentStreak > 0) {
    if (isLitToday) {
      motivation = currentStreak === 1
        ? "Огонёк зажжён! Отличное начало первого дня 🔥"
        : `Огонёк горит! ${currentStreak} дней непрерывного роста 🔥`;
    } else {
      motivation = `Сохрани стрик ${currentStreak} дн.! Сделай шаг сегодня, чтобы огонёк не угас 🔥`;
    }
  }
  
  return {
    currentStreak,
    isLitToday,
    needsPracticeToday,
    weekDays,
    motivation,
  };
}
