# Подробный План: Переработка Модала Добавления Сущностей

## 1. АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ

### Текущая реализация
- Компонент: `src/components/month-screen-figma.tsx` (CreateModal)
- Одна форма с условной логикой для разных типов сущностей
- Переключатель между типами (event, task, journal, note) в виде кнопок
- Размер модала: 560px ширина
- Состояние: управляется через `createState` hook

### Поддерживаемые типы
1. **Event** - событие с временем начала и окончания
2. **Task** - задача с опциональным временем
3. **Journal** - запись в дневник с настроением
4. **Note** - заметка с категорией

### БД схема (текущая)
```
Event: id, userId, categoryId, title, description, startsAt, endsAt, urgency, createdAt, updatedAt
Task: id, userId, categoryId, title, date, dueAt, isCompleted, createdAt, updatedAt
JournalEntry: id, userId, date, content, mood, activeMs, idleMs, createdAt, updatedAt
Note: id, userId, categoryId, title, content, date, pinnedAt, createdAt, updatedAt
```

---

## 2. ТРЕБОВАНИЯ НА ОСНОВЕ ДИЗАЙНА FIGMA

### 2.1 Общие требования
- **Переключатель типов**: 4 вкладки/таба в верхней части модала (EVENT | TASK | JOURNAL | NOTE)
- **По умолчанию**: открывается EVENT
- **Визуальное оформление**: каждый тип имеет свой цвет
  - Event: зелено-желтый (#b7c181, фон #eef3e6)
  - Task: голубой (#81acc1, фон #e8f0f5)
  - Journal: фиолетовый (#a381c1, фон #f0eaf5)
  - Note: красновато-розовый (#c18181, фон #f5eaea)

### 2.2 EVENT Modal (узел 1313-2414)
**Поля:**
- [x] Title (обязательное)
- [x] Date picker (обязательное)
- [x] Start time (обязательное)
- [x] End time (обязательное)
- [x] Description (опциональное)
- [] Category selector (если есть в дизайне)
- [ ] Urgency selector (LOW, MEDIUM, HIGH) - если есть в дизайне
- [ ] Location field - если есть в дизайне

**Компоненты:**
- Input для title
- Date picker (календарь или input type=date)
- Time picker (может быть два input type=time или один компонент)
- Textarea для description
- Select/dropdown для category (если требуется)
- Select для urgency (если требуется)

**Действия:**
- Save button (сохранить событие)
- Cancel button

### 2.3 TASK Modal (узел 1321-2465)
**Поля:**
- [x] Title (обязательное)
- [x] Date (дата задачи, обязательное)
- [x] Due time / Due date (опциональное - есть чекбокс "bind to time")
- [x] Description (опциональное)
- [ ] Category selector (если есть)
- [ ] Priority/Urgency (если есть)
- [ ] Checkbox "is completed" (если есть)

**Компоненты:**
- Input для title
- Date picker для date
- Checkbox "bind to time"
- Time picker (показывается если чекбокс отмечен)
- Textarea для description
- Select для category
- Другие опции

**Действия:**
- Create button
- Cancel button

### 2.4 JOURNAL Modal (узел 1323-2613)
**Поля:**
- [ ] Title - может не быть (дневник обычно без заголовка)
- [x] Date (обязательное)
- [x] Mood selector (опциональное) - может быть в виде эмодзи или текста
  - Примеры: calm, grateful, loved, safe, relaxed, happy, confident, anxious, overthinking, tense, lonely, stressed, heavy, motivated, tired
- [x] Content/Text (обязательное - "Write down what's on your mind...")
- [ ] Active time tracking (activeMs) - если есть в дизайне
- [ ] Idle time tracking (idleMs) - если есть в дизайне

**Компоненты:**
- Date picker
- Mood selector (dropdown или pill buttons для предопределенных настроений)
- Textarea для content (большой, ~200+ px высота)
- Опциональные поля для времени активности

**Действия:**
- Save button
- Cancel button

### 2.5 NOTE Modal (узел 1347-2636)
**Поля:**
- [x] Title (обязательное)
- [x] Content (обязательное)
- [x] Date (обязательное)
- [ ] Category selector
- [ ] Pinned toggle (if pinned display differently)
- [ ] Tags (если есть)

**Компоненты:**
- Input для title
- Textarea для content
- Date picker
- Select для category
- Checkbox/Toggle для "pin" (если требуется)

**Действия:**
- Save button
- Cancel button

---

## 3. НЕОБХОДИМЫЕ ИЗМЕНЕНИЯ В БД

### 3.1 Новые поля/модели (по анализу дизайна)

**Task model - добавить:**
- [ ] `description: String?` - для описания задачи (текущего нет)
- [ ] `priority/urgency: Urgency?` - приоритет (текущего нет)
- [ ] Проверить: нужна ли `location` для Task

**JournalEntry model - изменить/проверить:**
- [x] `activeMs` и `idleMs` - уже есть
- [x] `mood` - уже есть
- [ ] Добавить `title: String?` - если дневник может иметь заголовок

**Event model - проверить:**
- [x] `urgency` - уже есть
- [ ] Добавить `location: String?` - если требуется в дизайне

**Note model - проверить:**
- [x] Все основные поля есть
- [ ] `tags: String?` - если нужны теги

**Category model:**
- [x] Уже имеет color field - хорошо

### 3.2 Миграции Prisma
Все новые поля должны быть добавлены с помощью миграции:
```bash
prisma migrate dev --name add_fields_to_models
```

---

## 4. ИЗМЕНЕНИЯ В API

### 4.1 Event API (`src/app/api/events/route.ts`)
**POST /api/events**
- Текущие поля: ✓ OK
- Добавить валидацию для всех новых полей
- Обновить `createEventSchema` в `src/lib/validators.ts`

### 4.2 Task API (`src/app/api/tasks/route.ts`)
**POST /api/tasks**
- Добавить `description` поле
- Добавить `urgency/priority` поле
- Обновить `createTaskSchema`

### 4.3 Journal API (`src/app/api/journals/route.ts`)
**POST /api/journals**
- Текущее состояние: ✓ OK, но проверить все поля

### 4.4 Note API (`src/app/api/notes/route.ts`)
**POST /api/notes**
- Проверить все поля из дизайна
- Добавить поля если требуется

### 4.5 Обновить все схемы валидации в `src/lib/validators.ts`

---

## 5. АРХИТЕКТУРА НОВОГО МОДАЛА

### 5.1 Структура компонентов
```
CreateEntityModal
├── Header (с переключателем типов)
├── TabContainer (EVENT | TASK | JOURNAL | NOTE)
├── EventForm (если type === 'event')
├── TaskForm (если type === 'task')
├── JournalForm (если type === 'journal')
├── NoteForm (если type === 'note')
└── Footer (с кнопками Save/Cancel)
```

### 5.2 Компоненты для переиспользования
Создать отдельные компоненты для переиспользования:
- `<TypeSelector />` - переключатель между типами (4 кнопки/таба)
- `<DatePicker />` - если нет готового
- `<TimePicker />` или использовать `input type="time"`
- `<CategorySelect />` - выбор категории
- `<MoodSelector />` - для journal (dropdown или pills)
- `<UrgencySelect />` - для event/task (если требуется)

### 5.3 State management
Сохранить текущий подход с `useState` для `createState`:
```typescript
type CreateState = {
  type: CreateType; // 'event' | 'task' | 'journal' | 'note'
  // Event fields
  eventTitle: string;
  eventDate: Date;
  eventStartTime: string;
  eventEndTime: string;
  eventDescription: string;
  eventCategory: string;
  eventUrgency: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Task fields
  taskTitle: string;
  taskDate: Date;
  taskDueTime: string;
  taskHasTime: boolean;
  taskDescription: string;
  taskCategory: string;
  taskUrgency: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Journal fields
  journalDate: Date;
  journalMood: string;
  journalContent: string;
  
  // Note fields
  noteTitle: string;
  noteDate: Date;
  noteContent: string;
  noteCategory: string;
  notePinned: boolean;
  
  // Common
  loading: boolean;
  error: string;
};
```

---

## 6. UI/UX ДЕТАЛИ

### 6.1 Типографика и стили
- Header modal: "Create new" - 26px, warm accent color
- Labels: 13-14px, muted color
- Input/Textarea: 15px, border-color при фокусе переходит на accent-warm
- Buttons: 14px
- Все стили используют CSS переменные из `globals.css`

### 6.2 Цвета по типам (из текущего кода)
```javascript
const typePalette = {
  event: { bg: "#eef3e6", text: "#5a7a4a", dot: "#b7c181" },
  task: { bg: "#e8f0f5", text: "#4a6a8a", dot: "#81acc1" },
  journal: { bg: "#f0eaf5", text: "#6a4f8a", dot: "#a381c1" },
  note: { bg: "#f5eaea", text: "#8a4a4a", dot: "#c18181" },
};
```

### 6.3 Анимации
- Fade-in модала: `lia-fade-in` (180ms)
- Pop-in контента: `lia-pop-in` (220ms)
- Slide-in меню: `lia-slide-in` (220ms)

### 6.4 Размеры и отступы
- Modal width: 560px (или обновить согласно дизайну)
- Padding: px-6 py-5
- Gap между элементами: space-y-3 (12px)
- Border radius: rounded-[20px] для модала, rounded-[12px] для inputs

### 6.5 Валидация
- Required fields должны быть отмечены
- Error messages красные (#963838) на светлом фоне (#f7dddd)
- Real-time validation при изменении значений
- Submit button disabled если есть ошибки или loading

---

## 7. НЕОБХОДИМЫЕ БИБЛИОТЕКИ

### 7.1 Новые библиотеки (вероятно потребуются)
- `react-day-picker` - если нужен улучшенный date picker
- `date-fns` - уже установлена ✓
- `zod` - уже установлена ✓ (валидация)

### 7.2 Существующие библиотеки
- NextJS 16.2.4 ✓
- React 19.2.4 ✓
- TailwindCSS 4 ✓
- Prisma 7.7.0 ✓

---

## 8. РЕАЛИЗАЦИЯ: ПОШАГОВЫЙ ПЛАНДля нейросети

### ФАЗА 1: Подготовка БД (3-4 часа)
```bash
[ ] 1. Проанализировать дизайн в Figma на предмет всех полей каждого типа
[ ] 2. Определить недостающие поля в Prisma schema
[ ] 3. Добавить новые поля в модели:
    [ ] Event: location?, additionalFields?
    [ ] Task: description, urgency?
    [ ] JournalEntry: title?
    [ ] Note: tags?
[ ] 4. Создать миграцию Prisma
[ ] 5. Запустить миграцию: `prisma migrate dev`
[ ] 6. Обновить generated Prisma client: `prisma generate`
```

### ФАЗА 2: API Обновления (2-3 часа)
```bash
[ ] 1. Обновить validators.ts:
    [ ] createEventSchema - добавить новые поля
    [ ] createTaskSchema - добавить description, urgency
    [ ] createJournalSchema - проверить все поля
    [ ] createNoteSchema - проверить все поля
    
[ ] 2. Обновить API endpoints:
    [ ] src/app/api/events/route.ts - добавить обработку новых полей
    [ ] src/app/api/tasks/route.ts - добавить description, urgency
    [ ] src/app/api/journals/route.ts - проверить обработку
    [ ] src/app/api/notes/route.ts - проверить обработку
    
[ ] 3. Обновить GET endpoints если требуется возвращать новые поля
```

### ФАЗА 3: Компоненты и UI (5-6 часов)
```bash
[ ] 1. Создать вспомогательные компоненты в src/components/:
    [ ] CreateTypeSelector.tsx - 4 таба (EVENT | TASK | JOURNAL | NOTE)
    [ ] DatePickerInput.tsx - обертка над input type="date"
    [ ] TimePickerInput.tsx - обертка над input type="time"
    [ ] MoodSelector.tsx - selector для настроений в journal
    [ ] CategorySelect.tsx - dropdown для выбора категории
    [ ] UrgencySelect.tsx - selector для prioritize (если требуется)
    
[ ] 2. Разделить CreateModal на подкомпоненты:
    [ ] CreateEventForm.tsx - форма события
    [ ] CreateTaskForm.tsx - форма задачи
    [ ] CreateJournalForm.tsx - форма дневника
    [ ] CreateNoteForm.tsx - форма заметки
    
[ ] 3. Создать главный компонент:
    [ ] CreateEntityModal.tsx - главный модал с переключателем
    
[ ] 4. Обновить month-screen-figma.tsx:
    [ ] Заменить старый CreateModal на новый CreateEntityModal
    [ ] Обновить логику открытия/закрытия модала
    [ ] Обновить handleSubmit для работы с новой структурой
```

### ФАЗА 4: Стили и анимации (2-3 часа)
```bash
[ ] 1. Обновить CSS переменные в globals.css если требуется
[ ] 2. Применить дизайн цвета из Figma для каждого типа
[ ] 3. Настроить padding, margins, font-sizes согласно дизайну
[ ] 4. Обновить animations (fade-in, pop-in, slide-in)
[ ] 5. Убедиться что focus states соответствуют дизайну
[ ] 6. Проверить responsive design
```

### ФАЗА 5: Интеграция и тестирование (3-4 часа)
```bash
[ ] 1. Интегрировать новые компоненты в month-screen-figma.tsx
[ ] 2. Обновить типы (CreateType, CreateState)
[ ] 3. Тестирование каждого типа модала:
    [ ] Event - создание события с датой и временем
    [ ] Task - создание задачи с опциональным временем
    [ ] Journal - создание записи с настроением
    [ ] Note - создание заметки с категорией
    
[ ] 4. Тестирование UI:
    [ ] Переключение между типами
    [ ] Валидация формы
    [ ] Error handling
    [ ] Loading state
    [ ] Success notification
    
[ ] 5. Тестирование на разных размерах экрана
```

### ФАЗА 6: Полировка (2-3 часа)
```bash
[ ] 1. Code review и оптимизация производительности
[ ] 2. Проверка доступности (accessibility)
[ ] 3. Обновление документации/комментариев
[ ] 4. Final visual polish согласно дизайну
[ ] 5. Проверка на ошибки консоли
```

---

## 9. ТОЧКИ ВНИМАНИЯ И РИСКИ

### 9.1 Потенциальные проблемы
1. **Date picker компонент** - нужно выбрать между:
   - Встроенный `<input type="date">` (простой, кроссбраузерный)
   - `react-day-picker` (красивый, но требует зависимость)
   
2. **Валидация datetime** - нужно убедиться что:
   - Время события корректно (endTime > startTime)
   - Даты в правильном формате для API
   
3. **State management** - с 4 разными формами:
   - Может быть слишком много полей в `createState`
   - Решение: либо сохранить одну большую форму, либо разделить на подкомпоненты с локальным state
   
4. **Category selector** - нужно убедиться:
   - Категории загруженны перед открытием модала
   - Корректно передается categoryId в API
   
5. **Mood selector для journal** - нужно определить:
   - Предопределенный список настроений
   - Можно ли вводить произвольное текстовое значение
   - Визуальное отображение (dropdown, pills, иконки)

### 9.2 Миграция данных
- Если добавляются обязательные поля, нужна миграция с default значениями
- Старые записи должны продолжить работать

---

## 10. ФИНАЛЬНЫЙ CHECKLIST

### Перед запуском на production
```
[ ] Все 4 типа модалов работают корректно
[ ] Все поля валидируются правильно
[ ] API endpoints возвращают корректные ответы
[ ] БД миграции выполнены успешно
[ ] Нет console ошибок
[ ] Стили полностью соответствуют дизайну
[ ] Responsive дизайн работает на мобильных
[ ] Keyboard navigation работает (Tab, Enter, Escape)
[ ] Accessibility проверена (контрастность, ARIA labels)
[ ] Производительность оптимальна
[ ] Tests пройдены (если есть)
```

---

## 11. ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ/СОЗДАНИЯ

### Файлы для СОЗДАНИЯ:
```
src/components/CreateTypeSelector.tsx
src/components/DatePickerInput.tsx
src/components/TimePickerInput.tsx
src/components/MoodSelector.tsx
src/components/CategorySelect.tsx
src/components/UrgencySelect.tsx (если требуется)
src/components/CreateEventForm.tsx
src/components/CreateTaskForm.tsx
src/components/CreateJournalForm.tsx
src/components/CreateNoteForm.tsx
src/components/CreateEntityModal.tsx
prisma/migrations/[timestamp]_add_new_fields/migration.sql
```

### Файлы для ИЗМЕНЕНИЯ:
```
src/components/month-screen-figma.tsx - заменить CreateModal
src/lib/validators.ts - обновить все схемы
src/app/api/events/route.ts - добавить новые поля
src/app/api/tasks/route.ts - добавить description и urgency
src/app/api/journals/route.ts - проверить/обновить
src/app/api/notes/route.ts - проверить/обновить
prisma/schema.prisma - добавить новые поля в модели
```

---

## 12. ДОПОЛНИТЕЛЬНЫЕ ЗАМЕЧАНИЯ

### 12.1 Из анализа текущего кода
- Модал использует portal с position absolute
- Есть backdrop с blur effect
- Анимация pop-in на контенте и fade-in на фоне
- Keyboard support: Escape закрывает модал
- Click outside (на backdrop) закрывает модал

### 12.2 Для нейросети
При реализации убедитесь:
1. Все цвета из `typePalette` используются последовательно
2. Переключатель типов должен быть очень заметным (это главное управление)
3. Каждый тип имеет свой набор полей - не делайте условную логику слишком сложной
4. Используйте Tailwind классы (не inline styles), кроме цветов из типов
5. Следуйте pattern из текущего кода (naming, структура)
6. Протестируйте все 4 типа перед сдачей

---

**ИТОГО:** ~12-16 часов работы для опытного разработчика.
**Критический путь:** БД миграция → API updates → UI компоненты → Интеграция → Тестирование.
