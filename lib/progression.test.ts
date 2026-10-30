import { describe, it, expect } from "vitest";
import { calculateLevel, getXpRequiredForLevel, calculateStreak, formatDateKey } from "./progression";

describe("progression level curve", () => {
  it("starts at level 1 with 0 XP", () => {
    const info = calculateLevel(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe("Новичок");
    expect(info.currentLevelXp).toBe(0);
    expect(info.xpForNextLevel).toBe(100);
    expect(info.progressPercent).toBe(0);
    expect(info.xpRemaining).toBe(100);
  });

  it("escalates required XP per level", () => {
    expect(getXpRequiredForLevel(1)).toBe(100);
    expect(getXpRequiredForLevel(2)).toBe(150);
    expect(getXpRequiredForLevel(3)).toBe(200);
    expect(getXpRequiredForLevel(4)).toBe(250);
    expect(getXpRequiredForLevel(5)).toBe(300);
    expect(getXpRequiredForLevel(6)).toBe(350);
  });

  it("calculates level progression accurately across levels", () => {
    // 100 XP -> exact start of Level 2
    const lvl2 = calculateLevel(100);
    expect(lvl2.level).toBe(2);
    expect(lvl2.currentLevelXp).toBe(0);
    expect(lvl2.xpForNextLevel).toBe(150);
    expect(lvl2.progressPercent).toBe(0);

    // 175 XP -> 50% through Level 2 (75 / 150)
    const lvl2Half = calculateLevel(175);
    expect(lvl2Half.level).toBe(2);
    expect(lvl2Half.currentLevelXp).toBe(75);
    expect(lvl2Half.progressPercent).toBe(50);
    expect(lvl2Half.xpRemaining).toBe(75);

    // 1300 XP (user's XP in screenshot)
    // L1: 0..100 (100)
    // L2: 100..250 (150)
    // L3: 250..450 (200)
    // L4: 450..700 (250)
    // L5: 700..1000 (300)
    // L6: 1000..1350 (350)
    // At 1300 XP -> Level 6, 300 / 350 XP = 86%
    const userLvl = calculateLevel(1300);
    expect(userLvl.level).toBe(6);
    expect(userLvl.title).toBe("Мастер шагов");
    expect(userLvl.currentLevelXp).toBe(300);
    expect(userLvl.xpForNextLevel).toBe(350);
    expect(userLvl.progressPercent).toBe(86);
    expect(userLvl.xpRemaining).toBe(50);
  });
});

describe("streak calculations", () => {
  it("calculates active streak today", () => {
    const today = formatDateKey(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateKey(yesterday);

    const streak = calculateStreak([yesterdayStr, today], 200);
    expect(streak.currentStreak).toBe(2);
    expect(streak.isLitToday).toBe(true);
    expect(streak.needsPracticeToday).toBe(false);
  });

  it("handles legacy user with total XP > 0", () => {
    const streak = calculateStreak([], 1300);
    expect(streak.currentStreak).toBe(1);
    expect(streak.isLitToday).toBe(true);
  });
});
