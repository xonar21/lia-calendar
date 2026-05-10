"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string; color?: string };

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export function CategorySelect({ value, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data: { categories: Category[] } = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[6px] border bg-white px-3 py-[6px] font-[family-name:var(--font-crimson)] text-[10px] font-light tracking-[0.2px] text-[var(--lia-muted)]"
      style={{ borderColor: "var(--input-border)" }}
    >
      <option value="">Category</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
