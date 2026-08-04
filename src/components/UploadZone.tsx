import React, { useState, useRef } from 'react';
import { Upload, FileCode2, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight, ShieldCheck, Clock, MapPin, Play, User, Calendar, Camera, Cpu, Layers, RefreshCw, X, Plus, UserPlus, Users, Calculator, Timer, Globe } from 'lucide-react';
import { parseKmlOrKmzFile, createSampleTripReport, calculateWorkWeekRange, formatActualWorkingHoursInput, calculateWeeklyFieldTimeTotal } from '../utils/kmlParser';
import { TripReportData, SettingsConfig } from '../types';
import { getStoredSettings } from '../utils/defaultSettings';
import { getStoredHistoryReports } from '../utils/historyStorage';
import { AddTechnicianModal } from './AddTechnicianModal';
import { RemarksSelector } from './RemarksSelector';
import { SearchableTechnicianSelect } from './SearchableTechnicianSelect';
import { DEFAULT_CHECKED_REMARKS, NO_SCHEDULE_REMARKS, formatRemarksToString } from '../constants/remarks';

interface UploadZoneProps {
  onReportGenerated: (report: TripReportData, mode?: 'replace' | 'add') => void;
  onNavigateToSheet: () => void;
  onNavigateToMap: () => void;
  activeReport: TripReportData | null;
  activeReportsList?: TripReportData[];
  historyReports?: TripReportData[];
  onRemoveReportFromList?: (index: number) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onReportGenerated,
  onNavigateToSheet,
  onNavigateToMap,
  activeReport,
  activeReportsList = [],
  historyReports,
  onRemoveReportFromList
}) => {
  const settings: SettingsConfig = getStoredSettings();

  // Staging & Processing State
  const [stagedFile, setStagedFile] = useState<{ file?: File; name: string; sizeFormatted: string; isSample: boolean; isMultiProjectSample?: boolean } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-Extraction Parameters (User controls before extraction)
  const todayIso = new Date().toISOString().split('T')[0];
  const [dateOfSchedule, setDateOfSchedule] = useState<string>(todayIso);
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>(settings.regions[0] || settings.technicians[0]?.defaultRegion || 'South Central');
  const [selectedPlate, setSelectedPlate] = useState<string>('');
  
  // Equipment inputs (Cameras & Machines)
  const [camerasCount, setCamerasCount] = useState<string>('');
  const [machinesCount, setMachinesCount] = useState<string>('');
  const [equipmentString, setEquipmentString] = useState<string>('');

  // Actual Working Hours inputs (Hour/s and Minute/s)
  const [actualHoursInput, setActualHoursInput] = useState<string>('');
  const [actualMinutesInput, setActualMinutesInput] = useState<string>('');

  // Running Total Tsheets inputs (Hour/s and Minute/s)
  const [runningTsheetsHoursInput, setRunningTsheetsHoursInput] = useState<string>('');
  const [runningTsheetsMinutesInput, setRunningTsheetsMinutesInput] = useState<string>('');

  // Selected Remarks Checklist State (Default checked items preset)
  const [selectedRemarks, setSelectedRemarks] = useState<string[]>(() => [...DEFAULT_CHECKED_REMARKS]);

  // Work Week Customization State (Toggle disabled by default -> system auto-detects)
  const [isCustomWorkWeek, setIsCustomWorkWeek] = useState<boolean>(false);
  const [customWeekDate, setCustomWeekDate] = useState<string>(todayIso);

  // Single Project Only distance calculation toggle
  const [isSingleProject, setIsSingleProject] = useState<boolean>(false);

  // No Schedule mode toggle
  const [isNoSchedule, setIsNoSchedule] = useState<boolean>(false);

  // LADOT Exclusive toggle
  const [isLadotExclusive, setIsLadotExclusive] = useState<boolean>(false);

  // Toggle No Schedule handler
  const handleNoScheduleToggle = () => {
    const nextState = !isNoSchedule;
    setIsNoSchedule(nextState);
    if (nextState) {
      setCamerasCount('');
      setMachinesCount('');
      setEquipmentString('NO DATA');
      setSelectedRemarks([...NO_SCHEDULE_REMARKS]);
    } else {
      setSelectedRemarks([...DEFAULT_CHECKED_REMARKS]);
      setCamerasCount('31');
      setMachinesCount('5');
      setEquipmentString('31C/5M');
    }
  };

  // Computed Work Week Range for preview
  const previewWorkWeek = calculateWorkWeekRange(dateOfSchedule);
  const customWorkWeekRange = calculateWorkWeekRange(customWeekDate);
  const effectiveWorkWeek = isCustomWorkWeek && customWeekDate ? customWorkWeekRange : previewWorkWeek;

  // Auto-clear pre-extraction parameter inputs EXCEPT Date of Schedule and Region
  const clearPreExtractionInputs = () => {
    // Reset technician selection (clear)
    setSelectedTech('');
    setSelectedPlate('');

    // Clear Equipment inputs
    setCamerasCount('');
    setMachinesCount('');
    setEquipmentString('');

    // Clear Actual Working Hours
    setActualHoursInput('');
    setActualMinutesInput('');

    // Clear Running Total Tsheets
    setRunningTsheetsHoursInput('');
    setRunningTsheetsMinutesInput('');

    // Reset Single Project & No Schedule options
    setIsSingleProject(false);
    setIsNoSchedule(false);

    // Reset Selected Remarks to DEFAULT_CHECKED_REMARKS
    setSelectedRemarks([...DEFAULT_CHECKED_REMARKS]);

    // Reset Custom Work Week toggle & input
    setIsCustomWorkWeek(false);
    setCustomWeekDate(dateOfSchedule);

    // Note: dateOfSchedule and selectedRegion are kept intact!
  };

  // Handle Technician selection
  const handleTechChange = (techName: string) => {
    setSelectedTech(techName);
    const foundTech = settings.technicians.find(t => t.name === techName);
    if (foundTech) {
      if (foundTech.defaultRegion) setSelectedRegion(foundTech.defaultRegion);
      setSelectedPlate(foundTech.defaultLicensePlate || '');
    } else {
      setSelectedPlate('');
    }
  };

  // Handle Camera/Machine count change
  const handleCameraChange = (val: string) => {
    setCamerasCount(val);
    const formatted = `${val || '0'}C/${machinesCount || '0'}M`;
    setEquipmentString(formatted);
  };

  const handleMachineChange = (val: string) => {
    setMachinesCount(val);
    const formatted = `${camerasCount || '0'}C/${val || '0'}M`;
    setEquipmentString(formatted);
  };

  // Stage user file without processing automatically
  const stageFile = (file: File) => {
    setError(null);
    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeFormatted = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;
    
    setStagedFile({
      file,
      name: file.name,
      sizeFormatted,
      isSample: false
    });
  };

  // Stage sample KMZ without processing automatically
  const handleStageSample = (isMulti: boolean = false) => {
    setError(null);
    setStagedFile({
      name: isMulti
        ? 'Finished_Trip_Analysis_Samsara_MultiProject_2026-07-20.kmz'
        : 'Finished_Trip_Analysis_Samsara_2026-07-20.kmz',
      sizeFormatted: isMulti ? '512.8 KB' : '418.2 KB',
      isSample: true,
      isMultiProjectSample: isMulti
    });
  };

  // File Drop & Selection Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.kmz') || file.name.toLowerCase().endsWith('.kml')) {
        stageFile(file);
      } else {
        setError('Please upload a valid .KMZ or .KML file.');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFile(e.target.files[0]);
    }
  };

  // Execute Extraction when user clicks "Process" button
  const handleExecuteExtraction = async (mode: 'replace' | 'add' = 'replace') => {
    if (!stagedFile) {
      setError('Please upload or stage a KMZ/KML file first.');
      return;
    }

    setError(null);
    setLoading(true);
    setStatusMessage('Initializing KMZ log parser...');

    const effectiveEquipments = isNoSchedule
      ? 'NO DATA'
      : (equipmentString || (camerasCount && machinesCount ? `${camerasCount}C/${machinesCount}M` : '31C/5M'));

    const options = {
      technician: selectedTech,
      region: selectedRegion,
      dateOfSchedule: dateOfSchedule,
      totalEquipments: effectiveEquipments,
      licensePlate: selectedPlate,
      issuesAnomaliesRemarks: formatRemarksToString(selectedRemarks),
      actualDailyWorkingHours: formatActualWorkingHoursInput(actualHoursInput, actualMinutesInput),
      runningTotalFieldTimeCal: '',
      runningTotalTsheets: formatActualWorkingHoursInput(runningTsheetsHoursInput, runningTsheetsMinutesInput),
      weeklyDateRange: effectiveWorkWeek,
      isSingleProject,
      isNoSchedule,
      isLadotExclusive,
      isMultiProjectSample: stagedFile.isMultiProjectSample
    };

    try {
      await new Promise(res => setTimeout(res, 300));
      setStatusMessage('Unzipping archive & parsing KML document...');
      await new Promise(res => setTimeout(res, 400));
      setStatusMessage('Extracting Samsara timestamps, project numbers & job labels...');

      let report: TripReportData;
      if (stagedFile.isSample || !stagedFile.file) {
        report = createSampleTripReport(options);
      } else {
        const result = await parseKmlOrKmzFile(stagedFile.file, options);
        report = result.report;
      }

      // Automatically compute weekly Running Total - Field Time Cal if user left it blank
      if (!options.runningTotalFieldTimeCal) {
        const historyList = historyReports !== undefined ? historyReports : getStoredHistoryReports();
        const allKnownReports = [...historyList, ...activeReportsList];
        report.runningTotalFieldTimeCal = calculateWeeklyFieldTimeTotal(
          report.technician,
          report.weeklyDateRange,
          allKnownReports,
          report.id,
          report.predictedDailyWorkingHours
        );
      }

      setStatusMessage('Encoding Trip Analysis report template...');
      await new Promise(res => setTimeout(res, 300));

      onReportGenerated(report, mode);
      setLoading(false);
      setStatusMessage('');
      setStagedFile(null);

      // Auto-clear pre-extraction inputs except Date of Schedule and Region
      clearPreExtractionInputs();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse KMZ file. Please ensure it is a valid Samsara/KML log.');
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Technician Modal */}
      <AddTechnicianModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddReport={(newReport) => {
          onReportGenerated(newReport, 'add');
          onNavigateToSheet();
        }}
        existingTechniciansCount={activeReportsList.length}
      />

      {/* Loaded Technicians Banner if multiple exist */}
      {activeReportsList.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-slate-950 font-black rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {activeReportsList.length} Technician {activeReportsList.length === 1 ? 'Report' : 'Reports'} Loaded in Active Sheet
                </span>
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full uppercase">
                  Stacked
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Technicians: {activeReportsList.map(r => r.technician).join(', ')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Another Technician</span>
            </button>
            <button
              onClick={onNavigateToSheet}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shrink-0"
            >
              <span>View Stacked Sheets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Pre-Extraction Form Card (ABOVE Upload UI) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pre-Extraction Parameters</h3>
              <p className="text-xs text-slate-500">
                Configure technician, schedule date, and assigned equipment before processing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-700" />
              <span>Add Another Technician</span>
            </button>
            <span className="hidden sm:inline text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              Required Form Inputs
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          {/* Date of Schedule Picker & Work Week Customization Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Date of Schedule</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer text-[10px] text-amber-700 font-semibold hover:text-amber-800">
                <input
                  type="checkbox"
                  checked={isCustomWorkWeek}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsCustomWorkWeek(checked);
                    if (checked && !customWeekDate) {
                      setCustomWeekDate(dateOfSchedule);
                    }
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3 h-3"
                />
                <span>Custom Week</span>
              </label>
            </div>
            <input
              type="date"
              value={dateOfSchedule}
              onChange={(e) => setDateOfSchedule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
            {!isCustomWorkWeek ? (
              <span className="text-[10px] text-slate-500 block truncate">
                Work Week (Auto): <strong className="text-slate-700">{previewWorkWeek}</strong>
              </span>
            ) : (
              <div className="space-y-1">
                <input
                  type="date"
                  value={customWeekDate}
                  onChange={(e) => setCustomWeekDate(e.target.value)}
                  className="w-full px-2 py-1 bg-amber-50/80 border border-amber-300 rounded text-xs font-semibold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-amber-800 font-bold block truncate">
                  Week: <strong>{customWorkWeekRange}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Technician Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Technician Name</span>
            </label>
            <SearchableTechnicianSelect
              technicians={settings.technicians}
              value={selectedTech}
              onChange={(techName) => handleTechChange(techName)}
              placeholder="-- Search or Select Tech --"
            />
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Region</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            >
              {settings.regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Cameras & Machines Assigned */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>Assigned Equipments</span>
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="text"
                  disabled={isNoSchedule}
                  value={isNoSchedule ? '' : camerasCount}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  placeholder={isNoSchedule ? '—' : '31'}
                  className={`w-12 px-2 py-2 border rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isNoSchedule
                      ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <span className="font-bold text-slate-500">C</span>
              </div>
              <span className="text-slate-400 font-bold">/</span>
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="text"
                  disabled={isNoSchedule}
                  value={isNoSchedule ? '' : machinesCount}
                  onChange={(e) => handleMachineChange(e.target.value)}
                  placeholder={isNoSchedule ? '—' : '5'}
                  className={`w-12 px-2 py-2 border rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isNoSchedule
                      ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <span className="font-bold text-slate-500">M</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              Format: <strong className="text-slate-800">{isNoSchedule ? 'NO DATA' : (equipmentString || '31C/5M')}</strong>
            </span>
          </div>

          {/* Actual Working Hours */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Actual Working Hours</span>
            </label>
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={actualHoursInput}
                  onChange={(e) => setActualHoursInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-500 text-[10px]">hr/s</span>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={actualMinutesInput}
                  onChange={(e) => setActualMinutesInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-500 text-[10px]">min/s</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              Report output: <strong className="text-slate-800">{formatActualWorkingHoursInput(actualHoursInput, actualMinutesInput) || '(Blank / Default)'}</strong>
            </span>
          </div>

          {/* Running Total - Tsheets */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-600" />
              <span>Running Total - Tsheets</span>
            </label>
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="number"
                  min="0"
                  value={runningTsheetsHoursInput}
                  onChange={(e) => setRunningTsheetsHoursInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-500 text-[10px]">hr/s</span>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={runningTsheetsMinutesInput}
                  onChange={(e) => setRunningTsheetsMinutesInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-500 text-[10px]">min/s</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              Report output: <strong className="text-slate-800">{formatActualWorkingHoursInput(runningTsheetsHoursInput, runningTsheetsMinutesInput) || '(Default 11 hr/s 0 min)'}</strong>
            </span>
          </div>

          {/* Pre-Extraction Toggles: SINGLE PROJECT ONLY, NO SCHEDULE & LADOT EXCLUSIVE */}
          <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* SINGLE PROJECT ONLY Toggle Bar */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setIsSingleProject(!isSingleProject)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                  isSingleProject
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                    : 'bg-amber-50/60 border-amber-300 hover:border-amber-400 text-amber-950'
                }`}
              >
                <span className={`font-bold text-xs ${isSingleProject ? 'text-slate-950' : 'text-amber-900'} truncate`}>
                  SINGLE PROJECT ONLY
                </span>
                <div
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                    isSingleProject ? 'bg-slate-950/80' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                      isSingleProject ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
              <p className="text-[10px] text-amber-800/80 mt-1 font-medium leading-tight">
                Note: Use this for Related Projects. Do not use for any Single Big Projects e.g. LADOT, PENNDOT, NYS etc.
              </p>
            </div>

            {/* NO SCHEDULE Toggle Bar */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={handleNoScheduleToggle}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                  isNoSchedule
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                    : 'bg-amber-50/60 border-amber-300 hover:border-amber-400 text-amber-950'
                }`}
              >
                <span className={`font-bold text-xs ${isNoSchedule ? 'text-slate-950' : 'text-amber-900'} truncate`}>
                  NO SCHEDULE
                </span>
                <div
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                    isNoSchedule ? 'bg-slate-950/80' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                      isNoSchedule ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
              <p className="text-[10px] text-amber-800/80 mt-1 font-medium leading-tight">
                Clears shift/job times & project numbers; blocks machine input & sets No Schedule remarks.
              </p>
            </div>

            {/* LADOT EXCLUSIVE Toggle Bar */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setIsLadotExclusive(!isLadotExclusive)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                  isLadotExclusive
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                    : 'bg-amber-50/60 border-amber-300 hover:border-amber-400 text-amber-950'
                }`}
              >
                <span className={`font-bold text-xs ${isLadotExclusive ? 'text-slate-950' : 'text-amber-900'} truncate`}>
                  LADOT EXCLUSIVE
                </span>
                <div
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                    isLadotExclusive ? 'bg-slate-950/80' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                      isLadotExclusive ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
              <p className="text-[10px] text-amber-800/80 mt-1 font-medium leading-tight">
                Sets Predicted Daily Hours to 0 hours and 0 mins so it is excluded from history totals.
              </p>
            </div>
          </div>
        </div>

        {/* Remarks / Notes Options Checkboxes */}
        <div className="pt-2 border-t border-slate-100">
          <RemarksSelector
            selectedRemarks={selectedRemarks}
            onChange={setSelectedRemarks}
            title="Pre-Extraction Remarks / Notes Options"
            description="Checked remarks will be automatically encoded into the Issues/Anomalies/Remarks section"
          />
        </div>
      </div>

      {/* 2. File Upload / Staging Dropzone */}
      <div className="space-y-3">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
              : stagedFile
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-300 hover:border-amber-500 hover:bg-slate-50 bg-white shadow-sm'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".kmz,.kml"
            className="hidden"
          />

          {!stagedFile ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
                <Upload className="w-7 h-7" />
              </div>

              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Select or Drag Finished Trip Analysis KMZ / KML File
                </h3>
                <p className="text-xs text-slate-500">
                  File will be staged for processing. Click <strong>Process & Extract</strong> below when ready.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-400">
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">.KMZ File</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleStageSample(false); }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Stage Standard Demo</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleStageSample(true); }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-xs transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Stage Multi-Project Demo (3 Projects)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                  <FileCode2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">{stagedFile.name}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded border border-amber-300 uppercase tracking-wider">
                      Staged for {selectedTech}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Size: {stagedFile.sizeFormatted} • {stagedFile.isSample ? 'Demo Log' : 'Uploaded File'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setStagedFile(null); }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove File"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Process Control Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-md">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Extract & Encode Trip Analysis</span>
            </h4>
            <p className="text-xs text-slate-400">
              {stagedFile
                ? `Staged file "${stagedFile.name}" for ${selectedTech}`
                : 'Select or drag a KMZ/KML file above, or click "+ Add Another Technician"'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Action 1: Replace or Primary */}
            <button
              type="button"
              disabled={!stagedFile || loading}
              onClick={() => handleExecuteExtraction('replace')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all ${
                !stagedFile || loading
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Process Primary Report</span>
                </>
              )}
            </button>

            {/* Action 2: Add as Additional Technician */}
            <button
              type="button"
              disabled={!stagedFile || loading}
              onClick={() => handleExecuteExtraction('add')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all ${
                !stagedFile || loading
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
              title="Add as another technician sheet below existing reports"
            >
              <Plus className="w-4 h-4" />
              <span>+ Append Technician Sheet</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Processing Log...</span>
              </span>
              <span>{statusMessage}</span>
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
              <div className="bg-amber-600 h-2 rounded-full animate-pulse w-3/4 transition-all duration-300"></div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Parsing Error</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Extracted File Summary Card if activeReport exists */}
      {activeReport && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base text-white">{activeReport.fileName}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded border border-emerald-500/30">
                    Successfully Parsed
                  </span>
                </div>
                <p className="text-xs text-slate-400">Processed at {activeReport.uploadedAt}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onNavigateToSheet}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>View Encoded Form</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateToMap}
                className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm rounded-lg border border-slate-700 transition-all cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>SchezTripNGo App</span>
              </button>
            </div>
          </div>

          {/* Key Extracted Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Technician</span>
              <span className="font-bold text-sm text-amber-300 block">{activeReport.technician}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{activeReport.region} Region</span>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Vehicle License Plate</span>
              <span className="font-bold text-sm text-white block">{activeReport.licensePlate}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Project #{activeReport.jobs[0]?.projectNumber || '26-240026'}</span>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Start & End Shift</span>
              <span className="font-bold text-sm text-emerald-400 block">{activeReport.startShift} - {activeReport.endShift}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Date: {activeReport.dateOfSchedule}</span>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Total Hours (Samsara)</span>
              <span className="font-bold text-sm text-amber-400 block">{activeReport.totalHoursSamsara}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Equipments: {activeReport.jobs[0]?.totalEquipments || '31C/5M'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
