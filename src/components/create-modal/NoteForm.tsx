"use client";

import { CategorySelect } from "./CategorySelect";
import type { NoteFormState } from "@/types/modal";

type Props = {
  data: Partial<NoteFormState>;
  onUpdate: (updates: Partial<NoteFormState>) => void;
};

export function NoteForm({ data, onUpdate }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Note title
        </label>
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="e.g. Project ideas"
          className="w-full rounded-[6px] border bg-white px-3 py-[6px] font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none tracking-[0.2px] text-[#929292] placeholder:text-[#929292]"
          style={{ borderColor: "var(--input-border)" }}
          required
        />
      </div>

      <div>
        <label className="mb-1 block font-[family-name:var(--font-crimson)] text-[12px] font-normal leading-none text-black">
          Note content
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
            placeholder="Start writing..."
            className="h-[72px] w-full resize-none bg-white px-3 py-[6px] font-[family-name:var(--font-crimson)] text-[10px] font-light leading-none tracking-[0.2px] text-[#929292] placeholder:text-[#929292] outline-none"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <CategorySelect
          value={data.categoryId || ""}
          onChange={(id) => onUpdate({ categoryId: id })}
        />
      </div>
    </div>
  );
}
