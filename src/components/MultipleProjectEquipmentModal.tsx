import React, { useState, useEffect } from 'react';
import { TripReportData, JobRow } from '../types';
import { computePredictedDailyWorkingHours, parseEquipmentCount } from '../utils/kmlParser';
import { Layers, X, Copy, Sparkles, ArrowRight, Camera, Monitor } from 'lucide-react';

interface MultipleProjectEquipmentModalProps {
  isOpen: boolean;
  report: TripReportData | null;
  mode: 'replace' | 'add';
  onConfirm: (updatedReport: TripReportData, mode: 'replace' | 'add') => void;
  onCancel: () => void;
}

interface ProjectEquipmentItem {
  id: string; // Job ID
  projectNumber: string;
  jobAssigned: string;
  startJobTime: string;
  endJobTime: string;
  cameras: string;
  machines: string;
  equipmentString: string;
}

export const MultipleProjectEquipmentModal: React.FC<MultipleProjectEquipmentModalProps> = ({
  isOpen,
  report,
  mode,
  onConfirm,
  onCancel,
}) => {
  const [items, setItems] = useState<ProjectEquipmentItem[]>([]);

  useEffect(() => {
    if (isOpen && report && report.jobs) {
      const parsedItems: ProjectEquipmentItem[] = report.jobs.map((job) => {
        const rawEq = job.totalEquipments || '31C/5M';
        const camMatch = rawEq.match(/(\d+)\s*C/i);
        const machMatch = rawEq.match(/(\d+)\s*M/i);

        let cVal = camMatch ? camMatch[1] : '';
        let mVal = machMatch ? machMatch[1] : '';

        if (!cVal && !mVal) {
          const count = parseEquipmentCount(rawEq);
          if (count > 0) {
            cVal = String(count);
            mVal = '0';
          } else {
            cVal = '31';
            mVal = '5';
          }
        }

        return {
          id: job.id,
          projectNumber: job.projectNumber,
          jobAssigned: job.jobAssigned || 'Job',
          startJobTime: job.startJobTime,
          endJobTime: job.endJobTime,
          cameras: cVal || '31',
          machines: mVal || '5',
          equipmentString: rawEq !== 'NO DATA' ? `${cVal || '31'}C/${mVal || '5'}M` : 'NO DATA'
        };
      });

      setItems(parsedItems);
    }
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const handleItemCameraChange = (id: string, val: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newEq = `${val || '0'}C/${item.machines || '0'}M`;
          return { ...item, cameras: val, equipmentString: newEq };
        }
        return item;
      })
    );
  };

  const handleItemMachineChange = (id: string, val: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newEq = `${item.cameras || '0'}C/${val || '0'}M`;
          return { ...item, machines: val, equipmentString: newEq };
        }
        return item;
      })
    );
  };

  const handleApplyPresetToItem = (id: string, presetEq: string) => {
    const camMatch = presetEq.match(/(\d+)\s*C/i);
    const machMatch = presetEq.match(/(\d+)\s*M/i);
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            cameras: camMatch ? camMatch[1] : '0',
            machines: machMatch ? machMatch[1] : '0',
            equipmentString: presetEq
          };
        }
        return item;
      })
    );
  };

  const handleApplyFirstToAll = () => {
    if (items.length === 0) return;
    const source = items[0];
    setItems(prev =>
      prev.map(item => ({
        ...item,
        cameras: source.cameras,
        machines: source.machines,
        equipmentString: source.equipmentString
      }))
    );
  };

  const handleConfirm = () => {
    if (!report) return;

    const updatedJobs: JobRow[] = report.jobs.map(job => {
      const match = items.find(i => i.id === job.id);
      if (match) {
        return {
          ...job,
          totalEquipments: match.equipmentString || `${match.cameras || '0'}C/${match.machines || '0'}M`
        };
      }
      return job;
    });

    const updatedPredicted = report.isNoSchedule
      ? 'NO DATA'
      : report.isLadotExclusive
      ? '0 hour/s 0 minutes'
      : computePredictedDailyWorkingHours(
          report.rawKmlDetails?.totalDistanceMiles || 84.5,
          updatedJobs
        );

    const updatedReport: TripReportData = {
      ...report,
      jobs: updatedJobs,
      predictedDailyWorkingHours: updatedPredicted
    };

    onConfirm(updatedReport, mode);
  };

  const projectNumbersList = Array.from(new Set(items.map(i => i.projectNumber).filter(p => p && p !== 'NO DATA')));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-amber-500/10 dark:bg-amber-500/15 flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-md shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {items.length} Projects Detected
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {report.technician} • {report.dateOfSchedule}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                Multiple Projects Detected — Equipment Assignment
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                The system scanned <strong className="text-amber-600 dark:text-amber-400 font-semibold">{projectNumbersList.join(', ')}</strong> in this trip. Please input the assigned Equipment count (Cameras &amp; Machines) for each specific project number before proceeding.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Bulk Action Bar */}
        <div className="px-6 py-3 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-medium">Quick Equipment Configuration</span>
          </div>
          <button
            type="button"
            onClick={handleApplyFirstToAll}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-650 transition-colors shadow-xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-amber-500" />
            <span>Apply Project #1 Equipment Count ({items[0]?.equipmentString || '31C/5M'}) to All</span>
          </button>
        </div>

        {/* Form Body - Scrollable Items List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 hover:border-amber-400/50 transition-colors space-y-3"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        Project #{item.projectNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item.jobAssigned}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Shift Time: {item.startJobTime} – {item.endJobTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Assigned:</span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                    {item.equipmentString}
                  </span>
                </div>
              </div>

              {/* Input Fields for Cameras & Machines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                    <span>Cameras Count (C)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.cameras}
                    onChange={(e) => handleItemCameraChange(item.id, e.target.value)}
                    placeholder="e.g. 31"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
                    <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Machines Count (M)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.machines}
                    onChange={(e) => handleItemMachineChange(item.id, e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
                {['31C/5M', '34C/5M', '10C/2M', '12C/0M', 'NO DATA'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPresetToItem(item.id, preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer border ${
                      item.equipmentString === preset
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Clicking proceed will update job equipment counts &amp; recalculate predicted daily hours.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Confirm &amp; Proceed to Trip Report Sheet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
