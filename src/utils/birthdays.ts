import { Empleado } from '../types';

export interface BirthdayInfo {
  employee: Empleado;
  day: number;
  month: number;
  year?: number;
  ageTurning?: number;
  isToday: boolean;
  daysUntil: number; // 0 for today
}

/**
 * Parses date string in DD/MM/YYYY or YYYY-MM-DD format
 */
export function parseBirthDate(fechaStr?: string): { day: number; month: number; year?: number } | null {
  if (!fechaStr) return null;
  const str = fechaStr.trim();
  if (!str) return null;

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parts[2] ? parseInt(parts[2], 10) : undefined;
      if (!isNaN(day) && !isNaN(month) && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return { day, month, year };
      }
    }
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return { day, month, year };
      }
    }
  }
  return null;
}

/**
 * Returns birthday analysis for active employees
 */
export function getBirthdayList(employees: Empleado[], targetDate: Date = new Date()): BirthdayInfo[] {
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth() + 1; // 1-12
  const currentDay = targetDate.getDate();

  const activeEmployees = employees.filter((e) => e.estado === 'ACTIVO');

  const list: BirthdayInfo[] = [];

  for (const emp of activeEmployees) {
    const parsed = parseBirthDate(emp.fechaNacimiento);
    if (!parsed) continue;

    const isToday = parsed.day === currentDay && parsed.month === currentMonth;

    // Calculate days until next birthday
    // Target date normalized to start of day
    const todayZero = new Date(currentYear, currentMonth - 1, currentDay);
    let bdayThisYear = new Date(currentYear, parsed.month - 1, parsed.day);

    let targetYear = currentYear;
    if (bdayThisYear < todayZero) {
      targetYear = currentYear + 1;
      bdayThisYear = new Date(targetYear, parsed.month - 1, parsed.day);
    }

    const diffMs = bdayThisYear.getTime() - todayZero.getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const ageTurning = parsed.year ? targetYear - parsed.year : undefined;

    list.push({
      employee: emp,
      day: parsed.day,
      month: parsed.month,
      year: parsed.year,
      ageTurning,
      isToday,
      daysUntil,
    });
  }

  // Sort by daysUntil (0 for today first, then 1, 2, ...)
  return list.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Get birthdays occurring today
 */
export function getTodayBirthdays(employees: Empleado[], targetDate: Date = new Date()): BirthdayInfo[] {
  return getBirthdayList(employees, targetDate).filter((b) => b.isToday);
}

/**
 * Get birthdays occurring in the current month or next N days
 */
export function getUpcomingBirthdays(employees: Empleado[], daysAhead = 30, targetDate: Date = new Date()): BirthdayInfo[] {
  return getBirthdayList(employees, targetDate).filter((b) => !b.isToday && b.daysUntil <= daysAhead);
}

/**
 * Format month name in Spanish
 */
export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
