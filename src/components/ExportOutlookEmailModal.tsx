import React, { useState, useEffect } from 'react';
import { X, Mail, Download, Copy, Check, ExternalLink, Sparkles, FileText, Layout, Palette, User, Users, RefreshCw } from 'lucide-react';
import { TripReportData } from '../types';
import { generateTripReportEmailHtml, generateEMLContent, downloadEMLFile, EmailExportOptions } from '../utils/emailExporter';
import { UserProfile } from '../lib/firebase';
import {
  TEAM_EMAIL_PRESETS,
  TeamEmailPreset,
  getEmailPresetForUser,
  buildEmailSubjectAndGreeting
} from '../constants/teamEmailPresets';

interface ExportOutlookEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportsList: TripReportData[];
  currentUserProfile?: UserProfile | null;
}

export const ExportOutlookEmailModal: React.FC<ExportOutlookEmailModalProps> = ({
  isOpen,
  onClose,
  reportsList,
  currentUserProfile
}) => {
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Active selected preset ID (e.g. 'teamjames', 'teamdwight', 'custom', etc.)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('teamjames');

  // Form values
  const [subject, setSubject] = useState('');
  const [toRecipients, setToRecipients] = useState('');
  const [ccRecipients, setCcRecipients] = useState('');
  const [introMessage, setIntroMessage] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Compute and initialize default values on open or user profile / reports change
  useEffect(() => {
    if (!isOpen) return;

    // Detect matched preset for current logged-in user
    const matchedPreset = getEmailPresetForUser(currentUserProfile);
    setSelectedPresetId(matchedPreset.id);

    // Get primary date and region
    const firstReport = reportsList && reportsList.length > 0 ? reportsList[0] : undefined;
    const assignedRegion = currentUserProfile?.assignedRegion;
    const reportRegion = firstReport?.region;
    const dateOfSchedule = firstReport?.dateOfSchedule;

    const { subject: defaultSubject, introMessage: defaultIntro } = buildEmailSubjectAndGreeting({
      assignedRegion,
      reportRegion,
      dateOfSchedule
    });

    setSubject(defaultSubject);
    setToRecipients(matchedPreset.toRecipients);
    setCcRecipients(matchedPreset.ccRecipients);
    setIntroMessage(defaultIntro);
  }, [isOpen, reportsList, currentUserProfile]);

  // Handler to switch preset
  const handleApplyPreset = (preset: TeamEmailPreset) => {
    setSelectedPresetId(preset.id);
    setToRecipients(preset.toRecipients);
    setCcRecipients(preset.ccRecipients);
  };

  // Handler to reset all fields to user account defaults
  const handleResetToAccountDefaults = () => {
    const matchedPreset = getEmailPresetForUser(currentUserProfile);
    setSelectedPresetId(matchedPreset.id);

    const firstReport = reportsList && reportsList.length > 0 ? reportsList[0] : undefined;
    const assignedRegion = currentUserProfile?.assignedRegion;
    const reportRegion = firstReport?.region;
    const dateOfSchedule = firstReport?.dateOfSchedule;

    const { subject: defaultSubject, introMessage: defaultIntro } = buildEmailSubjectAndGreeting({
      assignedRegion,
      reportRegion,
      dateOfSchedule
    });

    setSubject(defaultSubject);
    setToRecipients(matchedPreset.toRecipients);
    setCcRecipients(matchedPreset.ccRecipients);
    setIntroMessage(defaultIntro);
  };

  if (!isOpen) return null;

  const exportOpts: EmailExportOptions = {
    subject,
    toRecipients,
    ccRecipients,
    introMessage,
    theme
  };

  const previewHtml = generateTripReportEmailHtml(reportsList, exportOpts);

  const handleDownloadEML = () => {
    downloadEMLFile(reportsList, exportOpts);
  };

  const handleCopyHTML = async () => {
    try {
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      // Fallback to text copy
      navigator.clipboard.writeText(previewHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    }
  };

  const handleCopyPlainText = () => {
    const textContent = `${subject}\nTo: ${toRecipients}\nCc: ${ccRecipients}\n\n${introMessage}\n\n` + 
      reportsList.map(r => 
        `Technician: ${r.technician} | Date: ${r.dateOfSchedule} | Region: ${r.region}\n` +
        `Shift: ${r.startShift} - ${r.endShift} (${r.totalHoursSamsara})\n` +
        `Jobs:\n` + (r.jobs || []).map(j => ` - ${j.projectNumber}: ${j.startJobTime} to ${j.endJobTime} (${j.totalWorkingHours})`).join('\n') + '\n' +
        `Predicted Hours: ${r.predictedDailyWorkingHours}\nActual Hours: ${r.actualDailyWorkingHours}\n` +
        `Remarks:\n${r.issuesAnomaliesRemarks}`
      ).join('\n\n---\n\n');

    navigator.clipboard.writeText(textContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(toRecipients)}?cc=${encodeURIComponent(ccRecipients)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(introMessage + '\n\n[Please view attached report or import downloaded .eml file]')}`;
    window.open(mailtoUrl, '_blank');
  };

  const activeUserRegion = currentUserProfile?.assignedRegion || (reportsList && reportsList[0]?.region) || 'South Central';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Export Outlook Email (.eml)
                </h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                  Ready for Send-Out
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auto-populated for <strong className="text-amber-400 font-semibold">{currentUserProfile?.displayName || currentUserProfile?.username || 'Team'}</strong> with assigned region <strong className="text-slate-200">{activeUserRegion}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Account Preset Switcher Bar */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Account Preset Recipients:</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (Click any team to auto-fill To/CC)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToAccountDefaults}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors"
                title="Reset to your account assigned region and default recipients"
              >
                <RefreshCw className="w-3 h-3 text-amber-400" />
                <span>Reset to My Defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {TEAM_EMAIL_PRESETS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-[1.02]'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="truncate">{preset.name}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                      {preset.id}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Form Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-200">
            
            {/* Subject Field */}
            <div className="lg:col-span-12 space-y-1">
              <label className="font-bold text-slate-300 text-xs flex items-center justify-between">
                <span>Email Subject Line</span>
                <span className="text-[10px] text-slate-500 font-normal">Editable</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Trip Analysis | South Central Region | 8/26/2026 (Monday Schedule)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>

            {/* To Recipients */}
            <div className="lg:col-span-6 space-y-1">
              <label className="font-bold text-slate-300 text-xs">To Recipients</label>
              <input
                type="text"
                value={toRecipients}
                onChange={(e) => {
                  setToRecipients(e.target.value);
                  setSelectedPresetId('custom');
                }}
                placeholder="'Chris James Laciste' <james.laciste@ndsdata.com>"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* CC Recipients */}
            <div className="lg:col-span-6 space-y-1">
              <label className="font-bold text-slate-300 text-xs">Cc Recipients</label>
              <input
                type="text"
                value={ccRecipients}
                onChange={(e) => {
                  setCcRecipients(e.target.value);
                  setSelectedPresetId('custom');
                }}
                placeholder="'katrinjoyce.pasucal@ndsdata.com'; 'crislie.busayong@ndsdata.com'"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Intro Message */}
            <div className="lg:col-span-9 space-y-1">
              <label className="font-bold text-slate-300 text-xs">Email Greeting / Intro Message</label>
              <textarea
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
              />
            </div>

            {/* Theme & Style Toggle */}
            <div className="lg:col-span-3 space-y-1 flex flex-col justify-between">
              <label className="font-bold text-slate-300 text-xs flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Outlook Color Theme</span>
              </label>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                    theme === 'dark' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dark / Gold
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                    theme === 'light' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Light Classic
                </button>
              </div>
            </div>
          </div>

          {/* Live Outlook Email Preview Frame */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Outlook Email Message Preview:</span>
              </span>
              <span className="text-slate-500 text-[11px] font-normal">
                Exact render preview matching Outlook template
              </span>
            </div>

            {/* Simulated Outlook Desktop Window Header */}
            <div className="rounded-2xl border border-slate-800 bg-[#2b2b2b] overflow-hidden shadow-xl text-slate-100">
              <div className="bg-[#202020] px-4 py-3 border-b border-slate-700/80 text-xs space-y-1 font-sans">
                <div className="font-bold text-sm text-amber-300 leading-tight">
                  {subject}
                </div>
                <div className="text-slate-300 text-[11px]">
                  <span className="text-slate-400 font-semibold">To:</span> {toRecipients || '(None)'}
                </div>
                <div className="text-slate-300 text-[11px]">
                  <span className="text-slate-400 font-semibold">Cc:</span> {ccRecipients || '(None)'}
                </div>
              </div>

              {/* Rendered HTML Container */}
              <div className={`p-4 overflow-x-auto max-h-[380px] transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-slate-100'}`}>
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800 gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyHTML}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              {copiedHtml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedHtml ? 'Copied HTML!' : 'Copy Rich HTML'}</span>
            </button>

            <button
              onClick={handleCopyPlainText}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-800 transition-all"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-slate-500" />}
              <span>{copiedText ? 'Copied Text!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleOpenMailto}
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-800 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>Mailto Link</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleDownloadEML}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Download Outlook .eml File</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

