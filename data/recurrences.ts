export type RecurrenceFrequency =
  | "one_time"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual"
  | "custom";

export type RecurrenceEndMode = "date" | "occurrences" | "none";

export type AuditRecurrence = {
  id: string;
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endMode: RecurrenceEndMode;
  endDate?: string;
  occurrences?: number;
  generatedAuditIds: string[];
};

export const recurrenceLabels: Record<RecurrenceFrequency, string> = {
  one_time: "One Time",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
  custom: "Custom",
};

export const recurrenceUnits: Record<RecurrenceFrequency, string> = {
  one_time: "days",
  weekly: "weeks",
  monthly: "months",
  quarterly: "months",
  semi_annual: "months",
  annual: "years",
  custom: "months",
};

export const defaultInterval: Record<RecurrenceFrequency, number> = {
  one_time: 1,
  weekly: 1,
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 1,
  custom: 1,
};

export const recurrenceSeed: AuditRecurrence[] = [
  {
    id: "REC-2027-001",
    frequency: "quarterly",
    interval: 3,
    startDate: "2027-01-15",
    endMode: "occurrences",
    occurrences: 4,
    generatedAuditIds: [
      "AUD-2027-001",
      "AUD-2027-002",
      "AUD-2027-003",
      "AUD-2027-004",
    ],
  },
];

function addMonths(date: Date, months: number) {
  const day = date.getUTCDate();
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

export function generateOccurrenceDates(
  recurrence: Omit<AuditRecurrence, "id" | "generatedAuditIds">,
) {
  const dates: string[] = [];
  let current = new Date(`${recurrence.startDate}T00:00:00Z`);
  const maximum =
    recurrence.endMode === "occurrences"
      ? Math.min(Math.max(recurrence.occurrences ?? 1, 1), 120)
      : recurrence.endMode === "date"
        ? 120
        : 12;

  for (let index = 0; index < maximum; index += 1) {
    const value = current.toISOString().slice(0, 10);
    if (
      recurrence.endMode === "date" &&
      recurrence.endDate &&
      value > recurrence.endDate
    )
      break;
    dates.push(value);
    if (recurrence.frequency === "weekly") {
      current = new Date(
        current.getTime() + recurrence.interval * 7 * 86400000,
      );
    } else if (recurrence.frequency === "annual") {
      current = addMonths(current, recurrence.interval * 12);
    } else {
      current = addMonths(current, recurrence.interval);
    }
  }
  return dates;
}

export function formatOccurrenceDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
