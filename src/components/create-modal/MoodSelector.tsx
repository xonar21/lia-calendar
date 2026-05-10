"use client";

const EMOTIONS_ROWS = [
  ["anxious", "overthinking", "lonely", "stressed"],
  ["tired", "heavy", "tense", "calm", "grateful"],
  ["loved", "safe", "relaxed", "happy"],
  ["confident", "motivated"],
];

type Props = {
  value: string;
  onChange: (mood: string) => void;
};

export function MoodSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {EMOTIONS_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex flex-wrap gap-1.5">
          {row.map((emotion) => {
            const active = value === emotion;
            return (
              <button
                key={emotion}
                type="button"
                onClick={() => onChange(active ? "" : emotion)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-[3px] font-[family-name:var(--font-crimson)] text-[10px] font-normal leading-none transition ${
                  active
                    ? "bg-[var(--accent-color)] text-white"
                    : "bg-white text-[#77559d] hover:bg-[var(--accent-color)]/10"
                }`}
              >
                {emotion}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
