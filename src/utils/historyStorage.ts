import { TripReportData } from '../types';

const HISTORY_STORAGE_KEY = 'trip_analysis_stored_reports_10d';
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

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

export function getStoredHistoryReports(userId?: string): TripReportData[] {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const records: StoredReportRecord[] = JSON.parse(raw);
    if (!Array.isArray(records)) return [];

    const now = Date.now();
    // Filter reports within 10 days maximum duration
    const validRecords = records.filter(item => {
      if (!item || !item.report) return false;
      const age = now - (item.timestamp || 0);
      return age <= TEN_DAYS_MS;
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
    const records: StoredReportRecord[] = reports.map(r => ({
      timestamp: Number(r.uploadedAt) || Date.now(),
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

    const records: StoredReportRecord[] = updated.map(r => ({
      timestamp: Date.now(),
      report: r
    }));

    localStorage.setItem(key, JSON.stringify(records));
    return updated;
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

  const records: StoredReportRecord[] = updated.map(r => ({
    timestamp: Date.now(),
    report: r
  }));

  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save multiple reports to history', e);
  }
  return updated;
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
