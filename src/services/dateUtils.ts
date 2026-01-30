import { subYears, startOfDay, isAfter, isBefore, getDate, getDay, getMonth, getYear } from 'date-fns';
import type { Timeframe } from '@/types/mutualFund';

/**
 * Parse date string in DD-MM-YYYY format to Date object
 */
export function parseNavDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get week of month (1-5)
 */
export function getWeekOfMonth(date: Date): number {
  const dayOfMonth = getDate(date);
  return Math.ceil(dayOfMonth / 7);
}

/**
 * Get quarter (1-4) from month
 */
export function getQuarter(month: number): number {
  return Math.floor(month / 3) + 1;
}

/**
 * Get cutoff date for a timeframe
 */
export function getTimeframeCutoffDate(timeframe: Timeframe): Date {
  const now = new Date();
  const years = timeframe === '1Y' ? 1 : timeframe === '3Y' ? 3 : timeframe === '5Y' ? 5 : 10;
  return startOfDay(subYears(now, years));
}

/**
 * Filter NAV data by timeframe
 */
export function filterByTimeframe<T extends { date: Date }>(
  data: T[],
  timeframe: Timeframe
): T[] {
  const cutoffDate = getTimeframeCutoffDate(timeframe);
  return data.filter(item => isAfter(item.date, cutoffDate) || item.date.getTime() === cutoffDate.getTime());
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate volatility as percentage
 */
export function calculateVolatility(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = calculateStdDev(values);
  return (stdDev / mean) * 100;
}

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
