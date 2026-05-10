"use client";

import { MoodSelector } from "./MoodSelector";
import type { JournalFormState } from "@/types/modal";

type Props = {
  data: Partial<JournalFormState>;
  onUpdate: (updates: Partial<JournalFormState>) => void;
};

export function JournalForm({ data, onUpdate }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 font-[family-name:var(--font-crimson)]">
        <span className="text-[10px] font-light tracking-[0.2px] text-[#929292]">
          {data.date
            ? data.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Select date"}
        </span>
        <span className="text-[#b9b9b9]">|</span>
        <button
          type="button"
          className="text-[10px] font-normal text-[#9a6f64] underline"
        >
          Edit
        </button>
      </div>

      <div>
        <label className="mb-1 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Morning clarity
        </label>
        <div
          className="overflow-hidden rounded-[6px] border"
          style={{ borderColor: "var(--input-border)" }}
        >
          <div className="flex items-center gap-1 border-b bg-[#f6f6f6] px-2 py-[3px]" style={{ borderColor: "var(--input-border)" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 w-4 rounded bg-white/60" />
            ))}
          </div>
          <textarea
            value={data.content || ""}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Share your thoughts..."
            className="h-[71px] w-full resize-none bg-white px-3 py-[6px] font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none tracking-[0.2px] text-[#929292] placeholder:text-[#929292] outline-none"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Mood
        </label>
        <input
          type="text"
          value={data.mood || ""}
          onChange={(e) => onUpdate({ mood: e.target.value })}
          placeholder="How are you feeling?"
          className="w-full rounded-[6px] border bg-white px-3 py-[6px] font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none tracking-[0.2px] text-[#929292] placeholder:text-[#929292]"
          style={{ borderColor: "var(--input-border)" }}
        />
      </div>

      <div>
        <label className="mb-0.5 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Emotions
        </label>
        <p className="mb-1.5 font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none text-[#929292]">
          How are you feeling? (select any that fit)
        </p>
        <MoodSelector
          value={data.mood || ""}
          onChange={(mood) => onUpdate({ mood })}
        />
      </div>
    </div>
  );
}
