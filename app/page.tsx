"use client";

import { useState } from "react";
import { enhancedDemoRoadmaps } from "@/lib/mock-data";
import { type Roadmap } from "@/lib/roadmaps";
import { useKaizenStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { CardVisual } from "@/components/card-visual";

type View = "repository" | "mine";
type SortMode = "for-you" | "popular" | "recent";

/**
 * Map roadmap categories to visual themes
 */
function getCategoryFromRoadmap(roadmap: Roadmap): "art" | "language" | "music" | "yoga" | "cooking" | "code" | "writing" | "default" {
  const title = roadmap.title.toLowerCase();
  if (title.includes("акварель") || title.includes("рисован") || title.includes("art")) return "art";
  if (title.includes("английск") || title.includes("язык") || title.includes("language")) return "language";
  if (title.includes("музык") || title.includes("music") || title.includes("гитар")) return "music";
  if (title.includes("йога") || title.includes("yoga")) return "yoga";
  if (title.includes("готов") || title.includes("cooking") || title.includes("рецепт")) return "cooking";
  if (title.includes("код") || title.includes("code") || title.includes("програм")) return "code";
  if (title.includes("писат") || title.includes("writing") || title.includes("текст")) return "writing";
  return "default";
}

export default function OpusHomePage() {
  const [view, setView] = useState<View>("repository");
  const [sortMode, setSortMode] = useState<SortMode>("for-you");
  const [query, setQuery] = useState("");
  
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
            <div className="opus-nav-label">Пространство</div>
            <button
              className={`opus-nav-item ${view === "repository" ? "active" : ""}`}
              onClick={() => setView("repository")}
            >
              <span className="opus-nav-item-icon">🗂</span>
              Repository
            </button>
            <button
              className={`opus-nav-item ${view === "mine" ? "active" : ""}`}
              onClick={() => setView("mine")}
            >
              <span className="opus-nav-item-icon">📚</span>
              My Shelf
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
              {view === "repository" ? "Repository" : "My Shelf"}
            </h1>
            <p className="opus-section-subtitle">
              {view === "repository" 
                ? "Готовые маршруты для освоения новых навыков — выбери и начни сегодня."
                : "Твои сохранённые маршруты и прогресс — продолжай с того места, где остановился."
              }
            </p>
          </header>

          {/* Filter bar */}
          <div className="opus-filter-bar">
            <input
              type="search"
              className="input opus-search-input"
              placeholder="Найти маршрут..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            
            {view === "repository" && (
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
            )}
          </div>

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
                  : "Сохрани маршрут из Repository, чтобы начать своё путешествие."
                }
              </p>
              {view === "mine" && (
                <button className="btn btn-primary" onClick={() => setView("repository")}>
                  Перейти в Repository
                </button>
              )}
            </div>
          ) : (
            <div className="opus-cards-grid">
              {visible.map((roadmap) => {
                const category = getCategoryFromRoadmap(roadmap);
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
                    
                    {/* Thematic visual */}
                    <div className="opus-card-visual">
                      <CardVisual category={category} themeMode={themeMode} />
                    </div>
                    
                    {/* Content */}
                    <div className="opus-card-content">
                      <h3 className="opus-card-title">{roadmap.title}</h3>
                      <p className="opus-card-description">{roadmap.description}</p>
                      
                      {/* Meta */}
                      <div className="opus-card-meta">
                        <div className="opus-card-meta-left">
                          <span className="opus-card-author">{roadmap.author}</span>
                          <span className="opus-card-level">{roadmap.level}</span>
                        </div>
                        <div className="opus-card-meta-right">
                          <span className="opus-card-stat">
                            ⭐ {roadmap.rating.toFixed(1)}
                          </span>
                          <span className="opus-card-stat">
                            {isLiked ? "♥" : "♡"} {roadmap.likes}
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
