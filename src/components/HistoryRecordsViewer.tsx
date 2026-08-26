import React, { useState, useMemo } from 'react';
import { TripReportData } from '../types';
import { clearAllHistoryRecords, deleteSingleHistoryRecord } from '../utils/historyStorage';
import { parseDurationStringToMinutes, formatMinutesToDurationString } from '../utils/kmlParser';
import { Clock, Trash2, Calendar, User, FileText, ChevronDown, ChevronUp, ShieldAlert, CheckCircle2, ArrowRight, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryRecordsViewerProps {
  historyReports: TripReportData[];
  onRefreshHistory: () => void;
  onSelectReport: (report: TripReportData) => void;
  onNavigateToSheet: () => void;
  isAdminAuthenticated: boolean;
  onRequestAdminLock: () => void;
  onDeleteHistoryRecord?: (report: TripReportData) => void;
  onClearAllHistory?: () => void;
}

interface GroupedWeeklyRecord {
  key: string;
  technician: string;
  weeklyDateRange: string;
  reports: TripReportData[];
  totalMinutes: number;
}

export const HistoryRecordsViewer: React.FC<HistoryRecordsViewerProps> = ({
  historyReports,
  onRefreshHistory,
  onSelectReport,
  onNavigateToSheet,
  isAdminAuthenticated,
  onRequestAdminLock,
  onDeleteHistoryRecord,
  onClearAllHistory
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Group reports by Technician and Work Week
  const groupedRecords = useMemo(() => {
    const list: GroupedWeeklyRecord[] = [];
    const groupMap = new Map<string, TripReportData[]>();

    for (const r of historyReports) {
      const tech = r.technician || 'Unassigned Technician';
      const week = r.weeklyDateRange || 'Current Week';
      const key = `${tech.trim().toLowerCase()}||${week.trim().toLowerCase()}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(r);
    }

    groupMap.forEach((reports, key) => {
      const first = reports[0];
      let totalMins = 0;
      for (const rep of reports) {
        totalMins += parseDurationStringToMinutes(rep.predictedDailyWorkingHours);
      }

      list.push({
        key,
        technician: first.technician || 'Unassigned Technician',
        weeklyDateRange: first.weeklyDateRange || 'Current Week',
        reports,
        totalMinutes: totalMins
      });
    });

    return list;
  }, [historyReports]);

  // Filter grouped records by search query
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedRecords;
    const term = searchTerm.toLowerCase().trim();
    return groupedRecords.filter(g =>
      g.technician.toLowerCase().includes(term) ||
      g.weeklyDateRange.toLowerCase().includes(term) ||
      g.reports.some(r =>
        r.dateOfSchedule?.toLowerCase().includes(term) ||
        r.fileName?.toLowerCase().includes(term) ||
        r.jobs.some(j => j.projectNumber?.toLowerCase().includes(term))
      )
    );
  }, [groupedRecords, searchTerm]);

  // Reset to page 1 on search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Calculate pagination bounds
  const totalItems = filteredGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

  const handleClearRecords = () => {
    if (onClearAllHistory) {
      onClearAllHistory();
    } else {
      clearAllHistoryRecords();
      onRefreshHistory();
    }
    setShowConfirmClear(false);
  };

  const handleDeleteSingleRecord = (rep: TripReportData) => {
    if (onDeleteHistoryRecord) {
      onDeleteHistoryRecord(rep);
    } else {
      deleteSingleHistoryRecord(rep, {
        date: rep.dateOfSchedule,
        tech: rep.technician,
        fileName: rep.fileName
      });
      onRefreshHistory();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Stored Reports (10-Day Retention Records)</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {historyReports.length} {historyReports.length === 1 ? 'Report' : 'Reports'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reports are automatically retained for up to 10 days from their <strong className="text-slate-700">Schedule Date</strong> to calculate weekly <strong className="text-slate-700">Running Total - Field Time Cal</strong> by adding Predicted Daily Working Hours.
          </p>
        </div>

        {/* Action: Clear All Records */}
        <div>
          {!showConfirmClear ? (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Clear All Records</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-red-50 p-2 border border-red-300 rounded-xl">
              <span className="text-xs text-red-900 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Clear 10-day history?
              </span>
              <button
                onClick={handleClearRecords}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Page Size Controls */}
      {historyReports.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 border border-slate-200 rounded-2xl">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search technician, date, project..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Page size selector */}
          <div className="flex items-center space-x-2 text-xs text-slate-600 w-full sm:w-auto justify-between sm:justify-end">
            <span className="font-semibold">Groups per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value={5}>5 groups</option>
              <option value={10}>10 groups</option>
              <option value={20}>20 groups</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {historyReports.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No stored trip reports in the 10-day history buffer.</p>
          <p className="text-xs text-slate-400 mt-0.5">Upload or append trip logs above to automatically compute running weekly field totals.</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No records match your search criteria.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer"
          >
            Clear search filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Technician Weekly Field Time Accumulations</span>
            <span>
              Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} groups
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {paginatedGroups.map((group) => {
              const isExpanded = expandedKey === group.key;
              const formattedWeeklyTotal = formatMinutesToDurationString(group.totalMinutes);

              return (
                <div
                  key={group.key}
                  className="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Group Header */}
                  <div
                    onClick={() => setExpandedKey(isExpanded ? null : group.key)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-bold shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm">{group.technician}</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold text-[10px] rounded-full">
                            {group.reports.length} {group.reports.length === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 space-x-2 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Work Week: <strong>{group.weeklyDateRange}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Total Badge */}
                    <div className="flex items-center space-x-3">
                      <div className="text-left sm:text-right bg-amber-100/80 border border-amber-300/80 px-3.5 py-1.5 rounded-xl">
                        <div className="text-[10px] font-bold text-amber-900 uppercase">
                          Computed Running Total Field Time
                        </div>
                        <div className="text-sm font-black text-amber-950">
                          {formattedWeeklyTotal}
                        </div>
                      </div>

                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white p-4 space-y-3">
                      <div className="text-xs font-bold text-slate-700">
                        Processed Daily Reports in {group.weeklyDateRange}:
                      </div>

                      <div className="space-y-2">
                        {group.reports.map((rep) => (
                          <div
                            key={rep.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2 font-bold text-slate-900">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Date: {rep.dateOfSchedule}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600">{rep.fileName}</span>
                              </div>
                              <div className="text-slate-500 text-[11px] flex items-center space-x-3">
                                <span>Project #{rep.jobs[0]?.projectNumber || 'N/A'}</span>
                                <span>•</span>
                                <span>Equipments: {rep.jobs[0]?.totalEquipments || 'N/A'}</span>
                                <span>•</span>
                                <span>Samsara Shift: {rep.totalHoursSamsara}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0">
                              <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-right">
                                <span className="text-[10px] text-slate-400 block font-semibold">Predicted Hours</span>
                                <span className="font-extrabold text-slate-800 text-xs">{rep.predictedDailyWorkingHours}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectReport(rep);
                                  onNavigateToSheet();
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
                                title="Add this record to active Trip Record Sheet"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Sheet</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSingleRecord(rep);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Delete this specific record from history"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span className="hidden sm:inline">Delete Record</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium">
                Page <strong className="text-slate-800">{validPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={validPage === 1}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Page number buttons */}
                <div className="flex items-center space-x-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - validPage) <= 1)
                    .map((p, idx, arr) => {
                      const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsisBefore && <span className="text-xs text-slate-400 px-1">...</span>}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              p === validPage
                                ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={validPage === totalPages}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
