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
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Task title
        </label>
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="e.g. Wash the dishes"
          className="w-full rounded-[6px] border bg-white px-3 py-[6px] font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none tracking-[0.2px] text-[#929292] placeholder:text-[#929292]"
          style={{ borderColor: "var(--input-border)" }}
          required
        />
      </div>

      <div>
        <label className="mb-1 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Description
        </label>
        <textarea
          value={data.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Add details about the event..."
          className="h-[62px] w-full resize-none rounded-[6px] border bg-white px-3 py-[6px] font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none tracking-[0.2px] text-[#929292] placeholder:text-[#929292]"
          style={{ borderColor: "var(--input-border)" }}
        />
      </div>

      <div
        className="overflow-hidden rounded-[6px] border bg-white"
        style={{ borderColor: "var(--input-border)" }}
      >
        <div className="flex items-center justify-between border-b px-3 py-[7px]" style={{ borderColor: "var(--input-border)" }}>
          <input
            type="date"
            value={data.date ? data.date.toISOString().split("T")[0] : ""}
            onChange={(e) => onUpdate({ date: new Date(e.target.value) })}
            className="w-full bg-transparent font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[#929292] outline-none"
            required
          />
        </div>
        <div className="flex items-center gap-3 px-3 py-[6px]">
          <label className="flex items-center gap-2 font-[family-name:var(--font-crimson)] text-[10px] font-light text-[#929292]">
            <input
              type="checkbox"
              checked={data.hasTime || false}
              onChange={(e) => onUpdate({ hasTime: e.target.checked })}
              className="h-3 w-3 accent-current"
            />
            All day
          </label>
          {data.hasTime && (
            <input
              type="time"
              value={data.dueTime || "09:00"}
              onChange={(e) => onUpdate({ dueTime: e.target.value })}
              className="flex-1 bg-transparent font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[#929292] outline-none"
            />
          )}
        </div>
      </div>

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

      <label className="flex items-center gap-2 font-[family-name:var(--font-crimson)] text-[12px] font-normal text-black">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-current"
        />
        Mark as completed
      </label>
    </div>
  );
}
