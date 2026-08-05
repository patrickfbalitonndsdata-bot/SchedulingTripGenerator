import React from 'react';
import { UploadZone } from './UploadZone';
import { TripReportData } from '../types';
import { HistoryRecordsViewer } from './HistoryRecordsViewer';
import { FileSpreadsheet, Clock, CheckCircle2, AlertTriangle, Layers, Calendar, ArrowRight, ShieldCheck, Cpu, Plus } from 'lucide-react';

interface DashboardProps {
  onReportGenerated: (report: TripReportData, mode?: 'replace' | 'add') => void;
  onNavigateToSheet: () => void;
  onNavigateToMap: () => void;
  activeReport: TripReportData | null;
  activeReportsList?: TripReportData[];
  historyReports: TripReportData[];
  onSelectReport: (report: TripReportData) => void;
  onRemoveReportFromList?: (index: number) => void;
  onRefreshHistory: () => void;
  isAdminAuthenticated: boolean;
  onRequestAdminLock: () => void;
  onDeleteHistoryRecord?: (report: TripReportData) => void;
  onClearAllHistory?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onReportGenerated,
  onNavigateToSheet,
  onNavigateToMap,
  activeReport,
  activeReportsList = [],
  historyReports,
  onSelectReport,
  onRemoveReportFromList,
  onRefreshHistory,
  isAdminAuthenticated,
  onRequestAdminLock,
  onDeleteHistoryRecord,
  onClearAllHistory
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Automated Samsara Log Processing</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SchEZTrip - Trip Analysis Automator
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Upload your Samsara Finished Trip Analysis KMZ/KML files to instantly extract shift timestamps, project numbers, equipment counts, and job statuses. Automatically encodes the official Trip Analysis spreadsheet report.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>KMZ & KML Auto-Extraction</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Samsara Shift Timestamps</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Standard Form Auto-Fill</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Multi-Technician Stacked Sheets</span>
          </div>
        </div>
      </div>

      {/* Main Upload Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>1. File Upload & Log Parsing</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Supports Samsara Finished Trip Analysis KMZ / KML</span>
        </div>

        <UploadZone
          onReportGenerated={onReportGenerated}
          onNavigateToSheet={onNavigateToSheet}
          onNavigateToMap={onNavigateToMap}
          activeReport={activeReport}
          activeReportsList={activeReportsList}
          historyReports={historyReports}
          onRemoveReportFromList={onRemoveReportFromList}
        />
      </div>

      {/* Quick Summary Grid */}
      {activeReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Current Technician</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {activeReport.technician || 'Technician'}
            </p>
            <div className="flex items-center text-xs text-slate-500 space-x-2">
              <span className="font-medium text-slate-700">Region:</span>
              <span>{activeReport.region || 'Unassigned'}</span>
              {activeReport.licensePlate && (
                <>
                  <span>•</span>
                  <span>Plate: {activeReport.licensePlate}</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Samsara Shift Hours</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">
              {activeReport.totalHoursSamsara || '0 hour/s 0 minutes'}
            </p>
            <div className="flex items-center text-xs text-slate-500 space-x-2">
              <span className="font-medium text-slate-700">Shift:</span>
              <span>{activeReport.startShift && activeReport.endShift ? `${activeReport.startShift} - ${activeReport.endShift}` : 'No shift logged'}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Field Time vs T-Sheets</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-extrabold text-slate-900">
                {activeReport.predictedDailyWorkingHours || '0h 0m'}
              </span>
              <span className="text-xs text-slate-500">vs {activeReport.actualDailyWorkingHours || '0h 0m'}</span>
            </div>
            <p className="text-xs text-slate-500">
              Date: {activeReport.dateOfSchedule || activeReport.weeklyDateRange || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* History / Recent Processed Logs */}
      {historyReports.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recent Trip Analyses</h3>
            <span className="text-xs text-slate-500">{historyReports.length} reports in active session</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historyReports.map((report) => (
              <div
                key={report.id}
                onClick={() => {
                  onSelectReport(report);
                  onNavigateToSheet();
                }}
                className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                  activeReport?.id === report.id
                    ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{report.fileName}</span>
                      {activeReport?.id === report.id && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded shrink-0">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 space-x-2 sm:space-x-3 flex-wrap">
                      <span>Tech: {report.technician}</span>
                      <span>•</span>
                      <span>Project #{report.jobs[0]?.projectNumber || '26-240026'}</span>
                      <span>•</span>
                      <span>{report.dateOfSchedule}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectReport(report); onNavigateToSheet(); }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-2xs shrink-0 cursor-pointer"
                    title="Add this report to Trip Record Sheet"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Sheet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Stored Reports 2-Week History Records Viewer */}
      <HistoryRecordsViewer
        historyReports={historyReports}
        onRefreshHistory={onRefreshHistory}
        onSelectReport={onSelectReport}
        onNavigateToSheet={onNavigateToSheet}
        isAdminAuthenticated={isAdminAuthenticated}
        onRequestAdminLock={onRequestAdminLock}
        onDeleteHistoryRecord={onDeleteHistoryRecord}
        onClearAllHistory={onClearAllHistory}
      />
    </div>
  );
};
