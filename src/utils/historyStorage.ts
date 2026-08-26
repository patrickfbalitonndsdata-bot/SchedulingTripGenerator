import { TripReportData } from '../types';

const HISTORY_STORAGE_KEY = 'trip_analysis_stored_reports_10d';
export const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

function getStorageKey(userId?: string): string {
  if (userId && userId.trim()) {
    return `${HISTORY_STORAGE_KEY}_${userId.trim()}`;
  }
  return HISTORY_STORAGE_KEY;
}

export interface StoredReportRecord {
  timestamp: number;
  report: TripReportData;
}

/**
 * Extracts the effective reference timestamp for a trip report based primarily on its dateOfSchedule.
 * If dateOfSchedule is valid (e.g. "8/3/2026", "08/03/2026", "2026-08-03"), it returns the end-of-day timestamp
 * of that schedule date (23:59:59.999) so that the report remains valid for 10 full calendar days
 * after the schedule date.
 * If dateOfSchedule is missing or unparseable, it falls back to uploadedAt, timestamp, or updatedAt.
 */
export function getReportScheduleTimestamp(report: any): number {
  if (!report) return Date.now();

  const schedDateStr = report.dateOfSchedule || report.date || '';
  if (schedDateStr && typeof schedDateStr === 'string' && schedDateStr.trim()) {
    const trimmed = schedDateStr.trim();

    // Match MM/DD/YYYY or M/D/YYYY
    const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdyMatch) {
      const month = parseInt(mdyMatch[1], 10) - 1;
      const day = parseInt(mdyMatch[2], 10);
      const year = parseInt(mdyMatch[3], 10);
      const d = new Date(year, month, day, 23, 59, 59, 999);
      if (!isNaN(d.getTime())) {
        return d.getTime();
      }
    }

    // Match YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const d = new Date(year, month, day, 23, 59, 59, 999);
      if (!isNaN(d.getTime())) {
        return d.getTime();
      }
    }

    // Standard new Date parse fallback
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(23, 59, 59, 999);
      return parsed.getTime();
    }
  }

  // Fallback to uploaded timestamp or creation time
  if (report.uploadedAt) {
    const p = Number(report.uploadedAt);
    if (!isNaN(p) && p > 0) return p;
    const d = new Date(report.uploadedAt).getTime();
    if (!isNaN(d) && d > 0) return d;
  }

  if (report.timestamp) {
    const p = Number(report.timestamp);
    if (!isNaN(p) && p > 0) return p;
  }

  if (report.updatedAt) {
    const d = new Date(report.updatedAt).getTime();
    if (!isNaN(d) && d > 0) return d;
  }

  return Date.now();
}

/**
 * Determines whether a report has exceeded the 10-day retention window based on its Schedule Date.
 */
export function isReportExpired(report: any, now: number = Date.now()): boolean {
  if (!report) return true;
  const scheduleTime = getReportScheduleTimestamp(report);
  const age = now - scheduleTime;
  return age > TEN_DAYS_MS;
}

export function getStoredHistoryReports(userId?: string): TripReportData[] {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const records: StoredReportRecord[] = JSON.parse(raw);
    if (!Array.isArray(records)) return [];

    const now = Date.now();
    // Filter reports within 10 days of their Schedule Date
    const validRecords = records.filter(item => {
      if (!item || !item.report) return false;
      return !isReportExpired(item.report, now);
    });

    if (validRecords.length !== records.length) {
      localStorage.setItem(key, JSON.stringify(validRecords));
    }

    return validRecords.map(item => item.report);
  } catch (e) {
    console.error('Failed to load history reports from localStorage', e);
    return [];
  }
}

export function isSameReportRecord(a: TripReportData, b: TripReportData): boolean {
  if (a.id && b.id && a.id.trim() === b.id.trim()) return true;
  const aTech = (a.technician || '').trim().toLowerCase();
  const bTech = (b.technician || '').trim().toLowerCase();
  const aDate = (a.dateOfSchedule || '').trim();
  const bDate = (b.dateOfSchedule || '').trim();
  const aFile = (a.fileName || '').trim().toLowerCase();
  const bFile = (b.fileName || '').trim().toLowerCase();

  if (aTech && bTech && aTech === bTech && aDate && bDate && aDate === bDate) {
    if (aFile && bFile) {
      return aFile === bFile;
    }
    return true;
  }
  return false;
}

export function isSameTechnicianAndScheduleDate(a: TripReportData, b: TripReportData): boolean {
  const aTech = (a.technician || '').trim().toLowerCase();
  const bTech = (b.technician || '').trim().toLowerCase();
  const aDate = (a.dateOfSchedule || '').trim();
  const bDate = (b.dateOfSchedule || '').trim();

  if (aTech && bTech && aTech === bTech && aDate && bDate && aDate === bDate) {
    return true;
  }
  return false;
}

export function findExistingReportByTechAndDate(
  newReport: TripReportData,
  knownReports: TripReportData[]
): TripReportData | null {
  const cleanTech = (newReport.technician || '').trim().toLowerCase();
  const cleanDate = (newReport.dateOfSchedule || '').trim();

  if (!cleanTech || !cleanDate) return null;

  for (const item of knownReports) {
    if (!item) continue;
    const itemTech = (item.technician || '').trim().toLowerCase();
    const itemDate = (item.dateOfSchedule || '').trim();

    if (itemTech === cleanTech && itemDate === cleanDate) {
      // Don't flag if it's literally the same instance ID
      if (!newReport.id || !item.id || newReport.id.trim() !== item.id.trim()) {
        return item;
      }
    }
  }

  return null;
}

export function replaceLocalHistoryCache(reports: TripReportData[], userId?: string): void {
  try {
    const key = getStorageKey(userId);
    const now = Date.now();
    const validReports = (reports || []).filter(r => !isReportExpired(r, now));
    const records: StoredReportRecord[] = validReports.map(r => ({
      timestamp: getReportScheduleTimestamp(r),
      report: r
    }));
    localStorage.setItem(key, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to replace local history cache', e);
  }
}

export function saveReportToHistory(report: TripReportData, userId?: string): TripReportData[] {
  try {
    const key = getStorageKey(userId);
    const current = getStoredHistoryReports(userId);
    const existingIdx = current.findIndex(r => isSameReportRecord(r, report));
    let updated: TripReportData[];

    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = { ...report, id: current[existingIdx].id || report.id };
    } else {
      updated = [report, ...current];
    }

    const now = Date.now();
    const validReports = updated.filter(r => !isReportExpired(r, now));
    const records: StoredReportRecord[] = validReports.map(r => ({
      timestamp: getReportScheduleTimestamp(r),
      report: r
    }));

    localStorage.setItem(key, JSON.stringify(records));
    return validReports;
  } catch (e) {
    console.error('Failed to save report to history', e);
    return [];
  }
}

export function saveMultipleReportsToHistory(reports: TripReportData[], userId?: string): TripReportData[] {
  const key = getStorageKey(userId);
  let updated = getStoredHistoryReports(userId);
  for (const rep of reports) {
    const existingIdx = updated.findIndex(r => isSameReportRecord(r, rep));
    if (existingIdx >= 0) {
      updated[existingIdx] = { ...rep, id: updated[existingIdx].id || rep.id };
    } else {
      updated = [rep, ...updated];
    }
  }

  const now = Date.now();
  const validReports = updated.filter(r => !isReportExpired(r, now));
  const records: StoredReportRecord[] = validReports.map(r => ({
    timestamp: getReportScheduleTimestamp(r),
    report: r
  }));

  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save multiple reports to history', e);
  }
  return validReports;
}

export function clearAllHistoryRecords(userId?: string): void {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear history records from storage', e);
  }
}

export function deleteSingleHistoryRecord(
  target: string | TripReportData,
  fallbackKey?: { date?: string; tech?: string; fileName?: string },
  userId?: string
): TripReportData[] {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const records: StoredReportRecord[] = JSON.parse(raw);
    if (!Array.isArray(records)) return [];

    const targetReport: TripReportData | null = typeof target === 'object' ? target : null;
    const targetId = typeof target === 'string' ? target : targetReport?.id;

    const cleanId = (targetId || '').trim();
    const cleanDate = (fallbackKey?.date || targetReport?.dateOfSchedule || '').trim();
    const cleanTech = (fallbackKey?.tech || targetReport?.technician || '').trim().toLowerCase();
    const cleanFile = (fallbackKey?.fileName || targetReport?.fileName || '').trim().toLowerCase();

    let deleted = false;

    const updatedRecords = records.filter(item => {
      if (!item || !item.report) return false;
      if (deleted) return true; // Remove just the matching entry

      const itemReport = item.report;

      // Match using full record comparison if report object passed
      if (targetReport && isSameReportRecord(itemReport, targetReport)) {
        deleted = true;
        return false;
      }

      const itemId = (itemReport.id || '').trim();
      const itemDate = (itemReport.dateOfSchedule || '').trim();
      const itemTech = (itemReport.technician || '').trim().toLowerCase();
      const itemFile = (itemReport.fileName || '').trim().toLowerCase();

      // Match by ID
      if (cleanId && itemId && itemId === cleanId) {
        deleted = true;
        return false;
      }

      // Match by Tech + Date (+ optional file)
      if (cleanTech && cleanDate && itemTech === cleanTech && itemDate === cleanDate) {
        if (!cleanFile || !itemFile || cleanFile === itemFile) {
          deleted = true;
          return false;
        }
      }

      return true;
    });

    localStorage.setItem(key, JSON.stringify(updatedRecords));
    return updatedRecords.map(item => item.report);
  } catch (e) {
    console.error('Failed to delete history record from storage', e);
    return [];
  }
}
