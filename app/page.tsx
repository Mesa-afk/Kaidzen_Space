"use client";

import { useState } from "react";
import { enhancedDemoRoadmaps } from "@/lib/mock-data";
import { type Roadmap } from "@/lib/roadmaps";
import { useKaizenStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { CardVisual } from "@/components/card-visual";
import { mockGenerateRoadmap } from "@/lib/mock-generate";
import { generateRoadmapApi, isBackendEnabled } from "@/lib/api-client";

type View = "repository" | "mine";
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
  
  const hydrated = useHydrated();
  const { myRoadmaps, addRoadmap, themeMode, setThemeMode, soundEnabled, toggleSound, likedRoadmapIds } = useKaizenStore();
  
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

  const generateRoadmap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setCreateError("");
    
    try {
      const generated = isBackendEnabled()
        ? await generateRoadmapApi(topic, level)
        : await new Promise<ReturnType<typeof mockGenerateRoadmap>>((resolve) => 
            setTimeout(() => resolve(mockGenerateRoadmap(topic, level)), 1500)
          );
      
      const id = crypto.randomUUID();
      const roadmap: Roadmap = {
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
      
      addRoadmap(roadmap);
      setView("mine");
      setShowCreate(false);
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
        <a href="#" className="opus-brand">
          <div className="opus-brand-mark">k</div>
          <span className="opus-brand-text">
            kaizen<span className="opus-brand-light">space</span>
          </span>
        </a>

        <nav className="opus-nav">
          <div className="opus-nav-section">
            <div className="opus-nav-label">Твоё пространство</div>
            <button
              className={`opus-nav-item ${view === "repository" ? "active" : ""}`}
              onClick={() => setView("repository")}
            >
              <span className="opus-nav-item-icon">🗂</span>
              Каталог
            </button>
            <button
              className={`opus-nav-item ${view === "mine" ? "active" : ""}`}
              onClick={() => setView("mine")}
            >
              <span className="opus-nav-item-icon">📚</span>
              Моя полка
            </button>
          </div>
        </nav>

        {/* Profile & Settings at bottom */}
        <div className="opus-profile-section">
          <div className="opus-profile">
            <div className="opus-profile-avatar">У</div>
            <div className="opus-profile-info">
              <div className="opus-profile-name">Пользователь</div>
              <div className="opus-profile-xp">0 XP сегодня</div>
            </div>
          </div>
          
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
            <div style={{
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
                <button className="btn btn-primary" onClick={() => setView("repository")}>
                  Перейти в каталог
                </button>
              )}
            </div>
          ) : (
            <div className="opus-cards-grid">
              {visible.map((roadmap) => {
                const isLiked = likedRoadmapIds.includes(roadmap.id);
                
                return (
                  <button
                    key={roadmap.id}
                    className="opus-roadmap-card"
                    onClick={() => {
                      // TODO: Open roadmap detail
                      console.log("Open roadmap:", roadmap.id);
                    }}
                  >
                    {/* Progress bar for shelf cards */}
                    {view === "mine" && (
                      <div className="opus-card-progress">
                        <div 
                          className="opus-card-progress-fill" 
                          style={{ width: "0%" }} // TODO: Calculate real progress
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
      </main>
    </div>
  );
}
