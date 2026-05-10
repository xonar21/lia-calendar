# Руководство по Реализации: Код и Структура

## 1. СТРУКТУРА НОВЫХ КОМПОНЕНТОВ

```
src/components/
├── CreateEntityModal.tsx          ← Main component
├── create-modal/                  ← Folder for sub-components
│   ├── TypeSelector.tsx           ← 4 type tabs
│   ├── EventForm.tsx              ← Event-specific form
│   ├── TaskForm.tsx               ← Task-specific form
│   ├── JournalForm.tsx            ← Journal-specific form
│   ├── NoteForm.tsx               ← Note-specific form
│   ├── CategorySelect.tsx         ← Category dropdown
│   ├── MoodSelector.tsx           ← Mood picker for journal
│   └── UrgencySelect.tsx          ← Priority selector
├── month-screen-figma.tsx         ← Update to use CreateEntityModal
└── ...existing components
```

---

## 2. TYPE DEFINITIONS

### Обновить types в month-screen-figma.tsx или создать отдельный файл

```typescript
// types/modal.ts

export type CreateType = "event" | "task" | "journal" | "note";

export type EventFormState = {
  title: string;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  description: string;
  categoryId?: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
};

export type TaskFormState = {
  title: string;
  date: Date;
  hasTime: boolean;
  dueTime?: string; // optional, only if hasTime === true
  description: string;
  categoryId?: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
};

export type JournalFormState = {
  date: Date;
  mood: string;
  content: string;
  activeMs?: number;
  idleMs?: number;
};

export type NoteFormState = {
  title: string;
  date: Date;
  content: string;
  categoryId?: string;
  pinnedAt?: Date;
};

export type CreateState = {
  type: CreateType;
  event: Partial<EventFormState>;
  task: Partial<TaskFormState>;
  journal: Partial<JournalFormState>;
  note: Partial<NoteFormState>;
  loading: boolean;
  error: string;
};
```

---

## 3. КОМПОНЕНТ CreateEntityModal (Main)

```typescript
// src/components/CreateEntityModal.tsx

"use client";

import { FormEvent, useState, useCallback } from "react";
import { format } from "date-fns";

import { TypeSelector } from "./create-modal/TypeSelector";
import { EventForm } from "./create-modal/EventForm";
import { TaskForm } from "./create-modal/TaskForm";
import { JournalForm } from "./create-modal/JournalForm";
import { NoteForm } from "./create-modal/NoteForm";

import type { CreateType, CreateState } from "@/types/modal";

export type { CreateType };

type Props = {
  isOpen: boolean;
  selectedDate: Date;
  selectedCategory: string;
  onClose: () => void;
  onSubmit: (
    type: CreateType,
    data: Record<string, any>
  ) => Promise<void>;
};

const initialState: CreateState = {
  type: "event",
  event: {
    title: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    description: "",
    urgency: "MEDIUM",
  },
  task: {
    title: "",
    date: new Date(),
    hasTime: false,
    description: "",
    urgency: "MEDIUM",
  },
  journal: {
    date: new Date(),
    mood: "",
    content: "",
  },
  note: {
    title: "",
    date: new Date(),
    content: "",
  },
  loading: false,
  error: "",
};

export function CreateEntityModal({
  isOpen,
  selectedDate,
  selectedCategory,
  onClose,
  onSubmit,
}: Props) {
  const [state, setState] = useState<CreateState>({
    ...initialState,
    event: { ...initialState.event, date: selectedDate },
    task: { ...initialState.task, date: selectedDate },
    journal: { ...initialState.journal, date: selectedDate },
    note: { ...initialState.note, date: selectedDate },
  });

  const updateState = useCallback(
    (type: CreateType, updates: Record<string, any>) => {
      setState((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...updates },
        error: "",
      }));
    },
    []
  );

  const handleTypeChange = useCallback((newType: CreateType) => {
    setState((prev) => ({ ...prev, type: newType, error: "" }));
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const currentData = state[state.type];
      await onSubmit(state.type, currentData);
      // Reset form
      setState((prev) => ({
        ...initialState,
        event: { ...initialState.event, date: selectedDate },
        task: { ...initialState.task, date: selectedDate },
        journal: { ...initialState.journal, date: selectedDate },
        note: { ...initialState.note, date: selectedDate },
      }));
      onClose();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create item. Please try again.",
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="lia-fade-in absolute inset-0 z-30 flex items-center justify-center bg-[rgba(30,25,20,0.28)] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="lia-pop-in w-[560px] overflow-hidden rounded-[20px] border border-[var(--lia-border)] bg-[var(--lia-surface)] shadow-[0_24px_60px_-20px_rgba(30,25,20,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--lia-border-soft)] px-6 py-5">
          <div>
            <h3 className="text-[26px] leading-none text-[var(--lia-accent-warm)]">
              Create new
            </h3>
            <p className="mt-2 text-[13px] text-[var(--lia-muted)]">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
              <span className="mx-2 text-[var(--lia-border)]">•</span>
              category:{" "}
              <span className="font-medium text-[#3d362d]">
                {selectedCategory === "all" ? "none" : selectedCategory}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[16px] text-[var(--lia-muted)] hover:bg-black/5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Type Selector */}
        <TypeSelector
          activeType={state.type}
          onTypeChange={handleTypeChange}
        />

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-3 px-6 pb-6 pt-4">
          {state.type === "event" && (
            <EventForm
              data={state.event}
              onUpdate={(updates) =>
                updateState("event", updates)
              }
            />
          )}

          {state.type === "task" && (
            <TaskForm
              data={state.task}
              onUpdate={(updates) =>
                updateState("task", updates)
              }
            />
          )}

          {state.type === "journal" && (
            <JournalForm
              data={state.journal}
              onUpdate={(updates) =>
                updateState("journal", updates)
              }
            />
          )}

          {state.type === "note" && (
            <NoteForm
              data={state.note}
              onUpdate={(updates) =>
                updateState("note", updates)
              }
            />
          )}

          {/* Error Message */}
          {state.error && (
            <p className="rounded-[10px] bg-[#f7dddd] px-3 py-2 text-[13px] text-[#963838]">
              {state.error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--lia-border)] bg-white px-5 py-2 text-[14px] text-[var(--lia-muted)] hover:border-[var(--lia-accent-warm)]/40 hover:text-[#3d362d]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={state.loading}
              className="rounded-full bg-[var(--lia-accent-warm)] px-5 py-2 text-[14px] text-white shadow-[0_6px_16px_-8px_rgba(125,88,25,0.6)] hover:brightness-110 disabled:opacity-60"
            >
              {state.loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## 4. TypeSelector КОМПОНЕНТ

```typescript
// src/components/create-modal/TypeSelector.tsx

"use client";

import type { CreateType } from "@/types/modal";

const TYPE_PALETTE: Record<CreateType, { bg: string; text: string; dot: string }> = {
  event: { bg: "#eef3e6", text: "#5a7a4a", dot: "#b7c181" },
  task: { bg: "#e8f0f5", text: "#4a6a8a", dot: "#81acc1" },
  journal: { bg: "#f0eaf5", text: "#6a4f8a", dot: "#a381c1" },
  note: { bg: "#f5eaea", text: "#8a4a4a", dot: "#c18181" },
};

type Props = {
  activeType: CreateType;
  onTypeChange: (type: CreateType) => void;
};

export function TypeSelector({ activeType, onTypeChange }: Props) {
  const types: CreateType[] = ["event", "task", "journal", "note"];

  return (
    <div className="border-b border-[var(--lia-border-soft)] px-6 py-3">
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const isActive = activeType === type;
          const palette = TYPE_PALETTE[type];

          return (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] capitalize transition ${
                isActive
                  ? "border-transparent shadow-sm"
                  : "border-[var(--lia-border)] bg-white text-[var(--lia-muted)] hover:border-[var(--lia-accent-warm)]/40 hover:text-[#3d362d]"
              }`}
              style={
                isActive ? { background: palette.bg, color: palette.text } : undefined
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: palette.dot }}
              />
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 5. EventForm КОМПОНЕНТ

```typescript
// src/components/create-modal/EventForm.tsx

"use client";

import { CategorySelect } from "./CategorySelect";
import { UrgencySelect } from "./UrgencySelect";
import type { EventFormState } from "@/types/modal";

type Props = {
  data: Partial<EventFormState>;
  onUpdate: (updates: Partial<EventFormState>) => void;
};

export function EventForm({ data, onUpdate }: Props) {
  return (
    <>
      {/* Title */}
      <input
        type="text"
        value={data.title || ""}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="Title"
        className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
        required
      />

      {/* Date */}
      <input
        type="date"
        value={data.date ? data.date.toISOString().split("T")[0] : ""}
        onChange={(e) =>
          onUpdate({ date: new Date(e.target.value) })
        }
        className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
        required
      />

      {/* Time Row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[12px] text-[var(--lia-muted)]">
            Start time
          </label>
          <input
            type="time"
            value={data.startTime || "09:00"}
            onChange={(e) =>
              onUpdate({ startTime: e.target.value })
            }
            className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
            required
          />
        </div>
        <div className="flex-1">
          <label className="text-[12px] text-[var(--lia-muted)]">
            End time
          </label>
          <input
            type="time"
            value={data.endTime || "10:00"}
            onChange={(e) =>
              onUpdate({ endTime: e.target.value })
            }
            className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
            required
          />
        </div>
      </div>

      {/* Description */}
      <textarea
        value={data.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description (optional)"
        className="h-[112px] w-full resize-none rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
      />

      {/* Category & Urgency */}
      <div className="flex gap-3">
        <CategorySelect
          value={data.categoryId || ""}
          onChange={(id) => onUpdate({ categoryId: id })}
        />
        <UrgencySelect
          value={data.urgency || "MEDIUM"}
          onChange={(urgency) => onUpdate({ urgency })}
        />
      </div>
    </>
  );
}
```

---

## 6. TaskForm КОМПОНЕНТ

```typescript
// src/components/create-modal/TaskForm.tsx

"use client";

import { CategorySelect } from "./CategorySelect";
import { UrgencySelect } from "./UrgencySelect";
import type { TaskFormState } from "@/types/modal";

type Props = {
  data: Partial<TaskFormState>;
  onUpdate: (updates: Partial<TaskFormState>) => void;
};

export function TaskForm({ data, onUpdate }: Props) {
  return (
    <>
      {/* Title */}
      <input
        type="text"
        value={data.title || ""}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="Title"
        className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
        required
      />

      {/* Date */}
      <input
        type="date"
        value={data.date ? data.date.toISOString().split("T")[0] : ""}
        onChange={(e) =>
          onUpdate({ date: new Date(e.target.value) })
        }
        className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
        required
      />

      {/* Bind to time checkbox */}
      <label className="flex items-center gap-2 text-[13px] text-[var(--lia-muted)]">
        <input
          type="checkbox"
          checked={data.hasTime || false}
          onChange={(e) => onUpdate({ hasTime: e.target.checked })}
          className="h-4 w-4 accent-[var(--lia-accent-warm)]"
        />
        bind to time
      </label>

      {/* Due time (conditional) */}
      {data.hasTime && (
        <input
          type="time"
          value={data.dueTime || "09:00"}
          onChange={(e) => onUpdate({ dueTime: e.target.value })}
          className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
        />
      )}

      {/* Description */}
      <textarea
        value={data.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Description (optional)"
        className="h-[112px] w-full resize-none rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
      />

      {/* Category & Urgency */}
      <div className="flex gap-3">
        <CategorySelect
          value={data.categoryId || ""}
          onChange={(id) => onUpdate({ categoryId: id })}
        />
        <UrgencySelect
          value={data.urgency || "MEDIUM"}
          onChange={(urgency) => onUpdate({ urgency })}
        />
      </div>
    </>
  );
}
```

---

## 7. JournalForm КОМПОНЕНТ

```typescript
// src/components/create-modal/JournalForm.tsx

"use client";

import { MoodSelector } from "./MoodSelector";
import type { JournalFormState } from "@/types/modal";

type Props = {
  data: Partial<JournalFormState>;
  onUpdate: (updates: Partial<JournalFormState>) => void;
};

const MOOD_PRESETS = [
  "calm",
  "grateful",
  "loved",
  "safe",
  "relaxed",
  "happy",
  "confident",
  "anxious",
  "overthinking",
  "tense",
  "lonely",
  "stressed",
  "heavy",
  "motivated",
  "tired",
];

export function JournalForm({ data, onUpdate }: Props) {
  return (
    <>
      {/* Date */}
      <input
        type="date"
        value={data.date ? data.date.toISOString().split("T")[0] : ""}
        onChange={(e) =>
          onUpdate({ date: new Date(e.target.value) })
        }
        className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
        required
      />

      {/* Mood */}
      <MoodSelector
        value={data.mood || ""}
        onChange={(mood) => onUpdate({ mood })}
        presets={MOOD_PRESETS}
      />

      {/* Content */}
      <textarea
        value={data.content || ""}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Write down what's on your mind..."
        className="h-[200px] w-full resize-none rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
        required
      />

      {/* Active/Idle Time (optional) */}
      <div className="flex gap-3">
        <input
          type="number"
          value={data.activeMs ? data.activeMs / 1000 / 60 : ""}
          onChange={(e) =>
            onUpdate({
              activeMs: e.target.value ? Math.round(parseFloat(e.target.value) * 60 * 1000) : undefined,
            })
          }
          placeholder="Active time (minutes)"
          className="flex-1 rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
          min="0"
        />
        <input
          type="number"
          value={data.idleMs ? data.idleMs / 1000 / 60 : ""}
          onChange={(e) =>
            onUpdate({
              idleMs: e.target.value ? Math.round(parseFloat(e.target.value) * 60 * 1000) : undefined,
            })
          }
          placeholder="Idle time (minutes)"
          className="flex-1 rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
          min="0"
        />
      </div>
    </>
  );
}
```

---

## 8. NoteForm КОМПОНЕНТ

```typescript
// src/components/create-modal/NoteForm.tsx

"use client";

import { CategorySelect } from "./CategorySelect";
import type { NoteFormState } from "@/types/modal";

type Props = {
  data: Partial<NoteFormState>;
  onUpdate: (updates: Partial<NoteFormState>) => void;
};

export function NoteForm({ data, onUpdate }: Props) {
  return (
    <>
      {/* Title */}
      <input
        type="text"
        value={data.title || ""}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="Title"
        className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
        required
      />

      {/* Date */}
      <input
        type="date"
        value={data.date ? data.date.toISOString().split("T")[0] : ""}
        onChange={(e) =>
          onUpdate({ date: new Date(e.target.value) })
        }
        className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
        required
      />

      {/* Content */}
      <textarea
        value={data.content || ""}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Write your note..."
        className="h-[150px] w-full resize-none rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
        required
      />

      {/* Category */}
      <CategorySelect
        value={data.categoryId || ""}
        onChange={(id) => onUpdate({ categoryId: id })}
      />

      {/* Pinned */}
      <label className="flex items-center gap-2 text-[13px] text-[var(--lia-muted)]">
        <input
          type="checkbox"
          checked={!!data.pinnedAt}
          onChange={(e) =>
            onUpdate({ pinnedAt: e.target.checked ? new Date() : undefined })
          }
          className="h-4 w-4 accent-[var(--lia-accent-warm)]"
        />
        Pin this note
      </label>
    </>
  );
}
```

---

## 9. ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ

### CategorySelect

```typescript
// src/components/create-modal/CategorySelect.tsx

"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string; color?: string };

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export function CategorySelect({ value, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data: { categories: Category[] } = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
    >
      <option value="">Select category...</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
```

### MoodSelector

```typescript
// src/components/create-modal/MoodSelector.tsx

"use client";

type Props = {
  value: string;
  onChange: (mood: string) => void;
  presets: string[];
};

export function MoodSelector({ value, onChange, presets }: Props) {
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Mood (optional) — e.g. calm, focused, tired"
        className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
        list="mood-presets"
      />
      <datalist id="mood-presets">
        {presets.map((mood) => (
          <option key={mood} value={mood} />
        ))}
      </datalist>
    </>
  );
}
```

### UrgencySelect

```typescript
// src/components/create-modal/UrgencySelect.tsx

"use client";

type Props = {
  value: "LOW" | "MEDIUM" | "HIGH";
  onChange: (urgency: "LOW" | "MEDIUM" | "HIGH") => void;
};

export function UrgencySelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value as "LOW" | "MEDIUM" | "HIGH")
      }
      className="flex-1 rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px]"
    >
      <option value="LOW">Low Priority</option>
      <option value="MEDIUM">Medium Priority</option>
      <option value="HIGH">High Priority</option>
    </select>
  );
}
```

---

## 10. ИНТЕГРАЦИЯ В month-screen-figma.tsx

### Шаг 1: Импорт

```typescript
import { CreateEntityModal, type CreateType } from "@/components/CreateEntityModal";
```

### Шаг 2: Замена CreateModal на CreateEntityModal

```typescript
// Удалить старый CreateModal компонент

// Добавить новый в return JSX:
<CreateEntityModal
  isOpen={isCreateOpen}
  selectedDate={selectedDate}
  selectedCategory={selectedCategory}
  onClose={() => setCreateOpen(false)}
  onSubmit={handleCreateSubmit}
/>
```

### Шаг 3: Обновить handleCreateSubmit

```typescript
const handleCreateSubmit = async (type: CreateType, data: Record<string, any>) => {
  const dateKey = toDateKey(selectedDate);

  if (type === "event") {
    const startDateTime = joinDateTime(data.date, data.startTime);
    const endDateTime = joinDateTime(data.date, data.endTime);

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description || undefined,
        startsAt: startDateTime.toISOString(),
        endsAt: endDateTime.toISOString(),
        categoryId: data.categoryId || undefined,
        urgency: data.urgency,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create event");
    }
  }

  // Аналогично для task, journal, note

  setRefreshTick((prev) => prev + 1);
  setToast({ kind: "success", message: `${type} created successfully` });
};
```

---

## 11. ОБНОВЛЕНИЕ VALIDATORS

```typescript
// src/lib/validators.ts

import { z } from "zod";

// ... existing schemas ...

export const createEventSchema = z
  .object({
    categoryId: z.string().cuid().optional(),
    title: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: "endsAt must be greater than startsAt",
    path: ["endsAt"],
  });

export const createTaskSchema = z.object({
  categoryId: z.string().cuid().optional(),
  title: z.string().min(1).max(160),
  description: z.string().max(5000).optional(), // NEW
  date: z.string().datetime(),
  dueAt: z.string().datetime().optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(), // NEW
  isCompleted: z.boolean().default(false),
});

// ... rest of schemas ...
```

---

## 12. PRISMA MIGRATION EXAMPLE

```sql
-- prisma/migrations/[timestamp]_add_task_fields/migration.sql

-- AddColumn description to Task
ALTER TABLE "Task" ADD COLUMN "description" TEXT;

-- AddColumn urgency to Task
ALTER TABLE "Task" ADD COLUMN "urgency" VARCHAR(50);

-- Potentially for Event if adding location
-- ALTER TABLE "Event" ADD COLUMN "location" TEXT;
```

---

## 13. ТЕСТИРОВАНИЕ

### Checklist для каждого типа:
- [ ] Создание нового элемента
- [ ] Валидация обязательных полей
- [ ] Отправка данных на сервер
- [ ] Отображение ошибок
- [ ] Закрытие модала после успешного создания
- [ ] Переключение между типами
- [ ] Сохранение данных между переключениями типов

### Функциональное тестирование:
```bash
# EVENT
- Создать событие с временем (09:00-10:00)
- Создать событие с описанием и категорией
- Попытка создать событие с end time < start time (должна быть ошибка)

# TASK
- Создать задачу без времени
- Создать задачу с временем
- Изменить "bind to time" после заполнения

# JOURNAL
- Создать запись с настроением
- Создать запись без настроения
- Добавить время активности

# NOTE
- Создать заметку с категорией
- Закрепить/открепить заметку
- Создать заметку без категории
```

---

## 14. PERFORMANCE TIPS

1. **Lazy loading категорий:** Загружать при открытии модала, кешировать
2. **Дебаунс при вводе:** Не перерисовывать на каждый символ
3. **Мемоизация компонентов:** Использовать `React.memo` для формочек
4. **Keyboard shortcuts:** ESC для закрытия, ENTER для submit

---

## SUMMARY

Главные файлы:
1. ✅ `CreateEntityModal.tsx` - основной компонент
2. ✅ `create-modal/` - подкомпоненты
3. ✅ `types/modal.ts` - типы
4. ✅ Обновить `month-screen-figma.tsx`
5. ✅ Обновить `validators.ts`
6. ✅ Обновить API endpoints
7. ✅ Prisma миграция для новых полей

**Total files:** ~12-14 новых/обновленных файлов
**Estimated time:** 6-8 часов для опытного разработчика

