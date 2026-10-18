"use client";

import { useState } from "react";
import { enhancedDemoRoadmaps } from "@/lib/mock-data";
import { roadmapSourceId, type Roadmap } from "@/lib/roadmaps";
import { useKaizenStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { DayFocus } from "@/components/day-focus";
import { ThemeToggle } from "@/components/theme-toggle";
import { SoundToggle } from "@/components/sound-toggle";
import { DayMetroLine } from "@/components/day-metro-line";
import { distributeXp, type TaskNode } from "@/lib/graph";

type View = "repository" | "mine";

export default function Home() {
  const [view, setView] = useState<View>("repository");
  const [selected, setSelected] = useState<Roadmap | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [notice, setNotice] = useState("");
  
  const hydrated = useHydrated();
  const { myRoadmaps, likedIds, addRoadmap, removeRoadmap, toggleLike, focusGraphs, setFocusGraph } = useKaizenStore();
  
  const roadmaps = view === "repository" ? enhancedDemoRoadmaps : myRoadmaps;
  const visible = roadmaps.filter((roadmap) => 
    roadmap.title.toLowerCase().includes(query.toLowerCase())
  );

  const takeRoadmap = (roadmap: Roadmap) => {
    const sourceId = roadmapSourceId(roadmap);
    if (myRoadmaps.some((item) => roadmapSourceId(item) === sourceId)) {
      setNotice("Этот роудмап уже есть на твоей полке.");
      setView("mine");
      setSelected(null);
      return;
    }
    addRoadmap({ ...roadmap, id: crypto.randomUUID(), sourceId });
    setNotice("Роудмап добавлен на твою полку.");
    setView("mine");
    setSelected(null);
  };

  const isOnShelf = (roadmap: Roadmap) => 
    myRoadmaps.some((item) => roadmapSourceId(item) === roadmapSourceId(roadmap));

  const removeFromShelf = (roadmap: Roadmap) => {
    removeRoadmap(roadmap.id);
    setNotice(`«${roadmap.title}» удалён с твоей полки.`);
    setSelected(null);
    setSelectedDay(null);
  };

  const generateRoadmap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setCreateError("");
    
    try {
      const response = await fetch("/api/roadmaps/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось создать роудмап.");
      
      const id = crypto.randomUUID();
      const generated = result as {
        project_title: string;
        project_emoji: string;
        days: { day_number: number; tasks: TaskNode[] }[];
      };
      
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
      
      generated.days.forEach((day) => 
        setFocusGraph(`${id}:${day.day_number}`, day.tasks)
      );
      
      addRoadmap(roadmap);
      setView("mine");
      setShowCreate(false);
      setSelected(roadmap);
      setTopic("");
      setNotice("Твой новый роудмап готов — он уже на полке.");
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

  const openDay = (roadmap: Roadmap, dayNumber: number) => {
    const storageKey = `${roadmap.id}:${dayNumber}`;
    const day = roadmap.days.find((item) => item.dayNumber === dayNumber);
    
    if (day && !focusGraphs[storageKey]) {
      const weights = distributeXp(100, day.tasks.length);
      const graph: TaskNode[] = day.tasks.map((title, index) => ({
        id: crypto.randomUUID(),
        parent_id: null,
        type: "task",
        status: "pending",
        title,
        duration_minutes: 5,
        xp_weight: weights[index],
        dependencies: index === 0 ? [] : ["__previous__"],
      }));
      
      graph.forEach((task, index) => {
        if (index > 0) task.dependencies = [graph[index - 1].id];
      });
      
      setFocusGraph(storageKey, graph);
    }
    
    setSelectedDay(dayNumber);
  };

  // Render Day Focus if day is selected
  if (selected && selectedDay !== null) {
    return (
      <DayFocus
        roadmapTitle={selected.title}
        dayNumber={selectedDay}
        storageKey={`${selected.id}:${selectedDay}`}
        onBack={() => setSelectedDay(null)}
      />
    );
  }

  // Main UI
  return (
    <main className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">k.</span>
          <span>
            kaizen<span className="brand-light">space</span>
          </span>
        </a>

        <div className="side-label">ТВОЁ ПРОСТРАНСТВО</div>
        
        <button
          className={`nav-link ${view === "repository" ? "active" : ""}`}
          onClick={() => {
            setView("repository");
            setSelected(null);
          }}
        >
          <span>◫</span> Репозиторий 
          <span className="nav-count">
            {hydrated ? String(enhancedDemoRoadmaps.length).padStart(2, "0") : "00"}
          </span>
        </button>
        
        <button
          className={`nav-link ${view === "mine" ? "active" : ""}`}
          onClick={() => {
            setView("mine");
            setSelected(null);
          }}
        >
          <span>▤</span> Моя полка 
          <span className="nav-count">
            {hydrated ? String(myRoadmaps.length).padStart(2, "0") : "00"}
          </span>
        </button>

        <div className="sidebar-bottom">
          <div className="side-label">НАСТРОЙКИ</div>
          
          <div className="sidebar-controls">
            <ThemeToggle />
            <SoundToggle />
          </div>
          
          <div className="quote-card">
            <span>✳</span>
            <p>Не нужно видеть всю лестницу. Достаточно сделать первый шаг.</p>
            <small>— Мартин Лютер Кинг</small>
          </div>
          
          <div className="profile">
            <div className="avatar">А</div>
            <div>
              <strong>Алекс</strong>
              <small>Твой темп — правильный</small>
            </div>
            <span className="profile-dots">···</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            Моё пространство <span>/</span>{" "}
            <b>
              {selected
                ? selected.title
                : view === "repository"
                ? "Репозиторий"
                : "Моя полка"}
            </b>
          </div>
          <button className="help-button">
            ? <span>Как это работает</span>
          </button>
        </header>

        {notice && (
          <button className="notice-banner" onClick={() => setNotice("")}>
            {notice}
            <span>×</span>
          </button>
        )}

        {/* Roadmap Detail View */}
        {selected ? (
          <div className="detail-wrap">
            <button
              className="back-button"
              onClick={() => {
                setSelected(null);
                setSelectedDay(null);
              }}
            >
              ← Назад к каталогу
            </button>

            <div className={`detail-hero ${selected.color}`}>
              <span className="detail-emoji">{selected.emoji}</span>
              <div>
                <span className="eyebrow">{selected.level}</span>
                <h1>{selected.title}</h1>
                <p>{selected.description}</p>
              </div>
              
              {view === "repository" ? (
                <button
                  className="button-primary"
                  disabled={isOnShelf(selected)}
                  onClick={() => takeRoadmap(selected)}
                >
                  {isOnShelf(selected) ? "✓ Уже на полке" : (
                    <>
                      Добавить на полку <span>↗</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="button-remove"
                  onClick={() => removeFromShelf(selected)}
                >
                  Убрать с полки
                </button>
              )}
            </div>

            <div className="days-heading">
              <div>
                <span className="eyebrow">ПЛАН МАЛЕНЬКИХ ШАГОВ</span>
                <h2>Путь по дням</h2>
              </div>
              <span className="days-meta">
                {selected.days.length} дня · в своём темпе
              </span>
            </div>

            {/* Metro Line Visualization */}
            <DayMetroLine
              days={selected.days}
              completedDays={[]}
              currentDay={1}
              onDayClick={(dayNumber) => openDay(selected, dayNumber)}
            />
          </div>
        ) : (
          <>
            {/* Welcome Hero */}
            <section className="welcome">
              <div className="welcome-copy">
                <span className="eyebrow">ТВОЯ ПОЛКА ВОЗМОЖНОСТЕЙ</span>
                <h1>
                  {view === "repository" ? (
                    <>
                      Большие цели.
                      <br />
                      <em>Маленькие шаги.</em>
                    </>
                  ) : (
                    <>
                      Твоя личная
                      <br />
                      <em>полка роста.</em>
                    </>
                  )}
                </h1>
                <p>
                  {view === "repository"
                    ? "Выбери направление, которое давно хотелось попробовать. Мы поможем двигаться к нему без спешки."
                    : "Сохраняй понравившиеся роудмапы и возвращайся к ним, когда будешь готов."}
                </p>
                <div className="welcome-note">
                  <span>✳</span> Начать можно с любого места. И в любой момент.
                </div>
              </div>
              
              <div className="hero-art" aria-hidden="true">
                <div className="sun"></div>
                <div className="hill hill-back"></div>
                <div className="hill hill-front"></div>
                <div className="art-path"></div>
                <span className="art-spark spark-one">✳</span>
                <span className="art-spark spark-two">✦</span>
                <span className="art-figure">✿</span>
              </div>
            </section>

            {/* Catalog */}
            <section className="catalog">
              <div className="catalog-top">
                <div>
                  <span className="eyebrow">КОЛЛЕКЦИЯ РОУДМАПОВ</span>
                  <h2>
                    {view === "repository"
                      ? "Найди своё направление"
                      : "То, что ты выбрал"}
                  </h2>
                  <p>
                    {view === "repository"
                      ? "Подборки от людей, которые уже прошли этот путь."
                      : "Твои сохранённые планы — всё в одном месте."}
                  </p>
                </div>
                
                <div className="catalog-actions">
                  <button
                    className="button-create"
                    onClick={() => {
                      setShowCreate((open) => !open);
                      setCreateError("");
                    }}
                  >
                    ＋ Создать роудмап
                  </button>
                  <button
                    className="button-outline"
                    onClick={() => setView(view === "repository" ? "mine" : "repository")}
                  >
                    {view === "repository" ? "Моя полка" : "В репозиторий"}{" "}
                    <span>↗</span>
                  </button>
                </div>
              </div>

              {/* Create Roadmap Form */}
              {showCreate && (
                <form className="create-roadmap" onSubmit={generateRoadmap}>
                  <div className="create-intro">
                    <span className="create-spark">✳</span>
                    <div>
                      <strong>С чего хочется начать?</strong>
                      <p>Опиши навык или цель — мы разложим путь на маленькие шаги.</p>
                    </div>
                  </div>
                  
                  <div className="create-fields">
                    <label>
                      Я хочу научиться…
                      <input
                        required
                        minLength={2}
                        maxLength={160}
                        value={topic}
                        onChange={(event) => setTopic(event.target.value)}
                        placeholder="например, рисовать акварелью"
                        disabled={generating}
                      />
                    </label>
                    
                    <label>
                      Мой желаемый уровень
                      <input
                        required
                        minLength={2}
                        maxLength={100}
                        value={level}
                        onChange={(event) => setLevel(event.target.value)}
                        placeholder="например, уверенный базовый"
                        disabled={generating}
                      />
                    </label>
                    
                    <button className="button-primary" disabled={generating}>
                      {generating ? (
                        <>
                          <span className="pulse-dot" />
                          Собираем твой путь…
                        </>
                      ) : (
                        <>
                          Создать план <span>↗</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {createError && <p className="create-error">{createError}</p>}
                </form>
              )}

              {/* Filter Row */}
              <div className="filter-row">
                <div className="tabs">
                  <button className="tab active">
                    Для тебя <span>✳</span>
                  </button>
                  <button className="tab">Популярное</button>
                  <button className="tab">Недавно добавленные</button>
                </div>
                
                <label className="search">
                  <span>⌕</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Поиск роудмапов..."
                  />
                </label>
              </div>

              {/* Roadmap Grid */}
              {visible.length > 0 ? (
                <div className="roadmap-grid">
                  {visible.map((roadmap) => (
                    <button
                      key={roadmap.id}
                      className="roadmap-card"
                      onClick={() => setSelected(roadmap)}
                    >
                      <div className={`card-art ${roadmap.color}`}>
                        <span className="card-emoji">{roadmap.emoji}</span>
                      </div>
                      
                      <div className="card-body">
                        <div className="card-level">{roadmap.level}</div>
                        <h3 className="card-title">{roadmap.title}</h3>
                        <p className="card-description">{roadmap.description}</p>
                        
                        <div className="card-footer">
                          <span className="author">{roadmap.author}</span>
                          <div className="card-stats">
                            <span>⭐ {roadmap.rating}</span>
                            <span>♥ {roadmap.likes}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p>
                    {view === "mine"
                      ? "Твоя полка пока пуста. Добавь роудмапы из репозитория."
                      : "Ничего не найдено. Попробуй другой запрос."}
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="page-footer">
          <span>
            Сделано с заботой о твоём темпе <span className="footer-heart">♥</span>
          </span>
          <span>
            KAIZEN SPACE <b>·</b> 2025
          </span>
        </footer>
      </section>
    </main>
  );
}
