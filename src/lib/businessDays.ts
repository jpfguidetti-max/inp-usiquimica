// Business-day arithmetic used to compute SLA due dates and "days stuck" for
// the INP workflow. Skips Saturdays, Sundays, and any date present in the
// Holiday table.

export type HolidayLike = { date: Date };

function toDateOnlyKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function buildHolidaySet(holidays: HolidayLike[]): Set<string> {
  return new Set(holidays.map((h) => toDateOnlyKey(h.date)));
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isBusinessDay(d: Date, holidaySet: Set<string>): boolean {
  return !isWeekend(d) && !holidaySet.has(toDateOnlyKey(d));
}

/**
 * Adds `n` business days to `date`, skipping weekends and holidays.
 * n=0 returns the next business day on/after `date` unchanged if `date`
 * itself is already a business day... actually per common SLA semantics we
 * treat `date` as day 0 (the start) and count forward n business days.
 */
export function addBusinessDays(date: Date, n: number, holidays: HolidayLike[]): Date {
  const holidaySet = buildHolidaySet(holidays);
  const result = new Date(date);
  let remaining = n;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result, holidaySet)) {
      remaining -= 1;
    }
  }
  return result;
}

/**
 * Counts the number of business days strictly between `start` and `end`
 * (i.e. how many business days have elapsed). If `end` is before `start`,
 * returns a negative count using the same logic in reverse.
 */
export function businessDaysBetween(start: Date, end: Date, holidays: HolidayLike[]): number {
  const holidaySet = buildHolidaySet(holidays);
  if (end.getTime() === start.getTime()) return 0;

  const forward = end.getTime() > start.getTime();
  const from = forward ? start : end;
  const to = forward ? end : start;

  const cursor = new Date(from);
  let count = 0;
  while (cursor.getTime() < to.getTime()) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getTime() > to.getTime()) break;
    if (isBusinessDay(cursor, holidaySet)) {
      count += 1;
    }
  }
  return forward ? count : -count;
}

export function isHoliday(date: Date, holidays: HolidayLike[]): boolean {
  const holidaySet = buildHolidaySet(holidays);
  return holidaySet.has(toDateOnlyKey(date));
}
