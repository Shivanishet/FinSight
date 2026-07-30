export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatMonth(month: string): string {
  // month is YYYY-MM
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const tmp = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(monthKey(tmp));
  }
  return months;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * Used as the max date for date inputs
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check if a date string is in the future
 * Returns true if the date is after today (not including today)
 */
export function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Check if a date string is today
 */
export function isDateToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
}

/**
 * Check if a date string is in the past (including today)
 */
export function isPastOrToday(dateStr: string): boolean {
  return !isFutureDate(dateStr);
}

/**
 * Validate that a date is not in the future for income/expense entry
 * Returns null if valid, or an error message if invalid
 */
export function validateTransactionDate(dateStr: string): string | null {
  if (isFutureDate(dateStr)) {
    return 'Date cannot be in the future.';
  }
  return null;
}

/**
 * Get months up to and including the current month
 * Useful for dashboard/analytics to exclude future months
 */
export function getMonthsUpToCurrent(n: number): string[] {
  const months: string[] = [];
  const today = new Date();
  const currentMonthKey = monthKey(today);
  
  // Get the last n months
  const d = new Date(today.getFullYear(), today.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const tmp = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = monthKey(tmp);
    // Only include months up to and including current month
    if (key <= currentMonthKey) {
      months.push(key);
    }
  }
  return months;
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
