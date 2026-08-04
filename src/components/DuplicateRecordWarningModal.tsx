import React from 'react';
import { AlertTriangle, RefreshCw, X, User, Calendar, FileText, Clock } from 'lucide-react';
import { TripReportData } from '../types';

interface DuplicateRecordWarningModalProps {
  isOpen: boolean;
  existingRecord: TripReportData | null;
  newRecord: TripReportData | null;
  onConfirmRewrite: () => void;
  onCancel: () => void;
}

export const DuplicateRecordWarningModal: React.FC<DuplicateRecordWarningModalProps> = ({
  isOpen,
  existingRecord,
  newRecord,
  onConfirmRewrite,
  onCancel
}) => {
  if (!isOpen || !existingRecord || !newRecord) return null;

  const techName = newRecord.technician || existingRecord.technician || 'Technician';
  const schedDate = newRecord.dateOfSchedule || existingRecord.dateOfSchedule || 'Schedule Date';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-2xl max-w-lg w-full p-6 space-y-5 relative">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-200">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">
              Duplicate Record Warning
            </h3>
            <p className="text-xs text-slate-500">
              An existing trip report record was found for this technician and schedule date.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-800 border-b border-amber-200/60 pb-2">
            <div className="flex items-center space-x-1.5">
              <User className="w-4 h-4 text-amber-700" />
              <span>Tech: <strong className="text-slate-900">{techName}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>Date: <strong className="text-slate-900">{schedDate}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Prior Record */}
            <div className="p-2.5 bg-white border border-amber-200/80 rounded-lg space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Prior Record
              </div>
              <div className="text-slate-700 truncate flex items-center space-x-1" title={existingRecord.fileName || 'N/A'}>
                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{existingRecord.fileName || 'Saved Record'}</span>
              </div>
              {existingRecord.totalHoursSamsara && (
                <div className="text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{existingRecord.totalHoursSamsara} hrs</span>
                </div>
              )}
            </div>

            {/* New Record */}
            <div className="p-2.5 bg-white border border-amber-300 rounded-lg space-y-1 ring-2 ring-amber-400/20">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                New Record
              </div>
              <div className="text-slate-700 truncate flex items-center space-x-1" title={newRecord.fileName || 'N/A'}>
                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{newRecord.fileName || 'Current Process'}</span>
              </div>
              {newRecord.totalHoursSamsara && (
                <div className="text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{newRecord.totalHoursSamsara} hrs</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="text-sm font-bold text-slate-800 text-center px-2">
          Do you want to rewrite the prior record and replace it with the current record?
        </div>

        <p className="text-xs text-slate-500 text-center italic">
          If you proceed with the rewrite, the system will automatically delete the prior record for {techName} on {schedDate} and replace it with the new record.
        </p>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmRewrite}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rewrite & Replace Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
