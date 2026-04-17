"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect } from "react";

import type { CyclePhaseInfo } from "@/lib/cycle";

const imgCycle = "https://www.figma.com/api/mcp/asset/fc0c0ecc-7b83-44c5-a032-4cecdaefd529";

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  phase: CyclePhaseInfo;
  className?: string;
  popoverClassName?: string;
};

export function CyclePopover({
  isOpen,
  onToggle,
  onClose,
  phase,
  className,
  popoverClassName,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  const enabled = phase.phase !== "unknown";

  return (
    <>
      <button
        type="button"
        className={`grid h-10 w-10 place-items-center rounded-full hover:bg-black/5 ${className ?? ""}`}
        onClick={onToggle}
        aria-label="Toggle cycle details"
        aria-expanded={isOpen}
      >
        <Image src={imgCycle} alt="" width={24} height={24} unoptimized className="h-[24px] w-[24px]" />
      </button>

      {isOpen && (
        <aside
          className={`lia-pop-in fixed right-[24px] top-[104px] z-50 w-[280px] overflow-hidden rounded-[16px] px-[18px] py-[16px] text-[#f8e5c6] shadow-[0_20px_44px_-20px_rgba(30,25,20,0.45)] ${popoverClassName ?? ""}`}
          style={{
            background: enabled
              ? "linear-gradient(180deg, #eec069 0%, #e3a747 100%)"
              : "linear-gradient(180deg, #c9c3b4 0%, #a8a294 100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#4a3a1c]/85">
              Cycle Phase
            </p>
            <Link
              href="/settings"
              className="rounded-full bg-white/25 px-2.5 py-1 text-[11px] text-[#4a3a1c] hover:bg-white/40"
            >
              Edit
            </Link>
          </div>

          {enabled ? (
            <>
              <p className="mt-[10px] text-[22px] leading-tight">{phase.label}</p>
              <p className="text-[13px] italic text-[#fff2d9]/90">
                ({phase.season}) • day {phase.dayOfCycle}
              </p>
              <p className="mt-[10px] text-[13px] leading-snug text-white/90">{phase.description}</p>
              {phase.nextPeriodStart && (
                <p className="mt-[10px] text-[12px] text-[#fff2d9]/80">
                  Next period expected{" "}
                  <span className="text-white">{format(phase.nextPeriodStart, "MMM d")}</span>
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mt-[10px] text-[20px] leading-tight text-white">
                Cycle tracking is off
              </p>
              <p className="mt-[8px] text-[13px] leading-snug text-white/85">{phase.description}</p>
            </>
          )}

          <div className="mt-[12px] flex items-center justify-between text-[11px]">
            <Link href="/cycle" className="text-white/90 underline-offset-2 hover:underline">
              Open full view →
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] text-white hover:bg-white/35"
            >
              close
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
