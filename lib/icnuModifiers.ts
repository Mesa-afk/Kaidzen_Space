export type IcnUModifierCategory =
  | "INTEREST"
  | "CHALLENGE"
  | "NOVELTY"
  | "URGENCY"
  | "PASSION_PLAY";

export type IcnUModifier = {
  id: string;
  category: IcnUModifierCategory;
  label: string;
  instruction: string;
};

/** Curated, deterministic modifier catalog; selection has no random/LLM calls. */
export const ICNU_MODIFIERS = [
  // Interest: connect practice to a personally engaging subject.
  { id: "interest-favorite-topic", category: "INTEREST", label: "Любимая тема", instruction: "Свяжи упражнение с темой, о которой тебе уже интересно думать." },
  { id: "interest-real-life", category: "INTEREST", label: "Из жизни", instruction: "Найди один пример этого навыка в своей сегодняшней жизни." },
  { id: "interest-personal-project", category: "INTEREST", label: "Личный проект", instruction: "Сделай маленький фрагмент проекта, который действительно хочется закончить." },
  { id: "interest-curiosity-question", category: "INTEREST", label: "Вопрос из любопытства", instruction: "Начни с вопроса, на который тебе самому хочется узнать ответ." },
  { id: "interest-role-model", category: "INTEREST", label: "В стиле кумира", instruction: "Попробуй решить задачу способом человека, чья работа тебе нравится." },
  { id: "interest-useful-output", category: "INTEREST", label: "Полезный результат", instruction: "Сделай результат, которым можно воспользоваться сегодня." },
  { id: "interest-choice", category: "INTEREST", label: "Выбор из двух", instruction: "Выбери один из двух вариантов упражнения и объясни себе выбор." },
  { id: "interest-collect", category: "INTEREST", label: "Коллекционер", instruction: "Собери три примера, детали или наблюдения по теме." },
  { id: "interest-story", category: "INTEREST", label: "История навыка", instruction: "Преврати упражнение в короткую историю с началом и результатом." },
  { id: "interest-observer", category: "INTEREST", label: "Исследователь", instruction: "Понаблюдай за реальным примером навыка и повтори одну деталь." },
  { id: "interest-customize", category: "INTEREST", label: "Под себя", instruction: "Измени один элемент упражнения под свой вкус или привычный контекст." },
  { id: "interest-why", category: "INTEREST", label: "Зачем это нужно", instruction: "Перед началом назови одну причину, почему этот навык пригодится лично тебе." },

  // Challenge: provide a bounded, achievable stretch.
  { id: "challenge-speedrun", category: "CHALLENGE", label: "Режим спидрана", instruction: "Поставь короткий таймер и выполни один безопасный проход без остановки." },
  { id: "challenge-one-take", category: "CHALLENGE", label: "С первой попытки", instruction: "Сделай один цельный вариант, не исправляя его до завершения." },
  { id: "challenge-no-hints", category: "CHALLENGE", label: "Без подсказок", instruction: "Попробуй вспомнить или выполнить шаг самостоятельно, прежде чем смотреть инструкцию." },
  { id: "challenge-three-levels", category: "CHALLENGE", label: "Три уровня", instruction: "Выполни вариант легко, затем обычно, затем чуть сложнее." },
  { id: "challenge-precision", category: "CHALLENGE", label: "Точность", instruction: "Выбери один критерий качества и проверь по нему результат." },
  { id: "challenge-repetition", category: "CHALLENGE", label: "Три повтора", instruction: "Повтори ключевое действие три раза, замечая разницу между попытками." },
  { id: "challenge-limit-tools", category: "CHALLENGE", label: "Меньше инструментов", instruction: "Ограничься одним инструментом или правилом и посмотри, что получится." },
  { id: "challenge-recall-first", category: "CHALLENGE", label: "Сначала по памяти", instruction: "Воспроизведи основной шаг по памяти, затем сверься с образцом." },
  { id: "challenge-small-record", category: "CHALLENGE", label: "Личный рекорд", instruction: "Зафиксируй свой результат и попробуй улучшить только один аспект." },
  { id: "challenge-two-minutes", category: "CHALLENGE", label: "Два фокусных минуты", instruction: "Посвяти задаче две минуты непрерывного внимания; остановиться по таймеру можно." },
  { id: "challenge-explain-30", category: "CHALLENGE", label: "Объясни за 30 секунд", instruction: "Объясни вслух ключевую идею простыми словами за полминуты." },
  { id: "challenge-find-error", category: "CHALLENGE", label: "Найди слабое место", instruction: "Найди один возможный недочёт и исправь только его." },

  // Novelty: vary the sensory, procedural, or representational format.
  { id: "novelty-inversion", category: "NOVELTY", label: "Инверсия", instruction: "Сделай намеренно максимально кривой вариант, затем найди в нём одну полезную идею." },
  { id: "novelty-blind-input", category: "NOVELTY", label: "Слепой ввод", instruction: "Выполни короткий безопасный фрагмент, не глядя на клавиатуру или руки; затем проверь результат." },
  { id: "novelty-new-place", category: "NOVELTY", label: "Новое место", instruction: "Перенеси занятие в другое удобное место или измени положение материалов." },
  { id: "novelty-opposite-hand", category: "NOVELTY", label: "Другой рукой", instruction: "Если это безопасно для навыка, попробуй один лёгкий элемент другой рукой." },
  { id: "novelty-change-medium", category: "NOVELTY", label: "Другой материал", instruction: "Повтори идею на другом материале, носителе или в другом приложении." },
  { id: "novelty-random-prompt", category: "NOVELTY", label: "Неожиданный объект", instruction: "Выбери ближайший предмет как тему для одного короткого упражнения." },
  { id: "novelty-swap-order", category: "NOVELTY", label: "Смени порядок", instruction: "Начни с последнего небольшого шага и двигайся назад, если это не нарушает безопасность." },
  { id: "novelty-silent-mode", category: "NOVELTY", label: "Тихий режим", instruction: "Убери фоновый звук и сосредоточься на одном зрительном или тактильном сигнале." },
  { id: "novelty-color-code", category: "NOVELTY", label: "Цветовой код", instruction: "Пометь этапы разными цветами или символами, чтобы увидеть структуру." },
  { id: "novelty-teach-object", category: "NOVELTY", label: "Объясни предмету", instruction: "Объясни следующий шаг любому предмету рядом, будто он новичок." },
  { id: "novelty-format-switch", category: "NOVELTY", label: "Смени формат", instruction: "Представь результат схемой, списком, жестом или маленьким эскизом." },
  { id: "novelty-rhythm", category: "NOVELTY", label: "Новый ритм", instruction: "Выполняй повторяющиеся действия в спокойном равномерном ритме." },

  // Urgency: add a gentle, finite start cue without punishment.
  { id: "urgency-two-minute-start", category: "URGENCY", label: "Старт на две минуты", instruction: "Запусти таймер на две минуты и просто начни; продолжать после сигнала необязательно." },
  { id: "urgency-next-break", category: "URGENCY", label: "До перерыва", instruction: "Выбери один маленький результат, который успеешь сделать до ближайшего перерыва." },
  { id: "urgency-countdown-five", category: "URGENCY", label: "Пять спокойных минут", instruction: "Выдели пять минут на один фрагмент без требования закончить всё." },
  { id: "urgency-first-minute", category: "URGENCY", label: "Только первая минута", instruction: "Поставь таймер на минуту и подготовь первый шаг до его сигнала." },
  { id: "urgency-before-coffee", category: "URGENCY", label: "До следующего глотка", instruction: "Сделай один микро-шаг до следующего глотка напитка или короткой паузы." },
  { id: "urgency-single-round", category: "URGENCY", label: "Один раунд", instruction: "Сделай один ограниченный раунд упражнения, а затем остановись и оцени самочувствие." },
  { id: "urgency-start-cue", category: "URGENCY", label: "Счёт до трёх", instruction: "Сосчитай до трёх и выполни только самое первое физическое действие." },
  { id: "urgency-today-token", category: "URGENCY", label: "Один жетон сегодня", instruction: "Поставь себе один символ за начало занятия, независимо от результата." },
  { id: "urgency-short-window", category: "URGENCY", label: "Короткое окно", instruction: "Открой задачу на три минуты и выбери один заметный мини-результат." },
  { id: "urgency-now-or-schedule", category: "URGENCY", label: "Сейчас или запланировать", instruction: "Выбери: сделать двухминутный шаг сейчас или назначить конкретное время позже." },
  { id: "urgency-one-song", category: "URGENCY", label: "Пока звучит трек", instruction: "Поработай над одним шагом в течение одного короткого трека, без гонки за темпом." },
  { id: "urgency-first-thing", category: "URGENCY", label: "До переключения", instruction: "Сделай один шаг перед тем, как переключиться на следующее дело." },

  // Passion/play: make practice expressive, social, or pleasantly playful.
  { id: "play-favorite-track", category: "PASSION_PLAY", label: "Под любимый трек", instruction: "Выполни упражнение под любимую музыку, если она помогает сосредоточиться." },
  { id: "play-silly-version", category: "PASSION_PLAY", label: "Смешная версия", instruction: "Создай намеренно забавный вариант и отметь, чему он тебя научил." },
  { id: "play-commentator", category: "PASSION_PLAY", label: "Комментатор", instruction: "Комментируй свои действия как ведущий спортивной трансляции." },
  { id: "play-character", category: "PASSION_PLAY", label: "Роль мастера", instruction: "На один шаг представь себя персонажем или мастером, которому нравится этот навык." },
  { id: "play-sticker-reward", category: "PASSION_PLAY", label: "Наклейка за усилие", instruction: "После попытки поставь себе маленькую отметку за участие, а не за идеальность." },
  { id: "play-draw-face", category: "PASSION_PLAY", label: "Добавь характер", instruction: "Добавь результату одну деталь с характером, юмором или собственным стилем." },
  { id: "play-friendly-duel", category: "PASSION_PLAY", label: "Дружеский раунд", instruction: "Сравни две свои попытки, не сравнивая себя с другими людьми." },
  { id: "play-sound-effect", category: "PASSION_PLAY", label: "Звуковой эффект", instruction: "Придумай короткий звук для удачного шага и используй его как игровую отметку." },
  { id: "play-mini-showcase", category: "PASSION_PLAY", label: "Мини-показ", instruction: "Представь, что показываешь один фрагмент доброжелательному зрителю." },
  { id: "play-invent-rule", category: "PASSION_PLAY", label: "Своё правило", instruction: "Придумай одно весёлое, безопасное правило для этой попытки." },
  { id: "play-victory-pose", category: "PASSION_PLAY", label: "Поза победы", instruction: "После завершения сделай маленький жест празднования усилия." },
  { id: "play-remix", category: "PASSION_PLAY", label: "Ремикс", instruction: "Соедини навык с любимым жанром, персонажем или эстетикой." },
] as const satisfies readonly IcnUModifier[];

/** Returns unused catalog entries in stable catalog order, up to `count`. */
export function pickDailyModifiers(usedIds: readonly string[], count = 2): IcnUModifier[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError("Modifier count must be a non-negative integer");
  }
  if (count === 0) return [];

  const used = new Set(usedIds);
  return ICNU_MODIFIERS.filter((modifier) => !used.has(modifier.id)).slice(0, count);
}
