import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, User, Calendar, MapPin, Camera, FileCode2, Loader2, Plus, AlertCircle, Clock, Calculator, Timer } from 'lucide-react';
import { parseKmlOrKmzFile, createSampleTripReport, calculateWorkWeekRange, formatActualWorkingHoursInput, computePredictedDailyWorkingHours, calculateWeeklyFieldTimeTotal, getDayScheduleString, isPenndotRegionOrTech } from '../utils/kmlParser';
import { TripReportData, SettingsConfig } from '../types';
import { getStoredSettings } from '../utils/defaultSettings';
import { getStoredHistoryReports } from '../utils/historyStorage';
import { RemarksSelector } from './RemarksSelector';
import { SearchableTechnicianSelect } from './SearchableTechnicianSelect';
import { DEFAULT_CHECKED_REMARKS, NO_SCHEDULE_REMARKS, formatRemarksToString } from '../constants/remarks';

interface AddTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReport: (report: TripReportData) => void;
  existingTechniciansCount: number;
}

export const AddTechnicianModal: React.FC<AddTechnicianModalProps> = ({
  isOpen,
  onClose,
  onAddReport,
  existingTechniciansCount
}) => {
  if (!isOpen) return null;

  const settings: SettingsConfig = getStoredSettings();

  // Choose second tech by default if available
  const defaultTech = settings.technicians[existingTechniciansCount % settings.technicians.length] || settings.technicians[0];

  const todayIso = new Date().toISOString().split('T')[0];
  const [dateOfSchedule, setDateOfSchedule] = useState<string>(todayIso);
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>(settings.regions[0] || settings.technicians[0]?.defaultRegion || 'South Central');
  const [selectedPlate, setSelectedPlate] = useState<string>('');

  // Equipment counts
  const [camerasCount, setCamerasCount] = useState<string>('');
  const [machinesCount, setMachinesCount] = useState<string>('');
  const [equipmentString, setEquipmentString] = useState<string>('');

  // Actual Working Hours inputs (Hour/s and Minute/s)
  const [actualHoursInput, setActualHoursInput] = useState<string>('');
  const [actualMinutesInput, setActualMinutesInput] = useState<string>('');

  // Running Total Tsheets inputs
  const [runningTsheetsHoursInput, setRunningTsheetsHoursInput] = useState<string>('');
  const [runningTsheetsMinutesInput, setRunningTsheetsMinutesInput] = useState<string>('');

  // Selected Remarks Checklist
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
      setCamerasCount('34');
      setMachinesCount('5');
      setEquipmentString('34C/5M');
    }
  };

  // File staging
  const [stagedFile, setStagedFile] = useState<{ file?: File; name: string; sizeFormatted: string; isSample: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewWorkWeek = calculateWorkWeekRange(dateOfSchedule);
  const customWorkWeekRange = calculateWorkWeekRange(customWeekDate);
  const effectiveWorkWeek = isCustomWorkWeek && customWeekDate ? customWorkWeekRange : previewWorkWeek;

  const clearPreExtractionInputs = () => {
    setSelectedTech('');
    setSelectedPlate('');
    setCamerasCount('');
    setMachinesCount('');
    setEquipmentString('');
    setActualHoursInput('');
    setActualMinutesInput('');
    setRunningTsheetsHoursInput('');
    setRunningTsheetsMinutesInput('');
    setIsSingleProject(false);
    setIsNoSchedule(false);
    setSelectedRemarks([...DEFAULT_CHECKED_REMARKS]);
    setIsCustomWorkWeek(false);
    setCustomWeekDate(dateOfSchedule);
    // dateOfSchedule and selectedRegion are kept intact!
  };

  const handleTechChange = (techName: string) => {
    setSelectedTech(techName);
    const found = settings.technicians.find(t => t.name === techName);
    if (found) {
      if (found.defaultRegion) setSelectedRegion(found.defaultRegion);
      setSelectedPlate(found.defaultLicensePlate || '');
    } else {
      setSelectedPlate('');
    }
  };

  const handleCameraChange = (val: string) => {
    setCamerasCount(val);
    setEquipmentString(`${val || '0'}C/${machinesCount || '0'}M`);
  };

  const handleMachineChange = (val: string) => {
    setMachinesCount(val);
    setEquipmentString(`${camerasCount || '0'}C/${val || '0'}M`);
  };

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

  const handleStageSample = () => {
    setError(null);
    setStagedFile({
      name: `Samsara_Trip_Analysis_${selectedTech.replace(/\s+/g, '_')}.kmz`,
      sizeFormatted: '412.5 KB',
      isSample: true
    });
  };

  const handleExecute = async () => {
    if (!stagedFile) {
      setError('Please upload or stage a KMZ/KML file for this technician.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(`Parsing KMZ file for ${selectedTech}...`);

    const effectiveEquipments = isNoSchedule
      ? 'NO DATA'
      : (equipmentString || (camerasCount && machinesCount ? `${camerasCount}C/${machinesCount}M` : '34C/5M'));

    const options = {
      technician: selectedTech,
      region: selectedRegion,
      dateOfSchedule,
      totalEquipments: effectiveEquipments,
      licensePlate: selectedPlate,
      issuesAnomaliesRemarks: formatRemarksToString(selectedRemarks),
      actualDailyWorkingHours: formatActualWorkingHoursInput(actualHoursInput, actualMinutesInput),
      runningTotalFieldTimeCal: '',
      runningTotalTsheets: formatActualWorkingHoursInput(runningTsheetsHoursInput, runningTsheetsMinutesInput),
      weeklyDateRange: effectiveWorkWeek,
      isSingleProject,
      isNoSchedule,
      isLadotExclusive
    };

    try {
      await new Promise(r => setTimeout(r, 400));
      setStatusMessage('Extracting Samsara timestamps & project numbers...');

      let report: TripReportData;
      if (stagedFile.isSample || !stagedFile.file) {
        // Build customized sample report matching the selected technician
        report = createSampleTripReport(options);
        
        // If Gilliam Johns or Koda Costello demo presets
        if (!isNoSchedule && selectedTech.includes('Gilliam')) {
          report.startShift = '8:05 AM';
          report.endShift = '6:49 PM';
          report.totalHoursSamsara = '10:44';
          report.jobs = [{
            id: `job-gilliam-${Date.now()}`,
            projectNumber: '26-240026',
            startJobTime: '10:26 AM (START OF JOB INSTALL 26-240026)',
            endJobTime: '5:33 PM (END OF JOB INSTALL 26-240026)',
            totalEquipments: effectiveEquipments,
            totalWorkingHours: '7:07:00',
            jobAssigned: 'Install',
            jobStatus: 'Job Complete'
          }];
          report.predictedDailyWorkingHours = isLadotExclusive ? '0 hour/s 0 minutes' : computePredictedDailyWorkingHours(84.5, report.jobs);
          report.actualDailyWorkingHours = '11 hour/s 0 minutes';
          report.issuesAnomaliesRemarks = 'Assigned project/s Complete\nNo Issue/s Found\nNOTE: Install will be continued tomorrow Tuesday schedule';
          report.runningTotalFieldTimeCal = '21 hour/s 30 minutes';
          report.runningTotalTsheets = '11 hour/s 0 minutes';
        } else if (!isNoSchedule && selectedTech.includes('Koda')) {
          report.startShift = '7:30 AM';
          report.endShift = '8:28 PM';
          report.totalHoursSamsara = '12:58';
          report.jobs = [{
            id: `job-koda-${Date.now()}`,
            projectNumber: '26-240026',
            startJobTime: '8:24 AM (START OF JOB INSTALL 26-240026)',
            endJobTime: '7:37 PM (END OF JOB INSTALL 26-240026)',
            totalEquipments: effectiveEquipments,
            totalWorkingHours: '11:13:00',
            jobAssigned: 'Install',
            jobStatus: 'Job Complete'
          }];
          report.predictedDailyWorkingHours = isLadotExclusive ? '0 hour/s 0 minutes' : computePredictedDailyWorkingHours(84.5, report.jobs);
          report.actualDailyWorkingHours = '13 hour/s 1 minutes';
          report.issuesAnomaliesRemarks = 'Assigned project/s complete\nIssues to report (Based on Field Report):\nhad a camera that was disconnecting and not operating tried to fix the problem but wasn\'t able to';
          report.runningTotalFieldTimeCal = '20 hour/s';
          report.runningTotalTsheets = '13 hour/s 1 minutes';
        }
      } else {
        const result = await parseKmlOrKmzFile(stagedFile.file, options);
        report = result.report;
      }

      if (isNoSchedule) {
        report.startShift = 'NO DATA';
        report.endShift = 'NO DATA';
        report.totalHoursSamsara = 'NO DATA';
        report.predictedDailyWorkingHours = 'NO DATA';
        report.jobs = report.jobs.map(j => ({
          ...j,
          projectNumber: 'NO DATA',
          startJobTime: 'NO DATA',
          endJobTime: 'NO DATA',
          totalWorkingHours: 'NO DATA',
          jobAssigned: 'NO DATA',
          jobStatus: 'NO DATA',
          totalEquipments: effectiveEquipments
        }));
      } else if (isPenndotRegionOrTech(selectedRegion, selectedTech, settings.technicians)) {
        const penndotProj = getDayScheduleString(dateOfSchedule);
        report.jobs = report.jobs.map(j => ({
          ...j,
          projectNumber: penndotProj
        }));
      }

      // Automatically compute weekly Running Total - Field Time Cal if user left it blank
      if (!options.runningTotalFieldTimeCal) {
        const allKnown = getStoredHistoryReports();
        report.runningTotalFieldTimeCal = calculateWeeklyFieldTimeTotal(
          report.technician,
          report.weeklyDateRange,
          allKnown,
          report.id,
          report.predictedDailyWorkingHours
        );
      }

      await new Promise(r => setTimeout(r, 300));
      onAddReport(report);
      clearPreExtractionInputs();
      setLoading(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process KMZ file.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 font-black rounded-xl shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Add Another Technician Report</h3>
              <p className="text-xs text-slate-500">
                Upload a KMZ/KML file for an additional technician to add their Trip Report below existing sheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
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

          {/* Date of Schedule & Work Week Customization Toggle */}
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
                <span>Custom</span>
              </label>
            </div>
            <input
              type="date"
              value={dateOfSchedule}
              onChange={(e) => setDateOfSchedule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {!isCustomWorkWeek ? (
              <span className="text-[10px] text-slate-400 block truncate">Week: {previewWorkWeek}</span>
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

          {/* Region */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Region</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {settings.regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Equipments string */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>Assigned Equipments</span>
            </label>
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-0.5 flex-1">
                <input
                  type="text"
                  disabled={isNoSchedule}
                  value={isNoSchedule ? '' : camerasCount}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  placeholder={isNoSchedule ? '—' : '34'}
                  className={`w-full px-1.5 py-2 border rounded-lg text-center font-bold text-slate-900 ${
                    isNoSchedule
                      ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <span className="font-bold text-slate-500 text-[10px]">C</span>
              </div>
              <span className="text-slate-400 font-bold">/</span>
              <div className="flex items-center space-x-0.5 flex-1">
                <input
                  type="text"
                  disabled={isNoSchedule}
                  value={isNoSchedule ? '' : machinesCount}
                  onChange={(e) => handleMachineChange(e.target.value)}
                  placeholder={isNoSchedule ? '—' : '5'}
                  className={`w-full px-1.5 py-2 border rounded-lg text-center font-bold text-slate-900 ${
                    isNoSchedule
                      ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <span className="font-bold text-slate-500 text-[10px]">M</span>
              </div>
            </div>
          </div>

          {/* Actual Working Hours */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Actual Working Hours</span>
            </label>
            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-0.5 flex-1">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={actualHoursInput}
                  onChange={(e) => setActualHoursInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-1.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                />
                <span className="font-bold text-slate-500 text-[10px]">hr</span>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="flex items-center space-x-0.5 flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={actualMinutesInput}
                  onChange={(e) => setActualMinutesInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-1.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                />
                <span className="font-bold text-slate-500 text-[10px]">min</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {formatActualWorkingHoursInput(actualHoursInput, actualMinutesInput) || '(Blank / Default)'}
            </span>
          </div>

          {/* Running Total - Tsheets */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-600" />
              <span>Running Total - Tsheets</span>
            </label>
            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-0.5 flex-1">
                <input
                  type="number"
                  min="0"
                  value={runningTsheetsHoursInput}
                  onChange={(e) => setRunningTsheetsHoursInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-1.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                />
                <span className="font-bold text-slate-500 text-[10px]">hr</span>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="flex items-center space-x-0.5 flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={runningTsheetsMinutesInput}
                  onChange={(e) => setRunningTsheetsMinutesInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-1.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                />
                <span className="font-bold text-slate-500 text-[10px]">min</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {formatActualWorkingHoursInput(runningTsheetsHoursInput, runningTsheetsMinutesInput) || '(Default 11 hr/s 0 min)'}
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

        {/* Remarks Checklist Options */}
        <RemarksSelector
          selectedRemarks={selectedRemarks}
          onChange={setSelectedRemarks}
          compact={true}
          title="Remarks / Notes Options"
          description="Checked notes will populate the technician's Trip Report remarks"
        />

        {/* File Upload Zone */}
        <div className="space-y-2">
          <label className="font-bold text-slate-800 text-xs block">
            Technician's KMZ / KML Log File
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              stagedFile ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-300 hover:border-amber-500 bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".kmz,.kml"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && stageFile(e.target.files[0])}
            />

            {!stagedFile ? (
              <div className="space-y-2">
                <Upload className="w-6 h-6 text-amber-600 mx-auto" />
                <p className="text-xs font-medium text-slate-700">
                  Click or drag KMZ file for <strong>{selectedTech}</strong>
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleStageSample(); }}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-500 text-slate-950 font-bold text-[11px] rounded shadow-sm hover:bg-amber-400 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Stage Demo Log for {selectedTech}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-left">
                  <FileCode2 className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{stagedFile.name}</span>
                    <span className="text-[10px] text-slate-500">{stagedFile.sizeFormatted} • Staged for {selectedTech}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setStagedFile(null); }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!stagedFile || loading}
            onClick={handleExecute}
            className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
              !stagedFile || loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Log...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Process & Add Technician Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
