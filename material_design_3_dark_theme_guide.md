# Material Design 3 (M3) Dark Theme: Graphite & Purple Design Specification

> **Роль для ИИ-ассистента / Контекст:**
> Ты выступаешь в роли ведущего UI/UX-дизайнера и фронтенд-архитектора. Все генерируемые интерфейсы, стили (CSS/Tailwind) и компоненты обязаны строго соблюдать цветовую схему, иерархию токенов и правила интерактивности, описанные в этом документе. Запрещено использовать произвольные hex-значения вне данной спецификации.

---

## 1. Концепция и правила палитры

* **Базовый фон:** Глубокий угольный цвет (не чистый `#000000`, а нейтральный темный оттенок с легким графитовым подтоном).
* **Слои и карточки:** Плавный градиент глубины за счет ступеней `surface-container` (угольный $\to$ темный графит $\to$ светлый графит).
* **Текст по умолчанию:** Спокойный светло-серый (`#E2E2E6`) для предотвращения усталости глаз и снижения избыточной контрастности в темноте.
* **Кнопки и акценты:**
  * Пассивное состояние: темная графитовая подложка или очерченный контур со светло-серым текстом.
  * Наведение (`:hover`): подложка заливается светло-фиолетовым цветом, текст становится чистым белым (`#FFFFFF`).
  * Нажатие (`:active`): светло-фиолетовый фон слегка темнеет до насыщенного фиолетового, сохраняя белый текст.

---

## 2. Справочник токенов (Color Tokens)

### 2.1 Поверхности и фоны (Surfaces)
| Токен M3 | Hex-код | Назначение |
| :--- | :--- | :--- |
| `sys-surface` | `#111315` | Основной фон всей страницы/экрана (глубокий угольный) |
| `sys-surface-dim` | `#0E0F11` | Затемненные области, подложки под оверлеи |
| `sys-surface-container-low` | `#16181B` | Второстепенные области с минимальным возвышением |
| `sys-surface-container` | `#1D2024` | Карточки контента, боковые панели (графитовый) |
| `sys-surface-container-high` | `#23262B` | Всплывающие подсказки, модальные окна, кнопки по умолчанию |
| `sys-surface-container-highest` | `#2A2D33` | Разделители блоков, активные поля ввода |

### 2.2 Текст и контент (On-Surfaces)
| Токен M3 | Hex-код | Назначение |
| :--- | :--- | :--- |
| `sys-on-surface` | `#E2E2E6` | **Основной пассивный текст** (заголовки, лейблы, текст кнопок в покое) |
| `sys-on-surface-variant` | `#909299` | Второстепенный текст, подсказки, иконки в покое |
| `sys-text-bright` | `#FFFFFF` | **Текст при наведении (`hover`)**, активные заголовки акцентов |
| `sys-outline` | `#3E4148` | Границы карточек, инпутов, неактивных кнопок |
| `sys-outline-variant` | `#292B30` | Тонкие разделители, сетки таблиц |

### 2.3 Акцентный фиолетовый и состояния кнопок (Primary & States)
| Токен M3 | Hex-код | Назначение |
| :--- | :--- | :--- |
| `sys-primary` | `#D0BCFF` | Базовый светло-фиолетовый акцент M3 Dark |
| `sys-primary-hover` | `#DFCFFF` | **Кнопка при наведении** (разбеленный светло-фиолетовый) |
| `sys-primary-active` | `#B496F8` | **Кнопка при нажатии** (слегка затемненный фиолетовый) |
| `sys-on-primary-hover` | `#FFFFFF` | **Цвет текста кнопки при наведении и нажатии** |

---

## 3. Спецификация компонентов

### 3.1 Кнопка действия (Interactive Button)
Кнопка должна строго следовать переходам между графитовым покоем и фиолетовым интерактивом:

* **Состояние 1: Покой (Rest / Passive)**
  * Фон: `var(--sys-surface-container-high)` (`#23262B`)
  * Граница: 1px solid `rgba(208, 188, 255, 0.25)` или `var(--sys-outline)`
  * Текст: `var(--sys-on-surface)` (`#E2E2E6`)
  * Скругление (Border Radius): `9999px` (полное скругление Pill по гайдлайнам M3)
  * Высота / Паддинги: 40px высота, паддинги 10px 24px

* **Состояние 2: Наведение (Hover)**
  * Фон: `var(--sys-primary-hover)` (`#DFCFFF`)
  * Граница: прозрачная (`transparent`)
  * Текст: `var(--sys-text-bright)` (`#FFFFFF`)
  * Тень: `0 4px 12px rgba(208, 188, 255, 0.25)`

* **Состояние 3: Нажатие (Active / Pressed)**
  * Фон: `var(--sys-primary-active)` (`#B496F8`)
  * Граница: прозрачная (`transparent`)
  * Текст: `var(--sys-text-bright)` (`#FFFFFF`)
  * Трансформация: `transform: scale(0.98)`

* **Анимация переходов:**
  * `transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease`

### 3.2 Карточки и контейнеры (Cards)
* Фон: `var(--sys-surface-container)` (`#1D2024`)
* Граница: 1px solid `var(--sys-outline-variant)` (`#292B30`)
* Скругление: `16px` или `24px`
* Тень: в M3 темная тема строится на тоне поверхности, а не на черных тенях. Тени минимальные: `0 2px 8px rgba(0, 0, 0, 0.3)`.

### 3.3 Поля ввода (Input Fields)
* Фон: `var(--sys-surface-container-low)` (`#16181B`)
* Граница в покое: 1px solid `var(--sys-outline)` (`#3E4148`)
* Текст ввода: `var(--sys-on-surface)` (`#E2E2E6`)
* Плейсхолдер: `var(--sys-on-surface-variant)` (`#909299`)
* Фокус (`:focus`): Граница 2px `var(--sys-primary)` (`#D0BCFF`), мягкое свечение `0 0 0 3px rgba(208, 188, 255, 0.15)`.

---

## 4. Эталонная реализация CSS

При генерации стилей используй этот набор CSS-переменных:

```css
:root {
  /* Surfaces */
  --sys-surface: #111315;
  --sys-surface-dim: #0e0f11;
  --sys-surface-container-low: #16181b;
  --sys-surface-container: #1d2024;
  --sys-surface-container-high: #23262b;
  --sys-surface-container-highest: #2a2d33;

  /* Typography & Lines */
  --sys-on-surface: #e2e2e6;
  --sys-on-surface-variant: #909299;
  --sys-text-bright: #ffffff;
  --sys-outline: #3e4148;
  --sys-outline-variant: #292b30;

  /* Accents & States */
  --sys-primary: #d0bcff;
  --sys-primary-hover: #dfcfff;
  --sys-primary-active: #b496f8;
  --sys-on-primary-hover: #ffffff;

  /* Motion */
  --md-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --md-motion-duration-short: 150ms;
  --md-motion-duration-medium: 200ms;
}

body {
  background-color: var(--sys-surface);
  color: var(--sys-on-surface);
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 0;
  padding: 0;
}

/* Эталонная кнопка */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 24px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  text-decoration: none;
  cursor: pointer;
  
  /* Passive state */
  background-color: var(--sys-surface-container-high);
  color: var(--sys-on-surface);
  border: 1px solid var(--sys-outline);
  
  transition: 
    background-color var(--md-motion-duration-medium) var(--md-motion-easing-standard),
    color var(--md-motion-duration-short) ease,
    border-color var(--md-motion-duration-medium) ease,
    box-shadow var(--md-motion-duration-medium) ease,
    transform var(--md-motion-duration-short) ease;
}

.btn-primary:hover {
  background-color: var(--sys-primary-hover);
  color: var(--sys-on-primary-hover);
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(208, 188, 255, 0.28);
}

.btn-primary:active {
  background-color: var(--sys-primary-active);
  color: var(--sys-on-primary-hover);
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(208, 188, 255, 0.2);
  transform: scale(0.98);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--sys-primary);
  outline-offset: 2px;
}
```

---

## 5. Строгие запреты (Negative Constraints)

1. **Никогда** не использовать чистый черный `#000000` для основного фона (`sys-surface`).
2. **Никогда** не использовать чистый белый `#FFFFFF` для обычного статического текста — только `#E2E2E6` для снятия контрастной нагрузки. Чистый белый зарезервирован строго для подсветки активных элементов и ховера.
3. **Никогда** не делать резкие скачки цвета без плавных переходов `transition` по кривой Material Motion (`cubic-bezier(0.2, 0, 0, 1)`).
4. **Никогда** не заменять светло-фиолетовый акцент на холодный синий или кислотный неон. Цвета должны оставаться в гамме пастельного M3 Lavender/Purple (`#D0BCFF` $\to$ `#DFCFFF` $\to$ `#B496F8`).