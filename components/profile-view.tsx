"use client";

import { useEffect, useState } from "react";
import { useKaizenStore } from "@/lib/store";
import { calculateLevel, calculateStreak } from "@/lib/progression";
import { calculateTotalXp } from "@/lib/total-xp";

type ProfileViewProps = {
  onBack: () => void;
  onNavigateToCatalog: () => void;
};

/** Плавный count-up чисел профиля (кривая ease-out, как M3 emphasized-decelerate). */
function useAnimatedNumber(target: number, durationMs = 900) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(() => (prefersReducedMotion ? target : 0));

  useEffect(() => {
    if (target <= 0 || prefersReducedMotion) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, prefersReducedMotion]);

  return value;
}

export function ProfileView({ onBack, onNavigateToCatalog }: ProfileViewProps) {
  const {
    userName,
    setUserName,
    activeDates,
    focusGraphs,
    myRoadmaps,
  } = useKaizenStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  const totalXp = calculateTotalXp(focusGraphs);
  const levelInfo = calculateLevel(totalXp);
  const streakInfo = calculateStreak(activeDates, totalXp);
  const animatedTotalXp = useAnimatedNumber(totalXp);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const completedRoadmapsCount = myRoadmaps.filter((roadmap) => {
    if (!roadmap.days || roadmap.days.length === 0) return false;
    return roadmap.days.every((day) => {
      const graph = focusGraphs[`${roadmap.id}:${day.dayNumber}`];
      if (!graph) return false;
      const completedXp = graph
        .filter((t) => t.type === "task" && t.status === "completed")
        .reduce((sum, t) => sum + (t.xp_weight || 0), 0);
      return completedXp >= 100;
    });
  }).length;

  return (
    <div className="opus-content profile-page">
      {/* Top Navigation */}
      <button className="opus-back-btn" onClick={onBack}>
        ← Назад к роудмапам
      </button>

      {/* User Header Card */}
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          <span>{userName.slice(0, 1).toUpperCase() || "У"}</span>
          <div className="profile-avatar-badge" title="Активный ученик">
            ✨
          </div>
        </div>

        <div className="profile-header-info">
          <div className="profile-name-row">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="profile-name-form">
                <input
                  type="text"
                  className="input profile-name-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Сохранить
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setNameInput(userName);
                    setIsEditingName(false);
                  }}
                >
                  Отмена
                </button>
              </form>
            ) : (
              <div className="profile-name-display">
                <h1 className="profile-name">{userName}</h1>
                <button
                  className="profile-edit-name-btn"
                  onClick={() => setIsEditingName(true)}
                  title="Изменить имя"
                  aria-label="Изменить имя"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>

          <div className="profile-header-badges">
            <span className="profile-rank-pill">
              {levelInfo.title}
            </span>
            <span className="profile-meta-pill">
              Уровень {levelInfo.level}
            </span>
            <span className="profile-meta-pill">
              🔥 {streakInfo.currentStreak} дн. стрик
            </span>
          </div>
        </div>
      </div>

      {/* Global XP & Level Progression Card */}
      <div className="profile-card profile-xp-card">
        <div className="profile-card-header">
          <div>
            <span className="profile-eyebrow">ГЛОБАЛЬНАЯ ШКАЛА ОПЫТА</span>
            <h2 className="profile-level-title">
              Уровень {levelInfo.level} <span className="profile-level-subtitle">· {levelInfo.title}</span>
            </h2>
          </div>
          <div className="profile-total-xp">
            <span className="profile-total-xp-label">Всего за всё время</span>
            <span className="profile-total-xp-value tabular">
              {animatedTotalXp.toLocaleString()} XP
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="profile-progress-wrap">
          <div className="profile-progress-bar-bg">
            <div
              className="profile-progress-bar-fill"
              style={{ width: `${Math.max(5, levelInfo.progressPercent)}%` }}
            >
              <div className="profile-progress-shimmer" />
            </div>
          </div>
          <div className="profile-progress-meta">
            <span className="tabular">
              {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel} XP ({levelInfo.progressPercent}%)
            </span>
            <span>
              До уровня {levelInfo.nextLevel} осталось <strong>{levelInfo.xpRemaining} XP</strong>
            </span>
          </div>
        </div>

        <div className="profile-formula-note">
          <span className="profile-formula-icon">📈</span>
          <p>
            <strong>Нарастающая система уровней:</strong> С каждым новым уровнем для перехода требуется на 50 XP больше, чем для предыдущего. Чем выше мастерство, тем весомее каждый завершённый шаг.
          </p>
        </div>
      </div>

      {/* TikTok Flame Streak Card */}
      <div className={`profile-card profile-streak-card ${streakInfo.isLitToday ? "streak-burning" : ""}`}>
        <div className="profile-streak-body">
          {/* Animated Flame Icon */}
          <div className="streak-flame-wrapper">
            <div className="streak-flame-aura" />
            <div className="streak-flame-icon">🔥</div>
          </div>

          <div className="streak-info-content">
            <div className="streak-badge-row">
              <span className="streak-tag">СТРИК РОУДМАПОВ</span>
              {streakInfo.isLitToday && (
                <span className="streak-status-pill burning">Огонёк горит!</span>
              )}
              {streakInfo.needsPracticeToday && (
                <span className="streak-status-pill warning">Нужно позаниматься</span>
              )}
            </div>

            <h3 className="streak-count-title">
              {streakInfo.currentStreak}{" "}
              <span className="streak-count-unit">
                {streakInfo.currentStreak === 1
                  ? "день подряд"
                  : streakInfo.currentStreak >= 2 && streakInfo.currentStreak <= 4
                  ? "дня подряд"
                  : "дней подряд"}
              </span>
            </h3>

            <p className="streak-motivation-text">{streakInfo.motivation}</p>
          </div>
        </div>

        {/* 7-Day Week Strip */}
        <div className="streak-week-strip">
          <div className="streak-week-label">Эта неделя:</div>
          <div className="streak-week-days">
            {streakInfo.weekDays.map((day) => (
              <div
                key={day.dateStr}
                className={`streak-day-chip ${day.isCompleted ? "completed" : ""} ${day.isToday ? "today" : ""}`}
              >
                <span className="streak-day-name">{day.dayName}</span>
                <span className="streak-day-indicator">
                  {day.isCompleted ? "🔥" : day.isToday ? "⏳" : "·"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-box">
          <span className="profile-stat-icon">⚡</span>
          <span className="profile-stat-value tabular">{animatedTotalXp.toLocaleString()}</span>
          <span className="profile-stat-label">Всего XP за всё время</span>
        </div>

        <div className="profile-stat-box">
          <span className="profile-stat-icon">🏆</span>
          <span className="profile-stat-value">Ур. {levelInfo.level}</span>
          <span className="profile-stat-label">{levelInfo.title}</span>
        </div>

        <div className="profile-stat-box">
          <span className="profile-stat-icon">🔥</span>
          <span className="profile-stat-value tabular">{streakInfo.currentStreak} дн.</span>
          <span className="profile-stat-label">Текущий стрик обучения</span>
        </div>

        <div className="profile-stat-box">
          <span className="profile-stat-icon">📚</span>
          <span className="profile-stat-value tabular">{myRoadmaps.length}</span>
          <span className="profile-stat-label">
            Маршрутов на полке ({completedRoadmapsCount} пройдено)
          </span>
        </div>
      </div>

      {/* Call to action */}
      <div className="profile-footer-actions">
        <button className="btn btn-primary" onClick={onNavigateToCatalog}>
          Продолжить обучение →
        </button>
      </div>
    </div>
  );
}
