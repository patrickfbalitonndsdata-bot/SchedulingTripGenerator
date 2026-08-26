import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TripAnalysisTemplate } from './components/TripAnalysisTemplate';
import { AuthLanding } from './components/AuthLanding';
import { 
  auth, 
  getUserProfile, 
  firebaseSignOut, 
  UserProfile, 
  getStoredLocalSession, 
  saveLocalSession,
  subscribeToGlobalSettings,
  saveGlobalSettingsToFirestore
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { TripReportData, SettingsConfig } from './types';
import { getStoredSettings, saveSettings } from './utils/defaultSettings';
import { createSampleTripReport, computePredictedDailyWorkingHours } from './utils/kmlParser';
import { 
  getStoredHistoryReports, 
  saveReportToHistory, 
  saveMultipleReportsToHistory, 
  deleteSingleHistoryRecord, 
  clearAllHistoryRecords,
  findExistingReportByTechAndDate,
  isSameTechnicianAndScheduleDate
} from './utils/historyStorage';

// Lazy-loaded components for optimal bundle splitting and performance
const RouteMapViewer = lazy(() => import('./components/RouteMapViewer').then(m => ({ default: m.RouteMapViewer })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const UserProfileView = lazy(() => import('./components/UserProfileView').then(m => ({ default: m.UserProfileView })));
const AdminLockModal = lazy(() => import('./components/AdminLockModal').then(m => ({ default: m.AdminLockModal })));
const UserManualModal = lazy(() => import('./components/UserManualModal').then(m => ({ default: m.UserManualModal })));
const DuplicateRecordWarningModal = lazy(() => import('./components/DuplicateRecordWarningModal').then(m => ({ default: m.DuplicateRecordWarningModal })));
const MultipleProjectEquipmentModal = lazy(() => import('./components/MultipleProjectEquipmentModal').then(m => ({ default: m.MultipleProjectEquipmentModal })));

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sheet' | 'map' | 'profile' | 'settings'>('dashboard');
  const [settings, setSettings] = useState<SettingsConfig>(getStoredSettings());

  // Firebase Auth & User Profile State
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Admin Security Lock State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // User Manual Modal State
  const [showUserManualModal, setShowUserManualModal] = useState(false);

  // Listen to Firebase Auth state & fallback session
  useEffect(() => {
    const localSession = getStoredLocalSession();
    if (localSession && localSession.status === 'active') {
      setCurrentUserProfile(localSession);
      if (localSession.role === 'admin') {
        setIsAdminAuthenticated(true);
      }
      setAuthChecking(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile && profile.status === 'active') {
          setCurrentUserProfile(profile);
          saveLocalSession(profile);
          if (profile.role === 'admin') {
            setIsAdminAuthenticated(true);
          }
        } else {
          // If inactive or profile missing, sign out immediately
          await firebaseSignOut(auth);
          saveLocalSession(null);
          setCurrentUserProfile(null);
          setIsAdminAuthenticated(false);
        }
      } else {
        const currentLocal = getStoredLocalSession();
        if (!currentLocal || currentLocal.status !== 'active') {
          setCurrentUserProfile(null);
          setIsAdminAuthenticated(false);
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time global settings (Technician roster, vehicle plates, regions) from Firestore DB
  useEffect(() => {
    const unsubscribe = subscribeToGlobalSettings((fsSettings) => {
      if (fsSettings && fsSettings.technicians && fsSettings.regions) {
        setSettings(fsSettings);
        saveSettings(fsSettings);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    saveLocalSession(null);
    setCurrentUserProfile(null);
    setIsAdminAuthenticated(false);
    setActiveTab('dashboard');
  };

  const handleTabClick = (tab: 'dashboard' | 'sheet' | 'map' | 'profile' | 'settings') => {
    if (tab === 'settings' && currentUserProfile?.role !== 'admin') {
      // Non-admin accounts cannot access settings
      setActiveTab('dashboard');
      return;
    }
    if (tab === 'settings' && currentUserProfile?.role === 'admin') {
      setIsAdminAuthenticated(true);
    }
    setActiveTab(tab);
  };

  const handleLockAdminSession = () => {
    if (currentUserProfile?.role !== 'admin') {
      setIsAdminAuthenticated(false);
      if (activeTab === 'settings') {
        setActiveTab('dashboard');
      }
    }
  };

  // Multi-Technician Stacked Reports State
  const [reportsList, setReportsList] = useState<TripReportData[]>([]);
  const [historyReports, setHistoryReports] = useState<TripReportData[]>([]);

  // Automatically fetch & load user-specific history records from local storage
  useEffect(() => {
    if (!currentUserProfile) {
      setHistoryReports([]);
      return;
    }

    const userId = currentUserProfile.uid;
    // Load local history records (automatically filtering expired records based on Date of Schedule)
    const localReports = getStoredHistoryReports(userId);
    setHistoryReports(localReports);
  }, [currentUserProfile]);

  const handleRefreshHistory = () => {
    const userId = currentUserProfile?.uid;
    setHistoryReports(getStoredHistoryReports(userId));
  };

  const handleDeleteHistoryRecord = (report: TripReportData) => {
    const userId = currentUserProfile?.uid;
    deleteSingleHistoryRecord(report, {
      date: report.dateOfSchedule,
      tech: report.technician,
      fileName: report.fileName
    }, userId);

    // Remove from active reportsList if present so it isn't auto-saved back
    setReportsList(prev => prev.filter(r => {
      if (r.id && report.id && r.id.trim() === report.id.trim()) return false;
      const dateMatch = (r.dateOfSchedule || '').trim() === (report.dateOfSchedule || '').trim();
      const techMatch = (r.technician || '').trim().toLowerCase() === (report.technician || '').trim().toLowerCase();
      if (dateMatch && techMatch) return false;
      return true;
    }));

    setHistoryReports(getStoredHistoryReports(userId));
  };

  const handleClearAllHistory = () => {
    const userId = currentUserProfile?.uid;
    clearAllHistoryRecords(userId);
    setReportsList([]);
    setHistoryReports([]);
  };

  // Duplicate Warning Modal State
  const [pendingDuplicate, setPendingDuplicate] = useState<{
    newReport: TripReportData;
    existingReport: TripReportData;
    mode: 'replace' | 'add';
  } | null>(null);

  // Multiple Projects Equipment Prompt Modal State
  const [pendingMultipleProject, setPendingMultipleProject] = useState<{
    newReport: TripReportData;
    mode: 'replace' | 'add';
  } | null>(null);

  const commitReportGenerated = (newReport: TripReportData, mode: 'replace' | 'add') => {
    if (mode === 'replace') {
      setReportsList([newReport]);
    } else {
      setReportsList(prev => [...prev, newReport]);
    }

    const userId = currentUserProfile?.uid;
    // Persist to local browser storage
    saveReportToHistory(newReport, userId);
    setHistoryReports(getStoredHistoryReports(userId));
  };

  const processReportCommit = (newReport: TripReportData, mode: 'replace' | 'add') => {
    const userId = currentUserProfile?.uid;
    const history = getStoredHistoryReports(userId);
    const allKnown = [...reportsList, ...history];
    const existing = findExistingReportByTechAndDate(newReport, allKnown);

    if (existing) {
      setPendingDuplicate({
        newReport,
        existingReport: existing,
        mode
      });
      return;
    }

    commitReportGenerated(newReport, mode);
  };

  const handleReportGenerated = (newReport: TripReportData, mode: 'replace' | 'add' = 'replace') => {
    // Check if multiple projects are detected in the report
    const uniqueProjects = Array.from(new Set(newReport.jobs.map(j => j.projectNumber).filter(p => p && p !== 'NO DATA')));
    if (uniqueProjects.length > 1 || newReport.jobs.length > 1) {
      setPendingMultipleProject({
        newReport,
        mode
      });
      return;
    }

    processReportCommit(newReport, mode);
  };

  const handleConfirmMultipleProjectEquipment = (updatedReport: TripReportData, mode: 'replace' | 'add') => {
    setPendingMultipleProject(null);
    processReportCommit(updatedReport, mode);
  };

  const handleCancelMultipleProjectEquipment = () => {
    setPendingMultipleProject(null);
  };

  const handleConfirmRewrite = () => {
    if (!pendingDuplicate) return;
    const { newReport, existingReport, mode } = pendingDuplicate;
    const userId = currentUserProfile?.uid;

    // 1. Delete prior record for specific technician & schedule date from local storage
    deleteSingleHistoryRecord(existingReport, {
      date: existingReport.dateOfSchedule,
      tech: existingReport.technician,
      fileName: existingReport.fileName
    }, userId);

    // 2. Remove prior record for specific technician & schedule date from active reportsList
    const filteredActive = reportsList.filter(r => !isSameTechnicianAndScheduleDate(r, existingReport));

    // 3. Save new report to local storage
    saveReportToHistory(newReport, userId);
    setHistoryReports(getStoredHistoryReports(userId));

    // 4. Update active reportsList
    if (mode === 'replace') {
      setReportsList([newReport]);
    } else {
      setReportsList([...filteredActive, newReport]);
    }

    setPendingDuplicate(null);
  };

  const handleCancelRewrite = () => {
    setPendingDuplicate(null);
  };

  const handleAddTechnicianReport = (newReport: TripReportData) => {
    handleReportGenerated(newReport, 'add');
  };

  const handleAddReportToSheet = (report: TripReportData) => {
    setReportsList(prev => {
      const existingIndex = prev.findIndex(r => {
        if (r.id && report.id && r.id.trim() === report.id.trim()) return true;
        const dateMatch = (r.dateOfSchedule || '').trim() === (report.dateOfSchedule || '').trim();
        const techMatch = (r.technician || '').trim().toLowerCase() === (report.technician || '').trim().toLowerCase();
        return dateMatch && techMatch;
      });

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...report };
        return updated;
      }

      return [...prev, report];
    });
  };

  const handleRemoveTechnicianReport = (index: number) => {
    if (reportsList.length <= 1) return;
    setReportsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleLoadSample = () => {
    const report1 = createSampleTripReport({
      technician: 'Koda Costello',
      licensePlate: '20SB0180',
      totalEquipments: '28C/5M',
      dateOfSchedule: '2026-07-20'
    });
    report1.startShift = '7:30 AM';
    report1.endShift = '8:28 PM';
    report1.totalHoursSamsara = '12:58';
    report1.jobs = [{
      id: 'job-koda-1',
      projectNumber: '26-240026',
      startJobTime: '8:24 AM (START OF JOB INSTALL 26-240026)',
      endJobTime: '7:37 PM (END OF JOB INSTALL 26-240026)',
      totalEquipments: '28C/5M',
      totalWorkingHours: '11:13:00',
      jobAssigned: 'Install',
      jobStatus: 'Job Complete'
    }];
    report1.predictedDailyWorkingHours = computePredictedDailyWorkingHours(84.5, report1.jobs);
    report1.actualDailyWorkingHours = '13 hour/s 1 minutes';
    report1.issuesAnomaliesRemarks = 'Assigned project/s complete\nIssues to report (Based on Field Report):\nhad a camera that was disconnecting and not operating tried to fix the problem but wasn\'t able to';
    report1.runningTotalFieldTimeCal = '20 hour/s';
    report1.runningTotalTsheets = '13 hour/s 1 minutes';

    const report2 = createSampleTripReport({
      technician: 'Gilliam Johns',
      licensePlate: 'N580723',
      totalEquipments: '34C/5M',
      dateOfSchedule: '2026-07-20'
    });
    report2.startShift = '8:05 AM';
    report2.endShift = '6:49 PM';
    report2.totalHoursSamsara = '10:44';
    report2.jobs = [{
      id: 'job-gilliam-1',
      projectNumber: '26-240026',
      startJobTime: '10:26 AM (START OF JOB INSTALL 26-240026)',
      endJobTime: '5:33 PM (END OF JOB INSTALL 26-240026)',
      totalEquipments: '34C/5M',
      totalWorkingHours: '7:07:00',
      jobAssigned: 'Install',
      jobStatus: 'Job Complete'
    }];
    report2.predictedDailyWorkingHours = computePredictedDailyWorkingHours(84.5, report2.jobs);
    report2.actualDailyWorkingHours = '11 hour/s 0 minutes';
    report2.issuesAnomaliesRemarks = 'Assigned project/s Complete\nNo Issue/s Found\nNOTE: Install will be continued tomorrow Tuesday schedule';
    report2.runningTotalFieldTimeCal = '21 hour/s 30 minutes';
    report2.runningTotalTsheets = '11 hour/s 0 minutes';

    const userId = currentUserProfile?.uid;
    setReportsList([report1, report2]);

    saveMultipleReportsToHistory([report1, report2], userId);
    setHistoryReports(getStoredHistoryReports(userId));
    setActiveTab('sheet');
  };

  const activeReport = reportsList[0] || null;

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Verifying security credentials & database access...</p>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <AuthLanding
        onAuthSuccess={(profile) => {
          setCurrentUserProfile(profile);
          if (profile.role === 'admin') {
            setIsAdminAuthenticated(true);
          }
        }}
        adminPasscode={settings.adminPasscode || 'admin123'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabClick}
        hasActiveReport={reportsList.length > 0}
        onOpenUserManual={() => setShowUserManualModal(true)}
        isAdminAuthenticated={isAdminAuthenticated}
        onLockAdminSession={handleLockAdminSession}
        currentUserProfile={currentUserProfile}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onReportGenerated={handleReportGenerated}
            onNavigateToSheet={() => setActiveTab('sheet')}
            onNavigateToMap={() => setActiveTab('map')}
            activeReport={activeReport}
            activeReportsList={reportsList}
            historyReports={historyReports}
            onSelectReport={handleAddReportToSheet}
            onRemoveReportFromList={handleRemoveTechnicianReport}
            onRefreshHistory={handleRefreshHistory}
            onDeleteHistoryRecord={handleDeleteHistoryRecord}
            onClearAllHistory={handleClearAllHistory}
            isAdminAuthenticated={isAdminAuthenticated}
            onRequestAdminLock={() => setShowAdminModal(true)}
          />
        )}

        {activeTab === 'sheet' && (
          <TripAnalysisTemplate
            reportsList={reportsList}
            historyReports={historyReports}
            userId={currentUserProfile?.uid}
            currentUserProfile={currentUserProfile}
            onUpdateReportsList={(updatedList) => {
              setReportsList(updatedList);
              const userId = currentUserProfile?.uid;
              saveMultipleReportsToHistory(updatedList, userId);
              setHistoryReports(getStoredHistoryReports(userId));
            }}
            onClearAllReports={() => setReportsList([])}
            onAddTechnicianReport={handleAddTechnicianReport}
            onRemoveTechnicianReport={handleRemoveTechnicianReport}
            settings={settings}
            onBackToDashboard={() => setActiveTab('dashboard')}
            onLoadSample={handleLoadSample}
            onOpenUserManual={() => setShowUserManualModal(true)}
          />
        )}

        <Suspense fallback={
          <div className="flex items-center justify-center p-12 space-x-3 text-amber-600">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-600">Loading module...</span>
          </div>
        }>
          {activeTab === 'map' && (
            <RouteMapViewer
              report={activeReport}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'profile' && currentUserProfile && (
            <UserProfileView
              currentUserProfile={currentUserProfile}
              onProfileUpdated={(updated) => setCurrentUserProfile(updated)}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && currentUserProfile?.role === 'admin' && (
            <Settings
              settings={settings}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                saveSettings(newSettings);
                saveGlobalSettingsToFirestore(newSettings);
              }}
              onLockAdminSession={handleLockAdminSession}
              currentUserProfile={currentUserProfile}
            />
          )}

          {/* Duplicate Record Warning Modal */}
          <DuplicateRecordWarningModal
            isOpen={!!pendingDuplicate}
            existingRecord={pendingDuplicate?.existingReport || null}
            newRecord={pendingDuplicate?.newReport || null}
            onConfirmRewrite={handleConfirmRewrite}
            onCancel={handleCancelRewrite}
          />

          {/* Multiple Projects Equipment Prompt Modal */}
          <MultipleProjectEquipmentModal
            isOpen={!!pendingMultipleProject}
            report={pendingMultipleProject?.newReport || null}
            mode={pendingMultipleProject?.mode || 'replace'}
            onConfirm={handleConfirmMultipleProjectEquipment}
            onCancel={handleCancelMultipleProjectEquipment}
          />

          {/* Admin Lock Modal */}
          <AdminLockModal
            isOpen={showAdminModal}
            onClose={() => setShowAdminModal(false)}
            onUnlockSuccess={() => {
              setIsAdminAuthenticated(true);
              setShowAdminModal(false);
              setActiveTab('settings');
            }}
            currentPasscode={settings.adminPasscode || 'admin123'}
          />

          {/* User Manual Modal */}
          <UserManualModal
            isOpen={showUserManualModal}
            onClose={() => setShowUserManualModal(false)}
            onLoadSample={handleLoadSample}
          />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-800/80 bg-slate-900 py-6 text-slate-400 text-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-200">SchEZTrip</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Trip Analysis Automator</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-slate-400">
            <p className="text-slate-400">
              © 2026 Scheduling Team - Trip Analysis Automator, All rights reserved.
            </p>
            <span className="hidden sm:inline text-slate-800">|</span>
            <p className="text-[10px] text-slate-600/70 font-normal select-none tracking-wide">
              Developed by Patrick Franz O.B.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
