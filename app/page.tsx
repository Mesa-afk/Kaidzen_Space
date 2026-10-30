"use client";

import { useState } from "react";
import Link from "next/link";
import { enhancedDemoRoadmaps } from "@/lib/mock-data";
import { roadmapSourceId, type Roadmap } from "@/lib/roadmaps";
import { useKaizenStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { CardVisual } from "@/components/card-visual";
import { mockGenerateRoadmap } from "@/lib/mock-generate";
import { generateRoadmapSkeletonApi, isBackendEnabled } from "@/lib/api-client";
import { calculateTodayXp } from "@/lib/total-xp";
import { DayFocus } from "@/components/day-focus";
import { DayMetroLine } from "@/components/day-metro-line";
import { calculateCompletedDays, calculateDayProgress, findCurrentDay } from "@/lib/progress";
import type { TaskNode } from "@/lib/graph";
import { ProfileView } from "@/components/profile-view";
import { calculateLevel, calculateStreak } from "@/lib/progression";
import { calculateTotalXp } from "@/lib/total-xp";

type View = "repository" | "mine" | "profile";
type SortMode = "for-you" | "popular" | "recent";

export default function OpusHomePage() {
  const [view, setView] = useState<View>("repository");
  const [sortMode, setSortMode] = useState<SortMode>("for-you");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [selected, setSelected] = useState<Roadmap | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const hydrated = useHydrated();
  const {
    myRoadmaps,
    addRoadmap,
    removeRoadmap,
    themeMode,
    setThemeMode,
    soundEnabled,
    toggleSound,
    likedRoadmapIds,
    toggleLike,
    focusGraphs,
    setFocusGraph,
    userName,
    activeDates,
    currentUserEmail,
    avatarDataUrl,
  } = useKaizenStore();
  
  const totalXp = calculateTotalXp(focusGraphs);
  const levelInfo = calculateLevel(totalXp);
  const streakInfo = calculateStreak(activeDates, totalXp);
  
  const roadmaps = view === "repository" ? enhancedDemoRoadmaps : myRoadmaps;
  
  // Apply sorting
  const sortedRoadmaps = [...roadmaps].sort((a, b) => {
    if (sortMode === "popular") {
      return b.likes - a.likes || b.rating - a.rating;
    } else if (sortMode === "recent") {
      return b.id.localeCompare(a.id);
    }
    // "for-you" - liked items first
    const aLiked = likedRoadmapIds.includes(a.id) ? 1 : 0;
    const bLiked = likedRoadmapIds.includes(b.id) ? 1 : 0;
    return bLiked - aLiked || b.rating - a.rating;
  });
  
  const visible = sortedRoadmaps.filter((roadmap) => 
    roadmap.title.toLowerCase().includes(query.toLowerCase()) ||
    roadmap.description.toLowerCase().includes(query.toLowerCase())
  );

  const takeRoadmap = (roadmap: Roadmap) => {
    const sourceId = roadmapSourceId(roadmap);
    if (myRoadmaps.some((item) => roadmapSourceId(item) === sourceId)) {
      setView("mine");
      setSelected(null);
      return;
    }
    addRoadmap({ ...roadmap, id: crypto.randomUUID(), sourceId });
    setView("mine");
    setSelected(null);
  };

  const isOnShelf = (roadmap: Roadmap) => 
    myRoadmaps.some((item) => roadmapSourceId(item) === roadmapSourceId(roadmap));

  const removeFromShelf = (roadmap: Roadmap) => {
    removeRoadmap(roadmap.id);
    setSelected(null);
    setSelectedDay(null);
  };

  const openDay = (roadmap: Roadmap, dayNumber: number) => {
    const day = roadmap.days.find((item) => item.dayNumber === dayNumber);
    if (!day) return;
    setSelectedDay(dayNumber);
  };

  const navigateToRepository = () => {
    setView("repository");
    setSelected(null);
    setSelectedDay(null);
    setShowCreate(false);
  };

  const navigateToMine = () => {
    setView("mine");
    setSelected(null);
    setSelectedDay(null);
    setShowCreate(false);
  };

  const handleBrandClick = (event: React.MouseEvent) => {
    event.preventDefault();
    navigateToRepository();
  };

  const generateRoadmap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setCreateError("");
    
    try {
      const id = crypto.randomUUID();
      let roadmap: Roadmap;
      let dayGraphs: { dayNumber: number; tasks: TaskNode[] }[];

      if (isBackendEnabled()) {
        const generated = await generateRoadmapSkeletonApi(`${topic}\nУровень пользователя: ${level}`);
        roadmap = {
          id,
          sourceId: id,
          title: generated.folder_title,
          emoji: generated.emoji,
          description: generated.target_performance_level,
          level,
          likes: 0,
          rating: 0,
          author: "Ты",
          color: "mint",
          lovableProject: generated.lovable_project,
          targetPerformanceLevel: generated.target_performance_level,
          estimatedGlobalHours: generated.estimated_global_hours,
          subskills: generated.subskills.map((subskill) => ({
            id: subskill.id,
            title: subskill.title,
            description: subskill.description,
            startDay: subskill.day_start,
            endDay: subskill.day_end,
          })),
          days: generated.days.map((day) => ({
            dayNumber: day.day_number,
            title: day.title,
            subskillId: day.subskill_id,
            tasks: day.tasks.filter((task) => task.type === "task").map((task) => task.title),
          })),
        };
        dayGraphs = generated.days
          .filter((day) => day.tasks.length > 0)
          .map((day) => ({ dayNumber: day.day_number, tasks: day.tasks }));
      } else {
        const generated = await new Promise<ReturnType<typeof mockGenerateRoadmap>>((resolve) =>
          setTimeout(() => resolve(mockGenerateRoadmap(topic, level)), 1500)
        );
        roadmap = {
          id,
          sourceId: id,
          title: generated.project_title,
          emoji: generated.project_emoji,
          description: `Путь к цели «${topic}» — маленькими шагами и в своём темпе.`,
          level,
          likes: 0,
          rating: 0,
          author: "Ты",
          color: "mint",
          days: generated.days.map((day) => ({
            dayNumber: day.day_number,
            title: `Фокус дня ${day.day_number}`,
            tasks: day.tasks.filter((task) => task.type === "task").map((task) => task.title),
          })),
        };
        dayGraphs = generated.days.map((day) => ({ dayNumber: day.day_number, tasks: day.tasks }));
      }

      dayGraphs.forEach(({ dayNumber, tasks }) => setFocusGraph(`${id}:${dayNumber}`, tasks));
      
      addRoadmap(roadmap);
      setView("mine");
      setShowCreate(false);
      setSelected(roadmap);
      setTopic("");
      setLevel("");
    } catch (error) {
      setCreateError(
        error instanceof Error 
          ? error.message 
          : "Что-то пошло не так. Попробуй ещё раз."
      );
    } finally {
      setGenerating(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="opus-shell">
        <div className="opus-sidebar" />
        <main className="opus-main">
          <div className="opus-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
            <p style={{ color: "var(--text-tertiary)" }}>Загрузка...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="opus-shell">
      {/* Sidebar */}
      <aside className="opus-sidebar">
        <button
          type="button"
          onClick={handleBrandClick}
          className="opus-brand"
          aria-label="На главную"
        >
          <div className="opus-brand-mark">k</div>
          <span className="opus-brand-text">
            kaizen<span className="opus-brand-light">space</span>
          </span>
        </button>

        <nav className="opus-nav">
          <div className="opus-nav-section">
            <div className="opus-nav-label">Твоё пространство</div>
            <button
              className={`opus-nav-item ${view === "repository" ? "active" : ""}`}
              onClick={navigateToRepository}
            >
              <span className="opus-nav-item-icon">🗂</span>
              Каталог
            </button>
            <button
              className={`opus-nav-item ${view === "mine" ? "active" : ""}`}
              onClick={navigateToMine}
            >
              <span className="opus-nav-item-icon">📚</span>
              Моя полка
            </button>
          </div>
        </nav>

        {/* Profile & Settings at bottom */}
        <div className="opus-profile-section">
          <button
            type="button"
            className={`opus-profile-btn ${view === "profile" ? "active" : ""}`}
            onClick={() => {
              setView("profile");
              setSelected(null);
              setSelectedDay(null);
              setShowCreate(false);
            }}
            aria-label="Профиль пользователя"
            title="Открыть профиль"
          >
            <div className="opus-profile-avatar">
              {avatarDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarDataUrl} alt="" className="opus-profile-avatar-img" />
              ) : (
                userName.slice(0, 1).toUpperCase() || "У"
              )}
            </div>
            <div className="opus-profile-info">
              <div className="opus-profile-name">{userName}</div>
              <div className="opus-profile-xp">
                Ур. {levelInfo.level} · 🔥 {streakInfo.currentStreak} дн.
              </div>
            </div>
          </button>
          
          {!currentUserEmail && (
            <div className="opus-auth-actions">
              <Link href="/login" className="btn btn-secondary btn-sm">
                Войти
              </Link>
              <Link href="/register" className="btn btn-ghost btn-sm">
                Регистрация
              </Link>
            </div>
          )}

          <div className="opus-settings-row">
            <button
              className="opus-settings-btn"
              onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
              aria-label={themeMode === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
            >
              {themeMode === "light" ? "🌙" : "☀️"}
            </button>
            <button
              className="opus-settings-btn"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Выключить звук" : "Включить звук"}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="opus-main">
        {/* Focus view when a day is selected */}
        {selectedDay !== null && selected ? (
          <DayFocus
            key={`${selected.id}:${selectedDay}`}
            roadmapTitle={selected.title}
            roadmap={selected}
            dayNumber={selectedDay}
            storageKey={`${selected.id}:${selectedDay}`}
            onBack={() => setSelectedDay(null)}
          />
        ) : selected ? (
          /* Roadmap detail view */
          <div className="opus-content">
            <header className="opus-detail-header">
              <button 
                className="opus-back-btn"
                onClick={() => setSelected(null)}
              >
                ← Назад
              </button>
              
              <div className="opus-detail-title-row">
                <div className="opus-detail-visual">
                  <CardVisual emoji={selected.emoji} color={selected.color} themeMode={themeMode} />
                </div>
                <div>
                  <h1 className="opus-detail-title">{selected.title}</h1>
                  <p className="opus-detail-description">{selected.description}</p>
                </div>
              </div>
              
              <div className="opus-detail-actions">
                {isOnShelf(selected) ? (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => removeFromShelf(selected)}
                  >
                    Удалить с полки
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={() => takeRoadmap(selected)}
                  >
                    Добавить на полку
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => toggleLike(selected.id)}
                >
                  {likedRoadmapIds.includes(selected.id) ? "💙" : "🤍"}
                </button>
              </div>
            </header>
            
            {(() => {
              const completedDays = calculateCompletedDays(selected.id, selected.days.length, focusGraphs);
              const currentDay = findCurrentDay(selected.id, selected.days.length, focusGraphs);
              const dayProgress = Object.fromEntries(selected.days.map((day) => {
                const graph = focusGraphs[`${selected.id}:${day.dayNumber}`];
                return [day.dayNumber, graph ? calculateDayProgress(graph).percentage : 0];
              }));
              return (
                <DayMetroLine
                  days={selected.days}
                  completedDays={completedDays}
                  currentDay={currentDay}
                  dayProgress={dayProgress}
                  onDayClick={(dayNumber) => openDay(selected, dayNumber)}
                />
              );
            })()}
          </div>
        ) : view === "profile" ? (
          <ProfileView
            onBack={navigateToRepository}
            onNavigateToCatalog={navigateToRepository}
          />
        ) : (
          /* Catalog/Shelf view */
          <div className="opus-content">
            {/* Section header */}
            <header className="opus-section-header">
              <h1 className="opus-section-title">
                {view === "repository" ? "Каталог" : "Моя полка"}
              </h1>
              <p className="opus-section-subtitle">
                {view === "repository" 
                  ? "Готовые маршруты для освоения новых навыков — выбери и начни сегодня."
                  : "Твои сохранённые маршруты и прогресс — продолжай с того места, где остановился."
                }
              </p>
            </header>

          {/* Filter bar and create button */}
          <div className="opus-filter-bar">
            <input
              type="search"
              className="input opus-search-input"
              placeholder="Найти маршрут..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            
            {view === "repository" && (
              <>
                <div className="opus-sort-tabs">
                  <button
                    className={`opus-sort-tab ${sortMode === "for-you" ? "active" : ""}`}
                    onClick={() => setSortMode("for-you")}
                  >
                    Для тебя
                  </button>
                  <button
                    className={`opus-sort-tab ${sortMode === "popular" ? "active" : ""}`}
                    onClick={() => setSortMode("popular")}
                  >
                    Популярные
                  </button>
                  <button
                    className={`opus-sort-tab ${sortMode === "recent" ? "active" : ""}`}
                    onClick={() => setSortMode("recent")}
                  >
                    Новые
                  </button>
                </div>
                
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreate(true)}
                >
                  + Создать свой
                </button>
              </>
            )}
          </div>

          {/* Create roadmap form */}
          {showCreate && (
            <div className="m3-create-panel" style={{
              marginBottom: "var(--space-8)",
              padding: "var(--space-6)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)"
            }}>
              <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-xl)", fontWeight: 600 }}>
                Создать роудмап
              </h3>
              <form onSubmit={generateRoadmap} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <label htmlFor="topic" style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
                    Чему хочешь научиться?
                  </label>
                  <input
                    id="topic"
                    className="input"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Например: играть на гитаре, готовить пасту..."
                    required
                    disabled={generating}
                  />
                </div>
                <div>
                  <label htmlFor="level" style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
                    Твой уровень
                  </label>
                  <select
                    id="level"
                    className="input"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    required
                    disabled={generating}
                  >
                    <option value="">Выбери уровень</option>
                    <option value="Начальный">Начальный — я никогда этого не делал</option>
                    <option value="Базовый">Базовый — пробовал, но не уверен</option>
                    <option value="Средний">Средний — уже есть опыт</option>
                  </select>
                </div>
                {createError && (
                  <div style={{ padding: "var(--space-3)", background: "var(--state-error-bg)", border: "1px solid var(--state-error-border)", borderRadius: "var(--radius-md)", color: "var(--state-error-text)", fontSize: "var(--text-sm)" }}>
                    {createError}
                  </div>
                )}
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <button type="submit" className="btn btn-primary" disabled={generating}>
                    {generating ? "Создаю..." : "Создать маршрут"}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowCreate(false);
                      setTopic("");
                      setLevel("");
                      setCreateError("");
                    }}
                    disabled={generating}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Cards grid */}
          {visible.length === 0 ? (
            <div className="opus-empty-state">
              <div className="opus-empty-icon">
                {view === "repository" ? "🔍" : "📚"}
              </div>
              <h2 className="opus-empty-title">
                {view === "repository" ? "Ничего не найдено" : "Твоя полка пока пуста"}
              </h2>
              <p className="opus-empty-text">
                {view === "repository" 
                  ? "Попробуй изменить запрос или сбросить фильтры."
                  : "Сохрани маршрут из каталога, чтобы начать своё путешествие."
                }
              </p>
              {view === "mine" && (
                <button className="btn btn-primary" onClick={navigateToRepository}>
                  Перейти в каталог
                </button>
              )}
            </div>
          ) : (
            <div className="opus-cards-grid">
              {visible.map((roadmap, index) => {
                const completedDays = calculateCompletedDays(roadmap.id, roadmap.days.length, focusGraphs);
                const progressPercent = roadmap.days.length > 0 
                  ? Math.round((completedDays.length / roadmap.days.length) * 100) 
                  : 0;
                
                return (
                  <button
                    key={roadmap.id}
                    className="opus-roadmap-card"
                    style={{ "--m3-stagger": Math.min(index, 11) } as React.CSSProperties}
                    onClick={() => setSelected(roadmap)}
                  >
                    {/* Progress bar for shelf cards */}
                    {view === "mine" && (
                      <div className="opus-card-progress">
                        <div 
                          className="opus-card-progress-fill" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Standardized visual with emoji */}
                    <div className="opus-card-visual">
                      <CardVisual emoji={roadmap.emoji} color={roadmap.color} themeMode={themeMode} />
                    </div>
                    
                    {/* Content */}
                    <div className="opus-card-content">
                      <h3 className="opus-card-title">{roadmap.title}</h3>
                      <p className="opus-card-description">{roadmap.description}</p>
                      
                      {/* Simplified meta - less cluttered */}
                      <div className="opus-card-meta">
                        <div className="opus-card-meta-left">
                          <span className="opus-card-level">{roadmap.level}</span>
                        </div>
                        <div className="opus-card-meta-right">
                          <span className="opus-card-stat">
                            ⭐ {roadmap.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          </div>
        )}
      </main>
    </div>
  );
}
