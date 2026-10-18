import type { TaskNode } from "./graph";

/**
 * Mock roadmap generation for demo purposes
 * In production, this would call the actual LLM API
 */
export function mockGenerateRoadmap(topic: string, _level: string): {
  project_title: string;
  project_emoji: string;
  days: { day_number: number; tasks: TaskNode[] }[];
} {
  // Generate a title based on the topic
  const title = `${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
  
  // Pick a relevant emoji based on keywords
  const emoji = pickEmoji(topic);
  
  // Generate 3-4 days with tasks
  const dayCount = 3 + Math.floor(Math.random() * 2);
  const days = Array.from({ length: dayCount }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1;
    const taskCount = 2 + Math.floor(Math.random() * 2); // 2-3 tasks per day
    
    const tasks: TaskNode[] = Array.from({ length: taskCount }, (_, taskIndex) => {
      const taskId = `task-${dayNumber}-${taskIndex}`;
      return {
        id: taskId,
        parent_id: null,
        type: "task" as const,
        status: "pending" as const,
        title: generateTaskTitle(topic, dayNumber, taskIndex, taskCount),
        duration_minutes: 5 + Math.floor(Math.random() * 10), // 5-15 minutes
        xp_weight: 0, // Will be calculated by distributeXp
        dependencies: taskIndex === 0 ? [] : [`task-${dayNumber}-${taskIndex - 1}`],
      };
    });
    
    // Distribute XP evenly across tasks
    const baseXp = Math.floor(100 / taskCount);
    tasks.forEach((task, index) => {
      task.xp_weight = index === tasks.length - 1 
        ? 100 - baseXp * (tasks.length - 1) 
        : baseXp;
    });
    
    return {
      day_number: dayNumber,
      tasks,
    };
  });
  
  return {
    project_title: title,
    project_emoji: emoji,
    days,
  };
}

function pickEmoji(topic: string): string {
  const lower = topic.toLowerCase();
  
  if (lower.includes("рисова") || lower.includes("акварел") || lower.includes("художеств")) return "🎨";
  if (lower.includes("английск") || lower.includes("язык") || lower.includes("иностран")) return "🗣️";
  if (lower.includes("йог") || lower.includes("растяж") || lower.includes("медитац")) return "🧘";
  if (lower.includes("финанс") || lower.includes("деньг") || lower.includes("бюджет")) return "💰";
  if (lower.includes("гитар") || lower.includes("музык") || lower.includes("инструмент")) return "🎸";
  if (lower.includes("программ") || lower.includes("код") || lower.includes("разработк")) return "💻";
  if (lower.includes("чтен") || lower.includes("книг") || lower.includes("литератур")) return "📚";
  if (lower.includes("спорт") || lower.includes("трениров") || lower.includes("фитнес")) return "💪";
  if (lower.includes("готов") || lower.includes("кулинар") || lower.includes("еда")) return "🍳";
  if (lower.includes("растени") || lower.includes("цвет") || lower.includes("сад")) return "🪴";
  if (lower.includes("пис") || lower.includes("журнал") || lower.includes("дневник")) return "📓";
  if (lower.includes("фото") || lower.includes("снимк") || lower.includes("камер")) return "📸";
  
  return "✨"; // Default
}

function generateTaskTitle(topic: string, dayNumber: number, taskIndex: number, _totalTasks: number): string {
  const stages = [
    "Знакомство и подготовка",
    "Первая практика",
    "Углубление понимания",
    "Закрепление навыка",
  ];
  
  const actions = [
    ["Изучить основы", "Подготовить материалы", "Попробовать первый раз"],
    ["Выполнить базовое упражнение", "Практиковать технику", "Сделать второй подход"],
    ["Добавить сложности", "Применить на практике", "Экспериментировать"],
    ["Повторить с улучшениями", "Закрепить результат", "Подвести итоги"],
  ];
  
  const stageIndex = Math.min(dayNumber - 1, stages.length - 1);
  const actionIndex = taskIndex % actions[stageIndex].length;
  
  if (taskIndex === 0) {
    return `${stages[stageIndex]}: ${topic.toLowerCase()}`;
  }
  
  return `${actions[stageIndex][actionIndex]}`;
}
