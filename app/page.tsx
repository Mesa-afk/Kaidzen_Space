"use client";

import { useState } from "react";
import { demoRoadmaps, type Roadmap } from "@/lib/roadmaps";
import { useKaizenStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";

type View = "repository" | "mine";

export default function Home() {
  const [view, setView] = useState<View>("repository");
  const [selected, setSelected] = useState<Roadmap | null>(null);
  const [query, setQuery] = useState("");
  const hydrated = useHydrated();
  const { myRoadmaps, likedIds, addRoadmap, toggleLike } = useKaizenStore();
  const roadmaps = view === "repository" ? demoRoadmaps : myRoadmaps;
  const visible = roadmaps.filter((roadmap) => roadmap.title.toLowerCase().includes(query.toLowerCase()));

  const takeRoadmap = (roadmap: Roadmap) => {
    addRoadmap({ ...roadmap, id: `${roadmap.id}-${Date.now()}` });
    setView("mine");
    setSelected(null);
  };

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark">k.</span><span>kaizen<span className="brand-light">space</span></span></a>
        <div className="side-label">ТВОЁ ПРОСТРАНСТВО</div>
        <button className={`nav-link ${view === "repository" ? "active" : ""}`} onClick={() => { setView("repository"); setSelected(null); }}><span>◫</span> Репозиторий <span className="nav-count">04</span></button>
        <button className={`nav-link ${view === "mine" ? "active" : ""}`} onClick={() => { setView("mine"); setSelected(null); }}><span>▤</span> Моя полка <span className="nav-count">{hydrated ? String(myRoadmaps.length).padStart(2, "0") : "00"}</span></button>
        <div className="sidebar-bottom"><div className="side-label">МАЛЕНЬКИЕ ШАГИ — ТОЖЕ ШАГИ</div><div className="quote-card"><span>✳</span><p>Не нужно видеть всю лестницу. Достаточно сделать первый шаг.</p><small>— Мартин Лютер Кинг</small></div><div className="profile"><div className="avatar">А</div><div><strong>Алекс</strong><small>Твой темп — правильный</small></div><span className="profile-dots">···</span></div></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="breadcrumbs">Моё пространство <span>/</span> <b>{selected ? selected.title : view === "repository" ? "Репозиторий" : "Моя полка"}</b></div><button className="help-button">? <span>Как это работает</span></button></header>
        {selected ? <div className="detail-wrap"><button className="back-button" onClick={() => setSelected(null)}>← Назад к каталогу</button><div className={`detail-hero ${selected.color}`}><span className="detail-emoji">{selected.emoji}</span><div><span className="eyebrow">{selected.level}</span><h1>{selected.title}</h1><p>{selected.description}</p></div><button className="button-primary" onClick={() => takeRoadmap(selected)}>Добавить на полку <span>↗</span></button></div><div className="days-heading"><div><span className="eyebrow">ПЛАН МАЛЕНЬКИХ ШАГОВ</span><h2>Путь по дням</h2></div><span className="days-meta">{selected.days.length} дня · в своём темпе</span></div><div className="day-list">{selected.days.map((day) => <article className="day-row" key={day.dayNumber}><span className="day-number">{String(day.dayNumber).padStart(2, "0")}</span><div className="day-copy"><h3>День {day.dayNumber} <span>· {day.title}</span></h3><p>{day.tasks.join("  ·  ")}</p></div><span className="day-arrow">↗</span></article>)}</div></div> : <>
          <section className="welcome"><div className="welcome-copy"><span className="eyebrow">ТВОЯ ПОЛКА ВОЗМОЖНОСТЕЙ</span><h1>{view === "repository" ? <>Большие цели.<br/><em>Маленькие шаги.</em></> : <>Твоя личная<br/><em>полка роста.</em></>}</h1><p>{view === "repository" ? "Выбери направление, которое давно хотелось попробовать. Мы поможем двигаться к нему без спешки." : "Сохраняй понравившиеся роудмапы и возвращайся к ним, когда будешь готов."}</p><div className="welcome-note"><span>✳</span> Начать можно с любого места. И в любой момент.</div></div><div className="hero-art" aria-hidden="true"><div className="sun"></div><div className="hill hill-back"></div><div className="hill hill-front"></div><div className="art-path"></div><span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✦</span><span className="art-figure">✿</span></div></section>
          <section className="catalog"><div className="catalog-top"><div><span className="eyebrow">КОЛЛЕКЦИЯ РОУДМАПОВ</span><h2>{view === "repository" ? "Найди своё направление" : "То, что ты выбрал"}</h2><p>{view === "repository" ? "Подборки от людей, которые уже прошли этот путь." : "Твои сохранённые планы — всё в одном месте."}</p></div><button className="button-outline" onClick={() => setView(view === "repository" ? "mine" : "repository")}>{view === "repository" ? "Моя полка" : "В репозиторий"} <span>↗</span></button></div><div className="filter-row"><div className="tabs"><button className="tab active">Для тебя <span>✳</span></button><button className="tab">Популярное</button><button className="tab">Недавно добавленные</button></div><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти роудмап" /></label></div>{visible.length ? <div className="roadmap-grid">{visible.map((roadmap, index) => <article className="roadmap-card" key={roadmap.id} style={{ animationDelay: `${index * 70}ms` }}><button className={`card-art ${roadmap.color}`} onClick={() => setSelected(roadmap)} aria-label={`Открыть ${roadmap.title}`}><span className="card-art-emoji">{roadmap.emoji}</span><span className="card-art-label">KAIZEN<br/>ROADMAP</span><span className="card-art-orbit">✳</span></button><div className="card-body"><div className="card-category">{roadmap.level}<span>·</span>{roadmap.days.length} дня</div><button className="card-title" onClick={() => setSelected(roadmap)}>{roadmap.title}</button><p className="card-description">{roadmap.description}</p><div className="card-footer"><div className="author"><span className="author-avatar">{roadmap.author.slice(0, 1)}</span><span>{roadmap.author}</span></div><div className="card-stats"><button className={likedIds.includes(roadmap.id) ? "liked" : ""} onClick={() => toggleLike(roadmap.id)} aria-label="Нравится">♡ <span>{roadmap.likes + (likedIds.includes(roadmap.id) ? 1 : 0)}</span></button><span className="rating">✦ <span>{roadmap.rating.toFixed(1)}</span></span></div></div><button className="take-link" onClick={() => takeRoadmap(roadmap)}>Взять себе <span>↗</span></button></div></article>)}</div> : <div className="empty-state"><span>🌱</span><h3>{view === "mine" ? "Полка пока ждёт первого роудмапа" : "Ничего не нашлось"}</h3><p>{view === "mine" ? "Загляни в репозиторий и выбери то, что откликается." : "Попробуй изменить поисковый запрос."}</p>{view === "mine" && <button className="button-primary" onClick={() => setView("repository")}>Открыть репозиторий ↗</button>}</div>}</section>
        </>}
        <footer className="page-footer"><span>Сделано с заботой о твоём темпе <span className="footer-heart">♥</span></span><span>KAIZEN SPACE <b>·</b> 2025</span></footer>
      </section>
    </main>
  );
}
