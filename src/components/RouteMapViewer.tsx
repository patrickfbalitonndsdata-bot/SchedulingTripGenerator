import React, { useState } from 'react';
import { TripReportData } from '../types';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Globe,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

interface RouteMapViewerProps {
  report?: TripReportData | null;
  onBackToDashboard: () => void;
}

export const RouteMapViewer: React.FC<RouteMapViewerProps> = ({
  onBackToDashboard
}) => {
  const SCHEZ_URL = 'https://scheztripngo.netlify.app/';
  const [key, setKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(SCHEZ_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 pb-12 transition-all">
      {/* Top Header & Navigation Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-xl tracking-tight">
                SchezTripNGo App
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Embedded App
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium pl-10 sm:pl-0">
              Integrated trip & schedule workspace: <a href={SCHEZ_URL} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-mono">{SCHEZ_URL}</a>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
            title="Reload SchezTripNGo App"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
            title={isExpanded ? 'Standard View' : 'Expand Height'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>

          <button
            onClick={handleOpenExternal}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Open New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Integrated Workspace Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
              <Globe className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Loading SchezTripNGo Workspace...</p>
              <p className="text-slate-400 text-xs mt-1">Connecting to https://scheztripngo.netlify.app/</p>
            </div>
          </div>
        )}

        {/* Embedded Application Frame */}
        <div className={`w-full transition-all duration-300 ${isExpanded ? 'h-[calc(100vh-140px)] min-h-[850px]' : 'h-[calc(100vh-220px)] min-h-[700px]'}`}>
          <iframe
            key={key}
            src={SCHEZ_URL}
            title="SchezTripNGo Integrated Web App"
            className="w-full h-full border-0 bg-white"
            allow="geolocation; microphone; camera; clipboard-read; clipboard-write"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>

      {/* Embedded Feature Highlights Footer */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <span>SchezTripNGo Connected Suite</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Netlify Hosted
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Use the integrated SchezTripNGo planner above to coordinate technician schedules, manage trips, and cross-reference field trip reports seamlessly. If your browser blocks embedded frames, click <strong>Open New Tab</strong> above.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenExternal}
            className="shrink-0 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 underline decoration-amber-400/50 hover:decoration-amber-300 transition-colors"
          >
            <span>Launch standalone SchezTripNGo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
