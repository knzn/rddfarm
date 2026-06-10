export interface ScheduleEntry {
  dueDate: Date;
  amount: number;
}

function nextSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function nextFirstOfMonth(date: Date): Date {
  const d = new Date(date);
  if (d.getDate() === 1) {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setMonth(d.getMonth() + 1, 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calcWeeklySchedule(balance: number, today: Date, releaseDate: Date): ScheduleEntry[] {
  const sundays: Date[] = [];
  let cur = nextSunday(today);
  const end = new Date(releaseDate);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    sundays.push(new Date(cur));
    cur = new Date(cur);
    cur.setDate(cur.getDate() + 7);
  }

  if (sundays.length === 0) return [{ dueDate: releaseDate, amount: balance }];

  const weeklyAmount = Math.ceil(balance / sundays.length);
  const schedule: ScheduleEntry[] = sundays.map((d) => ({ dueDate: d, amount: weeklyAmount }));

  // adjust last entry so total = balance exactly
  const total = weeklyAmount * (sundays.length - 1);
  schedule[schedule.length - 1].amount = balance - total;

  return schedule;
}

export function calcMonthlySchedule(balance: number, today: Date, releaseDate: Date): ScheduleEntry[] {
  const starts: Date[] = [];

  // if today is before the 1st of next month, start from 1st of next month
  let cur = new Date(today);
  cur.setDate(1);
  cur.setHours(0, 0, 0, 0);
  if (cur <= today) {
    cur = nextFirstOfMonth(today);
  }

  const end = new Date(releaseDate);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    starts.push(new Date(cur));
    cur = new Date(cur);
    cur.setMonth(cur.getMonth() + 1);
  }

  if (starts.length === 0) return [{ dueDate: releaseDate, amount: balance }];

  const monthlyAmount = Math.ceil(balance / starts.length);
  const schedule: ScheduleEntry[] = starts.map((d) => ({ dueDate: d, amount: monthlyAmount }));

  const total = monthlyAmount * (starts.length - 1);
  schedule[schedule.length - 1].amount = balance - total;

  return schedule;
}
