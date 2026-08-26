export interface TeamEmailPreset {
  id: string;
  name: string;
  usernameKeys: string[];
  toRecipients: string;
  ccRecipients: string;
  defaultRegion?: string;
}

export const TEAM_EMAIL_PRESETS: TeamEmailPreset[] = [
  {
    id: 'teamjames',
    name: 'Team James',
    usernameKeys: ['teamjames', 'james', 'laciste', 'chrisjames', 'james.laciste@ndsdata.com'],
    toRecipients: "'Chris James Laciste' <james.laciste@ndsdata.com>",
    ccRecipients: "'katrinjoyce.pasucal@ndsdata.com'; 'crislie.busayong@ndsdata.com'",
    defaultRegion: 'South Central'
  },
  {
    id: 'teamdwight',
    name: 'Team Dwight',
    usernameKeys: ['teamdwight', 'dwight', 'pagaduan', 'dwight.pagaduan@ndsdata.com'],
    toRecipients: "'Dwight Pagaduan' <dwight.pagaduan@ndsdata.com>",
    ccRecipients: "'kristine.daantos@ndsdata.com'; 'zaira-lezette.tabion@ndsdata.com'; 'tedylyn.velarde.ndsdata@gmail.com'",
    defaultRegion: 'South Central'
  },
  {
    id: 'teamjohn',
    name: 'Team John',
    usernameKeys: ['teamjohn', 'john', 'bodino', 'john.bodino@ndsdata.com'],
    toRecipients: "'john.bodino@ndsdata.com'",
    ccRecipients: "'carmella.glimer@ndsdata.com'",
    defaultRegion: 'South Central'
  },
  {
    id: 'teamshane',
    name: 'Team Shane',
    usernameKeys: ['teamshane', 'shane', 'ravanes', 'shane.ravanes@ndsdata.com'],
    toRecipients: "'shane.ravanes@ndsdata.com'",
    ccRecipients: "'monica.luzon@ndsdata.com'; 'rhea.janluzelleellaga@ndsdata.com'; 'joannamia.berania@ndsdata.com'",
    defaultRegion: 'South Central'
  },
  {
    id: 'teamjovie',
    name: 'Team Jovie',
    usernameKeys: ['teamjovie', 'jovie', 'calma', 'jovie.calma@ndsdata.com'],
    toRecipients: "'jovie.calma@ndsdata.com'",
    ccRecipients: "'dan.orillaneda@ndsdata.com'",
    defaultRegion: 'South Central'
  },
  {
    id: 'teammarc',
    name: 'Team Marc',
    usernameKeys: ['teammarc', 'marc', 'pagcaliwagan', 'marc.pagcaliwagan@ndsdata.com'],
    toRecipients: "'marc.pagcaliwagan@ndsdata.com'",
    ccRecipients: "'dale.rosacena@ndsdata.com'; 'mich.cantillas@ndsdata.com'",
    defaultRegion: 'South Central'
  }
];

/**
 * Finds matching preset for a given user profile (by username, email, displayName, or id)
 */
export function getEmailPresetForUser(userProfile?: {
  username?: string;
  usernameLower?: string;
  email?: string;
  displayName?: string;
  assignedRegion?: string;
} | null): TeamEmailPreset {
  if (!userProfile) {
    return TEAM_EMAIL_PRESETS[0];
  }

  const uName = (userProfile.usernameLower || userProfile.username || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = (userProfile.email || '').toLowerCase().trim();
  const dName = (userProfile.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const preset of TEAM_EMAIL_PRESETS) {
    const presetId = preset.id.toLowerCase();
    if (uName.includes(presetId) || dName.includes(presetId) || email.includes(presetId)) {
      return preset;
    }
    for (const key of preset.usernameKeys) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9@.]/g, '');
      if (
        (uName && uName.includes(cleanKey)) ||
        (email && email.includes(cleanKey)) ||
        (dName && dName.includes(cleanKey))
      ) {
        return preset;
      }
    }
  }

  return TEAM_EMAIL_PRESETS[0];
}

/**
 * Parses schedule date and returns weekday name (e.g. Monday, Tuesday, Wednesday)
 */
export function getScheduleDayOfWeek(dateStr?: string): string {
  if (!dateStr) return 'Monday';
  try {
    const trimmed = dateStr.trim();
    // MM/DD/YYYY or M/D/YYYY
    const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (mdyMatch) {
      let year = parseInt(mdyMatch[3], 10);
      if (year < 100) year += 2000;
      const month = parseInt(mdyMatch[1], 10) - 1;
      const day = parseInt(mdyMatch[2], 10);
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    // YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    }
  } catch (_) {}
  return 'Monday';
}

/**
 * Builds standard Subject and Greeting message based on region and schedule date
 */
export function buildEmailSubjectAndGreeting(options: {
  assignedRegion?: string;
  reportRegion?: string;
  dateOfSchedule?: string;
}): {
  subject: string;
  introMessage: string;
  cleanRegion: string;
  dayName: string;
} {
  const rawRegion = options.assignedRegion || options.reportRegion || 'South Central';
  // Remove trailing "region" (case-insensitive) to prevent duplication like "South Central Region Region"
  const cleanRegion = rawRegion.replace(/\s+region$/i, '').trim() || 'South Central';
  const dayName = getScheduleDayOfWeek(options.dateOfSchedule);
  const dateStr = options.dateOfSchedule || new Date().toLocaleDateString('en-US');

  // Example: Trip Analysis | South Central Region | 8/26/2026 (Wednesday Schedule)
  const subject = `Trip Analysis | ${cleanRegion} Region | ${dateStr} (${dayName} Schedule)`;

  // Example:
  // Hi All,
  //
  // Please see trip analysis report for the South Central region (Wednesday Schedule).
  const introMessage = `Hi All,\n\nPlease see trip analysis report for the ${cleanRegion} region (${dayName} Schedule).`;

  return {
    subject,
    introMessage,
    cleanRegion,
    dayName
  };
}
