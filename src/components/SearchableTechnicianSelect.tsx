import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { TechnicianOption } from '../types';

interface SearchableTechnicianSelectProps {
  technicians: TechnicianOption[];
  value: string;
  onChange: (techName: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableTechnicianSelect: React.FC<SearchableTechnicianSelectProps> = ({
  technicians,
  value,
  onChange,
  placeholder = '-- Select or Search Technician --',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal search term when value changes externally
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTechnicians = technicians.filter(t =>
    t.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const handleSelect = (name: string) => {
    onChange(name);
    setSearchTerm(name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            onChange(val);
            setIsOpen(true);
          }}
          className={`w-full pl-8 pr-12 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white ${className}`}
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl text-xs py-1">
          {filteredTechnicians.length > 0 ? (
            filteredTechnicians.map((t) => {
              const isSelected = t.name === value;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t.name)}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-amber-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-50/80 font-bold text-amber-900' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{t.name}</span>
                    {(t.defaultRegion || t.defaultLicensePlate) && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {t.defaultRegion ? `Region: ${t.defaultRegion}` : ''}
                        {t.defaultRegion && t.defaultLicensePlate ? ' | ' : ''}
                        {t.defaultLicensePlate ? `Plate: ${t.defaultLicensePlate}` : ''}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-slate-400 italic text-[11px]">
              No matching technician found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
