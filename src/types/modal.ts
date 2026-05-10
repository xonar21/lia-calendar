export type CreateType = "event" | "task" | "journal" | "note";

export type EventFormState = {
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  allDay: boolean;
  description: string;
  categoryId?: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  reminder: string;
  repeat: string;
};

export type TaskFormState = {
  title: string;
  date: Date;
  hasTime: boolean;
  dueTime?: string;
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
