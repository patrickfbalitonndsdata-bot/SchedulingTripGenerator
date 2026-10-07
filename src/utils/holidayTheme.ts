import { ActiveHolidayTheme, HolidayThemePreference } from '../types';

export interface HolidayThemeMeta {
  id: ActiveHolidayTheme;
  name: string;
  shortLabel: string;
  dateRangeLabel: string;
  emoji: string;
  bannerGreeting: string;
  bannerSubtext: string;
  footerTagline: string;
  badgeClass: string;
  accentTextClass: string;
}

export const HOLIDAY_THEME_OPTIONS: {
  value: HolidayThemePreference;
  label: string;
  dateRange: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: 'auto',
    label: 'Auto (Based on Date)',
    dateRange: 'Automatic Seasonal Schedule',
    emoji: '📅',
    description: 'Automatically activates Halloween (Oct 20–Nov 30), Christmas (Dec 1–31), or New Year (Jan 1–15) based on calendar date.'
  },
  {
    value: 'halloween',
    label: 'Halloween Spooky Cemetery',
    dateRange: 'October 20 – November 30',
    emoji: '🎃',
    description: 'Spooky cemetery with glowing pumpkin heads, floating ghosts, spiders & cobwebs, and lightning flashes.'
  },
  {
    value: 'christmas',
    label: 'Christmas Winter Wonderland',
    dateRange: 'December 1 – December 31',
    emoji: '🎄',
    description: 'Snowy Christmas village & pine forest with flying reindeers & sleigh and falling snowflakes.'
  },
  {
    value: 'new_year',
    label: 'New Year Night Sky & Fireworks',
    dateRange: 'January 1 – January 15',
    emoji: '🎆',
    description: `Displays the current year (${new Date().getFullYear()}) in a starlit night sky with bursting fireworks and twinkling stars.`
  },
  {
    value: 'default',
    label: 'Standard Classic Theme',
    dateRange: 'Year-Round Classic',
    emoji: '⚡',
    description: 'Standard industrial slate & amber SchEZTrip interface without seasonal backdrops.'
  }
];

/**
 * Determines the active holiday theme strictly from a calendar date:
 * - Halloween: October 20 – November 30
 * - Christmas: December 1 – December 31
 * - New Year: January 1 – January 15
 * - Default: All other dates
 */
export function getDateBasedHolidayTheme(date: Date = new Date()): ActiveHolidayTheme {
  const month = date.getMonth(); // 0 = Jan, 9 = Oct, 10 = Nov, 11 = Dec
  const day = date.getDate();

  // Halloween: October 20 (month 9, day >= 20) to November 30 (month 10, day <= 30)
  if ((month === 9 && day >= 20) || (month === 10 && day >= 1 && day <= 30)) {
    return 'halloween';
  }

  // Christmas: Entire month of December (month 11)
  if (month === 11) {
    return 'christmas';
  }

  // New Year: January 1 to January 15 (month 0, day 1..15)
  if (month === 0 && day >= 1 && day <= 15) {
    return 'new_year';
  }

  return 'default';
}

/**
 * Resolves the effective active theme given the saved preference.
 * Defaults to 'auto' (date-based) when preference is undefined or 'auto'.
 */
export function resolveActiveHolidayTheme(
  preference: HolidayThemePreference = 'auto',
  date: Date = new Date()
): ActiveHolidayTheme {
  if (!preference || preference === 'auto') {
    return getDateBasedHolidayTheme(date);
  }
  return preference;
}

export function getHolidayThemeMeta(theme: ActiveHolidayTheme | string = 'default'): HolidayThemeMeta {
  const currentYear = new Date().getFullYear();

  switch (theme) {
    case 'halloween':
      return {
        id: 'halloween',
        name: 'Halloween Spooky Edition',
        shortLabel: 'Halloween',
        dateRangeLabel: 'Oct 20 – Nov 30',
        emoji: '🎃',
        bannerGreeting: '🎃 Spooky Halloween Season • Haunted Cemetery Edition',
        bannerSubtext: 'Eerie moonlight, floating specters, creeping spiders & lightning power your trip analysis.',
        footerTagline: '🕸️ Haunted Cemetery Edition (Oct 20 – Nov 30)',
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        accentTextClass: 'text-orange-400'
      };
    case 'christmas':
      return {
        id: 'christmas',
        name: 'Christmas Holiday Edition',
        shortLabel: 'Christmas',
        dateRangeLabel: 'Dec 1 – Dec 31',
        emoji: '🎄',
        bannerGreeting: '🎄 Merry Christmas & Happy Holidays • Winter Wonderland Edition',
        bannerSubtext: 'Flying reindeers, falling snowflakes, and festive holiday cheer across your trip reports.',
        footerTagline: '🦌 Festive Christmas Edition (December)',
        badgeClass: 'bg-red-500/20 text-emerald-300 border-red-500/40',
        accentTextClass: 'text-emerald-400'
      };
    case 'new_year':
      return {
        id: 'new_year',
        name: `New Year ${currentYear} Edition`,
        shortLabel: `New Year ${currentYear}`,
        dateRangeLabel: 'Jan 1 – Jan 15',
        emoji: '🎆',
        bannerGreeting: `🎆 Happy New Year ${currentYear} • Midnight Fireworks Edition`,
        bannerSubtext: `Celebrating ${currentYear} under a starlit night sky with live fireworks and twinkling stars.`,
        footerTagline: `✨ Happy New Year ${currentYear} Edition (Jan 1 – Jan 15)`,
        badgeClass: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
        accentTextClass: 'text-yellow-300'
      };
    default:
      return {
        id: 'default',
        name: 'Standard Default Theme',
        shortLabel: 'Default',
        dateRangeLabel: 'Standard',
        emoji: '⚡',
        bannerGreeting: 'Automated Samsara Log Processing',
        bannerSubtext: 'Standard Trip Analysis Automator',
        footerTagline: 'Trip Analysis Automator',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        accentTextClass: 'text-amber-400'
      };
  }
}
