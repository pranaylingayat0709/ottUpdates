// Week cycle utilities: every release week runs strictly Friday -> next Thursday.
import { addDays, format, startOfDay, subDays } from "date-fns";

const FRIDAY = 5; // date-fns getDay(): Sun=0 ... Fri=5, Sat=6

/** Returns the Friday that starts the release-week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day - FRIDAY + 7) % 7;
  return subDays(d, diff);
}

export function getWeekEnd(weekStart: Date): Date {
  return addDays(weekStart, 6); // Thursday
}

export function getWeekLabel(weekStart: Date, weekEnd: Date): string {
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const start = format(weekStart, sameMonth ? "d" : "d MMM");
  const end = format(weekEnd, "d MMM yyyy");
  return `${start} – ${end}`;
}

export function getCurrentWeekRange(reference: Date = new Date()) {
  const weekStartDate = getWeekStart(reference);
  const weekEndDate = getWeekEnd(weekStartDate);
  return { weekStartDate, weekEndDate, label: getWeekLabel(weekStartDate, weekEndDate) };
}

export function getAdjacentWeek(weekStart: Date, direction: 1 | -1) {
  const shifted = addDays(weekStart, direction * 7);
  const newStart = getWeekStart(shifted);
  const newEnd = getWeekEnd(newStart);
  return { weekStartDate: newStart, weekEndDate: newEnd, label: getWeekLabel(newStart, newEnd) };
}

/** Friday..Thursday day list for the release-calendar grid. */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameWeek(a: Date, b: Date): boolean {
  return getWeekStart(a).getTime() === getWeekStart(b).getTime();
}
