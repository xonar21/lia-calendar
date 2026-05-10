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
    <div className="flex flex-wrap gap-2 pb-3">
      {types.map((type) => {
        const isActive = activeType === type;
        const palette = TYPE_PALETTE[type];

        return (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange(type)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] capitalize transition ${
              isActive
                ? "border-transparent shadow-sm"
                : "border-[var(--lia-border)] bg-white text-[var(--lia-muted)] hover:border-[var(--lia-accent-warm)]/40 hover:text-[#3d362d]"
            }`}
            style={
              isActive ? { background: palette.bg, color: palette.text } : undefined
            }
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: palette.dot }}
            />
            {type}
          </button>
        );
      })}
    </div>
  );
}
