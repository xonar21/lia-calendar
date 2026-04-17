import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

export type CyclePhaseKey = "menstrual" | "follicular" | "ovulatory" | "luteal" | "unknown";

export type CyclePhaseInfo = {
  phase: CyclePhaseKey;
  label: string;
  season: string;
  dayOfCycle: number | null;
  cycleLengthDays: number;
  periodLengthDays: number;
  nextPeriodStart: Date | null;
  description: string;
  longDescription: string;
  accent: string;
};

export type CycleSettingsInput = {
  cycleMode?: "DISABLED" | "ENABLED" | null;
  cycleStartDate?: string | Date | null;
  cycleLengthDays?: number | null;
  periodLengthDays?: number | null;
};

const PHASE_META: Record<
  Exclude<CyclePhaseKey, "unknown">,
  { label: string; season: string; description: string; longDescription: string; accent: string }
> = {
  menstrual: {
    label: "Menstrual phase",
    season: "Inner winter",
    accent: "#b8697b",
    description: "Rest, reflect, and listen to your body.",
    longDescription:
      "Energy is low — favour slow work, gentle movement, and recovery. A good moment to review the past cycle and set soft intentions for the next.",
  },
  follicular: {
    label: "Follicular phase",
    season: "Inner spring",
    accent: "#7e9b8a",
    description: "Plan, explore, start new things.",
    longDescription:
      "Energy rises and focus returns. Great time for brainstorming, learning, and kicking off new projects or conversations.",
  },
  ovulatory: {
    label: "Ovulatory phase",
    season: "Inner summer",
    accent: "#e8b95e",
    description: "Communicate, present, and show up.",
    longDescription:
      "Peak social and verbal energy. Ideal for meetings, presentations, collaboration, and anything that needs visible confidence.",
  },
  luteal: {
    label: "Luteal phase",
    season: "Inner autumn",
    accent: "#9d6f61",
    description: "Organize, finish, slow down.",
    longDescription:
      "Good for detail work, wrapping things up and tidying. Sensitivity grows — protect your boundaries and keep the calendar light.",
  },
};

const UNKNOWN: CyclePhaseInfo = {
  phase: "unknown",
  label: "Cycle disabled",
  season: "",
  dayOfCycle: null,
  cycleLengthDays: 28,
  periodLengthDays: 5,
  nextPeriodStart: null,
  description: "Turn on cycle tracking in settings to see your current phase.",
  longDescription:
    "Lia can highlight your current phase in the calendar, suggest energy-aware planning, and show a projected next period.",
  accent: "#8d867f",
};

export function computeCyclePhase(
  settings: CycleSettingsInput | null | undefined,
  today: Date = new Date(),
): CyclePhaseInfo {
  if (!settings || settings.cycleMode !== "ENABLED" || !settings.cycleStartDate) {
    return UNKNOWN;
  }

  const cycleLengthDays = clampInt(settings.cycleLengthDays ?? 28, 20, 45);
  const periodLengthDays = clampInt(settings.periodLengthDays ?? 5, 2, 10);

  const start = startOfDay(new Date(settings.cycleStartDate));
  const now = startOfDay(today);
  const diff = differenceInCalendarDays(now, start);

  if (Number.isNaN(diff)) {
    return UNKNOWN;
  }

  const dayOfCycle = ((diff % cycleLengthDays) + cycleLengthDays) % cycleLengthDays + 1;

  const ovulationDay = Math.max(periodLengthDays + 1, Math.round(cycleLengthDays - 14));

  let phaseKey: Exclude<CyclePhaseKey, "unknown">;
  if (dayOfCycle <= periodLengthDays) {
    phaseKey = "menstrual";
  } else if (dayOfCycle < ovulationDay - 1) {
    phaseKey = "follicular";
  } else if (dayOfCycle <= ovulationDay + 1) {
    phaseKey = "ovulatory";
  } else {
    phaseKey = "luteal";
  }

  const cyclesPassed = Math.floor(diff / cycleLengthDays);
  const nextPeriodStart = addDays(start, (cyclesPassed + 1) * cycleLengthDays);

  const meta = PHASE_META[phaseKey];
  return {
    phase: phaseKey,
    label: meta.label,
    season: meta.season,
    dayOfCycle,
    cycleLengthDays,
    periodLengthDays,
    nextPeriodStart,
    description: meta.description,
    longDescription: meta.longDescription,
    accent: meta.accent,
  };
}

function clampInt(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}
