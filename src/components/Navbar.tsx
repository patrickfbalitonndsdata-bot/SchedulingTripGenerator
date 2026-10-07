import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, FileSpreadsheet, Settings, BookOpen, Lock, ShieldCheck, LogOut, UserCog, Sparkles, Crown, Palette, Check, ChevronDown } from 'lucide-react';
import { UserProfile, isSuperAdmin } from '../lib/firebase';
import { getAvatarById } from '../utils/avatars';
import { ActiveHolidayTheme, HolidayThemePreference } from '../types';
import { HOLIDAY_THEME_OPTIONS, getHolidayThemeMeta, getDateBasedHolidayTheme } from '../utils/holidayTheme';

interface NavbarProps {
  activeTab: 'dashboard' | 'sheet' | 'map' | 'profile' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'sheet' | 'map' | 'profile' | 'settings') => void;
  hasActiveReport: boolean;
  onOpenUserManual: () => void;
  isAdminAuthenticated: boolean;
  onLockAdminSession: () => void;
  currentUserProfile?: UserProfile | null;
  onSignOut?: () => void;
  activeHolidayTheme?: ActiveHolidayTheme;
  holidayThemePreference?: HolidayThemePreference;
  onChangeHolidayTheme?: (newTheme: HolidayThemePreference) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasActiveReport,
  onOpenUserManual,
  isAdminAuthenticated,
  onLockAdminSession,
  currentUserProfile,
  onSignOut,
  activeHolidayTheme = 'default',
  holidayThemePreference = 'auto',
  onChangeHolidayTheme
}) => {
  const avatar = getAvatarById(currentUserProfile?.avatarId);
  const isSuper = isSuperAdmin(currentUserProfile);
  const canManageTheme = currentUserProfile?.role === 'admin' || isSuper;

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeMeta = getHolidayThemeMeta(activeHolidayTheme);
  const currentOption = HOLIDAY_THEME_OPTIONS.find(o => o.value === holidayThemePreference) || HOLIDAY_THEME_OPTIONS[0];
  const autoResolvedMeta = getHolidayThemeMeta(getDateBasedHolidayTheme());

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md select-none transition-colors">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[4rem] py-2 md:py-0 gap-2.5 md:gap-4">
          
          {/* 1. Left Branding Section */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0" 
            onClick={() => setActiveTab('dashboard')}
            title="Go to Dashboard"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform ${
              activeHolidayTheme === 'halloween'
                ? 'bg-gradient-to-br from-orange-500 to-purple-700 text-white shadow-orange-500/30'
                : activeHolidayTheme === 'christmas'
                ? 'bg-gradient-to-br from-red-600 to-emerald-700 text-white shadow-red-500/30'
                : activeHolidayTheme === 'new_year'
                ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 shadow-yellow-400/30'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-amber-500/20'
            }`}>
              {activeHolidayTheme !== 'default' ? (
                <span className="text-lg leading-none">{themeMeta.emoji}</span>
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                  SchEZTrip
                </span>
                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-md whitespace-nowrap ${themeMeta.badgeClass}`}>
                  {activeHolidayTheme === 'default' ? 'Automator' : themeMeta.shortLabel}
                </span>
              </div>
              <p className="text-[10px] text-slate-300/80 font-medium tracking-wide whitespace-nowrap hidden sm:block">
                {activeHolidayTheme === 'default' ? 'Trip Analysis Automator' : themeMeta.name}
              </p>
            </div>
          </div>

          {/* 2. Center Navigation Links (Clean single row, no scrollbars) */}
          <nav className="flex items-center justify-center space-x-1 sm:space-x-1.5 shrink">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800/90 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-200 hover:bg-slate-800/60 hover:text-white'
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
                  : 'text-slate-200 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Trip Report Sheet</span>
              {hasActiveReport && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs" />
              )}
            </button>

            {/* Settings Tab - Visible for ADMIN accounts only */}
            {canManageTheme && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-slate-800/90 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-200 hover:bg-slate-800/60 hover:text-white'
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
            {/* ADMIN / SUPERADMIN ONLY: Holiday Theme Selector Dropdown */}
            {canManageTheme && onChangeHolidayTheme && (
              <div className="relative" ref={themeMenuRef}>
                <button
                  type="button"
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  title="Admin Holiday Theme Selector"
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold text-amber-200 bg-slate-800/90 hover:bg-slate-800 border border-amber-500/40 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentOption.emoji}</span>
                  <span className="hidden xl:inline">
                    {holidayThemePreference === 'auto'
                      ? `Theme: Auto (${autoResolvedMeta.shortLabel})`
                      : `Theme: ${themeMeta.shortLabel}`}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {themeMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-white space-y-1">
                    <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5" />
                          <span>System Holiday Theme</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Admin & Superadmin Exclusive Control
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                        Animations Active
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {HOLIDAY_THEME_OPTIONS.map((opt) => {
                        const isSelected = holidayThemePreference === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              onChangeHolidayTheme(opt.value);
                              setThemeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border border-amber-500/50 text-white'
                                : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-base leading-none mt-0.5">{opt.emoji}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span className="truncate">{opt.label}</span>
                                </div>
                                <span className="text-[10px] text-amber-300/90 font-semibold block">
                                  {opt.dateRange}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

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


