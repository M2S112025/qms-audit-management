export function getTodayISO(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((new Date(`${to.slice(0, 10)}T00:00:00`).getTime() - new Date(`${from.slice(0, 10)}T00:00:00`).getTime()) / 86_400_000);
}

export function isOverdue(date: string, today = getTodayISO()) {
  return date < today;
}

export function formatLocalDate(date: string) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}
