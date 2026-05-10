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
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { CyclePopover } from "@/components/cycle-popover";
import { UserMenu } from "@/components/user-menu";
import { computeCyclePhase, type CyclePhaseInfo } from "@/lib/cycle";

const imgSettings = "/icons/Cog--Streamline-Ultimate 1.svg";
const imgLogo = "/icons/Frame 140.svg";

const categoryList = ["all", "personal", "work", "health"] as const;
const weekDayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const hours = Array.from({ length: 24 }, (_, i) => {
  const suffix = i < 12 ? "AM" : "PM";
  const h = i % 12 === 0 ? 12 : i % 12;
  return `${h} ${suffix}`;
});
const ROW_H = 54; // px per hour slot

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

const ENTITY_DOT_COLORS: Record<string, string> = {
  event: "#b7c181",
  task: "#81acc1",
  journal: "#a381c1",
  note: "#c18181",
};

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
  category: AppCategory;
  startMinutes: number;    // minutes from midnight, e.g. 540 = 9:00 AM
  durationMinutes: number; // e.g. 60 for a 1-hour block
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

type DotEntity = {
  id: string;
  kind: "event" | "task" | "journal" | "note";
  title: string;
  time: string;
  dotColor: string;
  category: string;
};

type DotPopup = {
  date: Date;
  kind: "event" | "task" | "journal" | "note";
  entities: DotEntity[];
  x: number;
  y: number;
} | null;

type DayDotsInfo = {
  kinds: Record<string, DotEntity[]>;
  totalCount: number;
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
      time: "9AM",
      title: "start work day",
      bg: "#eef3e6",
      category: "work",
      startMinutes: 9 * 60,
      durationMinutes: 60,
    },
    {
      id: "seed-sport",
      kind: "event",
      time: "7AM",
      title: "sport",
      bg: "#eef3e6",
      category: "health",
      startMinutes: 7 * 60,
      durationMinutes: 90,
    },
    {
      id: "seed-water",
      kind: "task",
      time: "8AM",
      title: "drink water",
      bg: "#e8f0f5",
      category: "health",
      startMinutes: 8 * 60,
      durationMinutes: 30,
    },
  ],
};


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
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  return Array.from({ length: 35 }, (_, idx) => addDays(gridStart, idx));
}

function getWeekCells(anchorDate: Date) {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 0 });
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
  if (icon === "month") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#month-clip)">
          <path d="M10.6665 14.8146H1.77765C1.62049 14.8146 1.46976 14.7521 1.35862 14.641C1.24749 14.5299 1.18506 14.3791 1.18506 14.222V2.96271C1.18506 2.80554 1.24749 2.65482 1.35862 2.54368C1.46976 2.43255 1.62049 2.37012 1.77765 2.37012H14.2221C14.3793 2.37012 14.53 2.43255 14.6411 2.54368C14.7523 2.65482 14.8147 2.80554 14.8147 2.96271V10.0738" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4.14819 1.18555V4.14851" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.8518 1.18555V4.14851" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.18506 5.3335H14.8147" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.8149 10.0742V14.2224C14.8149 14.3795 14.7525 14.5303 14.6413 14.6414C14.5302 14.7525 14.3795 14.815 14.2223 14.815H10.6667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <clipPath id="month-clip"><rect width="16" height="16" fill="white"/></clipPath>
        </defs>
      </svg>
    );
  }
  if (icon === "week") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#week-clip)">
          <path d="M10.6665 14.8146H1.77765C1.62049 14.8146 1.46976 14.7521 1.35862 14.641C1.24749 14.5299 1.18506 14.3791 1.18506 14.222V2.96271C1.18506 2.80554 1.24749 2.65482 1.35862 2.54368C1.46976 2.43255 1.62049 2.37012 1.77765 2.37012H14.2221C14.3793 2.37012 14.53 2.43255 14.6411 2.54368C14.7523 2.65482 14.8147 2.80554 14.8147 2.96271V10.0738" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4.14819 1.18555V4.14851" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.8518 1.18555V4.14851" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.18506 5.3335H14.8147" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.8149 10.0742V14.2224C14.8149 14.3795 14.7525 14.5303 14.6413 14.6414C14.5302 14.7525 14.3795 14.815 14.2223 14.815H10.6667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.25928 7.40771H3.85187" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.03711 7.40771H5.6297" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.81494 7.40771H7.40753" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.59253 7.40771H9.18512" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.3704 7.40771H10.963" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.1482 7.40771H12.7408" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.25928 9.18555H3.85187" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.03711 9.18555H5.6297" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.81494 9.18555H7.40753" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.59253 9.18555H9.18512" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.3704 9.18555H10.963" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.1482 9.18555H12.7408" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.25928 10.9629H3.85187" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.03711 10.9629H5.6297" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.81494 10.9629H7.40753" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.59253 10.9629H9.18512" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.3704 10.9629H10.963" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.1482 10.9629H12.7408" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.25928 12.7407H3.85187" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.03711 12.7407H5.6297" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.81494 12.7407H7.40753" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.59253 12.7407H9.18512" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.3704 12.7407H10.963" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.1482 12.7407H12.7408" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <clipPath id="week-clip"><rect width="16" height="16" fill="white"/></clipPath>
        </defs>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#day-clip)">
        <path d="M10.6665 14.8146H1.77765C1.62049 14.8146 1.46976 14.7521 1.35862 14.641C1.24749 14.5299 1.18506 14.3791 1.18506 14.222V2.96271C1.18506 2.80554 1.24749 2.65482 1.35862 2.54368C1.46976 2.43255 1.62049 2.37012 1.77765 2.37012H14.2221C14.3793 2.37012 14.53 2.43255 14.6411 2.54368C14.7523 2.65482 14.8147 2.80554 14.8147 2.96271V10.0738" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.14819 1.18555V4.14851" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.8518 1.18555V4.14851" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1.18506 5.3335H14.8147" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.8149 10.0742V14.2224C14.8149 14.3795 14.7525 14.5303 14.6413 14.6414C14.5302 14.7525 14.3795 14.815 14.2223 14.815H10.6667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.25928 7.40771H12.7408" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.25928 9.18555H12.7408" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.25928 10.9629H12.7408" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.25928 12.7407H8.00002" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="day-clip"><rect width="16" height="16" fill="white"/></clipPath>
      </defs>
    </svg>
  );
}

function TimeGrid({
  columnDates,
  onSlotClick,
  entriesByDate,
  selectedCategory,
}: {
  columnDates: Date[];
  onSlotClick: (date: Date, time: string) => void;
  entriesByDate: Record<string, Entry[]>;
  selectedCategory: AppCategory;
}) {
  const totalH = ROW_H * 24;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * ROW_H; // default to 8 AM
    }
  }, []);

  return (
    <div className="absolute left-[368px] right-[24px] top-[184px] bottom-[24px] overflow-hidden rounded-[14px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] shadow-[0_1px_2px_rgba(90,79,62,0.04),0_8px_24px_-12px_rgba(90,79,62,0.08)]">
      <div ref={scrollRef} className="h-full overflow-y-auto">
        <div className="relative flex" style={{ height: `${totalH}px` }}>
          {/* Time label column */}
          <div className="relative w-[48px] shrink-0 border-r border-[var(--lia-border-soft)]">
            {hours.map((label, i) => (
              <div
                key={label}
                className="absolute right-0 flex w-[48px] items-start justify-end pr-2 pt-[6px] text-[10px] uppercase tracking-wide text-[var(--lia-muted-soft)]"
                style={{ top: `${i * ROW_H}px`, height: `${ROW_H}px` }}
              >
                {i === 0 ? "" : label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {columnDates.map((date) => {
            const dk = toDateKey(date);
            const dayEntries = (entriesByDate[dk] ?? []).filter(
              (e) => selectedCategory === "all" || e.category === selectedCategory,
            );

            return (
              <div
                key={dk}
                className="relative flex-1 border-r border-[var(--lia-border-soft)] last:border-r-0"
              >
                {/* Clickable hour slots */}
                {hours.map((_, i) => {
                  const hhmm = `${String(i).padStart(2, "0")}:00`;
                  return (
                    <button
                      key={hhmm}
                      type="button"
                      onClick={() => onSlotClick(date, hhmm)}
                      className="absolute left-0 right-0 border-b border-[var(--lia-border-soft)] transition hover:bg-[rgba(125,88,25,0.04)] focus:outline-none"
                      style={{ top: `${i * ROW_H}px`, height: `${ROW_H}px` }}
                      aria-label={`Create item ${dk} ${hhmm}`}
                    />
                  );
                })}

                {/* Event / task blocks — sized by duration, overlapping ones side-by-side */}
                {(() => {
                  // Compute column layout for overlapping entries
                  const placed: Array<{ entry: Entry; col: number; totalCols: number }> = [];
                  for (const entry of dayEntries) {
                    const eStart = entry.startMinutes;
                    const eEnd = eStart + entry.durationMinutes;
                    // Find all already-placed entries that overlap with this one
                    const overlapping = placed.filter((p) => {
                      const pStart = p.entry.startMinutes;
                      const pEnd = pStart + p.entry.durationMinutes;
                      return eStart < pEnd && eEnd > pStart;
                    });
                    // Pick first free column slot
                    const usedCols = new Set(overlapping.map((p) => p.col));
                    let col = 0;
                    while (usedCols.has(col)) col++;
                    // Max columns in this overlap group
                    const totalCols = Math.max(col + 1, ...overlapping.map((p) => p.totalCols));
                    // Update totalCols for all overlapping entries
                    for (const p of overlapping) p.totalCols = totalCols;
                    placed.push({ entry, col, totalCols });
                  }
                  return placed.map(({ entry, col, totalCols }) => {
                    const top = (entry.startMinutes / 60) * ROW_H;
                    const height = Math.max(22, (entry.durationMinutes / 60) * ROW_H);
                    const accent = getCategoryColor(entry.category);
                    const tall = height >= 44;
                    const colW = 100 / totalCols;
                    return (
                      <div
                        key={entry.id}
                        className="pointer-events-none absolute z-10 overflow-hidden rounded-[8px] px-[7px] shadow-[0_1px_4px_rgba(90,79,62,0.14)]"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${col * colW}% + 3px)`,
                          width: `calc(${colW}% - 6px)`,
                          background: entry.bg,
                        }}
                      >
                        <div className="flex h-full items-start gap-[5px] overflow-hidden pt-[4px]">
                          <span
                            className="mt-[2px] h-[8px] w-[2px] shrink-0 rounded-full"
                            style={{ background: accent }}
                          />
                          <span className="min-w-0 overflow-hidden">
                            {tall && (
                              <span className="block truncate text-[10px] leading-tight text-[#6b6258]">
                                {entry.time}
                              </span>
                            )}
                            <span className="block truncate text-[11px] leading-tight text-[#2c2722]">
                              {entry.title}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
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
    event: { bg: "#eef3e6", text: "#5a7a4a", dot: "#b7c181" },
    task: { bg: "#e8f0f5", text: "#4a6a8a", dot: "#81acc1" },
    journal: { bg: "#f0eaf5", text: "#6a4f8a", dot: "#a381c1" },
    note: { bg: "#f5eaea", text: "#8a4a4a", dot: "#c18181" },
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
  const [entriesByDate, setEntriesByDate] = useState<Record<string, Entry[]>>({});
  const [journals, setJournals] = useState<JournalRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
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
  const [dotPopup, setDotPopup] = useState<DotPopup>(null);
  const dotPopupRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!dotPopup) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setDotPopup(null); };
    window.addEventListener("keydown", onEsc);
    const onClick = (e: MouseEvent) => {
      if (dotPopupRef.current && !dotPopupRef.current.contains(e.target as Node)) {
        setDotPopup(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.removeEventListener("click", onClick);
    };
  }, [dotPopup]);

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

  const dotsByDate = useMemo(() => {
    const result: Record<string, DayDotsInfo> = {};
    Object.entries(entriesByDate).forEach(([key, dayEntries]) => {
      dayEntries.forEach((entry) => {
        if (!result[key]) result[key] = { kinds: {}, totalCount: 0 };
        result[key].totalCount += 1;
        if (!result[key].kinds[entry.kind]) result[key].kinds[entry.kind] = [];
        result[key].kinds[entry.kind].push({
          id: entry.id,
          kind: entry.kind,
          title: entry.title,
          time: entry.time,
          dotColor: ENTITY_DOT_COLORS[entry.kind] ?? getCategoryColor(entry.category),
          category: entry.category,
        });
      });
    });
    journals.forEach((j) => {
      if (!result[j.dateKey]) result[j.dateKey] = { kinds: {}, totalCount: 0 };
      result[j.dateKey].totalCount += 1;
      if (!result[j.dateKey].kinds["journal"]) result[j.dateKey].kinds["journal"] = [];
      result[j.dateKey].kinds["journal"].push({
        id: j.id,
        kind: "journal",
        title: j.content.slice(0, 60),
        time: j.createdAt,
        dotColor: ENTITY_DOT_COLORS["journal"],
        category: "journal",
      });
    });
    notes.forEach((n) => {
      if (!result[n.dateKey]) result[n.dateKey] = { kinds: {}, totalCount: 0 };
      result[n.dateKey].totalCount += 1;
      if (!result[n.dateKey].kinds["note"]) result[n.dateKey].kinds["note"] = [];
      result[n.dateKey].kinds["note"].push({
        id: n.id,
        kind: "note",
        title: n.title,
        time: n.createdAt,
        dotColor: ENTITY_DOT_COLORS["note"],
        category: n.category,
      });
    });
    return result;
  }, [entriesByDate, journals, notes]);

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
              endsAt?: string | null;
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
          const endDate = eventItem.endsAt ? new Date(eventItem.endsAt) : addHours(eventDate, 1);
          const key = toDateKey(eventDate);
          const category = categoryById[eventItem.categoryId ?? ""] ?? "personal";
          const startMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
          const durationMinutes = Math.max(30, Math.round((endDate.getTime() - eventDate.getTime()) / 60000));
          const item: Entry = {
            id: eventItem.id,
            kind: "event",
            time: toHumanTime(format(eventDate, "HH:mm")),
            title: eventItem.title,
            bg: "#eef3e6",
            category,
            startMinutes,
            durationMinutes,
          };
          nextEntries[key] = [...(nextEntries[key] ?? []), item];
        });

        tasks.forEach((taskItem) => {
          const taskDate = new Date(taskItem.date);
          const dueDate = taskItem.dueAt ? new Date(taskItem.dueAt) : null;
          const key = toDateKey(taskDate);
          const category = categoryById[taskItem.categoryId ?? ""] ?? "personal";
          const humanTime = dueDate ? toHumanTime(format(dueDate, "HH:mm")) : "Anytime";
          const startMinutes = dueDate
            ? dueDate.getHours() * 60 + dueDate.getMinutes()
            : 12 * 60; // default noon
          const item: Entry = {
            id: taskItem.id,
            kind: "task",
            time: humanTime,
            title: taskItem.title,
            bg: "#e8f0f5",
            category,
            startMinutes,
            durationMinutes: 30,
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

  const currentNodeId =
    view === "week"
      ? "1182:1597"
      : view === "day"
        ? "1152:45436"
        : isCycleCardOpen
          ? "1176:5607"
          : "1173:4548";

  const openCreate = (type?: CreateType, date?: Date, time?: string) => {
    setDotPopup(null);
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
        const [hhRaw = "0", mmRaw = "0"] = nowTime.split(":");
        const startMinutes = Number(hhRaw) * 60 + Number(mmRaw);
        const nextEntry: Entry = {
          id: crypto.randomUUID(),
          kind: createState.type,
          time: toHumanTime(nowTime),
          title: createState.title,
          bg: createState.type === "event" ? "#eef3e6" : "#e8f0f5",
          category: selectedCategory === "all" ? "personal" : selectedCategory,
          startMinutes,
          durationMinutes: createState.type === "event" ? 60 : 30,
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
        className="relative h-screen w-full overflow-hidden bg-[var(--lia-canvas)]"
        data-node-id={currentNodeId}
      >
        <aside className="absolute left-0 top-0 flex h-full w-[328px] flex-col border-r border-[var(--lia-border-soft)]">
          <Image
            src={imgLogo}
            alt="by Lia"
            width={174}
            height={65}
            unoptimized
            className="absolute left-[63px] top-[40px] h-[65px] w-[174px]"
          />

          <button
            type="button"
            onClick={() => openCreate()}
            className="absolute left-[24px] top-[190px] flex h-[59px] w-[280px] items-center justify-center rounded-[16px] bg-[#f2bc62] shadow-[0_8px_20px_-10px_rgba(90,79,62,0.35)] transition hover:brightness-105 active:translate-y-[1px]"
          >
            <span className="text-[24px] leading-[0.95] font-[family-name:var(--font-crimson)] text-[#f8e5c6]">
              Add something
            </span>
          </button>

          <div className="absolute left-[24px] top-[289px] flex flex-col gap-[6px]">
            {(["month", "week", "day"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`flex h-[44px] w-[280px] items-center rounded-[12px] px-[14px] text-left transition ${
                  view === item
                    ? "bg-[#d5d2cb]"
                    : "hover:bg-white/40"
                }`}
              >
                <span className={`inline-flex h-[16px] w-[16px] items-center justify-center ${
                  view === item ? "text-[#2f2a22]" : "text-[var(--lia-muted)]"
                }`}>
                  <SidebarIcon icon={item} />
                </span>
                <span
                  className={`ml-[10px] text-[18px] font-[family-name:var(--font-crimson)] ${
                    view === item ? "font-medium text-[#2f2a22]" : "font-light text-[#5a524a]"
                  }`}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </span>
              </button>
            ))}
          </div>

          <div className="absolute left-[24px] top-[513px] w-[280px]">
            <p className="text-[18px] font-medium tracking-[1.62px] text-[var(--lia-accent-warm)] font-[family-name:var(--font-crimson)]">
              CATEGORIES
            </p>
          </div>
          <div className="absolute left-[24px] top-[557px] flex w-[280px] flex-col gap-[6px]">
            {userCategories.map((category) => {
              const active = selectedCategory === category;
              const color = getCategoryColor(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex h-[44px] w-full items-center gap-[10px] rounded-[12px] px-[14px] text-left text-[18px] font-[family-name:var(--font-crimson)] transition ${
                    active
                      ? "bg-[#d5d2cb] font-medium text-[#2f2a22]"
                      : "font-light text-[#5a524a] hover:bg-white/40"
                  }`}
                >
                  <span
                    className="h-[16px] w-[16px] rounded-full"
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
              className="mt-[6px] flex items-center gap-2"
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

        <header className="absolute left-[368px] right-[40px] top-[44px] flex h-[50px] items-center justify-between">
          <div className="flex w-full items-center mr-[78px]">
            <h1
              className={`leading-none font-[family-name:var(--font-crimson)] ${
                view === "day" ? "text-[28px] text-[var(--lia-accent-cool)]" : "text-[28px] text-[var(--lia-accent-warm)]"
              }`}
            >
              {view === "day" ? format(anchorDate, "EEEE, MMMM d, yyyy") : monthLabel}
            </h1>
            <div className="absolute left-[200px] flex items-center gap-[6px]">
              <button
                type="button"
                onClick={() => setAnchorDate((prev) => shiftAnchor(prev, view, -1))}
                className="grid h-12 w-12 place-items-center rounded-full text-[var(--lia-muted)] hover:bg-black/5 hover:text-[#3d362d]"
                aria-label="Previous"
              >
                <svg width="11" height="21" viewBox="0 0 11 21" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}>
                  <path d="M0.5 0.5L10.2359 9.88522C10.405 10.0483 10.5 10.2694 10.5 10.5C10.5 10.7306 10.405 10.9517 10.2359 11.1148L0.5 20.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate((prev) => shiftAnchor(prev, view, 1))}
                className="grid h-12 w-12 place-items-center rounded-full text-[var(--lia-muted)] hover:bg-black/5 hover:text-[#3d362d]"
                aria-label="Next"
              >
                <svg width="11" height="21" viewBox="0 0 11 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.5 0.5L10.2359 9.88522C10.405 10.0483 10.5 10.2694 10.5 10.5C10.5 10.7306 10.405 10.9517 10.2359 11.1148L0.5 20.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setAnchorDate(now);
                setSelectedDate(now);
              }}
              className="ml-auto flex h-[50px] w-[176px] items-center justify-center rounded-full border border-[var(--lia-accent-warm)] text-[var(--lia-accent-warm)] transition hover:shadow-sm"
            >
              <span className="text-[24px] leading-none font-[family-name:var(--font-crimson)]">today</span>
            </button>
          </div>

          <div className="flex items-center">
            <CyclePopover
              isOpen={isCycleCardOpen}
              onToggle={() => setCycleCardOpen((prev) => !prev)}
              onClose={() => setCycleCardOpen(false)}
              phase={cyclePhase}
            />
            <Link
              href="/settings"
              className="ml-[16px] grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5"
              aria-label="Settings"
            >
              <Image src={imgSettings} alt="" width={24} height={24} unoptimized className="h-[24px] w-[24px]" />
            </Link>
            <div className="ml-[24px]">
              <UserMenu />
            </div>
          </div>
        </header>

        {calendarLoadError && (
          <p className="lia-slide-in absolute left-[368px] top-[104px] text-[13px] text-[#9b4d4d]">
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
            <div
              className="absolute left-[368px] right-[40px] top-[138px] grid"
              style={{ gridTemplateColumns: 'repeat(7, minmax(0, 216px))' }}
            >
              {weekDayLabels.map((label) => (
                <div key={label} className="flex h-[60px] items-center justify-center">
                  <span className="text-[20px] text-[var(--lia-muted)] opacity-70 font-[family-name:var(--font-crimson)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="absolute left-[368px] right-[40px] top-[190px] bottom-[24px] grid grid-rows-5 divide-x divide-y divide-[var(--lia-border-soft)] overflow-hidden rounded-[14px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] shadow-[0_1px_2px_rgba(90,79,62,0.04),0_12px_32px_-16px_rgba(90,79,62,0.12)]"
              style={{ gridTemplateColumns: 'repeat(7, minmax(0, 216px))' }}
            >
              {monthCells.map((date) => {
                const isCurrentMonth = isSameMonth(date, anchorDate);
                const isSelected = isSameDay(date, selectedDate);
                const dayIsToday = isToday(date);
                const dayDotsRaw = dotsByDate[toDateKey(date)];
                let displayDots: DayDotsInfo | null = null;
                if (dayDotsRaw) {
                  const filteredKinds: Record<string, DotEntity[]> = {};
                  let filteredTotal = 0;
                  for (const [kind, entities] of Object.entries(dayDotsRaw.kinds)) {
                    const filtered = entities.filter(
                      (e) => selectedCategory === "all" || e.category === selectedCategory || e.kind === "journal",
                    );
                    if (filtered.length > 0) {
                      filteredKinds[kind] = filtered;
                      filteredTotal += filtered.length;
                    }
                  }
                  if (Object.keys(filteredKinds).length > 0) {
                    displayDots = { kinds: filteredKinds, totalCount: filteredTotal };
                  }
                }

                return (
                  <div
                    key={toDateKey(date)}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDate(date)}
                    onDoubleClick={() => openCreate(undefined, date)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedDate(date);
                      }
                    }}
                    className="group relative min-h-0 max-h-[176px] min-w-0 max-w-[216px] cursor-pointer text-left focus:outline-none"
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
                    <div className="absolute left-[17px] top-[14px] flex items-center gap-2">
                      <span
                        className={`text-[20px] ${
                          dayIsToday
                            ? "font-medium text-[var(--lia-accent-warm)]"
                            : isCurrentMonth
                              ? "text-[#2f2a22]"
                              : "text-[#b8b0a1]"
                        }`}
                      >
                        {format(date, "d")}
                      </span>
                    </div>

                    {displayDots && (() => {
                      const kindEntries = Object.entries(displayDots.kinds);
                      const hasOverflow = kindEntries.length === 4 && displayDots.totalCount > kindEntries.length;
                      const overflow = displayDots.totalCount - kindEntries.length;
                      return (
                        <div className="absolute left-[17px] top-[59px] flex items-center gap-[12px]">
                          {kindEntries.map(([kind, entities]) => (
                            <div
                              key={kind}
                              role="button"
                              tabIndex={0}
                              className="h-[16px] w-[16px] shrink-0 cursor-pointer rounded-full transition-transform hover:scale-110 focus:outline-none"
                              style={{ background: ENTITY_DOT_COLORS[kind] ?? "#b6af9d" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const cellEl = e.currentTarget.closest('[role="button"]');
                                const cellRect = cellEl!.getBoundingClientRect();
                                setDotPopup({
                                  date,
                                  kind: kind as DotEntity["kind"],
                                  entities,
                                  x: cellRect.left,
                                  y: cellRect.bottom + 4,
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  const cellEl = e.currentTarget.closest('[role="button"]');
                                  const cellRect = cellEl!.getBoundingClientRect();
                                  setDotPopup({
                                    date,
                                    kind: kind as DotEntity["kind"],
                                    entities,
                                    x: cellRect.left,
                                    y: cellRect.bottom + 4,
                                  });
                                }
                              }}
                            />
                          ))}
                          {hasOverflow && (
                            <span className="text-[12px] font-light text-[#424242]">+{overflow}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === "week" && (
          <>
            <div className="absolute left-[368px] right-[24px] top-[130px] grid grid-cols-7 pl-[48px]">
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
                        dayIsToday
                          ? "bg-[#3d2b1c] text-white shadow-sm"
                          : selected
                            ? "bg-[var(--lia-accent-rose-soft)] text-white shadow-sm"
                            : "text-[#2f2a22] hover:bg-black/5"
                      }`}
                    >
                      {format(date, "d")}
                    </span>
                  </button>
                );
              })}
            </div>
            <TimeGrid
              columnDates={weekCells}
              onSlotClick={(date, time) => openCreate("event", date, time)}
              entriesByDate={entriesByDate}
              selectedCategory={selectedCategory}
            />
          </>
        )}

        {view === "day" && (
          <>
            {/* Per-tab heading + subtitle */}
            <div className="absolute left-[368px] top-[100px]">
              {dayTab === "calendar" && (
                <>
                  <h2 className="text-[28px] leading-[1.1] text-[var(--lia-accent-cool)]">Today&apos;s Plan</h2>
                  <p className="mt-[4px] text-[14px] text-[#7e90a9]">Your schedule and tasks for today</p>
                </>
              )}
              {dayTab === "journal" && (
                <>
                  <h2 className="text-[28px] leading-[1.1] text-[var(--lia-accent-cool)]">Journal</h2>
                  <p className="mt-[4px] text-[14px] text-[#7e90a9]">Write about your day, thoughts, and feelings</p>
                </>
              )}
              {dayTab === "notes" && (
                <>
                  <h2 className="text-[28px] leading-[1.1] text-[var(--lia-accent-cool)]">Notes</h2>
                  <p className="mt-[4px] text-[14px] text-[#7e90a9]">Quick notes pinned to {format(selectedDate, "MMMM d")}</p>
                </>
              )}
            </div>

            {/* Icon tab switcher */}
            <div className="absolute right-[24px] top-[106px] flex items-center gap-[6px]">
              {(
                [
                  {
                    id: "calendar" as DayTab,
                    label: "Schedule",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M1.5 6h13M5 1.5v2M11 1.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                  {
                    id: "journal" as DayTab,
                    label: "Journal",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M9.5 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6L9.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                        <path d="M9.5 2v4H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                        <path d="M5.5 9.5h5M5.5 11.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                  {
                    id: "notes" as DayTab,
                    label: "Notes",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M4.5 5.5h7M4.5 8h7M4.5 10.5h4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    ),
                  },
                ] as const
              ).map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  onClick={() => setDayTab(id)}
                  className={`grid h-[36px] w-[36px] place-items-center rounded-[10px] border transition ${
                    dayTab === id
                      ? "border-transparent bg-[var(--lia-accent-cool-soft)] text-white shadow-[0_2px_8px_-3px_rgba(88,119,164,0.5)]"
                      : "border-[var(--lia-border)] bg-[var(--lia-surface)] text-[var(--lia-muted)] hover:border-[var(--lia-accent-cool)]/40 hover:text-[var(--lia-accent-cool)]"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {dayTab === "calendar" && (
              <TimeGrid
                columnDates={[selectedDate]}
                onSlotClick={(date, time) => openCreate("event", date, time)}
                entriesByDate={entriesByDate}
                selectedCategory={selectedCategory}
              />
            )}

            {dayTab === "journal" && (
              <section className="absolute left-[368px] right-[24px] top-[160px] bottom-[24px] overflow-hidden rounded-[16px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] shadow-[0_1px_2px_rgba(90,79,62,0.04),0_12px_30px_-16px_rgba(90,79,62,0.12)]">
                <div className="h-full overflow-y-auto p-6">
                  <button
                    type="button"
                    onClick={() => openCreate("journal", selectedDate)}
                    className="mb-5 w-full rounded-[12px] border border-dashed border-[var(--lia-border)] bg-white/60 py-3 text-[13px] text-[var(--lia-muted)] transition hover:border-[var(--lia-accent-cool)]/50 hover:text-[var(--lia-accent-cool)]"
                  >
                    + Write new entry
                  </button>
                  {selectedJournals.length === 0 && (
                    <div className="grid h-[160px] place-items-center text-[14px] text-[var(--lia-muted)]">
                      No journal entries for this day yet.
                    </div>
                  )}
                  <div className="space-y-[2px]">
                    {selectedJournals.map((record) => (
                      <article key={record.id} className="rounded-[12px] bg-white px-5 py-4">
                        <p className="text-[15px] leading-relaxed text-[#2a2a2a]">{record.content}</p>
                        <div className="mt-3 flex items-center justify-between text-[12px] text-[var(--lia-muted)]">
                          {record.mood ? (
                            <span className="rounded-full bg-[var(--lia-accent-rose-tint)] px-2 py-0.5 text-[var(--lia-accent-rose)]">
                              {record.mood}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span>{record.createdAt}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {dayTab === "notes" && (
              <section className="absolute left-[368px] right-[24px] top-[160px] bottom-[24px] overflow-hidden rounded-[16px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] shadow-[0_1px_2px_rgba(90,79,62,0.04),0_12px_30px_-16px_rgba(90,79,62,0.12)]">
                <div className="h-full overflow-y-auto p-6">
                  <button
                    type="button"
                    onClick={() => openCreate("note", selectedDate)}
                    className="mb-5 w-full rounded-[12px] border border-dashed border-[var(--lia-border)] bg-white/60 py-3 text-[13px] text-[var(--lia-muted)] transition hover:border-[var(--lia-accent-cool)]/50 hover:text-[var(--lia-accent-cool)]"
                  >
                    + Add new note
                  </button>
                  {selectedNotes.length === 0 && (
                    <div className="grid h-[160px] place-items-center text-[14px] text-[var(--lia-muted)]">
                      No notes for this day yet.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedNotes.map((note) => {
                      const accent = getCategoryColor(note.category);
                      return (
                        <article
                          key={note.id}
                          className="overflow-hidden rounded-[12px] bg-white p-4 shadow-[0_1px_3px_rgba(90,79,62,0.06)] transition hover:-translate-y-[1px] hover:shadow-[0_8px_20px_-10px_rgba(90,79,62,0.18)]"
                        >
                          <h4 className="text-[16px] leading-tight text-[#2d2d2d]">{note.title}</h4>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#5a524a]">{note.content}</p>
                          <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--lia-muted)]">
                            <span className="h-[7px] w-[7px] rounded-full" style={{ background: accent }} />
                            <span className="capitalize">{note.category}</span>
                            <span className="ml-auto">{note.createdAt}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {dotPopup && (() => {
          const entityColor = ENTITY_DOT_COLORS[dotPopup.kind] ?? "#b7c181";
          const kindLabel = dotPopup.kind === "event" ? "Events" : dotPopup.kind === "task" ? "Tasks" : dotPopup.kind === "journal" ? "Journal" : "Notes";
          const countLabel = dotPopup.kind === "event" ? "events" : dotPopup.kind === "task" ? "tasks" : dotPopup.kind === "journal" ? "entries" : "notes";
          return (
            <div
              ref={dotPopupRef}
              className="fixed z-50 w-[258px] overflow-hidden rounded-[12px] border-t-[3px] border-solid bg-[#f4f1ec] font-[family-name:var(--font-crimson)]"
              style={{ left: dotPopup.x, top: dotPopup.y, borderTopColor: entityColor }}
            >
                <div className="flex items-baseline justify-between px-[20px] pb-[16px] pt-[20px]">
                  <span className="text-[20px] font-medium leading-none" style={{ color: entityColor }}>
                    {kindLabel}
                  </span>
                  <span className="text-[12px] text-[#7e7e7e]">
                    {dotPopup.entities.length} {countLabel}
                  </span>
                </div>

                <div className="px-[20px] pb-[16px] pt-[19px]">
                  <div className="flex flex-col gap-[9px]">
                    {dotPopup.entities.map((entity) => (
                      <div key={entity.id} className="flex items-center gap-[8px]">
                        <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: entityColor }} />
                        <span className="shrink-0 text-[12px] text-black">{entity.time}</span>
                        <span className="truncate text-[12px] text-black">{entity.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-[20px] pb-[20px] pt-[19px]">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="text-[14px] transition-opacity hover:opacity-70 focus:outline-none"
                      style={{ color: entityColor }}
                      onClick={() => {
                        setSelectedDate(dotPopup.date);
                        setView("day");
                        setDotPopup(null);
                      }}
                    >
                      View all for {format(dotPopup.date, "d MMM")}
                    </button>
                    <span className="text-[14px]" style={{ color: entityColor }}>→</span>
                  </div>
                </div>
              </div>
          );
        })()}

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
