import React from 'react';
import { STANDARD_REMARKS_OPTIONS, DEFAULT_CHECKED_REMARKS, ITEMS_WITH_INPUT, STATUS_REMARKS, getInputPrefix, sanitizeRemarksSelection } from '../constants/remarks';
import { CheckSquare, Square, Check, RotateCcw, AlertTriangle, FileText, Edit3 } from 'lucide-react';

interface RemarksSelectorProps {
  selectedRemarks: string[];
  onChange: (updatedRemarks: string[]) => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

export const RemarksSelector: React.FC<RemarksSelectorProps> = ({
  selectedRemarks,
  onChange,
  title = "Issues / Anomalies / Remarks Checklist",
  description = "Select standard report notes to automatically populate the Issues/Anomalies/Remarks section",
  compact = false
}) => {
  const handleToggle = (remark: string) => {
    const isInputItem = ITEMS_WITH_INPUT.includes(remark);
    const isStatusItem = STATUS_REMARKS.some(s => s.toLowerCase() === remark.toLowerCase());

    if (isStatusItem) {
      if (selectedRemarks.includes(remark)) {
        // Toggle OFF: uncheck this status remark
        onChange(selectedRemarks.filter(r => r !== remark));
      } else {
        // Toggle ON: check this status remark and uncheck all other status remarks
        const nonStatus = selectedRemarks.filter(r => !STATUS_REMARKS.some(s => s.toLowerCase() === r.toLowerCase()));
        onChange([remark, ...nonStatus]);
      }
      return;
    }

    if (isInputItem) {
      const existing = selectedRemarks.find(r => getInputPrefix(r) === remark);
      if (existing !== undefined) {
        // Toggle OFF: remove entry starting with prefix
        onChange(selectedRemarks.filter(r => getInputPrefix(r) !== remark));
      } else {
        // Toggle ON: add base prefix
        onChange(sanitizeRemarksSelection([...selectedRemarks, remark]));
      }
    } else {
      if (selectedRemarks.includes(remark)) {
        onChange(selectedRemarks.filter(r => r !== remark));
      } else {
        onChange(sanitizeRemarksSelection([...selectedRemarks, remark]));
      }
    }
  };

  const handleInputChange = (prefix: string, text: string) => {
    // Preserve spaces while typing
    const newEntry = text ? `${prefix} ${text}` : prefix;
    const existingIdx = selectedRemarks.findIndex(r => getInputPrefix(r) === prefix);

    if (existingIdx !== -1) {
      const updated = [...selectedRemarks];
      updated[existingIdx] = newEntry;
      onChange(sanitizeRemarksSelection(updated));
    } else {
      onChange(sanitizeRemarksSelection([...selectedRemarks, newEntry]));
    }
  };

  const handleSelectDefaults = () => {
    onChange([...DEFAULT_CHECKED_REMARKS]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectAll = () => {
    // Select all standard options, keeping only ONE active status remark (the currently checked one or default to 'Assigned project/s completed')
    const activeStatus = selectedRemarks.find(r => STATUS_REMARKS.some(s => s.toLowerCase() === r.toLowerCase())) || STATUS_REMARKS[0];
    const updated: string[] = [];

    STANDARD_REMARKS_OPTIONS.forEach(opt => {
      const isStatus = STATUS_REMARKS.some(s => s.toLowerCase() === opt.toLowerCase());
      if (isStatus) {
        if (opt.toLowerCase() === activeStatus.toLowerCase()) {
          updated.push(opt);
        }
        return;
      }

      const isInput = ITEMS_WITH_INPUT.includes(opt);
      if (isInput) {
        const existing = selectedRemarks.find(r => getInputPrefix(r) === opt);
        updated.push(existing || opt);
      } else {
        updated.push(opt);
      }
    });

    onChange(sanitizeRemarksSelection(updated));
  };

  return (
    <div className={`space-y-3 bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 sm:p-4 text-xs ${compact ? 'text-[11px]' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{title}</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-900 font-black text-[10px] rounded-full border border-amber-500/30">
                {selectedRemarks.length} Selected
              </span>
            </h4>
            {description && <p className="text-[11px] text-slate-500">{description}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[10px]">
          <button
            type="button"
            onClick={handleSelectDefaults}
            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg transition-colors flex items-center space-x-1"
            title="Reset to default checked notes: Assigned project/s completed & No Issue/s found"
          >
            <RotateCcw className="w-3 h-3 text-amber-700" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-semibold rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Checkboxes Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'lg:grid-cols-2 gap-2' : 'lg:grid-cols-3 gap-2.5'}`}>
        {STANDARD_REMARKS_OPTIONS.map((remark, idx) => {
          const isInputItem = ITEMS_WITH_INPUT.includes(remark);
          const existingInputEntry = isInputItem
            ? selectedRemarks.find(r => getInputPrefix(r) === remark)
            : undefined;

          const isChecked = isInputItem
            ? existingInputEntry !== undefined
            : selectedRemarks.includes(remark);

          const isDefaultItem = DEFAULT_CHECKED_REMARKS.includes(remark);

          // Extract text after prefix for input field
          let detailValue = '';
          if (existingInputEntry) {
            if (existingInputEntry.startsWith(remark + ' ')) {
              detailValue = existingInputEntry.slice(remark.length + 1);
            } else if (existingInputEntry.startsWith(remark)) {
              detailValue = existingInputEntry.slice(remark.length);
            } else {
              detailValue = existingInputEntry;
            }
          }

          return (
            <div
              key={idx}
              onClick={() => handleToggle(remark)}
              className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                isChecked
                  ? 'bg-amber-50/90 border-amber-400 text-slate-950 font-bold shadow-2xs ring-1 ring-amber-400/30'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <div className="mt-0.5 shrink-0">
                  {isChecked ? (
                    <div className="w-4 h-4 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 leading-tight text-[11px] sm:text-xs">
                  <span>{remark}</span>
                  {isDefaultItem && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-amber-200/80 text-amber-900 text-[9px] font-extrabold rounded uppercase tracking-wider">
                      Default
                    </span>
                  )}
                </div>
              </div>

              {/* Input Box for Input Items when Checked */}
              {isInputItem && isChecked && (
                <div
                  className="mt-2 pt-2 border-t border-amber-200/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center space-x-1 mb-1 text-[10px] text-amber-900 font-bold">
                    <Edit3 className="w-3 h-3 text-amber-700" />
                    <span>Enter Additional Note / Details:</span>
                  </div>
                  <input
                    type="text"
                    value={detailValue}
                    onChange={(e) => handleInputChange(remark, e.target.value)}
                    placeholder={
                      remark === 'Custom Notes:'
                        ? 'e.g. Follow up on site access with manager...'
                        : 'e.g. Hydraulic leak on truck #14, field report attached...'
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
