"use client";

type Props = {
  value: "LOW" | "MEDIUM" | "HIGH";
  onChange: (urgency: "LOW" | "MEDIUM" | "HIGH") => void;
};

export function UrgencySelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
      className="w-full rounded-[6px] border bg-white px-3 py-[6px] font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[var(--lia-muted)]"
      style={{ borderColor: "var(--input-border)" }}
    >
      <option value="LOW">Low Priority</option>
      <option value="MEDIUM">Medium Priority</option>
      <option value="HIGH">High Priority</option>
    </select>
  );
}
