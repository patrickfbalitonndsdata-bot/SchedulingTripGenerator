import React, { useState, useEffect } from 'react';
import { TripReportData, JobRow, SettingsConfig } from '../types';
import { Printer, Download, Copy, Plus, Trash2, Check, RefreshCw, ArrowLeft, ChevronUp, ChevronDown, Layers, User, RotateCcw, AlertTriangle, FileUp, Sparkles, FileSpreadsheet, ListChecks, Clock, Mail, BookOpen } from 'lucide-react';
import { computeWorkingHours, computeShiftTotalHours, calculateWorkWeekRange, detectJobAssignedFromLabel, formatActualWorkingHoursInput, parseActualWorkingHoursString, cleanJobTimeString, computePredictedDailyWorkingHours, parseEquipmentCount, calculateWeeklyFieldTimeTotal, getDayScheduleString, isPenndotRegionOrTech, cleanShiftTimeString } from '../utils/kmlParser';
import { getStoredHistoryReports } from '../utils/historyStorage';
import { RemarksSelector } from './RemarksSelector';
import { ExportOutlookEmailModal } from './ExportOutlookEmailModal';
import { SearchableTechnicianSelect } from './SearchableTechnicianSelect';
import { parseRemarksFromString, formatRemarksToString, getJobStatusFromRemark } from '../constants/remarks';

interface TripAnalysisTemplateProps {
  reportsList: TripReportData[];
  historyReports?: TripReportData[];
  userId?: string;
  onUpdateReportsList: (updatedList: TripReportData[]) => void;
  onClearAllReports?: () => void;
  onAddTechnicianReport: (newReport: TripReportData) => void;
  onRemoveTechnicianReport: (index: number) => void;
  settings: SettingsConfig;
  onBackToDashboard: () => void;
  onLoadSample?: () => void;
  onOpenUserManual?: () => void;
}

export const TripAnalysisTemplate: React.FC<TripAnalysisTemplateProps> = ({
  reportsList,
  historyReports,
  userId,
  onUpdateReportsList,
  onClearAllReports,
  onAddTechnicianReport,
  onRemoveTechnicianReport,
  settings,
  onBackToDashboard,
  onLoadSample,
  onOpenUserManual
}) => {
  const [copied, setCopied] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [openRemarksPanelIdx, setOpenRemarksPanelIdx] = useState<number | null>(null);

  const getKnownHistory = () => {
    if (historyReports && historyReports.length > 0) {
      return historyReports;
    }
    return getStoredHistoryReports(userId);
  };

  // Auto-sync Running Total - Field Time Cal with history storage + active reports calculation
  useEffect(() => {
    if (!reportsList || reportsList.length === 0) return;
    const history = getKnownHistory();
    const allKnown = [...history, ...reportsList];

    let needsUpdate = false;
    const updated = reportsList.map(r => {
      const computedFieldTotal = calculateWeeklyFieldTimeTotal(
        r.technician,
        r.weeklyDateRange,
        allKnown,
        r.id,
        r.predictedDailyWorkingHours,
        r.dateOfSchedule
      );
      const cleanedStart = cleanShiftTimeString(r.startShift);
      const cleanedEnd = cleanShiftTimeString(r.endShift);
      if (r.startShift !== cleanedStart || r.endShift !== cleanedEnd || r.runningTotalFieldTimeCal !== computedFieldTotal) {
        needsUpdate = true;
        return {
          ...r,
          startShift: cleanedStart,
          endShift: cleanedEnd,
          runningTotalFieldTimeCal: computedFieldTotal
        };
      }
      return r;
    });

    if (needsUpdate) {
      onUpdateReportsList(updated);
    }
  }, [reportsList, historyReports, userId]);

  const handleConfirmClear = () => {
    if (onClearAllReports) {
      onClearAllReports();
    } else {
      onUpdateReportsList([]);
    }
    setIsClearModalOpen(false);
  };

  // Field update handler for specific report index in stacked list
  const handleTopLevelChange = (index: number, field: keyof TripReportData, value: any) => {
    const updatedList = [...reportsList];
    const report = { ...updatedList[index], [field]: value };

    if (field === 'issuesAnomaliesRemarks') {
      const statusFromRemark = getJobStatusFromRemark(value);
      if (statusFromRemark && !report.isNoSchedule) {
        report.jobs = report.jobs.map(j => ({ ...j, jobStatus: statusFromRemark }));
      }
    }

    if (field === 'startShift' || field === 'endShift') {
      const newStart = field === 'startShift' ? value : report.startShift;
      const newEnd = field === 'endShift' ? value : report.endShift;
      report.totalHoursSamsara = computeShiftTotalHours(newStart, newEnd);
    }

    if (field === 'region' || field === 'dateOfSchedule' || field === 'technician') {
      const newRegion = field === 'region' ? value : report.region;
      const newTech = field === 'technician' ? value : report.technician;
      const newDate = field === 'dateOfSchedule' ? value : report.dateOfSchedule;

      if (field === 'dateOfSchedule') {
        const computedWeek = calculateWorkWeekRange(value);
        if (computedWeek) {
          report.weeklyDateRange = computedWeek;
        }
      }

      if (isPenndotRegionOrTech(newRegion, newTech, settings.technicians) && !report.isNoSchedule) {
        const penndotProj = getDayScheduleString(newDate);
        report.jobs = report.jobs.map(j => ({ ...j, projectNumber: penndotProj }));
      }
    }

    updatedList[index] = report;
    onUpdateReportsList(updatedList);
  };

  const handleJobChange = (reportIdx: number, jobIdx: number, field: keyof JobRow, value: string) => {
    const updatedList = [...reportsList];
    const report = { ...updatedList[reportIdx] };
    const updatedJobs = [...report.jobs];
    const targetJob = { ...updatedJobs[jobIdx], [field]: value };

    if (field === 'startJobTime' || field === 'endJobTime') {
      const computed = computeWorkingHours(
        field === 'startJobTime' ? value : targetJob.startJobTime,
        field === 'endJobTime' ? value : targetJob.endJobTime
      );
      if (computed !== "0 hour/s 0 minutes" || targetJob.startJobTime === targetJob.endJobTime) {
        targetJob.totalWorkingHours = computed;
      }

      const autoAssigned = detectJobAssignedFromLabel(targetJob.startJobTime + ' ' + targetJob.endJobTime);
      if (autoAssigned) {
        targetJob.jobAssigned = autoAssigned;
      }
    }

    updatedJobs[jobIdx] = targetJob;
    report.jobs = updatedJobs;
    const distanceMiles = report.kmlData?.totalDistanceMiles || 84.5;
    report.predictedDailyWorkingHours = report.isLadotExclusive
      ? '0 hour/s 0 minutes'
      : computePredictedDailyWorkingHours(distanceMiles, updatedJobs);

    updatedList[reportIdx] = report;
    onUpdateReportsList(updatedList);
  };

  const handleAddJobRow = (reportIdx: number) => {
    const updatedList = [...reportsList];
    const report = { ...updatedList[reportIdx] };
    const isPenndot = isPenndotRegionOrTech(report.region, report.technician, settings.technicians);
    const projNum = report.isNoSchedule ? 'NO DATA' : (isPenndot ? getDayScheduleString(report.dateOfSchedule) : '26-240026');
    const start = `01:52 AM (START OF JOB INSTALL ${projNum})`;
    const end = `01:52 AM (END OF JOB INSTALL ${projNum})`;
    const defaultJobStatus = report.isNoSchedule
      ? 'NO DATA'
      : (getJobStatusFromRemark(report.issuesAnomaliesRemarks) || settings.jobStatuses[0] || 'Job Complete');

    const newJob: JobRow = {
      id: `job-${Date.now()}`,
      projectNumber: projNum,
      startJobTime: start,
      endJobTime: end,
      totalEquipments: '31C/5M',
      totalWorkingHours: computeWorkingHours(start, end),
      jobAssigned: detectJobAssignedFromLabel(start),
      jobStatus: defaultJobStatus
    };

    const newJobs = [...report.jobs, newJob];
    report.jobs = newJobs;
    const distanceMiles = report.kmlData?.totalDistanceMiles || 84.5;
    report.predictedDailyWorkingHours = report.isLadotExclusive
      ? '0 hour/s 0 minutes'
      : computePredictedDailyWorkingHours(distanceMiles, newJobs);

    updatedList[reportIdx] = report;
    onUpdateReportsList(updatedList);
  };

  const handleRemoveJobRow = (reportIdx: number, jobIdx: number) => {
    const updatedList = [...reportsList];
    const report = { ...updatedList[reportIdx] };
    if (report.jobs.length <= 1) return;
    const newJobs = report.jobs.filter((_, i) => i !== jobIdx);
    report.jobs = newJobs;
    const distanceMiles = report.kmlData?.totalDistanceMiles || 84.5;
    report.predictedDailyWorkingHours = report.isLadotExclusive
      ? '0 hour/s 0 minutes'
      : computePredictedDailyWorkingHours(distanceMiles, newJobs);

    updatedList[reportIdx] = report;
    onUpdateReportsList(updatedList);
  };

  const handleMoveReport = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === reportsList.length - 1)) return;
    const updatedList = [...reportsList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updatedList[index];
    updatedList[index] = updatedList[targetIdx];
    updatedList[targetIdx] = temp;
    onUpdateReportsList(updatedList);
  };

  const handleGlobalModeChange = (mode: 'MANUAL' | 'AUTOMATED') => {
    const updatedList = reportsList.map(r => ({ ...r, mode }));
    onUpdateReportsList(updatedList);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const lines: string[] = [];

    reportsList.forEach((report, i) => {
      lines.push(`=== TECHNICIAN REPORT #${i + 1}: ${report.technician.toUpperCase()} ===`);
      lines.push(`MODE,${report.mode}`);
      lines.push(`Region,${report.region},Date of Schedule,${report.dateOfSchedule},License Plate,${report.licensePlate}`);
      lines.push(`Technician,${report.technician},Start Shift,${report.startShift},End Shift,${report.endShift},Total Hours (Samsara),${report.totalHoursSamsara}`);
      lines.push(``);
      lines.push(`Project Number,START JOB TIME,END JOB TIME,Total # of Equipments,Total Working Hours,Job Assigned,Job Status`);
      report.jobs.forEach(j => {
        lines.push(`"${j.projectNumber}","${j.startJobTime}","${j.endJobTime}","${j.totalEquipments}","${j.totalWorkingHours}","${j.jobAssigned}","${j.jobStatus}"`);
      });
      lines.push(``);
      lines.push(`Predicted Daily Working Hours (Via Field Time Calculator),${report.predictedDailyWorkingHours}`);
      lines.push(`Actual Daily Working Hours (Via T-Sheets),${report.actualDailyWorkingHours}`);
      lines.push(`Issues/Anomalies/Remarks,"${report.issuesAnomaliesRemarks.replace(/\n/g, ' ')}"`);
      lines.push(`Weekly Date Range,${report.weeklyDateRange}`);
      lines.push(`Running Total - Field Time Cal,${report.runningTotalFieldTimeCal}`);
      lines.push(`Running Total - Tsheets,${report.runningTotalTsheets}`);
      lines.push(``);
      lines.push(`--------------------------------------------------------------------------------`);
      lines.push(``);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const dateStr = reportsList[0]?.dateOfSchedule.replace(/\//g, '-') || 'Report';
    link.setAttribute('download', `Trip_Analysis_MultiTech_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = () => {
    let fullText = `=== TRIP ANALYSIS REPORTS (${reportsList.length} TECHNICIAN/S) ===\n\n`;

    reportsList.forEach((report, i) => {
      fullText += `--- TECHNICIAN #${i + 1}: ${report.technician} (${report.mode}) ---\n`;
      fullText += `Region: ${report.region} | Date: ${report.dateOfSchedule} | License Plate: ${report.licensePlate}\n`;
      fullText += `Shift: ${report.startShift} - ${report.endShift} | Total Samsara Hours: ${report.totalHoursSamsara}\n\n`;
      fullText += `JOBS:\n`;
      report.jobs.forEach(j => {
        fullText += `- Project #${j.projectNumber} | ${j.startJobTime} - ${j.endJobTime} | Equipments: ${j.totalEquipments} | Hours: ${j.totalWorkingHours} | Type: ${j.jobAssigned} | Status: ${j.jobStatus}\n`;
      });
      fullText += `\nPredicted Daily Hours: ${report.predictedDailyWorkingHours}\n`;
      fullText += `Actual Daily Hours: ${report.actualDailyWorkingHours}\n`;
      fullText += `Weekly Range: ${report.weeklyDateRange}\n`;
      fullText += `Running Total (Field Time): ${report.runningTotalFieldTimeCal}\n`;
      fullText += `Running Total (Tsheets): ${report.runningTotalTsheets}\n`;
      fullText += `Remarks:\n${report.issuesAnomaliesRemarks}\n\n`;
      fullText += `--------------------------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(fullText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecalculateWeeklyTotal = (reportIdx: number) => {
    const currentRep = reportsList[reportIdx];
    if (!currentRep) return;

    const allKnown = [...getKnownHistory(), ...reportsList];
    const newWeeklyTotal = calculateWeeklyFieldTimeTotal(
      currentRep.technician,
      currentRep.weeklyDateRange,
      allKnown,
      currentRep.id,
      currentRep.predictedDailyWorkingHours,
      currentRep.dateOfSchedule
    );

    const updated = [...reportsList];
    updated[reportIdx] = {
      ...currentRep,
      runningTotalFieldTimeCal: newWeeklyTotal
    };
    onUpdateReportsList(updated);
  };

  const activeMode = reportsList[0]?.mode || 'AUTOMATED';

  return (
    <div className="space-y-6 pb-20">
      {/* Clear / Refresh Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Clear All Trip Report Sheets?</h3>
                <p className="text-xs text-slate-500">
                  This will remove all currently displayed technician sheets from the view so you can upload or stage new trip reports.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Ready for New Log Uploads:</span>
              </span>
              <p className="text-slate-700">
                After clearing, you can upload fresh Samsara KMZ or KML files from the Dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yes, Clear All Sheets</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Action Bar (Hidden in Print View) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">Trip Analysis Spreadsheet Template</h2>
              <span className="px-2.5 py-0.5 text-xs font-black bg-amber-500 text-slate-950 rounded-md shadow-sm">
                {reportsList.length} Technician {reportsList.length === 1 ? 'Sheet' : 'Sheets Stacked'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Edit fields directly in any technician spreadsheet below</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh / Clear Button */}
          <button
            onClick={() => setIsClearModalOpen(true)}
            disabled={reportsList.length === 0}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm ${
              reportsList.length === 0
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 hover:scale-[1.02]'
            }`}
            title="Clear all displayed sheets for new trip report uploads"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Clear / Refresh Sheet</span>
          </button>

          {/* Static Mode Badge */}
          <div className="flex items-center px-4 py-2 bg-amber-400 border border-amber-500 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider shadow-sm select-none">
            AUTOMATED
          </div>

          <button
            onClick={handleCopyText}
            disabled={reportsList.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Copied All!' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={reportsList.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsEmailModalOpen(true)}
            disabled={reportsList.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            title="Export report as an Outlook .eml email draft"
          >
            <Mail className="w-4 h-4 text-amber-300" />
            <span>Export Outlook (.eml)</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={reportsList.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {reportsList.length === 0 ? (
        /* EMPTY STATE WHEN SHEETS ARE CLEARED */
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm my-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-black text-slate-900">All Trip Report Sheets Cleared</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              The Trip Report Sheet view is currently empty. Upload or stage new Samsara KMZ/KML log files from the Dashboard to generate encoded trip report sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onBackToDashboard}
              className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-105"
            >
              <FileUp className="w-4 h-4" />
              <span>Upload New KMZ / KML File</span>
            </button>

            {onOpenUserManual && (
              <button
                onClick={onOpenUserManual}
                className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>User Manual</span>
              </button>
            )}

            {onLoadSample && (
              <button
                onClick={onLoadSample}
                className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs sm:text-sm rounded-xl transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Load Demo Reports</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* STACKED SPREADSHEETS CONTAINER (Matching second attached photo) */
      <div className="space-y-8 print:space-y-6">
        {reportsList.map((report, reportIdx) => (
          <div key={report.id || `report-${reportIdx}`} className="space-y-2 page-break-inside-avoid print:mb-8">
            
            {/* Technician Section Banner (Non-print Header with Sheet Controls) */}
            <div className="print:hidden flex items-center justify-between px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                  {reportIdx + 1}
                </div>
                <span className="text-amber-300 font-extrabold text-sm sm:text-base">
                  Technician: {report.technician}
                </span>
                <span className="text-slate-400 font-normal">
                  • Date: {report.dateOfSchedule} • Plate: {report.licensePlate} • Region: {report.region}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                {/* Reorder Buttons */}
                {reportsList.length > 1 && (
                  <>
                    <button
                      onClick={() => handleMoveReport(reportIdx, 'up')}
                      disabled={reportIdx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                      title="Move Sheet Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveReport(reportIdx, 'down')}
                      disabled={reportIdx === reportsList.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                      title="Move Sheet Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Remove Technician Sheet */}
                {reportsList.length > 1 && (
                  <button
                    onClick={() => onRemoveTechnicianReport(reportIdx)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-colors ml-2"
                    title="Remove Technician Sheet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* SPREADSHEET FORM CARD (Standard Yellow Theme Layout) */}
            <div className="bg-white border-2 border-slate-900 rounded-lg shadow-xl overflow-hidden font-sans text-slate-900 max-w-6xl mx-auto print:border-2 print:border-slate-900 print:shadow-none print:m-0 print:p-0">
              
              {/* Yellow Header Banner: Title MANUAL / AUTOMATED */}
              <div className="bg-[#fde047] border-b-2 border-slate-900 py-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-950">
                <div className="text-center sm:text-left">
                  <span className="font-black tracking-widest text-xl sm:text-2xl uppercase select-none">
                    {report.mode}
                  </span>
                </div>
                
                {/* Samsara Log Scanner Indicator Badge */}
                <div className="print:hidden flex items-center space-x-1.5 px-3 py-1 bg-slate-900 text-amber-300 rounded-full text-xs font-semibold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Samsara Log Processed for {report.technician}</span>
                </div>
              </div>

              {/* TOP SECTION GRID */}
              <div className="grid grid-cols-1 md:grid-cols-12 text-xs sm:text-sm font-semibold border-b-2 border-slate-900 bg-[#fefce8]">
                
                {/* Left Block: Region, Date, Tech */}
                <div className="md:col-span-8 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 p-0">
                  {/* Region Row */}
                  <div className="grid grid-cols-12 border-b border-slate-900 py-1.5 px-3 items-center">
                    <span className="col-span-4 font-extrabold text-slate-950 text-right pr-4">Region:</span>
                    <div className="col-span-8">
                      <select
                        value={report.region}
                        onChange={(e) => handleTopLevelChange(reportIdx, 'region', e.target.value)}
                        className="w-full bg-transparent font-medium text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5 cursor-pointer"
                      >
                        {settings.regions.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date of Schedule Row */}
                  <div className="grid grid-cols-12 border-b border-slate-900 py-1.5 px-3 items-center">
                    <span className="col-span-4 font-extrabold text-slate-950 text-right pr-4">Date of Schedule</span>
                    <div className="col-span-8 text-center">
                      <input
                        type="text"
                        value={report.dateOfSchedule}
                        onChange={(e) => handleTopLevelChange(reportIdx, 'dateOfSchedule', e.target.value)}
                        className="w-full bg-transparent text-center font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5"
                      />
                    </div>
                  </div>

                  {/* Technician & License Plate Row */}
                  <div className="grid grid-cols-12 border-b border-slate-900 py-1.5 px-3 items-center">
                    <span className="col-span-4 font-extrabold text-slate-950 text-right pr-4">Technician:</span>
                    <div className="col-span-4">
                      <SearchableTechnicianSelect
                        technicians={settings.technicians}
                        value={report.technician}
                        onChange={(selectedName) => {
                          const foundTech = settings.technicians.find(t => t.name === selectedName);
                          if (foundTech) {
                            const updatedList = [...reportsList];
                            const newRegion = foundTech.defaultRegion || report.region;
                            let newJobs = report.jobs;
                            if (isPenndotRegionOrTech(newRegion, foundTech.name, settings.technicians) && !report.isNoSchedule) {
                              const penndotProj = getDayScheduleString(report.dateOfSchedule);
                              newJobs = newJobs.map(j => ({ ...j, projectNumber: penndotProj }));
                            }
                            updatedList[reportIdx] = {
                              ...report,
                              technician: foundTech.name,
                              region: newRegion,
                              licensePlate: foundTech.defaultLicensePlate || report.licensePlate,
                              jobs: newJobs
                            };
                            onUpdateReportsList(updatedList);
                          } else {
                            handleTopLevelChange(reportIdx, 'technician', selectedName);
                          }
                        }}
                        placeholder="Search technician..."
                        className="bg-transparent text-center font-medium border-0 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* License Plate aligned inside middle */}
                    <span className="col-span-2 font-extrabold text-slate-950 text-right pr-2">License plate</span>
                    <div className="col-span-2 text-center">
                      <input
                        type="text"
                        value={report.licensePlate}
                        onChange={(e) => handleTopLevelChange(reportIdx, 'licensePlate', e.target.value)}
                        className="w-full bg-transparent text-center font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5"
                      />
                    </div>
                  </div>

                  {/* Actual Working Hours Row (Input box for user lined together with Date, Tech, Region, License Plate) */}
                  <div className="grid grid-cols-12 py-1.5 px-3 items-center bg-[#fef08a]/40 print:hidden">
                    <span className="col-span-4 font-extrabold text-slate-950 text-right pr-4 flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 inline" />
                      <span>Actual Working Hours:</span>
                    </span>
                    <div className="col-span-8 flex items-center justify-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={parseActualWorkingHoursString(report.actualDailyWorkingHours).hours}
                          onChange={(e) => {
                            const currentMins = parseActualWorkingHoursString(report.actualDailyWorkingHours).minutes;
                            const formatted = formatActualWorkingHoursInput(e.target.value, currentMins);
                            handleTopLevelChange(reportIdx, 'actualDailyWorkingHours', formatted);
                          }}
                          placeholder="0"
                          className="w-12 text-center bg-white border border-slate-300 rounded py-0.5 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="font-semibold text-slate-700 text-xs">hr/s</span>
                      </div>
                      <span className="font-bold text-slate-500">:</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={parseActualWorkingHoursString(report.actualDailyWorkingHours).minutes}
                          onChange={(e) => {
                            const currentHrs = parseActualWorkingHoursString(report.actualDailyWorkingHours).hours;
                            const formatted = formatActualWorkingHoursInput(currentHrs, e.target.value);
                            handleTopLevelChange(reportIdx, 'actualDailyWorkingHours', formatted);
                          }}
                          placeholder="0"
                          className="w-12 text-center bg-white border border-slate-300 rounded py-0.5 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="font-semibold text-slate-700 text-xs">min/s</span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-medium ml-2 truncate">
                        Output: <strong className="text-slate-950">{report.actualDailyWorkingHours || '(Blank / Not Displayed)'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Block: Start Shift, End Shift, Total Hours */}
                <div className="md:col-span-4 p-0 font-bold">
                  <div className="grid grid-cols-12 border-b border-slate-900 py-1.5 px-3 items-center">
                    <span className="col-span-5 text-slate-950 text-center">Start Shift</span>
                    <div className="col-span-7 flex flex-col items-center">
                      <input
                        type="text"
                        value={report.startShift}
                        onChange={(e) => handleTopLevelChange(reportIdx, 'startShift', e.target.value)}
                        className="w-full bg-transparent text-center font-semibold text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5"
                        placeholder="06:30 AM"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 border-b border-slate-900 py-1.5 px-3 items-center">
                    <span className="col-span-5 text-slate-950 text-center">End Shift</span>
                    <div className="col-span-7 flex flex-col items-center">
                      <input
                        type="text"
                        value={report.endShift}
                        onChange={(e) => handleTopLevelChange(reportIdx, 'endShift', e.target.value)}
                        className="w-full bg-transparent text-center font-semibold text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5"
                        placeholder="07:00 PM"
                      />
                    </div>
                  </div>

                  <div className="py-2 px-3 text-center bg-[#fef08a] border-slate-900">
                    <span className="block font-extrabold text-xs text-slate-900 italic">Total Hours</span>
                    <span className="block font-medium text-xs text-slate-700 italic">(Via Samsara)</span>
                    <input
                      type="text"
                      value={report.totalHoursSamsara}
                      onChange={(e) => handleTopLevelChange(reportIdx, 'totalHoursSamsara', e.target.value)}
                      className="w-full bg-transparent text-center font-bold text-sm text-slate-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* MIDDLE SECTION: JOBS TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-900 text-slate-950 font-extrabold text-center">
                      <th className="border-r-2 border-slate-900 py-2.5 px-2 w-[18%]">Project Number</th>
                      <th className="border-r-2 border-slate-900 py-2.5 px-2 w-[18%]">START JOB TIME</th>
                      <th className="border-r-2 border-slate-900 py-2.5 px-2 w-[18%]">END JOB TIME</th>
                      <th className="border-r-2 border-slate-900 py-2.5 px-2 w-[15%]">Total # of Equipments</th>
                      <th className="border-r-2 border-slate-900 py-2.5 px-2 w-[15%]">Total Working Hours</th>
                      <th className="py-2.5 px-2 w-[16%]">Job Assigned / Status</th>
                      <th className="print:hidden w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.jobs.map((job, jobIdx) => (
                      <tr key={job.id || `job-${jobIdx}`} className="border-b-2 border-slate-900 min-h-[140px]">
                        <td className="border-r-2 border-slate-900 p-2 align-top text-center font-bold">
                          <input
                            type="text"
                            value={job.projectNumber}
                            onChange={(e) => handleJobChange(reportIdx, jobIdx, 'projectNumber', e.target.value)}
                            className="w-full text-center bg-transparent focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-1"
                          />
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 align-top text-center font-medium">
                          <input
                            type="text"
                            value={cleanJobTimeString(job.startJobTime)}
                            onChange={(e) => handleJobChange(reportIdx, jobIdx, 'startJobTime', cleanJobTimeString(e.target.value))}
                            className="w-full text-center bg-transparent font-medium text-xs sm:text-sm focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-1"
                            placeholder="8:24 AM"
                          />
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 align-top text-center font-medium">
                          <input
                            type="text"
                            value={cleanJobTimeString(job.endJobTime)}
                            onChange={(e) => handleJobChange(reportIdx, jobIdx, 'endJobTime', cleanJobTimeString(e.target.value))}
                            className="w-full text-center bg-transparent font-medium text-xs sm:text-sm focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-1"
                            placeholder="7:37 PM"
                          />
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 align-top text-center font-bold">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5 print:hidden">
                              Custom Equipment
                            </span>
                            <input
                              type="text"
                              value={job.totalEquipments}
                              onChange={(e) => handleJobChange(reportIdx, jobIdx, 'totalEquipments', e.target.value)}
                              placeholder="e.g. 31C/5M"
                              className="w-full text-center bg-amber-50/70 border border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-1 font-bold text-xs sm:text-sm text-slate-900 shadow-inner"
                            />
                          </div>
                        </td>
                        <td className="border-r-2 border-slate-900 p-2 align-top text-center font-semibold">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] text-amber-900/80 font-bold uppercase tracking-wider mb-0.5 print:hidden">
                              Computed Hours
                            </span>
                            <div className="w-full text-center bg-amber-100/70 border border-amber-300/80 rounded py-1.5 font-extrabold text-xs sm:text-sm text-slate-950">
                              {computeWorkingHours(job.startJobTime, job.endJobTime) || job.totalWorkingHours || '0 hour/s 0 minutes'}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 align-top text-center space-y-2">
                          {/* Job Assigned Dropdown */}
                          <div className="relative">
                            <select
                              value={job.jobAssigned}
                              onChange={(e) => handleJobChange(reportIdx, jobIdx, 'jobAssigned', e.target.value)}
                              className="w-full text-center font-semibold bg-white border border-slate-300 rounded py-1 px-2 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer text-xs"
                            >
                              {settings.jobTypes.map(jt => (
                                <option key={jt} value={jt}>{jt}</option>
                              ))}
                            </select>
                          </div>

                          {/* Job Status Dropdown */}
                          <div className="relative">
                            <select
                              value={job.jobStatus}
                              onChange={(e) => handleJobChange(reportIdx, jobIdx, 'jobStatus', e.target.value)}
                              className={`w-full text-center font-bold border rounded py-1 px-2 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer text-xs ${
                                job.jobStatus === 'Job Complete'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : job.jobStatus === 'Incomplete'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : job.jobStatus === 'NO DATA'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-rose-50 text-rose-900 border-rose-300'
                              }`}
                            >
                              {!settings.jobStatuses.includes(job.jobStatus) && job.jobStatus && (
                                <option value={job.jobStatus}>{job.jobStatus}</option>
                              )}
                              {settings.jobStatuses.map(js => (
                                <option key={js} value={js}>{js}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td className="print:hidden p-2 align-middle text-center">
                          {report.jobs.length > 1 && (
                            <button
                              onClick={() => handleRemoveJobRow(reportIdx, jobIdx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Remove Job Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Row Button (Print Hidden) */}
              <div className="print:hidden p-2 bg-slate-50 border-b-2 border-slate-900 flex justify-end">
                <button
                  onClick={() => handleAddJobRow(reportIdx)}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded border border-amber-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Additional Job Row</span>
                </button>
              </div>

              {/* BOTTOM SECTION GRID (Yellow Theme matching screenshot) */}
              <div className="grid grid-cols-1 md:grid-cols-12 bg-[#fefce8] text-xs sm:text-sm">
                
                {/* Left Block: Predicted Daily Working Hours + Issues/Remarks */}
                <div className="md:col-span-8 border-b-2 md:border-b-0 md:border-r-2 border-slate-900">
                  {/* Predicted Daily Working Hours Header */}
                  <div className="bg-[#fef08a] border-b border-slate-900 py-2 px-3 text-center font-extrabold text-slate-950">
                    <div>Predicted Daily Working Hours</div>
                    <div className="font-normal text-xs italic text-slate-700">(Via Field Time Calculator)</div>
                  </div>

                  {/* Predicted Value & Formula Breakdown */}
                  <div className="border-b-2 border-slate-900 py-2 px-3 text-center font-bold text-slate-950 bg-white">
                    <input
                      type="text"
                      value={report.predictedDailyWorkingHours}
                      onChange={(e) => handleTopLevelChange(reportIdx, 'predictedDailyWorkingHours', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5 font-extrabold text-sm sm:text-base text-slate-950"
                    />
                    {(() => {
                      const dist = report.kmlData?.totalDistanceMiles || 84.5;
                      const travelMins = Math.round((dist / 40) * 60);
                      const travelHrs = (travelMins / 60).toFixed(1);
                      let totalUnits = 0;
                      report.jobs.forEach(j => {
                        totalUnits += parseEquipmentCount(j.totalEquipments);
                      });
                      return (
                        <div className="text-[10px] font-semibold text-slate-500 mt-0.5 print:hidden">
                          Formula: {report.isSingleProject ? 'Start Pin to Farthest Pin Roundtrip Distance' : 'Route Distance'} ({dist} mi ~{travelHrs}h travel) + Equipment ({totalUnits} units @ 15m standard / 10m teardown)
                        </div>
                      );
                    })()}
                  </div>

                  {/* Issues/Anomalies/Remarks Header */}
                  <div className="border-b border-slate-900 py-1.5 px-3 font-extrabold text-slate-950 flex items-center justify-between bg-[#fef08a]">
                    <span className="flex-1 text-center">Issues/Anomalies/Remarks:</span>
                    <button
                      type="button"
                      onClick={() => setOpenRemarksPanelIdx(openRemarksPanelIdx === reportIdx ? null : reportIdx)}
                      className="print:hidden inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded shadow-xs transition-colors"
                      title="Toggle notes checklist selector"
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>{openRemarksPanelIdx === reportIdx ? 'Hide Checklist' : 'Edit Remarks Checklist'}</span>
                    </button>
                  </div>

                  {/* Interactive Checklist Panel when opened */}
                  {openRemarksPanelIdx === reportIdx && (
                    <div className="print:hidden p-3 bg-amber-100/70 border-b border-slate-900">
                      {(() => {
                        const { checkedRemarks, customNotes } = parseRemarksFromString(report.issuesAnomaliesRemarks);
                        return (
                          <RemarksSelector
                            selectedRemarks={checkedRemarks}
                            onChange={(updatedChecked) => {
                              const newFormatted = formatRemarksToString(updatedChecked, customNotes);
                              handleTopLevelChange(reportIdx, 'issuesAnomaliesRemarks', newFormatted);
                            }}
                            compact={true}
                            title="Select Report Notes / Remarks"
                            description="Toggling checkboxes will update the Issues/Anomalies/Remarks below"
                          />
                        );
                      })()}
                    </div>
                  )}

                  {/* Textarea for Remarks */}
                  <div className="p-4 text-center bg-[#fefce8]">
                    <textarea
                      rows={4}
                      value={report.issuesAnomaliesRemarks}
                      onChange={(e) => handleTopLevelChange(reportIdx, 'issuesAnomaliesRemarks', e.target.value)}
                      className="w-full bg-transparent text-center font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded p-2 resize-y"
                    />
                  </div>
                </div>

                {/* Right Block: Actual Daily Working Hours + Weekly Totals */}
                <div className="md:col-span-4 flex flex-col justify-between">
                  {/* Actual Daily Working Hours Header */}
                  <div className="bg-[#fef08a] border-b border-slate-900 py-2 px-3 text-center font-extrabold text-slate-950">
                    <div>Actual Daily Working Hours</div>
                    <div className="font-normal text-xs italic text-slate-700">(Via - T Sheets)</div>
                  </div>

                  {/* Actual Value */}
                  <div className="border-b-2 border-slate-900 py-2 px-3 text-center font-bold text-slate-950 bg-white">
                    <input
                      type="text"
                      value={report.actualDailyWorkingHours}
                      onChange={(e) => handleTopLevelChange(reportIdx, 'actualDailyWorkingHours', e.target.value)}
                      placeholder="e.g. 5 hour/s 0 minutes"
                      className="w-full text-center bg-amber-50/40 hover:bg-amber-50 focus:bg-white border border-slate-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 rounded-md py-1.5 px-2 font-black text-sm sm:text-base text-slate-950 transition-all shadow-xs"
                    />
                  </div>

                  {/* Weekly Headers */}
                  <div className="grid grid-cols-2 border-b border-slate-900 bg-[#fef08a] text-center font-extrabold text-[11px] sm:text-xs">
                    <div className="p-2 border-r border-slate-900">
                      Predicted Weekly Working Hours
                    </div>
                    <div className="p-2">
                      Actual Weekly Working Hours
                    </div>
                  </div>

                  {/* Date Range Picker Selector */}
                  <div className="border-b border-slate-900 bg-white py-1.5 px-2 text-center">
                    <input
                      type="text"
                      value={report.weeklyDateRange}
                      onChange={(e) => handleTopLevelChange(reportIdx, 'weeklyDateRange', e.target.value)}
                      className="w-full text-center font-bold text-slate-900 bg-transparent focus:bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
                    />
                  </div>

                  {/* Running Totals Row */}
                  <div className="grid grid-cols-2 border-b border-slate-900 text-center font-extrabold text-[11px] sm:text-xs bg-[#fef08a] text-slate-950">
                    <div className="p-2 border-r border-slate-900 flex items-center justify-center gap-1.5 flex-wrap">
                      <span>Running Total - Field Time Cal</span>
                      <button
                        type="button"
                        onClick={() => handleRecalculateWeeklyTotal(reportIdx)}
                        title="Auto-calculate sum of Predicted Daily Working Hours for this technician across the work week"
                        className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer print:hidden"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Auto-Sum</span>
                      </button>
                    </div>
                    <div className="p-2 flex items-center justify-center">
                      Running Total - Tsheets
                    </div>
                  </div>

                  {/* Running Total Values */}
                  <div className="grid grid-cols-2 text-center font-extrabold text-sm bg-white">
                    <div className="border-r border-slate-900 p-2.5">
                      <input
                        type="text"
                        value={report.runningTotalFieldTimeCal}
                        onChange={(e) => handleTopLevelChange(reportIdx, 'runningTotalFieldTimeCal', e.target.value)}
                        placeholder="e.g. 5 hour/s 0 minutes"
                        className="w-full text-center bg-amber-50/40 hover:bg-amber-50 focus:bg-white border border-slate-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 rounded-md py-1.5 px-2 font-black text-slate-950 transition-all shadow-xs"
                      />
                    </div>
                    <div className="p-2.5">
                      <input
                        type="text"
                        value={report.runningTotalTsheets}
                        onChange={(e) => handleTopLevelChange(reportIdx, 'runningTotalTsheets', e.target.value)}
                        placeholder="e.g. 5 hour/s 0 minutes"
                        className="w-full text-center bg-amber-50/40 hover:bg-amber-50 focus:bg-white border border-slate-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 rounded-md py-1.5 px-2 font-black text-slate-950 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Bottom Action Card when reports exist */}
      {reportsList.length > 0 && (
        <div className="print:hidden max-w-6xl mx-auto border-2 border-dashed border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Manage Technician Sheet Reports</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload or stage a KMZ/KML file in the Dashboard to append an additional technician report, or clear current sheets.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <FileUp className="w-4 h-4" />
              <span>Upload / Append in Dashboard</span>
            </button>
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Clear / Refresh Sheet</span>
            </button>
          </div>
        </div>
      )}

      {/* Export Outlook Email Modal */}
      <ExportOutlookEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        reportsList={reportsList}
      />
    </div>
  );
};
