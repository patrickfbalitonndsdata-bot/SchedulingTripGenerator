import React, { useState } from 'react';
import { 
  X, BookOpen, Sparkles, User, MapPin, Calendar, Camera, 
  Sliders, FileUp, CheckCircle2, Zap, Shield, Mail, Layers, 
  FileSpreadsheet, Clock, ArrowRight, Lightbulb, Check, AlertCircle,
  HelpCircle, Monitor, PlayCircle, BarChart3, Lock, Globe, Database
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSample?: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  onLoadSample
}) => {
  const [activeTab, setActiveTab] = useState<'tutorial' | 'automations' | 'advantages' | 'faq'>('tutorial');
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn print:hidden overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold tracking-tight text-white">System User Manual</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-500 text-slate-950 rounded-full uppercase tracking-wider">
                  Interactive Guide
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated Samsara KMZ Parser • Step-by-Step Graphical Tutorial & Features
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {onLoadSample && (
              <button
                onClick={() => {
                  onLoadSample();
                  onClose();
                }}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Try Demo KMZ</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close Manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 shrink-0 flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tutorial'
                ? 'border-amber-500 text-slate-900 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-t-lg'
            }`}
          >
            <PlayCircle className="w-4 h-4 text-amber-500" />
            <span>1. Graphical Tutorial</span>
          </button>

          <button
            onClick={() => setActiveTab('automations')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'automations'
                ? 'border-amber-500 text-slate-900 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-t-lg'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>2. Smart Automations</span>
          </button>

          <button
            onClick={() => setActiveTab('advantages')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'advantages'
                ? 'border-amber-500 text-slate-900 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-t-lg'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>3. Key Features & Advantages</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-amber-500 text-slate-900 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-t-lg'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>4. Frequently Asked Questions</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: GRAPHICAL TUTORIAL */}
          {activeTab === 'tutorial' && (
            <div className="space-y-6">
              {/* Intro Banner */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold block text-sm text-amber-950 mb-0.5">Quick Input Walkthrough</span>
                  Follow the step-by-step graphical guide below to learn how parameters are set, how auto-detection triggers, and how Samsara KMZ logs generate accurate Trip Reports instantly.
                </div>
              </div>

              {/* Step Navigation Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { num: 1, title: "1. Select Tech", desc: "Auto Region" },
                  { num: 2, title: "2. Date & Schedule", desc: "Work Week" },
                  { num: 3, title: "3. Equipment", desc: "C / M Format" },
                  { num: 4, title: "4. Special Toggles", desc: "No Schedule / PENNDOT" },
                  { num: 5, title: "5. Upload KMZ", desc: "Automated Report" }
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => setActiveStep(s.num)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      activeStep === s.num
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        activeStep === s.num ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        STEP {s.num}
                      </span>
                    </div>
                    <p className="font-bold text-xs leading-tight">{s.title}</p>
                    <p className={`text-[10px] mt-0.5 ${activeStep === s.num ? 'text-slate-300' : 'text-slate-500'}`}>{s.desc}</p>
                  </button>
                ))}
              </div>

              {/* STEP 1 DETAIL */}
              {activeStep === 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        1
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">Select Technician & Region Auto-Detection</h3>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full">
                      ⚡ Smart Auto-Fill
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    When you select a technician from the searchable dropdown menu, the system automatically retrieves their default <strong>Region</strong> (e.g., <em>PENNDOT</em>, <em>South Central</em>, <em>Florida</em>) and assigned <strong>License Plate</strong> from the database.
                  </p>

                  {/* Graphical Mockup Card */}
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">UI Mockup Representation</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100 p-3.5 rounded-lg border border-slate-200">
                      
                      {/* Dropdown Mockup */}
                      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Technician Name</label>
                        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border-2 border-amber-400 rounded-lg text-xs font-bold text-slate-900">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-600" />
                            Thomas Rivera
                          </span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-extrabold">Selected</span>
                        </div>
                      </div>

                      {/* Auto Result Mockup */}
                      <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-300 shadow-sm">
                        <label className="text-[11px] font-bold text-emerald-800 block mb-1">Auto-Detected Region & Plate</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              PENNDOT
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">Auto-Set</span>
                          </div>
                          <div className="px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-800">
                            16DAHQ
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Pro Tip:</strong> You can customize default regions & license plates in the <strong>Settings</strong> tab anytime.</span>
                  </div>
                </div>
              )}

              {/* STEP 2 DETAIL */}
              {activeStep === 2 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        2
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">Date of Schedule & Work Week Calculation</h3>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 border border-blue-300 font-bold px-2.5 py-1 rounded-full">
                      📅 Auto Work-Week
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select the schedule date (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">07/23/2026</code>). The system instantly calculates the official Sunday-to-Saturday Work Week range (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">07/19/2026 - 07/25/2026</code>) and updates all running totals.
                  </p>

                  {/* Graphical Mockup Card */}
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">UI Mockup Representation</div>
                    <div className="bg-slate-100 p-3.5 rounded-lg border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-300">
                        <div className="w-full sm:w-1/2">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Date of Schedule</label>
                          <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            <span>07/23/2026</span>
                            <span className="ml-auto text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">Thursday</span>
                          </div>
                        </div>
                        <div className="w-full sm:w-1/2">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Work Week (Auto-Computed)</label>
                          <div className="px-3 py-2 bg-amber-50/80 border border-amber-300 rounded-lg text-xs font-extrabold text-amber-950 flex items-center justify-between">
                            <span>07/19/2026 - 07/25/2026</span>
                            <Check className="w-4 h-4 text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 DETAIL */}
              {activeStep === 3 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        3
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">Assigned Equipments (Cameras & Machines)</h3>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-800 border border-purple-300 font-bold px-2.5 py-1 rounded-full">
                      📹 Format: 34C/5M
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Input camera count (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded">34</code>) and machine count (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded">5</code>). The system formats the result cleanly as <strong>34C/5M</strong> or <strong>34C</strong> across all trip report sheets.
                  </p>

                  {/* Graphical Mockup */}
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">UI Mockup Representation</div>
                    <div className="bg-slate-100 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1">
                          <span className="text-slate-900 font-extrabold text-sm">34</span>
                          <span className="text-slate-500 text-[10px]">C</span>
                        </div>
                        <span className="font-bold text-slate-400">/</span>
                        <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1">
                          <span className="text-slate-900 font-extrabold text-sm">5</span>
                          <span className="text-slate-500 text-[10px]">M</span>
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block" />

                      <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-lg text-xs font-extrabold text-emerald-950 flex items-center gap-2 w-full sm:w-auto justify-center">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Formatted Output: <span className="text-emerald-700 underline underline-offset-2">34C/5M</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 DETAIL */}
              {activeStep === 4 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        4
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">Special Toggles (NO SCHEDULE & PENNDOT Rule)</h3>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-full">
                      ⚙️ Smart Toggles
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* NO SCHEDULE TOGGLE CARD */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-amber-500" />
                          NO SCHEDULE Toggle
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">
                          ON
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        When enabled, the system automatically sets Shift times, Job start/end times, Equipment, and Job status to <strong className="text-rose-700">NO DATA</strong>. Equipment inputs are disabled and No Schedule remarks are checked by default.
                      </p>
                      <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
                        <div>Shift Times: <span className="font-bold text-rose-600">NO DATA</span></div>
                        <div>Equipments: <span className="font-bold text-rose-600">NO DATA</span></div>
                        <div>Job Status: <span className="font-bold text-rose-600">NO DATA</span></div>
                      </div>
                    </div>

                    {/* PENNDOT REGION CARD */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          PENNDOT Region Rule
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
                          AUTOMATED
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        If <strong>PENNDOT</strong> is selected as the region or technician, project numbers automatically format as <strong className="text-blue-800">[Day] Schedule</strong> based on the schedule date.
                      </p>
                      <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-800 space-y-1">
                        <div>Date: <strong>07/23/2026 (Thursday)</strong></div>
                        <div>Project #: <span className="font-extrabold text-blue-700">Thursday Schedule</span></div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 5 DETAIL */}
              {activeStep === 5 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        5
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">Upload Samsara KMZ / KML & Generate Report</h3>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full">
                      🚀 1-Click Extraction
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Drag and drop your Samsara <code className="bg-slate-200 px-1 py-0.5 rounded">.kmz</code> or <code className="bg-slate-200 px-1 py-0.5 rounded">.kml</code> log file into the Upload Zone (or click to browse). The system extracts all GPS timestamps, detects shift start/end times, project numbers, and job installation durations automatically.
                  </p>

                  <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <FileUp className="w-8 h-8 text-amber-400" />
                      <div>
                        <div className="font-bold text-sm text-amber-300">Samsara KMZ Log Parser</div>
                        <p className="text-xs text-slate-400">Extracts GPS waypoints, shift start/end, job hours & running totals</p>
                      </div>
                    </div>
                    {onLoadSample && (
                      <button
                        onClick={() => {
                          onLoadSample();
                          onClose();
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-all shadow-md shrink-0"
                      >
                        Load Sample KMZ Now
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SMART AUTOMATIONS */}
          {activeTab === 'automations' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-lg font-extrabold text-slate-900">System Automations & Engine Rules</h3>
                <p className="text-xs text-slate-500">Every automated feature built into the Samsara KMZ Trip Analysis system</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-600 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Samsara GPS Placemark Parsing</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Reads compressed XML inside KMZ zip archives, extracts earliest and latest timestamps for shift boundaries, and detects job installation start and end markers.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Clean Shift & Job Hour Output</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Filters out label suffixes like <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">(START OF SHIFT)</code> so that clean, printable timestamps (e.g. <code className="font-bold">07:30 AM</code>) render cleanly on output sheets.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>PENNDOT Region Day-Schedule Rule</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automatically replaces generic project numbers with <code className="font-bold text-blue-700">[Day] Schedule</code> (e.g., <strong>Thursday Schedule</strong>) whenever PENNDOT region or technicians are active.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2 text-purple-600 font-bold text-sm">
                    <Sliders className="w-4 h-4" />
                    <span>NO SCHEDULE "NO DATA" Uniformity</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Toggling NO SCHEDULE updates all shift times, job times, equipment, and job statuses to <strong className="text-rose-600">NO DATA</strong>, ensuring clean, uniform reporting.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-600 font-bold text-sm">
                    <BarChart3 className="w-4 h-4" />
                    <span>Running Total Arithmetic</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automatically calculates cumulative Tsheets working hours and Field Time total across all job rows without manual mathematical calculations.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                    <Mail className="w-4 h-4" />
                    <span>Outlook Email Exporter</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Generates copy-ready formatted HTML tables and structured plain text summaries for instant insertion into Microsoft Outlook or email clients.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: KEY ADVANTAGES & FEATURES */}
          {activeTab === 'advantages' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-lg font-extrabold text-slate-900">Key Features & Business Advantages</h3>
                <p className="text-xs text-slate-500">Why the Samsara KMZ Trip Analysis system simplifies daily reporting</p>
              </div>

              <div className="space-y-4">
                
                {/* Feature 1 */}
                <div className="flex items-start space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">100% Mathematical Calculation Accuracy</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Eliminates human errors in time math. Total working hours, shift durations, Samsara totals, and predicted daily hours are computed with second-level precision directly from GPS placemark logs.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Multi-Technician Report Stacking</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Process and display multiple technician reports simultaneously. Stack trip report sheets vertically, review running totals across technicians, and export or print them as a single cohesive report package.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Cloud & Offline Database Synchronization</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Generated reports, settings, and user profiles automatically synchronize with Firestore and local browser storage for reliable, multi-device record keeping and instant offline access.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: FREQUENTLY ASKED QUESTIONS */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-lg font-extrabold text-slate-900">Frequently Asked Questions</h3>
                <p className="text-xs text-slate-500">Quick solutions to common operational questions</p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">Q: What happens if I upload a file with NO SCHEDULE toggled ON?</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The system will preserve the NO SCHEDULE mode, populating <strong className="text-rose-600">NO DATA</strong> across shift times, job hours, status, and equipment string, while locking camera/machine count fields.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">Q: How does PENNDOT region project numbering work?</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    When PENNDOT is selected as region or technician, the system converts the selected schedule date into its day name and automatically uses <strong className="text-blue-700 font-bold">[Day] Schedule</strong> (e.g., <em>Thursday Schedule</em>) as the project number.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">Q: Can I edit reports manually after parsing?</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Yes! Every field in the Trip Report Sheet—including shift times, job start/end times, project numbers, remarks, and job status—is fully editable.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">Q: Are my history records saved to the database across devices?</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Yes! All generated trip reports and history records are stored in the cloud database tied to your account. Log in on any device to view and manage your account's synchronized history (retained for up to 10 days).
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>Need extra help? Load a sample KMZ file to test the workflow interactively.</span>
          </div>

          <div className="flex items-center space-x-3">
            {onLoadSample && (
              <button
                onClick={() => {
                  onLoadSample();
                  onClose();
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-sm"
              >
                Load Sample KMZ
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
            >
              Close User Manual
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
