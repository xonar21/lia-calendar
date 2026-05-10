"use client";

import { FormEvent, useState, useCallback } from "react";

import { TypeSelector } from "./create-modal/TypeSelector";
import { EventForm } from "./create-modal/EventForm";
import { TaskForm } from "./create-modal/TaskForm";
import { JournalForm } from "./create-modal/JournalForm";
import { NoteForm } from "./create-modal/NoteForm";

import type { CreateType, CreateState } from "@/types/modal";

export type { CreateType };

const TYPE_CONFIG = {
  event: {
    modalBg: "#e4f3d9",
    modalBorder: "#9eb38e",
    accent: "#7b926a",
    inputBorder: "#9eb38e",
    title: "Event",
    subtitle: "Add event to your calendar",
    icon: "/icons/calendar-event.svg",
  },
  task: {
    modalBg: "#def2fb",
    modalBorder: "#578094",
    accent: "#578094",
    inputBorder: "#578094",
    title: "Task",
    subtitle: "Add a task to get things done",
    icon: "/icons/task-icon.svg",
  },
  journal: {
    modalBg: "#eee3f8",
    modalBorder: "#7d579e",
    accent: "#7d579e",
    inputBorder: "#7d579e",
    title: "Journal",
    subtitle: "Capture your thoughts and feelings",
    icon: "/icons/journal-icon.svg",
  },
  note: {
    modalBg: "#fdfce3",
    modalBorder: "#b3b16a",
    accent: "#b3b16a",
    inputBorder: "#b3b16a",
    title: "Note",
    subtitle: "Write down your thoughts",
    icon: "/icons/note-icon.svg",
  },
} as const;

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
    allDay: false,
    description: "",
    urgency: "MEDIUM",
    reminder: "1 hour before",
    repeat: "Does not repeat",
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

  const config = TYPE_CONFIG[state.type];

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
        className="lia-pop-in w-[410px] overflow-hidden rounded-[12px] border shadow-[0_24px_60px_-20px_rgba(30,25,20,0.35)]"
        style={{ background: config.modalBg, borderColor: config.modalBorder }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between px-6 pb-3 pt-5"
          style={
            { "--input-border": config.inputBorder, "--accent-color": config.accent } as React.CSSProperties
          }
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-[30px] w-[29px] items-center justify-center rounded-[4px]"
              style={{ background: config.modalBorder }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {config.title === "Event" && (
                  <>
                    <path d="M3 1H11C12.1046 1 13 1.89543 13 3V11C13 12.1046 12.1046 13 11 13H3C1.89543 13 1 12.1046 1 11V3C1 1.89543 1.89543 1 3 1Z" stroke="white" strokeWidth="1.2" fill="none"/>
                    <path d="M4 1V4M10 1V4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M1 5H13" stroke="white" strokeWidth="1.2"/>
                  </>
                )}
                {config.title === "Task" && (
                  <path d="M2 7L5 10L12 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                )}
                {config.title === "Journal" && (
                  <>
                    <path d="M2 1H12C12.5523 1 13 1.44772 13 2V12C13 12.5523 12.5523 13 12 13H2C1.44772 13 1 12.5523 1 12V2C1 1.44772 1.44772 1 2 1Z" stroke="white" strokeWidth="1.2"/>
                    <path d="M4 5H10M4 8H10M4 11H7" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                  </>
                )}
                {config.title === "Note" && (
                  <>
                    <path d="M2 1H10L13 4V12C13 12.5523 12.5523 13 12 13H2C1.44772 13 1 12.5523 1 12V2C1 1.44772 1.44772 1 2 1Z" stroke="white" strokeWidth="1.2"/>
                    <path d="M10 1V4H13" stroke="white" strokeWidth="1.2" fill="white"/>
                    <path d="M4 6H10M4 9H9" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                  </>
                )}
              </svg>
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-crimson)] text-[16px] font-medium leading-none text-black">
                {config.title}
              </h2>
              <p className="font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none text-[#929292]">
                {config.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 place-items-center rounded text-[12px] text-[var(--lia-muted)] hover:bg-black/5"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-6">
          <TypeSelector
            activeType={state.type}
            onTypeChange={handleTypeChange}
          />
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-5 pt-3">
          <div
            className="flex flex-col gap-3"
            style={
              { "--input-border": config.inputBorder, "--accent-color": config.accent } as React.CSSProperties
            }
          >
            {state.type === "event" && (
              <EventForm
                data={state.event}
                onUpdate={(updates) => updateState("event", updates)}
              />
            )}

            {state.type === "task" && (
              <TaskForm
                data={state.task}
                onUpdate={(updates) => updateState("task", updates)}
              />
            )}

            {state.type === "journal" && (
              <JournalForm
                data={state.journal}
                onUpdate={(updates) => updateState("journal", updates)}
              />
            )}

            {state.type === "note" && (
              <NoteForm
                data={state.note}
                onUpdate={(updates) => updateState("note", updates)}
              />
            )}

            {state.error && (
              <p className="rounded-[6px] bg-[#f7dddd] px-3 py-2 font-[family-name:var(--font-crimson)] text-[10px] text-[#963838]">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={state.loading}
              className="mt-1 w-full rounded-[16px] px-5 py-3 font-[family-name:var(--font-crimson)] text-[18px] font-medium leading-none transition hover:brightness-110 disabled:opacity-60"
              style={{ background: config.accent, color: config.modalBg }}
            >
              {state.loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
