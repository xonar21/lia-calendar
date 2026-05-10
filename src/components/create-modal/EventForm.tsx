"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { EventFormState } from "@/types/modal";

type Props = {
  data: Partial<EventFormState>;
  onUpdate: (updates: Partial<EventFormState>) => void;
};

function to12h(time: string) {
  const [h = "0", m = "0"] = time.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export function EventForm({ data, onUpdate }: Props) {
  const [timeOpen, setTimeOpen] = useState(true);

  const formattedDate = data.date
    ? format(data.date, "MMMM d, yyyy")
    : "Select date";

  return (
    <div className="flex flex-col gap-2.5">
      {/* Event title */}
      <div>
        <label className="mb-1 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Event title
        </label>
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="e.g. Workday"
          className="w-full rounded-[6px] border bg-white px-3 py-[7px] font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none tracking-[0.2px] text-[#929292] placeholder:text-[#929292] outline-none"
          style={{ borderColor: "var(--input-border)" }}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Description
        </label>
        <textarea
          value={data.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Add details about the event..."
          className="h-[62px] w-full resize-none rounded-[6px] border bg-white px-3 py-[7px] font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none tracking-[0.2px] text-[#929292] placeholder:text-[#929292] outline-none"
          style={{ borderColor: "var(--input-border)" }}
        />
      </div>

      {/* Date / Time picker (Frame 196) */}
      <div
        className="overflow-hidden rounded-[6px] border bg-white"
        style={{ borderColor: "var(--input-border)", height: 87 }}
      >
        {/* Date row (Frame 195) */}
        <div
          className="flex h-[29px] items-center justify-between border-b px-3"
          style={{ borderColor: "#777777" }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-[var(--input-border)]/30" />
            <span className="font-[family-name:var(--font-crimson)] text-[12px] font-normal text-black">
              Date
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[#929292]">
              {formattedDate}
            </span>
            <span className="text-[8px] leading-none text-[#929292]">&#x25B6;</span>
          </div>
        </div>

        {/* Bottom section (Frame 194) */}
        <div className="px-3 pt-2">
          {/* Time row (Frame 192) */}
          <div className="flex h-[21px] items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-[var(--lia-muted-soft)]" />
              <span className="font-[family-name:var(--font-crimson)] text-[12px] font-normal text-black">
                Time
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={data.startTime || "09:00"}
                onChange={(e) => onUpdate({ startTime: e.target.value })}
                className="w-[70px] bg-transparent font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[#929292] outline-none"
              />
              <span className="text-[10px] font-light text-[#929292]">to</span>
              <input
                type="time"
                value={data.endTime || "10:00"}
                onChange={(e) => onUpdate({ endTime: e.target.value })}
                className="w-[70px] bg-transparent font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[#929292] outline-none"
              />
              <span className="text-[8px] leading-none text-[#929292]">&#x25BC;</span>
            </div>
          </div>

          {/* All day row (Frame 193) */}
          <div className="mt-[7px] flex h-[13px] items-center gap-1.5">
            <input
              type="checkbox"
              checked={data.allDay || false}
              onChange={(e) => onUpdate({ allDay: e.target.checked })}
              className="h-3 w-3 accent-[var(--input-border)]"
            />
            <span className="font-[family-name:var(--font-crimson)] text-[12px] font-normal text-black">
              All day
            </span>
          </div>
        </div>
      </div>

      {/* Color + Category (Frame 203) */}
      <div
        className="overflow-hidden rounded-[6px] border bg-white"
        style={{ borderColor: "var(--input-border)" }}
      >
        <div
          className="flex h-[29px] items-center justify-between border-b px-3"
          style={{ borderColor: "#777777" }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border" style={{ borderColor: "var(--input-border)" }} />
            <span className="font-[family-name:var(--font-crimson)] text-[12px] font-normal text-black">
              Color
            </span>
          </div>
        </div>
        <div className="flex h-[29px] items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-[var(--lia-muted-soft)]" />
            <span className="font-[family-name:var(--font-crimson)] text-[12px] font-normal text-black">
              Category
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[#929292]">
              Personal
            </span>
            <span className="text-[8px] leading-none text-[#929292]">&#x25B6;</span>
          </div>
        </div>
      </div>

      {/* Reminder + Repeat (Frame 212) */}
      <div
        className="overflow-hidden rounded-[6px] border bg-white"
        style={{ borderColor: "var(--input-border)" }}
      >
        <div
          className="flex h-[29px] items-center justify-between border-b px-3"
          style={{ borderColor: "#777777" }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-[var(--lia-muted-soft)]" />
            <span className="font-[family-name:var(--font-crimson)] text-[12px] font-normal text-black">
              Reminder
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[#929292]">
              {data.reminder || "1 hour before"}
            </span>
            <span className="text-[8px] leading-none text-[#929292]">&#x25B6;</span>
          </div>
        </div>
        <div className="flex h-[29px] items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-[var(--lia-muted-soft)]" />
            <span className="font-[family-name:var(--font-crimson)] text-[12px] font-normal text-black">
              Repeat
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[#929292]">
              {data.repeat || "Does not repeat"}
            </span>
            <span className="text-[8px] leading-none text-[#929292]">&#x25B6;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
