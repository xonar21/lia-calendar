# Детальные Спецификации Каждого Типа Модала

## ГЛОБАЛЬНЫЕ ХАРАКТЕРИСТИКИ МОДАЛА

### Размеры
- **Width:** 560px
- **Border radius:** 20px
- **Box shadow:** `0_24px_60px_-20px_rgba(30,25,20,0.35)`
- **Border:** 1px solid `var(--lia-border)`
- **Background:** `var(--lia-surface)` (#f6f6f6)

### Структура
```
┌─────────────────────────────────────┐
│ Header (с переключателем типов)     │
├─────────────────────────────────────┤
│                                       │
│ Form Content (зависит от типа)       │
│                                       │
├─────────────────────────────────────┤
│ Footer (Buttons)                    │
└─────────────────────────────────────┘
```

### Header
- **Title:** "Create new"
  - Font size: 26px
  - Color: `var(--lia-accent-warm)` (#7d5819)
  - Font weight: normal
  
- **Subtitle:** Date + Category info
  - Font size: 13px
  - Color: `var(--lia-muted)` (#8d867f)
  - Format: "Friday, April 14, 2026 • category: work"
  
- **Close button:**
  - Icon: ✕
  - Width/Height: 8px x 8px
  - Hover: `bg-black/5`
  - Color: `var(--lia-muted)`

- **Border:** bottom border 1px `var(--lia-border-soft)`
- **Padding:** px-6 py-5

### Type Selector (вверху, вместо header или в header)
**Вариант 1: Радикальный переход** (вероятно в дизайне)
```
┌─ EVENT ─┬─ TASK ─┬─ JOURNAL ─┬─ NOTE ─┐
│  ●      │        │           │        │
└─────────┴────────┴───────────┴────────┘
```

**Вариант 2: Текущий (что есть в коде)**
```
[● EVENT]  [TASK]  [JOURNAL]  [NOTE]
```

**Стили:**
- **Active button:**
  - Background: тип-цвет из palette
  - Text color: тип-текст
  - Border: transparent
  - Box shadow: shadow-sm
  - Padding: px-3.5 py-1.5
  
- **Inactive button:**
  - Background: white
  - Border: 1px `var(--lia-border)`
  - Text color: `var(--lia-muted)`
  - Hover: border-`var(--lia-accent-warm)`/40, text-#3d362d
  
- **Dot indicator:**
  - Width/Height: 2px x 2px
  - Rounded: full
  - Color: тип-цвет

---

## EVENT MODAL

### Color Palette
```
Background: #eef3e6
Text: #5a7a4a
Dot/Accent: #b7c181
```

### Поля (слева направо, top-to-bottom)

#### 1. Title *
- **Type:** Text Input
- **Placeholder:** "Title"
- **Required:** Yes
- **Max length:** 120 chars
- **Classes:** `w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]`

#### 2. Date *
- **Type:** Date Picker
- **Placeholder:** "Select date"
- **Required:** Yes
- **Format:** "April 14, 2026" (display) / "2026-04-14" (internal)
- **Option A:** `<input type="date">` (стандартный)
- **Option B:** Компонент DatePickerInput с календарем

#### 3. Start Time *
- **Type:** Time Picker
- **Placeholder:** "09:00"
- **Required:** Yes
- **Format:** "HH:MM" (24-hour format)
- **Default:** "09:00"
- **Implementation:** `<input type="time">`

#### 4. End Time *
- **Type:** Time Picker
- **Placeholder:** "10:00"
- **Required:** Yes
- **Format:** "HH:MM" (24-hour format)
- **Validation:** Must be > Start Time
- **Implementation:** `<input type="time">`

#### 5. Description
- **Type:** Textarea
- **Placeholder:** "Description (optional)"
- **Required:** No
- **Max length:** 2000 chars
- **Height:** ~112px (default)
- **Classes:** `h-[112px] w-full resize-none rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]`

#### 6. Category (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Select/Dropdown
- **Default:** "none" или первая из доступных
- **Options:** Динамически загруженные из БД (categories)
- **Required:** No
- **Implementation:** 
  - `<CategorySelect categories={categories} selected={category} onChange={...} />`

#### 7. Urgency (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Select/Dropdown
- **Options:** LOW, MEDIUM, HIGH
- **Default:** MEDIUM
- **Required:** No
- **Implementation:**
  - `<UrgencySelect selected={urgency} onChange={...} />`

#### 8. Location (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Text Input
- **Placeholder:** "Location (optional)"
- **Required:** No
- **Max length:** 200 chars

### Button Actions
- **Primary:** "Create" button
  - Background: `var(--lia-accent-warm)` (#7d5819)
  - Text: white
  - Padding: px-5 py-2
  - Border radius: full
  - Font size: 14px
  - Box shadow: `0_6px_16px_-8px_rgba(125,88,25,0.6)`
  - Hover: `brightness-110`
  - Disabled: `opacity-60`
  - Width: auto

- **Secondary:** "Cancel" button
  - Background: white
  - Border: 1px `var(--lia-border)`
  - Text: `var(--lia-muted)`
  - Hover: border-`var(--lia-accent-warm)`/40, text-#3d362d
  - Padding: px-5 py-2
  - Border radius: full
  - Font size: 14px

### API Call
```javascript
POST /api/events
{
  "title": "string",          // required, max 120
  "description": "string",    // optional, max 2000
  "startsAt": "ISO8601",      // required
  "endsAt": "ISO8601",        // required, > startsAt
  "categoryId": "uuid",       // optional
  "urgency": "LOW|MEDIUM|HIGH" // default: MEDIUM
}
```

### Error Display
- **Style:** rounded-[10px] bg-[#f7dddd] px-3 py-2 text-[13px] text-[#963838]
- **Position:** Above buttons
- **Example:** "Event end time must be after start time"

---

## TASK MODAL

### Color Palette
```
Background: #e8f0f5
Text: #4a6a8a
Dot/Accent: #81acc1
```

### Поля

#### 1. Title *
- **Type:** Text Input
- **Placeholder:** "Title"
- **Required:** Yes
- **Max length:** 160 chars
- **Classes:** Same as Event

#### 2. Date *
- **Type:** Date Picker
- **Placeholder:** "Select date"
- **Required:** Yes
- **Format:** "April 14, 2026" (display)
- **Note:** Это дата, когда задача должна быть выполнена

#### 3. Bind to time (checkbox)
- **Label:** "bind to time"
- **Type:** Checkbox
- **Default:** unchecked
- **Effect:** Shows time picker if checked
- **Color:** `accent-var(--lia-accent-warm)`

#### 4. Due Time (conditional, показывается если "bind to time" checked)
- **Type:** Time Picker
- **Placeholder:** "09:00"
- **Required:** No (зависит от чекбокса)
- **Format:** "HH:MM"
- **Implementation:** `<input type="time">`
- **Show:** `{(state.type === "task" && state.useTime) && <TimeInput />}`

#### 5. Description
- **Type:** Textarea
- **Placeholder:** "Description (optional)"
- **Required:** No
- **Max length:** Нет ограничения в scheme (проверить дизайн)
- **Height:** ~112px

#### 6. Category (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Select/Dropdown
- **Required:** No
- **Implementation:** `<CategorySelect />`

#### 7. Priority/Urgency (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Select/Dropdown
- **Options:** LOW, MEDIUM, HIGH
- **Default:** MEDIUM
- **Required:** No

#### 8. Is Completed (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Checkbox
- **Label:** "Mark as completed"
- **Default:** unchecked
- **Note:** Обычно не заполняется при создании

### API Call
```javascript
POST /api/tasks
{
  "title": "string",        // required, max 160
  "date": "ISO8601",        // required
  "dueAt": "ISO8601",       // optional
  "categoryId": "uuid",     // optional
  "description": "string",  // optional (ADD THIS)
  "urgency": "string",      // optional (ADD THIS if in design)
  "isCompleted": boolean    // default: false
}
```

---

## JOURNAL MODAL

### Color Palette
```
Background: #f0eaf5
Text: #6a4f8a
Dot/Accent: #a381c1
```

### Поля

#### 1. Date *
- **Type:** Date Picker
- **Placeholder:** "Select date"
- **Required:** Yes
- **Format:** "April 14, 2026"
- **Note:** Дата записи в дневник

#### 2. Mood (optional)
- **Type:** Mood Selector
- **Placeholder:** "Mood (optional) — e.g. calm, focused, tired"
- **Required:** No
- **Max length:** 50 chars
- **Implementation options:**
  - Option A: Text input с suggestions
  - Option B: Dropdown/Select с predefined моодов
  - Option C: Pill buttons для популярных настроений
  
**Predefined moods (из дизайна):**
```
calm, grateful, loved, safe, relaxed, happy, confident,
anxious, overthinking, tense, lonely, stressed, heavy,
motivated, tired
```

**Рекомендуемая реализация:**
```jsx
<MoodSelector 
  value={state.mood} 
  onChange={(mood) => onChange({ mood })}
  presets={[
    'calm', 'grateful', 'loved', 'safe', 'relaxed',
    'happy', 'confident', 'anxious', 'overthinking',
    'tense', 'lonely', 'stressed', 'heavy', 'motivated', 'tired'
  ]}
/>
```

#### 3. Content *
- **Type:** Textarea
- **Placeholder:** "Write down what's on your mind..."
- **Required:** Yes
- **Min length:** 1 char
- **Max length:** 20000 chars
- **Height:** ~200px (больше чем у других)
- **Classes:** `h-[200px] w-full resize-none rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]`

#### 4. Active Time (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Number Input или Duration Picker
- **Label:** "Active time (minutes)"
- **Required:** No
- **Unit:** Milliseconds (в БД), но может быть минуты в UI
- **Implementation:** `<input type="number" min="0" />`

#### 5. Idle Time (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Number Input или Duration Picker
- **Label:** "Idle time (minutes)"
- **Required:** No
- **Unit:** Milliseconds (в БД)

### Особенности Journal
- **NO Title field** - дневник обычно без заголовка, только дата и содержание
- **Большее место для текста** - это основной контент
- **Эмоциональный фокус** - настроение в центре внимания

### API Call
```javascript
POST /api/journals
{
  "date": "ISO8601",           // required
  "content": "string",         // required, min 1, max 20000
  "mood": "string",            // optional, max 50
  "activeMs": number,          // optional
  "idleMs": number             // optional
}
```

---

## NOTE MODAL

### Color Palette
```
Background: #f5eaea
Text: #8a4a4a
Dot/Accent: #c18181
```

### Поля

#### 1. Title *
- **Type:** Text Input
- **Placeholder:** "Title"
- **Required:** Yes
- **Max length:** 160 chars

#### 2. Date *
- **Type:** Date Picker
- **Required:** Yes
- **Format:** "April 14, 2026"

#### 3. Content *
- **Type:** Textarea
- **Placeholder:** "Content (optional)" или "Write your note..."
- **Required:** Yes
- **Min length:** 1 char
- **Max length:** 10000 chars
- **Height:** ~150px

#### 4. Category
- **Type:** Select/Dropdown
- **Required:** No
- **Implementation:** `<CategorySelect />`
- **Default:** "none"

#### 5. Pinned Toggle (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Checkbox
- **Label:** "Pin this note"
- **Default:** unchecked
- **Effect:** Закрепленные заметки показываются в начале

#### 6. Tags (ЕСЛИ В ДИЗАЙНЕ)
- **Type:** Tag Input
- **Placeholder:** "Add tags..."
- **Required:** No
- **Implementation:** Может быть просто текстом с запятыми или отдельный компонент

### API Call
```javascript
POST /api/notes
{
  "title": "string",       // required, max 160
  "content": "string",     // required, min 1, max 10000
  "date": "ISO8601",       // required
  "categoryId": "uuid",    // optional
  "pinnedAt": "ISO8601"    // optional
}
```

---

## ПЕРЕКЛЮЧАТЕЛЬ ТИПОВ (Type Selector)

### Расположение
- **В header модала** (чуть ниже заголовка)
- **Или вместо заголовка**

### Структура
```
[● EVENT] [TASK] [JOURNAL] [NOTE]
```

### Размеры
- **Button padding:** px-3.5 py-1.5
- **Font size:** 13px
- **Gap между кнопками:** gap-2
- **Border radius:** full (rounded-full)

### Стили каждого типа кнопки

**EVENT (Active)**
```css
background: #eef3e6
color: #5a7a4a
border: transparent
box-shadow: 0 1px 2px
```

**TASK (Active)**
```css
background: #e8f0f5
color: #4a6a8a
border: transparent
box-shadow: 0 1px 2px
```

**JOURNAL (Active)**
```css
background: #f0eaf5
color: #6a4f8a
border: transparent
box-shadow: 0 1px 2px
```

**NOTE (Active)**
```css
background: #f5eaea
color: #8a4a4a
border: transparent
box-shadow: 0 1px 2px
```

**Inactive (все типы)**
```css
background: white
color: var(--lia-muted) #8d867f
border: 1px var(--lia-border)
hover -> border-color: var(--lia-accent-warm)/40
hover -> color: #3d362d
```

---

## FOKUS И VALIDATION

### Input Focus State (ALL)
```css
outline: none
border-color: var(--lia-accent-warm) !important
box-shadow: 0 0 0 3px rgba(125,88,25,0.12)
transition: border-color 160ms ease, box-shadow 160ms ease
```

### Required Field Marker
- **Визуальный маркер:** `*` красным (опционально)
- **Или через validation:** при попытке submit без заполнения

### Error Messages
- **Position:** Выше кнопок
- **Style:** 
  ```css
  rounded-[10px] 
  bg-[#f7dddd] 
  px-3 py-2 
  text-[13px] 
  text-[#963838]
  ```
- **Пример ошибок:**
  - "Title is required"
  - "End time must be after start time" (для Event)
  - "Please enter valid date"
  - "Content cannot be empty" (для Journal)

---

## TRANSITIONS И ANIMATION

### Modal Entrance
- **Background:** `lia-fade-in` (180ms ease-out)
- **Content:** `lia-pop-in` (220ms ease-out)
- **CSS:**
```css
@keyframes lia-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes lia-pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Type Change Animation
- При переключении между типами:
  - Поля должны обновиться с animation (fade-in для новых полей)
  - Цвет фона может плавно меняться

### Button States
- **Loading:** "Saving..." text, disabled state
- **Success:** Toast notification (зеленый + галочка)
- **Error:** Error message в модале (красный)

---

## KEYBOARD NAVIGATION

### Support
- **TAB:** Переход между полями
- **SHIFT+TAB:** Обратный переход
- **ENTER:** Submit на кнопке Submit (если focus там)
- **ESCAPE:** Закрыть модал

### Implementation
```javascript
useEffect(() => {
  if (!isOpen) return;
  const onEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };
  window.addEventListener("keydown", onEsc);
  return () => window.removeEventListener("keydown", onEsc);
}, [isOpen, onClose]);
```

---

## RESPONSIVE DESIGN

### Desktop (1024px+)
- Modal width: 560px
- Все элементы на месте

### Tablet (768px - 1023px)
- Modal width: 90% или 500px (max)
- Padding может быть чуть меньше

### Mobile (< 768px)
- Modal width: 95% или full screen
- Padding: px-4 py-4 (вместо px-6)
- Font sizes могут быть чуть меньше для экономии места
- Type selector может быть в виде горизонтального скролла

---

## ТЕМИЗАЦИЯ (если требуется dark mode)

Текущий дизайн светлый. Если будет dark mode:
- Обновить CSS переменные в globals.css
- Все компоненты автоматически поддержат через переменные
- Цвета типов остаются теми же или адаптируются

---

## SUMMARY ДЛЯ БЫСТРОЙ РЕАЛИЗАЦИИ

| Тип | Title | Date | Fields | Content Size | Priority |
|-----|-------|------|--------|--------------|----------|
| EVENT | ✓ | ✓ | Start/End Time, Description, Category*, Urgency* | Средний | HIGH |
| TASK | ✓ | ✓ | Optional Time (via checkbox), Description*, Category, Urgency* | Средний | HIGH |
| JOURNAL | ✗ | ✓ | Mood, Active/Idle Time | **БОЛЬШОЙ** | HIGH |
| NOTE | ✓ | ✓ | Content, Category, Pinned* | Средний | MEDIUM |

**Legend:**
- ✓ = Required
- ✗ = Not included
- * = Conditional (зависит от дизайна)
- LARGE = 200px+, Medium = 112-150px

