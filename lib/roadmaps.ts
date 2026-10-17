export type RoadmapDay = { dayNumber: number; title: string; tasks: string[] };
export type Roadmap = {
  id: string;
  sourceId?: string;
  title: string;
  emoji: string;
  description: string;
  level: string;
  days: RoadmapDay[];
  likes: number;
  rating: number;
  author: string;
  color: string;
};

/** Older saved copies used `<source-id>-<timestamp>` as their ID. */
export function roadmapSourceId(roadmap: Roadmap) {
  return roadmap.sourceId ?? roadmap.id.replace(/-\d{13}$/, "");
}

export function dedupeRoadmaps(roadmaps: Roadmap[]) {
  const seen = new Set<string>();
  return roadmaps.reduce<Roadmap[]>((result, roadmap) => {
    const sourceId = roadmapSourceId(roadmap);
    if (seen.has(sourceId)) return result;
    seen.add(sourceId);
    result.push({ ...roadmap, sourceId });
    return result;
  }, []);
}

export const demoRoadmaps: Roadmap[] = [
  { id: "draw", title: "Основы рисования", emoji: "🎨", description: "От первых линий до простых скетчей — без спешки и давления.", level: "Для начинающих", likes: 284, rating: 4.9, author: "Маша Л.🤍", color: "peach", days: [{ dayNumber: 1, title: "Знакомство с линией", tasks: ["Подготовить бумагу и карандаш", "Нарисовать 10 прямых и волнистых линий"] }, { dayNumber: 2, title: "Простые формы", tasks: ["Нарисовать круги и квадраты", "Собрать из форм маленький натюрморт"] }, { dayNumber: 3, title: "Первый скетч", tasks: ["Выбрать предмет рядом", "Набросать его простыми формами"] }] },
  { id: "english", title: "Английский каждый день", emoji: "🗣️", description: "Уверенный старт: немного слов, немного практики, каждый день.", level: "Начальный", likes: 192, rating: 4.8, author: "Alex Chen", color: "lavender", days: [{ dayNumber: 1, title: "Первые слова", tasks: ["Выучить 5 слов о себе", "Составить 3 простых предложения"] }, { dayNumber: 2, title: "Слушаем и повторяем", tasks: ["Послушать короткий диалог", "Повторить 5 фраз вслух"] }] },
  { id: "yoga", title: "Мягкая йога дома", emoji: "🧘", description: "Спокойное движение, чтобы почувствовать себя лучше в своём теле.", level: "Любой уровень", likes: 156, rating: 4.7, author: "Ника", color: "mint", days: [{ dayNumber: 1, title: "Начинаем мягко", tasks: ["Освободить немного места", "Сделать 3 минуты спокойного дыхания"] }, { dayNumber: 2, title: "Лёгкая разминка", tasks: ["Размять плечи и шею", "Попробовать позу кошки-коровы"] }] },
  { id: "budget", title: "Спокойно о финансах", emoji: "🌱", description: "Разобраться в личном бюджете маленькими понятными шагами.", level: "Для начинающих", likes: 87, rating: 4.5, author: "Финансы без стресса", color: "blue", days: [{ dayNumber: 1, title: "Куда уходят деньги", tasks: ["Открыть заметки или таблицу", "Записать сегодняшние траты"] }] },
];
