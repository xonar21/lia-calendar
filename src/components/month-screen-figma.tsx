"use client";

import {
  addDays,
  addHours,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { CyclePopover } from "@/components/cycle-popover";
import { UserMenu } from "@/components/user-menu";
import { computeCyclePhase, type CyclePhaseInfo } from "@/lib/cycle";

const imgSettings = "https://www.figma.com/api/mcp/asset/5a98bf4e-f919-4652-b8b2-b0741acc6fee";
const imgLogo = "https://www.figma.com/api/mcp/asset/c6101315-437e-4c97-9d22-78ff3d51b341";
const imgEventIcon = "https://www.figma.com/api/mcp/asset/5e9d66b3-13e2-4533-ae5d-c39249ff6e8c";
const imgSportIcon = "https://www.figma.com/api/mcp/asset/124125cc-17a5-48df-befe-315f6d5379f4";
const imgTaskIcon = "https://www.figma.com/api/mcp/asset/dd2b5917-2018-4c8d-9c13-9d6fdb49a64e";

const categoryList = ["all", "personal", "work", "health"] as const;
const weekDayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const hours = Array.from({ length: 12 }, (_, index) => `${index === 0 ? 12 : index} AM`);

const DEFAULT_CATEGORY_COLOR = "#b6af9d";
const CATEGORY_PALETTE: Record<string, string> = {
  personal: "#e8b95e",
  work: "#5877a4",
  health: "#7e9b8a",
  family: "#9d6f61",
  study: "#8c7aa9",
};

function getCategoryColor(name: string) {
  if (!name || name === "all") return DEFAULT_CATEGORY_COLOR;
  if (CATEGORY_PALETTE[name]) return CATEGORY_PALETTE[name];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 42%, 58%)`;
}

type AppView = "month" | "week" | "day";
type AppCategory = string;
type DayTab = "calendar" | "journal" | "notes";
type CreateType = "event" | "task" | "journal" | "note";

type Entry = {
  id: string;
  kind: "event" | "task";
  time: string;
  title: string;
  bg: string;
  icon: string;
  category: AppCategory;
};

type JournalRecord = {
  id: string;
  dateKey: string;
  content: string;
  mood?: string;
  createdAt: string;
};

type NoteRecord = {
  id: string;
  dateKey: string;
  title: string;
  content: string;
  createdAt: string;
  category: AppCategory;
};

type CreateState = {
  type: CreateType;
  title: string;
  description: string;
  mood: string;
  useTime: boolean;
  time: string;
  loading: boolean;
  error: string;
};

type ToastState = {
  kind: "success" | "error";
  message: string;
} | null;

const seedEntries: Record<string, Entry[]> = {
  "2026-04-14": [
    {
      id: "seed-workday",
      kind: "event",
      time: "12AM",
      title: "start work day",
      bg: "#f8e5c6",
      icon: imgEventIcon,
      category: "work",
    },
    {
      id: "seed-sport",
      kind: "event",
      time: "12AM",
      title: "sport",
      bg: "#d1d7d4",
      icon: imgSportIcon,
      category: "health",
    },
    {
      id: "seed-water",
      kind: "task",
      time: "12AM",
      title: "drink water",
      bg: "#d1d7d4",
      icon: imgTaskIcon,
      category: "health",
    },
  ],
};

const seedJournals: JournalRecord[] = [
  {
    id: "j-seed-1",
    dateKey: "2026-04-14",
    content: "Утро продуктивное, хочу сосредоточиться на ключевых задачах.",
    mood: "motivated",
    createdAt: "08:32",
  },
];

const seedNotes: NoteRecord[] = [
  {
    id: "n-seed-1",
    dateKey: "2026-04-14",
    title: "Покупки",
    content: "Овсянка, бананы, йогурт, орехи",
    createdAt: "09:15",
    category: "personal",
  },
];

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toHumanTime(value: string) {
  const [hhRaw = "0", mmRaw = "00"] = value.split(":");
  const hh = Number(hhRaw);
  const suffix = hh >= 12 ? "PM" : "AM";
  const normalized = hh % 12 === 0 ? 12 : hh % 12;
  return `${normalized}${mmRaw === "00" ? "" : `:${mmRaw}`}${suffix}`;
}

function joinDateTime(date: Date, hhmm: string) {
  const [hhRaw = "0", mmRaw = "0"] = hhmm.split(":");
  const output = new Date(date);
  output.setHours(Number(hhRaw), Number(mmRaw), 0, 0);
  return output;
}

function getMonthCells(anchorDate: Date) {
  const monthStart = startOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  return Array.from({ length: 35 }, (_, idx) => addDays(gridStart, idx));
}

function getWeekCells(anchorDate: Date) {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx));
}

function shiftAnchor(date: Date, view: AppView, direction: 1 | -1) {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addDays(date, 7 * direction);
  const nextMonthDate = new Date(date);
  nextMonthDate.setMonth(date.getMonth() + direction);
  return nextMonthDate;
}

function SidebarIcon({ icon }: { icon: AppView }) {
  const stroke = "#000000";
  if (icon === "month") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1.25" y="2.25" width="11.5" height="10.5" rx="1.5" stroke={stroke} strokeWidth="1" />
        <path d="M1.5 5H12.5M4.25 1.5V3.5M9.75 1.5V3.5" stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  if (icon === "week") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1.25" y="1.25" width="11.5" height="11.5" rx="1.5" stroke={stroke} strokeWidth="1" />
        <path d="M1.5 4.5H12.5M1.5 7H12.5M1.5 9.5H12.5" stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.25" y="1.25" width="11.5" height="11.5" rx="1.5" stroke={stroke} strokeWidth="1" />
      <path d="M3.25 4.25H10.75M3.25 7H10.75M3.25 9.75H8.75" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

function TimeGrid({
  columnDates,
  onSlotClick,
}: {
  columnDates: Date[];
  onSlotClick: (date: Date, time: string) => void;
}) {
  return (
    <div
      className="absolute left-[304px] right-[24px] top-[184px] grid overflow-hidden rounded-[14px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] shadow-[0_1px_2px_rgba(90,79,62,0.04),0_8px_24px_-12px_rgba(90,79,62,0.08)]"
      style={{ gridTemplateColumns: `48px repeat(${columnDates.length}, minmax(0, 1fr))` }}
    >
      {hours.map((label, rowIndex) => (
        <div key={`row-${label}`} className="contents">
          <div className="flex h-[54px] items-start justify-end border-r border-b border-[var(--lia-border-soft)] pr-2 pt-2 text-[12px] uppercase tracking-wide text-[var(--lia-muted-soft)]">
            {label}
          </div>
          {columnDates.map((date) => {
            const hhmm = `${String(rowIndex).padStart(2, "0")}:00`;
            return (
              <button
                key={`${toDateKey(date)}-${hhmm}`}
                type="button"
                onClick={() => onSlotClick(date, hhmm)}
                className="group relative h-[54px] border-r border-b border-[var(--lia-border-soft)] transition hover:bg-[rgba(125,88,25,0.06)] focus:outline-none"
                aria-label={`Create item ${toDateKey(date)} ${hhmm}`}
              >
                <span className="pointer-events-none absolute inset-1 rounded-[8px] opacity-0 ring-1 ring-inset ring-[var(--lia-accent-warm)]/30 transition group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function CreateModal({
  isOpen,
  state,
  selectedDate,
  selectedCategory,
  onClose,
  onChange,
  onSubmit,
}: {
  isOpen: boolean;
  state: CreateState;
  selectedDate: Date;
  selectedCategory: AppCategory;
  onClose: () => void;
  onChange: (next: Partial<CreateState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!isOpen) return null;

  const typePalette: Record<CreateType, { bg: string; text: string; dot: string }> = {
    event: { bg: "var(--lia-accent-warm-tint)", text: "var(--lia-accent-warm)", dot: "#e8b95e" },
    task: { bg: "var(--lia-accent-sage-tint)", text: "#4c6a59", dot: "#7e9b8a" },
    journal: { bg: "var(--lia-accent-cool-tint)", text: "var(--lia-accent-cool)", dot: "#77adc4" },
    note: { bg: "var(--lia-accent-rose-tint)", text: "var(--lia-accent-rose)", dot: "#9d6f61" },
  };

  return (
    <div
      className="lia-fade-in absolute inset-0 z-30 flex items-center justify-center bg-[rgba(30,25,20,0.28)] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="lia-pop-in w-[560px] overflow-hidden rounded-[20px] border border-[var(--lia-border)] bg-[var(--lia-surface)] shadow-[0_24px_60px_-20px_rgba(30,25,20,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--lia-border-soft)] px-6 py-5">
          <div>
            <h3 className="text-[26px] leading-none text-[var(--lia-accent-warm)]">Create new</h3>
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

        <div className="px-6 pt-5">
          <div className="flex flex-wrap gap-2">
            {(["event", "task", "journal", "note"] as const).map((type) => {
              const active = state.type === type;
              const palette = typePalette[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ type })}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] capitalize ${
                    active
                      ? "border-transparent shadow-sm"
                      : "border-[var(--lia-border)] bg-white text-[var(--lia-muted)] hover:border-[var(--lia-accent-warm)]/40 hover:text-[#3d362d]"
                  }`}
                  style={
                    active
                      ? { background: palette.bg, color: palette.text }
                      : undefined
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

        <form onSubmit={onSubmit} className="space-y-3 px-6 pb-6 pt-4">
          {state.type !== "journal" && (
            <input
              value={state.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="Title"
              className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
              required
            />
          )}

          {state.type === "journal" && (
            <input
              value={state.mood}
              onChange={(event) => onChange({ mood: event.target.value })}
              placeholder="Mood (optional) — e.g. calm, focused, tired"
              className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
            />
          )}

          <textarea
            value={state.description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder={state.type === "journal" ? "Write down what's on your mind..." : "Description (optional)"}
            className="h-[112px] w-full resize-none rounded-[12px] border border-[var(--lia-border)] bg-white px-3.5 py-2.5 text-[15px] placeholder:text-[var(--lia-muted-soft)]"
          />

          {(state.type === "event" || state.type === "task" || state.type === "note") && (
            <div className="flex flex-wrap items-center gap-3">
              {state.type !== "event" && (
                <label className="flex items-center gap-2 text-[13px] text-[var(--lia-muted)]">
                  <input
                    type="checkbox"
                    checked={state.useTime}
                    onChange={(event) => onChange({ useTime: event.target.checked })}
                    className="h-4 w-4 accent-[var(--lia-accent-warm)]"
                  />
                  bind to time
                </label>
              )}
              {(state.type === "event" || state.useTime) && (
                <input
                  type="time"
                  value={state.time}
                  onChange={(event) => onChange({ time: event.target.value })}
                  className="rounded-[12px] border border-[var(--lia-border)] bg-white px-3 py-2 text-[14px]"
                  required={state.type === "event"}
                />
              )}
            </div>
          )}

          {state.error && (
            <p className="rounded-[10px] bg-[#f7dddd] px-3 py-2 text-[13px] text-[#963838]">{state.error}</p>
          )}

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

export function MonthScreenFigma() {
  const [view, setView] = useState<AppView>("month");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date(2026, 3, 14));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 3, 14));
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>("all");
  const [isCycleCardOpen, setCycleCardOpen] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<CyclePhaseInfo>(computeCyclePhase(null));
  const [dayTab, setDayTab] = useState<DayTab>("calendar");
  const [entriesByDate, setEntriesByDate] = useState<Record<string, Entry[]>>(seedEntries);
  const [journals, setJournals] = useState<JournalRecord[]>(seedJournals);
  const [notes, setNotes] = useState<NoteRecord[]>(seedNotes);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [categoryIds, setCategoryIds] = useState<Record<string, string>>({});
  const [userCategories, setUserCategories] = useState<string[]>([...categoryList]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [createState, setCreateState] = useState<CreateState>({
    type: "event",
    title: "",
    description: "",
    mood: "",
    useTime: true,
    time: "09:00",
    loading: false,
    error: "",
  });
  const [calendarLoadError, setCalendarLoadError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) return;
        const payload: { categories?: Array<{ id: string; name: string }> } = await response.json();
        const mapping = Object.fromEntries(
          (payload.categories ?? []).map((category) => [category.name.toLowerCase(), category.id]),
        );
        setCategoryIds(mapping);
        setUserCategories(["all", ...Object.keys(mapping)]);
      } catch {
        // silent fallback; local mode still works
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const payload: {
          settings?: {
            defaultView?: "MONTH" | "WEEK" | "DAY";
            cycleMode?: "ENABLED" | "DISABLED" | null;
            cycleLengthDays?: number | null;
            periodLengthDays?: number | null;
            cycleStartDate?: string | null;
          };
        } = await response.json();
        const defaultView = payload.settings?.defaultView?.toLowerCase();
        if (defaultView === "month" || defaultView === "week" || defaultView === "day") {
          setView(defaultView);
        }
        setCyclePhase(computeCyclePhase(payload.settings ?? null));
      } catch {
        // keep local defaults
      } finally {
        setSettingsHydrated(true);
      }
    };

    void loadSettings();
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    const persist = async () => {
      try {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defaultView: view.toUpperCase() }),
        });
      } catch {
        // non-critical
      }
    };
    void persist();
  }, [view, settingsHydrated]);

  useEffect(() => {
    if (!isCreateOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCreateOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isCreateOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const monthLabel = format(anchorDate, "MMMM yyyy");
  const monthCells = useMemo(() => getMonthCells(anchorDate), [anchorDate]);
  const weekCells = useMemo(() => getWeekCells(anchorDate), [anchorDate]);
  const dateKey = toDateKey(selectedDate);
  const categoryById = useMemo(
    () => Object.fromEntries(Object.entries(categoryIds).map(([name, id]) => [id, name as AppCategory])),
    [categoryIds],
  );
  const selectedJournals = journals.filter((journal) => journal.dateKey === dateKey);
  const selectedNotes = notes.filter((note) => note.dateKey === dateKey);

  useEffect(() => {
    const loadCalendar = async () => {
      const from =
        view === "month"
          ? startOfDay(monthCells[0])
          : view === "week"
            ? startOfDay(weekCells[0])
            : startOfDay(selectedDate);
      const to =
        view === "month"
          ? addDays(startOfDay(monthCells[monthCells.length - 1]), 1)
          : view === "week"
            ? addDays(startOfDay(weekCells[weekCells.length - 1]), 1)
            : addDays(startOfDay(selectedDate), 1);

      const selectedCategoryId = selectedCategory !== "all" ? categoryIds[selectedCategory] : undefined;
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);

      try {
        const response = await fetch(`/api/calendar?${params.toString()}`);
        if (!response.ok) {
          setCalendarLoadError("Cannot load calendar data right now.");
          return;
        }

        type CalendarResponse = {
          data?: {
            events?: Array<{
              id: string;
              title: string;
              startsAt: string;
              categoryId?: string | null;
            }>;
            tasks?: Array<{
              id: string;
              title: string;
              date: string;
              dueAt?: string | null;
              categoryId?: string | null;
            }>;
            journals?: Array<{ id: string; date: string; content: string; mood?: string | null }>;
            notes?: Array<{
              id: string;
              title: string;
              content: string;
              date: string;
              categoryId?: string | null;
              pinnedAt?: string | null;
            }>;
          };
        };

        const payload: CalendarResponse = await response.json();
        const nextEntries: Record<string, Entry[]> = {};
        const events = payload.data?.events ?? [];
        const tasks = payload.data?.tasks ?? [];

        events.forEach((eventItem) => {
          const eventDate = new Date(eventItem.startsAt);
          const key = toDateKey(eventDate);
          const category = categoryById[eventItem.categoryId ?? ""] ?? "personal";
          const item: Entry = {
            id: eventItem.id,
            kind: "event",
            time: toHumanTime(format(eventDate, "HH:mm")),
            title: eventItem.title,
            bg: "#f8e5c6",
            icon: imgEventIcon,
            category,
          };
          nextEntries[key] = [...(nextEntries[key] ?? []), item];
        });

        tasks.forEach((taskItem) => {
          const taskDate = new Date(taskItem.date);
          const key = toDateKey(taskDate);
          const category = categoryById[taskItem.categoryId ?? ""] ?? "personal";
          const humanTime = taskItem.dueAt ? toHumanTime(format(new Date(taskItem.dueAt), "HH:mm")) : "Anytime";
          const item: Entry = {
            id: taskItem.id,
            kind: "task",
            time: humanTime,
            title: taskItem.title,
            bg: "#d1d7d4",
            icon: imgTaskIcon,
            category,
          };
          nextEntries[key] = [...(nextEntries[key] ?? []), item];
        });

        setEntriesByDate(Object.keys(nextEntries).length > 0 ? nextEntries : seedEntries);
        setJournals(
          (payload.data?.journals ?? []).map((journalItem) => ({
            id: journalItem.id,
            dateKey: toDateKey(new Date(journalItem.date)),
            content: journalItem.content,
            mood: journalItem.mood ?? undefined,
            createdAt: format(new Date(journalItem.date), "HH:mm"),
          })),
        );
        setNotes(
          (payload.data?.notes ?? []).map((noteItem) => ({
            id: noteItem.id,
            dateKey: toDateKey(new Date(noteItem.date)),
            title: noteItem.title,
            content: noteItem.content,
            createdAt: format(new Date(noteItem.pinnedAt ?? noteItem.date), "HH:mm"),
            category: categoryById[noteItem.categoryId ?? ""] ?? "personal",
          })),
        );
        setCalendarLoadError("");
      } catch {
        setCalendarLoadError("Cannot load calendar data right now.");
      }
    };

    void loadCalendar();
  }, [view, selectedDate, selectedCategory, monthCells, weekCells, categoryIds, categoryById, refreshTick]);

  const addButtonStyle =
    view === "day"
      ? { bg: "#77adc4", text: "#f1f6fa" }
      : view === "week"
        ? { bg: "#e6b8ac", text: "#f7ece7" }
        : { bg: "#f2bc62", text: "#f8e5c6" };

  const currentNodeId =
    view === "week"
      ? "1182:1597"
      : view === "day"
        ? "1152:45436"
        : isCycleCardOpen
          ? "1176:5607"
          : "1173:4548";

  const openCreate = (type?: CreateType, date?: Date, time?: string) => {
    if (date) setSelectedDate(date);
    setCreateState((prev) => ({
      ...prev,
      type: type ?? prev.type,
      time: time ?? prev.time,
      title: "",
      description: "",
      mood: "",
      error: "",
      loading: false,
    }));
    setCreateOpen(true);
  };

  const postJson = async (url: string, payload: unknown) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${url}`);
    }
    return response;
  };

  const onAddCategory = async () => {
    const value = newCategoryName.trim().toLowerCase();
    if (!value || value === "all") {
      setToast({ kind: "error", message: "Invalid category name" });
      return;
    }
    if (userCategories.includes(value)) {
      setToast({ kind: "error", message: "Category already exists" });
      return;
    }

    try {
      await postJson("/api/categories", { name: value });
      setUserCategories((prev) => [...prev, value]);
      setNewCategoryName("");
      setRefreshTick((prev) => prev + 1);
      setToast({ kind: "success", message: "Category created" });
    } catch {
      setToast({ kind: "error", message: "Cannot create category" });
    }
  };

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateState((prev) => ({ ...prev, loading: true, error: "" }));

    const selectedCategoryId =
      selectedCategory !== "all" ? categoryIds[selectedCategory] : undefined;
    const nowTime = createState.time || "09:00";
    const at = joinDateTime(selectedDate, nowTime);

    try {
      if (createState.type === "event") {
        const payload = {
          categoryId: selectedCategoryId,
          title: createState.title,
          description: createState.description || undefined,
          startsAt: at.toISOString(),
          endsAt: addHours(at, 1).toISOString(),
          urgency: "MEDIUM",
        };
        await postJson("/api/events", payload);
      }

      if (createState.type === "task") {
        const payload = {
          categoryId: selectedCategoryId,
          title: createState.title,
          date: selectedDate.toISOString(),
          dueAt: createState.useTime ? at.toISOString() : undefined,
          isCompleted: false,
        };
        await postJson("/api/tasks", payload);
      }

      if (createState.type === "journal") {
        const payload = {
          date: selectedDate.toISOString(),
          content: createState.description || "Journal note",
          mood: createState.mood || undefined,
        };
        await postJson("/api/journals", payload);
        setJournals((prev) => [
          {
            id: crypto.randomUUID(),
            dateKey,
            content: payload.content,
            mood: payload.mood,
            createdAt: format(new Date(), "HH:mm"),
          },
          ...prev,
        ]);
      }

      if (createState.type === "note") {
        const payload = {
          categoryId: selectedCategoryId,
          title: createState.title,
          content: createState.description || "",
          date: selectedDate.toISOString(),
          pinnedAt: createState.useTime ? at.toISOString() : undefined,
        };
        await postJson("/api/notes", payload);
        setNotes((prev) => [
          {
            id: crypto.randomUUID(),
            dateKey,
            title: payload.title,
            content: payload.content,
            createdAt: format(new Date(), "HH:mm"),
            category: selectedCategory === "all" ? "personal" : selectedCategory,
          },
          ...prev,
        ]);
      }

      if (createState.type === "event" || createState.type === "task") {
        const nextEntry: Entry = {
          id: crypto.randomUUID(),
          kind: createState.type,
          time: toHumanTime(nowTime),
          title: createState.title,
          bg: createState.type === "event" ? "#f8e5c6" : "#d1d7d4",
          icon: createState.type === "event" ? imgEventIcon : imgTaskIcon,
          category: selectedCategory === "all" ? "personal" : selectedCategory,
        };
        setEntriesByDate((prev) => ({
          ...prev,
          [dateKey]: [...(prev[dateKey] ?? []), nextEntry],
        }));
      }

      setRefreshTick((prev) => prev + 1);
      setCreateOpen(false);
      setToast({ kind: "success", message: `${createState.type} created` });
    } catch {
      setToast({ kind: "error", message: "Create request failed" });
      setCreateState((prev) => ({ ...prev, error: "Failed to create item. Please try again." }));
    } finally {
      setCreateState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--lia-canvas)]">
      <div
        className="relative h-[1024px] w-full overflow-hidden bg-[var(--lia-canvas)]"
        data-node-id={currentNodeId}
      >
        <aside className="absolute left-0 top-0 flex h-[1024px] w-[295px] flex-col border-r border-[var(--lia-border-soft)]">
          <Image
            src={imgLogo}
            alt="by Lia"
            width={174}
            height={65}
            unoptimized
            className="absolute left-[40px] top-[26px] h-[65px] w-[174px]"
          />

          <button
            type="button"
            onClick={() => openCreate()}
            className="absolute left-[20px] top-[157px] flex h-[68px] w-[255px] items-center justify-center rounded-[16px] shadow-[0_8px_20px_-10px_rgba(90,79,62,0.35)] transition hover:brightness-105 active:translate-y-[1px]"
            style={{ background: addButtonStyle.bg }}
          >
            <span className="text-[28px] leading-[0.95]" style={{ color: addButtonStyle.text }}>
              + Add something
            </span>
          </button>

          <div className="absolute left-[20px] top-[252px] flex flex-col gap-[2px]">
            {(["month", "week", "day"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`group flex w-[255px] items-center gap-[10px] rounded-[12px] px-[14px] py-[11px] text-left transition ${
                  view === item
                    ? "bg-white/70 shadow-[0_1px_2px_rgba(90,79,62,0.06)]"
                    : "hover:bg-white/40"
                }`}
              >
                <span className="inline-flex h-[16px] w-[16px] items-center justify-center text-[var(--lia-accent-warm)]">
                  <SidebarIcon icon={item} />
                </span>
                <span
                  className={`text-[16px] ${
                    view === item ? "font-medium text-[#2f2a22]" : "font-light text-[#5a524a]"
                  }`}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </span>
              </button>
            ))}
          </div>

          <div className="absolute left-[34px] top-[472px] w-[255px]">
            <p className="text-[12px] font-medium tracking-[0.18em] text-[var(--lia-accent-warm)]">
              CATEGORIES
            </p>
          </div>
          <div className="absolute left-[20px] top-[504px] flex w-[255px] flex-col gap-[2px]">
            {userCategories.map((category) => {
              const active = selectedCategory === category;
              const color = getCategoryColor(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex w-full items-center gap-[10px] rounded-[12px] px-[14px] py-[9px] text-left text-[15px] transition ${
                    active
                      ? "bg-white/70 shadow-[0_1px_2px_rgba(90,79,62,0.06)] font-medium text-[#2f2a22]"
                      : "font-light text-[#5a524a] hover:bg-white/40"
                  }`}
                >
                  <span
                    className="h-[10px] w-[10px] rounded-full"
                    style={{
                      background: category === "all" ? "transparent" : color,
                      border: category === "all" ? "1.5px dashed var(--lia-muted-soft)" : "none",
                    }}
                  />
                  <span className="flex-1 truncate">
                    {category[0].toUpperCase() + category.slice(1)}
                  </span>
                </button>
              );
            })}
            <form
              className="mt-2 flex items-center gap-2 px-[2px]"
              onSubmit={(event) => {
                event.preventDefault();
                void onAddCategory();
              }}
            >
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="new category"
                className="min-w-0 flex-1 rounded-full border border-[var(--lia-border)] bg-white px-3 py-1.5 text-[12px] placeholder:text-[var(--lia-muted-soft)]"
              />
              <button
                type="submit"
                className="rounded-full border border-[var(--lia-accent-warm)]/30 bg-[var(--lia-accent-warm-tint)] px-3 py-1.5 text-[12px] text-[var(--lia-accent-warm)] hover:brightness-105"
              >
                add
              </button>
            </form>
          </div>
        </aside>

        <header className="absolute left-[308px] right-[24px] top-[44px] flex h-[50px] items-center justify-between">
          <div className="grid min-w-[520px] grid-cols-[1fr_72px] items-center gap-[12px]">
            <h1
              className={`leading-none tracking-[-0.01em] ${
                view === "day" ? "text-[40px] text-[var(--lia-accent-cool)]" : "text-[42px] text-[var(--lia-accent-warm)]"
              }`}
            >
              {view === "day" ? format(anchorDate, "EEEE, MMMM d, yyyy") : monthLabel}
            </h1>
            <div className="flex w-[72px] justify-between">
              <button
                type="button"
                onClick={() => setAnchorDate((prev) => shiftAnchor(prev, view, -1))}
                className="grid h-8 w-8 place-items-center rounded-full text-[22px] leading-none text-[var(--lia-muted)] hover:bg-black/5 hover:text-[#3d362d]"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate((prev) => shiftAnchor(prev, view, 1))}
                className="grid h-8 w-8 place-items-center rounded-full text-[22px] leading-none text-[var(--lia-muted)] hover:bg-black/5 hover:text-[#3d362d]"
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setAnchorDate(now);
                setSelectedDate(now);
              }}
              className={`flex h-[40px] w-[123px] items-center justify-center rounded-full border transition hover:shadow-sm ${
                view === "day"
                  ? "border-[var(--lia-accent-cool)] text-[var(--lia-accent-cool)] hover:bg-[var(--lia-accent-cool-tint)]"
                  : "border-[var(--lia-accent-warm)] text-[var(--lia-accent-warm)] hover:bg-[var(--lia-accent-warm-tint)]"
              }`}
            >
              <span className="text-[18px] leading-none">today</span>
            </button>
            <CyclePopover
              isOpen={isCycleCardOpen}
              onToggle={() => setCycleCardOpen((prev) => !prev)}
              onClose={() => setCycleCardOpen(false)}
              phase={cyclePhase}
            />
            <Link
              href="/settings"
              className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5"
              aria-label="Settings"
            >
              <Image src={imgSettings} alt="" width={24} height={24} unoptimized className="h-[24px] w-[24px]" />
            </Link>
            <UserMenu />
          </div>
        </header>

        {calendarLoadError && (
          <p className="lia-slide-in absolute left-[308px] top-[104px] text-[13px] text-[#9b4d4d]">
            {calendarLoadError}
          </p>
        )}

        {toast && (
          <div
            className={`lia-slide-in absolute right-[24px] top-[104px] z-20 rounded-full border px-4 py-2 text-[13px] shadow-[0_8px_20px_-10px_rgba(30,25,20,0.3)] ${
              toast.kind === "success"
                ? "border-[#bcd6ba] bg-[#e8f1e7] text-[#2d6a2b]"
                : "border-[#e9c3c3] bg-[#fbe8e8] text-[#963838]"
            }`}
          >
            {toast.message}
          </div>
        )}

        {view === "month" && (
          <>
            <div className="absolute left-[304px] right-[24px] top-[138px] grid grid-cols-7">
              {weekDayLabels.map((label) => (
                <div key={label} className="flex h-[52px] items-center justify-center">
                  <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-[var(--lia-muted-soft)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute left-[304px] right-[24px] top-[190px] grid grid-cols-7 overflow-hidden rounded-[14px] border border-[var(--lia-border-soft)] bg-[var(--lia-border-soft)] shadow-[0_1px_2px_rgba(90,79,62,0.04),0_12px_32px_-16px_rgba(90,79,62,0.12)]">
              {monthCells.map((date) => {
                const isCurrentMonth = isSameMonth(date, anchorDate);
                const isSelected = isSameDay(date, selectedDate);
                const dayIsToday = isToday(date);
                const entries =
                  entriesByDate[toDateKey(date)]?.filter(
                    (entry) => selectedCategory === "all" || entry.category === selectedCategory,
                  ) ?? [];

                return (
                  <button
                    key={toDateKey(date)}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    onDoubleClick={() => openCreate(undefined, date)}
                    className="group relative h-[170px] min-w-0 text-left focus:outline-none"
                  >
                    <div
                      className="absolute inset-0 transition group-hover:brightness-[0.98]"
                      style={{
                        background: isCurrentMonth ? "#f6f6f6" : "#ebe9e1",
                      }}
                    />
                    {isSelected && (
                      <div className="pointer-events-none absolute inset-[3px] rounded-[8px] ring-2 ring-inset ring-[var(--lia-accent-warm)]/70" />
                    )}
                    <div className="absolute left-[12px] top-[10px] flex items-center gap-2">
                      <span
                        className={`grid h-[26px] min-w-[26px] place-items-center rounded-full px-1.5 text-[15px] ${
                          dayIsToday
                            ? "bg-[var(--lia-accent-warm)] text-white shadow-sm"
                            : isCurrentMonth
                              ? "text-[#2f2a22]"
                              : "text-[#b8b0a1]"
                        }`}
                      >
                        {format(date, "d")}
                      </span>
                    </div>

                    {entries.length > 0 && (
                      <div className="absolute left-[9px] right-[9px] top-[46px] flex flex-col gap-[4px]">
                        {entries.slice(0, 3).map((entry) => {
                          const accent = getCategoryColor(entry.category);
                          return (
                            <div
                              key={entry.id}
                              className="flex items-center gap-[6px] rounded-[8px] px-[8px] py-[5px] shadow-[0_1px_1px_rgba(90,79,62,0.04)]"
                              style={{ background: entry.bg }}
                            >
                              <span
                                className="h-[10px] w-[3px] shrink-0 rounded-full"
                                style={{ background: accent }}
                              />
                              <Image
                                alt=""
                                src={entry.icon}
                                width={16}
                                height={12}
                                unoptimized
                                className="h-[12px] w-[16px] shrink-0"
                              />
                              <p className="truncate text-[12px] leading-tight text-[#2c2722]">
                                <span className="text-[11px] text-[#6b6258]">{entry.time}</span>{" "}
                                {entry.title}
                              </p>
                            </div>
                          );
                        })}
                        {entries.length > 3 && (
                          <p className="pl-1 text-[10px] text-[var(--lia-muted)]">
                            +{entries.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === "week" && (
          <>
            <div className="absolute left-[304px] right-[24px] top-[130px] grid grid-cols-7 pl-[48px]">
              {weekCells.map((date) => {
                const selected = isSameDay(date, selectedDate);
                const dayIsToday = isToday(date);
                return (
                  <button
                    key={toDateKey(date)}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className="flex h-[60px] flex-col items-center justify-center gap-[4px]"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--lia-muted-soft)]">
                      {format(date, "EEE")}
                    </span>
                    <span
                      className={`grid h-[34px] w-[34px] place-items-center rounded-full text-[20px] transition ${
                        selected
                          ? "bg-[var(--lia-accent-rose)] text-white shadow-sm"
                          : dayIsToday
                            ? "bg-[var(--lia-accent-warm-tint)] text-[var(--lia-accent-warm)]"
                            : "text-[#2f2a22] hover:bg-black/5"
                      }`}
                    >
                      {format(date, "d")}
                    </span>
                  </button>
                );
              })}
            </div>
            <TimeGrid columnDates={weekCells} onSlotClick={(date, time) => openCreate("event", date, time)} />
          </>
        )}

        {view === "day" && (
          <>
            <div className="absolute left-[304px] top-[120px]">
              <h2 className="text-[32px] leading-[1.1] text-[var(--lia-accent-cool)]">
                Today&apos;s Plan
              </h2>
              <p className="mt-1 text-[16px] text-[#7e90a9]">
                Your schedule, notes and reflections for {format(selectedDate, "MMMM d")}
              </p>
            </div>
            <div className="absolute right-[24px] top-[130px] flex overflow-hidden rounded-full border border-[var(--lia-border)] bg-[var(--lia-surface)] p-[3px] shadow-[0_2px_6px_-2px_rgba(90,79,62,0.15)]">
              {(["calendar", "journal", "notes"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDayTab(tab)}
                  className={`flex h-[32px] w-[88px] items-center justify-center rounded-full text-[13px] capitalize transition ${
                    dayTab === tab
                      ? "bg-[var(--lia-accent-cool-soft)] text-white shadow-[0_2px_6px_-2px_rgba(88,119,164,0.5)]"
                      : "text-[var(--lia-muted)] hover:text-[#3d362d]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {dayTab === "calendar" && (
              <TimeGrid columnDates={[selectedDate]} onSlotClick={(date, time) => openCreate("event", date, time)} />
            )}

            {dayTab === "journal" && (
              <section className="absolute left-[304px] right-[24px] top-[184px] h-[710px] rounded-[16px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] p-5 shadow-[0_1px_2px_rgba(90,79,62,0.04),0_12px_30px_-16px_rgba(90,79,62,0.12)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[24px] leading-none text-[var(--lia-accent-cool)]">Journal</h3>
                    <p className="mt-1 text-[13px] text-[var(--lia-muted)]">
                      Thoughts and reflections for {format(selectedDate, "MMMM d")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreate("journal", selectedDate)}
                    className="rounded-full bg-[var(--lia-accent-cool-soft)] px-4 py-2 text-[13px] text-white shadow-[0_6px_16px_-8px_rgba(88,119,164,0.6)] hover:brightness-110"
                  >
                    + Add entry
                  </button>
                </div>
                <div className="space-y-2 overflow-auto pr-1">
                  {selectedJournals.length === 0 && (
                    <div className="grid h-[200px] place-items-center rounded-[12px] border border-dashed border-[var(--lia-border)] text-[14px] text-[var(--lia-muted)]">
                      No journal entries for this day yet.
                    </div>
                  )}
                  {selectedJournals.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-[12px] border border-[var(--lia-border-soft)] bg-white p-4 shadow-[0_1px_1px_rgba(90,79,62,0.03)]"
                    >
                      <div className="flex items-center gap-2 text-[12px] text-[var(--lia-muted)]">
                        <span className="rounded-full bg-[var(--lia-accent-cool-tint)] px-2 py-0.5 text-[var(--lia-accent-cool)]">
                          {record.createdAt}
                        </span>
                        {record.mood && (
                          <span className="rounded-full bg-[var(--lia-accent-rose-tint)] px-2 py-0.5 text-[var(--lia-accent-rose)]">
                            mood: {record.mood}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[16px] leading-relaxed text-[#2a2a2a]">{record.content}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {dayTab === "notes" && (
              <section className="absolute left-[304px] right-[24px] top-[184px] h-[710px] rounded-[16px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] p-5 shadow-[0_1px_2px_rgba(90,79,62,0.04),0_12px_30px_-16px_rgba(90,79,62,0.12)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[24px] leading-none text-[var(--lia-accent-cool)]">Notes</h3>
                    <p className="mt-1 text-[13px] text-[var(--lia-muted)]">
                      Quick notes pinned to {format(selectedDate, "MMMM d")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreate("note", selectedDate)}
                    className="rounded-full bg-[var(--lia-accent-cool-soft)] px-4 py-2 text-[13px] text-white shadow-[0_6px_16px_-8px_rgba(88,119,164,0.6)] hover:brightness-110"
                  >
                    + Add note
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-auto pr-1">
                  {selectedNotes.length === 0 && (
                    <div className="col-span-2 grid h-[200px] place-items-center rounded-[12px] border border-dashed border-[var(--lia-border)] text-[14px] text-[var(--lia-muted)]">
                      No notes for this day yet.
                    </div>
                  )}
                  {selectedNotes.map((note) => {
                    const accent = getCategoryColor(note.category);
                    return (
                      <article
                        key={note.id}
                        className="group overflow-hidden rounded-[12px] border border-[var(--lia-border-soft)] bg-white p-4 shadow-[0_1px_1px_rgba(90,79,62,0.03)] transition hover:-translate-y-[1px] hover:shadow-[0_10px_20px_-12px_rgba(90,79,62,0.2)]"
                      >
                        <div className="flex items-center gap-2 text-[12px] text-[var(--lia-muted)]">
                          <span
                            className="inline-block h-[8px] w-[8px] rounded-full"
                            style={{ background: accent }}
                          />
                          <span>{note.createdAt}</span>
                          <span className="text-[var(--lia-border)]">•</span>
                          <span className="capitalize">{note.category}</span>
                        </div>
                        <h4 className="mt-1.5 text-[18px] leading-tight text-[#2d2d2d]">{note.title}</h4>
                        <p className="mt-1 text-[14px] leading-relaxed text-[#5a524a]">{note.content}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        <CreateModal
          isOpen={isCreateOpen}
          state={createState}
          selectedDate={selectedDate}
          selectedCategory={selectedCategory}
          onClose={() => setCreateOpen(false)}
          onChange={(next) => setCreateState((prev) => ({ ...prev, ...next, error: "" }))}
          onSubmit={onCreateSubmit}
        />
      </div>
    </div>
  );
}
