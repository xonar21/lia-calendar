"use client";

import { format } from "date-fns";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";

type CycleMode = "ENABLED" | "DISABLED";
type DefaultView = "MONTH" | "WEEK" | "DAY";

type Settings = {
  locale: string;
  timezone: string;
  defaultView: DefaultView;
  cycleMode: CycleMode;
  cycleLengthDays: number;
  periodLengthDays: number;
  cycleStartDate: string;
};

const DEFAULT_SETTINGS: Settings = {
  locale: "en-US",
  timezone: "UTC",
  defaultView: "MONTH",
  cycleMode: "DISABLED",
  cycleLengthDays: 28,
  periodLengthDays: 5,
  cycleStartDate: "",
};

const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "ru-RU", label: "Русский" },
  { value: "de-DE", label: "Deutsch" },
  { value: "fr-FR", label: "Français" },
  { value: "es-ES", label: "Español" },
];

const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Dubai",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const payload: { settings?: Partial<Settings> & { cycleStartDate?: string | null } } =
          await response.json();
        if (payload.settings) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...payload.settings,
            cycleLengthDays: payload.settings.cycleLengthDays ?? DEFAULT_SETTINGS.cycleLengthDays,
            periodLengthDays: payload.settings.periodLengthDays ?? DEFAULT_SETTINGS.periodLengthDays,
            cycleStartDate: payload.settings.cycleStartDate
              ? format(new Date(payload.settings.cycleStartDate), "yyyy-MM-dd")
              : "",
          });
        }
      } catch {
        // keep defaults
      } finally {
        setLoaded(true);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const cycleEnabled = settings.cycleMode === "ENABLED";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        locale: settings.locale,
        timezone: settings.timezone,
        defaultView: settings.defaultView,
        cycleMode: settings.cycleMode,
      };
      if (cycleEnabled) {
        payload.cycleLengthDays = settings.cycleLengthDays;
        payload.periodLengthDays = settings.periodLengthDays;
        payload.cycleStartDate = settings.cycleStartDate
          ? new Date(`${settings.cycleStartDate}T00:00:00.000Z`).toISOString()
          : null;
      } else {
        payload.cycleStartDate = null;
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("fail");
      setToast({ kind: "success", message: "Settings saved" });
    } catch {
      setToast({ kind: "error", message: "Cannot save settings" });
    } finally {
      setSaving(false);
    }
  };

  const disabledStyle = useMemo(
    () => (cycleEnabled ? "" : "pointer-events-none opacity-50"),
    [cycleEnabled],
  );

  return (
    <AppShell activeNav="settings" title="Settings" subtitle="Customise your calendar and cycle tracking">
      {toast && (
        <div
          className={`lia-slide-in fixed right-[40px] top-[104px] z-[60] rounded-full border px-4 py-2 text-[13px] shadow-[0_8px_20px_-10px_rgba(30,25,20,0.3)] ${
            toast.kind === "success"
              ? "border-[#bcd6ba] bg-[#e8f1e7] text-[#2d6a2b]"
              : "border-[#e9c3c3] bg-[#fbe8e8] text-[#963838]"
          }`}
        >
          {toast.message}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className={`mx-auto flex max-w-[760px] flex-col gap-5 ${loaded ? "" : "opacity-0"}`}
      >
        <SettingsCard title="Calendar" description="Defaults that are applied when you open the app.">
          <Field label="Default view">
            <div className="flex gap-2">
              {(["MONTH", "WEEK", "DAY"] as const).map((view) => {
                const active = settings.defaultView === view;
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, defaultView: view }))}
                    className={`rounded-full border px-4 py-1.5 text-[13px] capitalize transition ${
                      active
                        ? "border-transparent bg-[var(--lia-accent-warm-tint)] text-[var(--lia-accent-warm)]"
                        : "border-[var(--lia-border)] bg-white text-[var(--lia-muted)] hover:border-[var(--lia-accent-warm)]/40 hover:text-[#3d362d]"
                    }`}
                  >
                    {view.toLowerCase()}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Region">
            <select
              value={settings.locale}
              onChange={(event) => setSettings((prev) => ({ ...prev, locale: event.target.value }))}
              className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3 py-2 text-[14px]"
            >
              {LOCALES.map((locale) => (
                <option key={locale.value} value={locale.value}>
                  {locale.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Timezone">
            <select
              value={settings.timezone}
              onChange={(event) => setSettings((prev) => ({ ...prev, timezone: event.target.value }))}
              className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3 py-2 text-[14px]"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>
        </SettingsCard>

        <SettingsCard
          title="Cycle tracking"
          description="Show cycle phases and a projected next period in your calendar."
          trailing={
            <ToggleSwitch
              checked={cycleEnabled}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, cycleMode: checked ? "ENABLED" : "DISABLED" }))
              }
              label="Cycle mode"
            />
          }
        >
          <div className={`grid gap-4 ${disabledStyle}`}>
            <Field label="First day of your last period">
              <input
                type="date"
                value={settings.cycleStartDate}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, cycleStartDate: event.target.value }))
                }
                className="w-full rounded-[12px] border border-[var(--lia-border)] bg-white px-3 py-2 text-[14px]"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={`Cycle length — ${settings.cycleLengthDays} days`}>
                <input
                  type="range"
                  min={20}
                  max={40}
                  value={settings.cycleLengthDays}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      cycleLengthDays: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-[var(--lia-accent-warm)]"
                />
                <p className="mt-1 text-[11px] text-[var(--lia-muted)]">Typical range 24–35</p>
              </Field>

              <Field label={`Period length — ${settings.periodLengthDays} days`}>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={settings.periodLengthDays}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      periodLengthDays: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-[var(--lia-accent-warm)]"
                />
                <p className="mt-1 text-[11px] text-[var(--lia-muted)]">Typical range 3–7</p>
              </Field>
            </div>

            <div className="rounded-[12px] border border-dashed border-[var(--lia-border)] bg-white/60 p-4 text-[13px] text-[var(--lia-muted)]">
              Not sure about your cycle? You can start with defaults and adjust later — Lia will
              recompute phases as soon as you update these values.
            </div>
          </div>
        </SettingsCard>

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[var(--lia-accent-warm)] px-6 py-2.5 text-[14px] text-white shadow-[0_6px_16px_-8px_rgba(125,88,25,0.6)] hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function SettingsCard({
  title,
  description,
  children,
  trailing,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] p-6 shadow-[0_1px_2px_rgba(90,79,62,0.04),0_12px_30px_-20px_rgba(90,79,62,0.12)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] leading-none text-[var(--lia-accent-warm)]">{title}</h2>
          {description && (
            <p className="mt-1.5 text-[13px] text-[var(--lia-muted)]">{description}</p>
          )}
        </div>
        {trailing}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--lia-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition ${
        checked ? "bg-[var(--lia-accent-warm)]" : "bg-[var(--lia-border)]"
      }`}
    >
      <span
        className={`absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}
