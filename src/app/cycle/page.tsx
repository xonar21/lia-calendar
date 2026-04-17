"use client";

import Link from "next/link";
import { addDays, format } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { computeCyclePhase, type CyclePhaseInfo } from "@/lib/cycle";

const PHASE_ORDER: Array<{
  key: "menstrual" | "follicular" | "ovulatory" | "luteal";
  label: string;
  season: string;
  accent: string;
}> = [
  { key: "menstrual", label: "Menstrual", season: "Inner winter", accent: "#b8697b" },
  { key: "follicular", label: "Follicular", season: "Inner spring", accent: "#7e9b8a" },
  { key: "ovulatory", label: "Ovulatory", season: "Inner summer", accent: "#e8b95e" },
  { key: "luteal", label: "Luteal", season: "Inner autumn", accent: "#9d6f61" },
];

type RawSettings = {
  cycleMode?: "ENABLED" | "DISABLED" | null;
  cycleLengthDays?: number | null;
  periodLengthDays?: number | null;
  cycleStartDate?: string | null;
};

export default function CyclePage() {
  const [phase, setPhase] = useState<CyclePhaseInfo>(computeCyclePhase(null));
  const [raw, setRaw] = useState<RawSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const daysUntilNextPeriod = useMemo(() => {
    if (!phase.nextPeriodStart || !now) return null;
    return Math.max(
      0,
      Math.round((phase.nextPeriodStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }, [phase.nextPeriodStart, now]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const payload: { settings?: RawSettings } = await response.json();
        setRaw(payload.settings ?? null);
        setPhase(computeCyclePhase(payload.settings ?? null));
        setNow(new Date());
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    };
    void load();
  }, []);

  const enabled = phase.phase !== "unknown";

  return (
    <AppShell activeNav="cycle" title="Cycle" subtitle="Your current phase and rhythm">
      <div className={`flex flex-col gap-5 ${loaded ? "" : "opacity-0"}`}>
        {!enabled ? (
          <section className="rounded-[18px] border border-dashed border-[var(--lia-border)] bg-[var(--lia-surface)] p-8 text-center shadow-[0_1px_2px_rgba(90,79,62,0.04)]">
            <h2 className="text-[24px] text-[var(--lia-accent-warm)]">Cycle tracking is off</h2>
            <p className="mx-auto mt-2 max-w-[440px] text-[14px] text-[var(--lia-muted)]">
              Turn on cycle tracking in settings to see your phase, energy suggestions and a
              projected next period based on your rhythm.
            </p>
            <Link
              href="/settings"
              className="mt-5 inline-flex rounded-full bg-[var(--lia-accent-warm)] px-5 py-2 text-[13px] text-white shadow-[0_6px_16px_-8px_rgba(125,88,25,0.6)] hover:brightness-110"
            >
              Open settings
            </Link>
          </section>
        ) : (
          <>
            <section
              className="relative overflow-hidden rounded-[20px] p-7 text-white shadow-[0_20px_44px_-20px_rgba(30,25,20,0.35)]"
              style={{
                background: `linear-gradient(135deg, ${phase.accent} 0%, ${shade(phase.accent, -18)} 100%)`,
              }}
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/80">
                    Current phase
                  </p>
                  <h2 className="mt-2 text-[38px] leading-none">{phase.label}</h2>
                  <p className="mt-2 text-[15px] italic text-white/85">
                    {phase.season} • day {phase.dayOfCycle} of {phase.cycleLengthDays}
                  </p>
                  <p className="mt-4 max-w-[540px] text-[15px] leading-relaxed text-white/90">
                    {phase.longDescription}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="shrink-0 rounded-full bg-white/25 px-4 py-2 text-[12px] text-white backdrop-blur hover:bg-white/35"
                >
                  Edit parameters
                </Link>
              </div>

              <CycleRing phase={phase} />
            </section>

            <section className="grid grid-cols-2 gap-3">
              <InfoTile
                label="Next period"
                value={phase.nextPeriodStart ? format(phase.nextPeriodStart, "MMMM d") : "—"}
                hint={daysUntilNextPeriod !== null ? `in ${daysUntilNextPeriod} days` : undefined}
              />
              <InfoTile
                label="Cycle length"
                value={`${phase.cycleLengthDays} days`}
                hint={`Period ≈ ${phase.periodLengthDays} days`}
              />
            </section>

            <section className="rounded-[18px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] p-6 shadow-[0_1px_2px_rgba(90,79,62,0.04),0_12px_30px_-20px_rgba(90,79,62,0.12)]">
              <h3 className="text-[20px] text-[var(--lia-accent-warm)]">All phases</h3>
              <p className="mt-1 text-[13px] text-[var(--lia-muted)]">
                A quick reference for the rhythm of your cycle.
              </p>

              <ul className="mt-4 flex flex-col divide-y divide-[var(--lia-border-soft)]">
                {PHASE_ORDER.map((item) => {
                  const active = item.key === phase.phase;
                  return (
                    <li
                      key={item.key}
                      className={`flex items-center justify-between gap-4 py-3 ${
                        active ? "opacity-100" : "opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-[14px] w-[14px] rounded-full"
                          style={{ background: item.accent }}
                        />
                        <div>
                          <p className="text-[16px] text-[#2f2a22]">{item.label}</p>
                          <p className="text-[12px] text-[var(--lia-muted)]">{item.season}</p>
                        </div>
                      </div>
                      {active && (
                        <span
                          className="rounded-full px-3 py-1 text-[11px] font-medium text-white"
                          style={{ background: item.accent }}
                        >
                          you are here
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {raw?.cycleStartDate && (
              <p className="text-center text-[12px] text-[var(--lia-muted)]">
                Last period start:{" "}
                {format(new Date(raw.cycleStartDate), "MMMM d, yyyy")} •{" "}
                <Link href="/settings" className="underline-offset-2 hover:underline">
                  adjust in settings
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function InfoTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] p-5 shadow-[0_1px_2px_rgba(90,79,62,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--lia-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[24px] text-[#2f2a22]">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-[var(--lia-muted)]">{hint}</p>}
    </div>
  );
}

function CycleRing({ phase }: { phase: CyclePhaseInfo }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = phase.dayOfCycle
    ? Math.min(1, phase.dayOfCycle / Math.max(1, phase.cycleLengthDays))
    : 0;
  const dash = circumference * progress;

  return (
    <div className="mt-6 flex items-center gap-5">
      <svg width="170" height="170" viewBox="0 0 170 170" className="shrink-0">
        <circle
          cx="85"
          cy="85"
          r={radius}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="85"
          cy="85"
          r={radius}
          stroke="white"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 85 85)"
        />
        <text
          x="85"
          y="88"
          textAnchor="middle"
          fontSize="30"
          fill="white"
          style={{ fontFamily: "var(--font-crimson), serif" }}
        >
          {phase.dayOfCycle ?? "—"}
        </text>
        <text
          x="85"
          y="108"
          textAnchor="middle"
          fontSize="11"
          fill="rgba(255,255,255,0.8)"
          style={{ letterSpacing: "0.18em" }}
        >
          DAY
        </text>
      </svg>
      <div className="text-[13px] text-white/90">
        <p className="font-medium text-white">Projection</p>
        <p className="mt-1 leading-relaxed">
          Based on your last period and a {phase.cycleLengthDays}‑day cycle, Lia expects the next
          one around{" "}
          <span className="font-medium text-white">
            {phase.nextPeriodStart ? format(phase.nextPeriodStart, "MMM d") : "—"}
          </span>
          .
        </p>
        {phase.nextPeriodStart && (
          <p className="mt-1">
            Ovulation window approx.{" "}
            <span className="font-medium text-white">
              {format(addDays(phase.nextPeriodStart, -16), "MMM d")}
            </span>{" "}
            –{" "}
            <span className="font-medium text-white">
              {format(addDays(phase.nextPeriodStart, -12), "MMM d")}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function shade(hex: string, percent: number) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const nr = Math.round((t - r) * p) + r;
  const ng = Math.round((t - g) * p) + g;
  const nb = Math.round((t - b) * p) + b;
  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
}
