import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Globe, Settings, BookOpen, Lock, ShieldCheck, LogOut, UserCog, Sparkles, Crown } from 'lucide-react';
import { UserProfile, isSuperAdmin } from '../lib/firebase';
import { getAvatarById } from '../utils/avatars';

interface NavbarProps {
  activeTab: 'dashboard' | 'sheet' | 'map' | 'profile' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'sheet' | 'map' | 'profile' | 'settings') => void;
  hasActiveReport: boolean;
  onOpenUserManual: () => void;
  isAdminAuthenticated: boolean;
  onLockAdminSession: () => void;
  currentUserProfile?: UserProfile | null;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasActiveReport,
  onOpenUserManual,
  isAdminAuthenticated,
  onLockAdminSession,
  currentUserProfile,
  onSignOut
}) => {
  const avatar = getAvatarById(currentUserProfile?.avatarId);
  const isSuper = isSuperAdmin(currentUserProfile);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md select-none">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[4rem] py-2 md:py-0 gap-2.5 md:gap-4">
          
          {/* 1. Left Branding Section */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0" 
            onClick={() => setActiveTab('dashboard')}
            title="Go to Dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                  SchEZTrip
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-md whitespace-nowrap">
                  Automator
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide whitespace-nowrap hidden sm:block">
                Trip Analysis Automator
              </p>
            </div>
          </div>

          {/* 2. Center Navigation Links (Clean single row, no scrollbars) */}
          <nav className="flex items-center justify-center space-x-1 sm:space-x-1.5 shrink">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700/90 shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Dashboard & Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('sheet')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sheet'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Trip Report Sheet</span>
              {hasActiveReport && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700/90 shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>SchEZPath</span>
            </button>

            {/* Settings Tab - Visible for ADMIN accounts only */}
            {currentUserProfile?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700/90 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Settings</span>
                {isAdminAuthenticated ? (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>ADMIN</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* 3. Right Account & Action Area */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Account Avatar / Name Pill - CLICKABLE for Profile Settings */}
            {currentUserProfile && (
              <button
                onClick={() => setActiveTab('profile')}
                title="Click to open Profile Settings"
                className={`flex items-center space-x-2 px-2.5 py-1 rounded-xl border transition-all cursor-pointer group ${
                  activeTab === 'profile'
                    ? 'bg-slate-800 text-amber-300 border-amber-500/60 ring-2 ring-amber-500/30 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-amber-500/40'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-sm font-bold shadow-xs border ${avatar.borderColor} transition-transform group-hover:scale-105`}>
                  <span>{avatar.emoji}</span>
                </div>

                {/* Name & Role */}
                <div className="text-left hidden lg:block">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors leading-none">
                      {currentUserProfile.displayName || 'User'}
                    </p>
                    {isSuper ? (
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ) : (
                      <Sparkles className="w-2.5 h-2.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <p className="text-[9px] text-amber-400 font-bold capitalize leading-none mt-0.5">
                    {isSuper ? 'Superadmin' : `${currentUserProfile.role} • ${currentUserProfile.assignedRegion || 'Active'}`}
                  </p>
                </div>

                {/* Profile settings icon indicator */}
                <UserCog className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
              </button>
            )}

            {/* User Manual Button */}
            <button
              onClick={onOpenUserManual}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all cursor-pointer"
              title="View User Manual"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">User Manual</span>
            </button>

            {/* Sign Out Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign Out of Account"
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

