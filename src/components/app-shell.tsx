"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";

import { CyclePopover } from "@/components/cycle-popover";
import { UserMenu } from "@/components/user-menu";
import { computeCyclePhase, type CyclePhaseInfo } from "@/lib/cycle";

type NavKey = "calendar" | "settings" | "cycle";

type Props = {
  activeNav: NavKey;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

const NAV: Array<{ key: NavKey; href: string; label: string }> = [
  { key: "calendar", href: "/", label: "Calendar" },
  { key: "cycle", href: "/cycle", label: "Cycle" },
  { key: "settings", href: "/settings", label: "Settings" },
];

export function AppShell({ activeNav, title, subtitle, rightSlot, children }: Props) {
  const [isCycleOpen, setCycleOpen] = useState(false);
  const [phase, setPhase] = useState<CyclePhaseInfo>(computeCyclePhase(null));

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const payload: {
          settings?: {
            cycleMode?: "ENABLED" | "DISABLED" | null;
            cycleLengthDays?: number | null;
            periodLengthDays?: number | null;
            cycleStartDate?: string | null;
          };
        } = await response.json();
        setPhase(computeCyclePhase(payload.settings ?? null));
      } catch {
        // keep defaults
      }
    };
    void loadSettings();
  }, []);

  const onToggleCycle = useCallback(() => setCycleOpen((prev) => !prev), []);
  const onCloseCycle = useCallback(() => setCycleOpen(false), []);

  return (
    <div className="min-h-screen w-full bg-[var(--lia-canvas)]">
      <div className="relative mx-auto flex min-h-screen w-full">
        <aside className="sticky top-0 flex h-screen w-[295px] shrink-0 flex-col border-r border-[var(--lia-border-soft)] px-[20px] pt-[26px]">
          <Link href="/" className="ml-[20px] block">
            <Image src="/icons/Frame 140.svg" alt="by Lia" width={202} height={78} unoptimized className="h-[78px] w-[202px]" />
          </Link>

          <nav className="mt-[120px] flex flex-col gap-[2px]">
            {NAV.map((item) => {
              const active = item.key === activeNav;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex w-[255px] items-center gap-[10px] rounded-[12px] px-[14px] py-[11px] text-left transition ${
                    active
                      ? "bg-white/70 shadow-[0_1px_2px_rgba(90,79,62,0.06)] font-medium text-[#2f2a22]"
                      : "font-light text-[#5a524a] hover:bg-white/40"
                  }`}
                >
                  <span
                    className="inline-block h-[8px] w-[8px] rounded-full"
                    style={{
                      background: active ? "var(--lia-accent-warm)" : "transparent",
                      border: active ? "none" : "1.5px solid var(--lia-muted-soft)",
                    }}
                  />
                  <span className="text-[16px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="relative flex-1 px-[40px] pb-[60px] pt-[44px]">
          <header className="flex h-[50px] items-center justify-between">
            <div>
              <h1 className="text-[36px] leading-none tracking-[-0.01em] text-[var(--lia-accent-warm)]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-[14px] text-[var(--lia-muted)]">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {rightSlot}
              <CyclePopover
                isOpen={isCycleOpen}
                onToggle={onToggleCycle}
                onClose={onCloseCycle}
                phase={phase}
              />
              <Link
                href="/settings"
                className={`grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5 ${
                  activeNav === "settings" ? "bg-white/70 shadow-[0_1px_2px_rgba(90,79,62,0.06)]" : ""
                }`}
                aria-label="Settings"
              >
                <Image src="/icons/Cog--Streamline-Ultimate 1.svg" alt="" width={24} height={24} unoptimized className="h-[24px] w-[24px]" />
              </Link>
              <UserMenu />
            </div>
          </header>

          <div className="mt-[36px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
