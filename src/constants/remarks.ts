export const STANDARD_REMARKS_OPTIONS: string[] = [
  'Assigned project/s completed',
  'Assigned project/s incomplete',
  'Assigned project/s Job not done',
  'No Issue/s found',
  'LADOTD Monday Notes: LADOTD installation will be continued tomorrow Tuesday schedule',
  'LADOTD Tuesday Notes: Monday Schedule was continued today (LADOTD)',
  'No assigned schedule',
  'Vehicle not used',
  'Assigned project/s complete based on Field report',
  'No activity found',
  'No SAMSARA logs found',
  'No Field Report for Reference',
  'Issue to Report (Based on Field Report):',
  'Construction report summary (Based on Field Report):',
  'Not Able to determine if the assigned projects are completed',
  'In-accurate INTUIT log',
  '(Not able to determine the Actual Daily Working hours)',
  'No T-Sheet log Found',
  'Will use for the Actual daily Working hours based on his Field Report (IN: --:-- AM/PM | OUT: --:-- AM/PM)',
  'No Schedule with Samsara Log/Activity',
  'Custom Notes:'
];

/**
 * Mapping for pre-extraction options that require a cleaned/shortened display line on the Trip Report sheet
 */
export const REMARKS_OUTPUT_MAP: Record<string, string> = {
  'LADOTD Monday Notes: LADOTD installation will be continued tomorrow Tuesday schedule':
    'Notes: LADOTD installation will be continued Tomorrow Tuesday schedule',
  'LADOTD Tuesday Notes: Monday Schedule was continued today (LADOTD)':
    'Notes: Monday Schedule was continued today (LADOTD)'
};

export const STATUS_REMARKS = [
  'Assigned project/s completed',
  'Assigned project/s incomplete',
  'Assigned project/s Job not done'
] as const;

export type StatusRemark = typeof STATUS_REMARKS[number];

export const ITEMS_WITH_INPUT: string[] = [
  'Issue to Report (Based on Field Report):',
  'Custom Notes:'
];

export const DEFAULT_CHECKED_REMARKS: string[] = [
  'Assigned project/s completed',
  'No Issue/s found'
];

export const NO_SCHEDULE_REMARKS: string[] = [
  'No assigned schedule',
  'No Schedule with Samsara Log/Activity'
];

/**
 * Maps a status remark string or text containing a status remark to the corresponding jobStatus value.
 */
export function getJobStatusFromRemark(remarkString: string): 'Job Complete' | 'Incomplete' | 'Not done' | null {
  if (!remarkString) return null;
  const lower = remarkString.toLowerCase();
  
  if (lower.includes('assigned project/s incomplete') || lower.includes('incomplete')) {
    return 'Incomplete';
  }
  if (lower.includes('assigned project/s job not done') || lower.includes('job not done') || lower.includes('not done')) {
    return 'Not done';
  }
  if (
    lower.includes('assigned project/s completed') || 
    lower.includes('assigned project/s complete') ||
    lower.includes('job complete')
  ) {
    return 'Job Complete';
  }
  return null;
}

/**
 * Helper to check if a remark string matches an input-enabled option prefix
 */
export function getInputPrefix(remarkString: string): string | null {
  for (const prefix of ITEMS_WITH_INPUT) {
    if (remarkString.toLowerCase().startsWith(prefix.toLowerCase())) {
      return prefix;
    }
  }
  return null;
}

/**
 * Ensures that selected remarks list has at most ONE status remark (mutually exclusive)
 * and that status remark is placed at the top of the list.
 */
export function sanitizeRemarksSelection(selectedRemarks: string[]): string[] {
  let statusRemarkFound: string | null = null;
  const otherRemarks: string[] = [];

  for (const remark of selectedRemarks) {
    const isStatus = STATUS_REMARKS.some(s => s.toLowerCase() === remark.toLowerCase() || (getInputPrefix(remark) && getInputPrefix(remark) === s));
    if (isStatus) {
      if (!statusRemarkFound) {
        statusRemarkFound = remark;
      }
    } else {
      if (!otherRemarks.includes(remark)) {
        otherRemarks.push(remark);
      }
    }
  }

  if (statusRemarkFound) {
    return [statusRemarkFound, ...otherRemarks];
  }
  return otherRemarks;
}

/**
 * Converts a list of checked remark strings into a single formatted multi-line string for issuesAnomaliesRemarks
 */
export function formatRemarksToString(selectedRemarks: string[], customNotes: string = ''): string {
  const sanitized = sanitizeRemarksSelection(selectedRemarks);
  const lines = sanitized.map(remark => REMARKS_OUTPUT_MAP[remark] || remark);
  if (customNotes && customNotes.trim()) {
    const trimmed = customNotes.trim();
    if (!lines.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
      lines.push(trimmed);
    }
  }
  return lines.join('\n');
}

/**
 * Parses an existing multi-line issuesAnomaliesRemarks string to extract which standard remarks are checked
 */
export function parseRemarksFromString(remarksString: string): {
  checkedRemarks: string[];
  customNotes: string;
} {
  if (!remarksString) {
    return {
      checkedRemarks: [...DEFAULT_CHECKED_REMARKS],
      customNotes: ''
    };
  }

  const existingLines = remarksString
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const rawChecked: string[] = [];
  const customLines: string[] = [];

  existingLines.forEach(line => {
    // Check if line matches an input prefix item (e.g. "Issue to Report (Based on Field Report): ...")
    const inputPrefix = getInputPrefix(line);
    if (inputPrefix) {
      if (!rawChecked.some(r => getInputPrefix(r) === inputPrefix)) {
        rawChecked.push(line);
      }
      return;
    }

    // Check mapped outputs first (e.g. "Notes: LADOTD installation...")
    let foundMatch: string | undefined;
    for (const [rawOption, outputVal] of Object.entries(REMARKS_OUTPUT_MAP)) {
      if (outputVal.toLowerCase() === line.toLowerCase() || rawOption.toLowerCase() === line.toLowerCase()) {
        foundMatch = rawOption;
        break;
      }
    }

    // Exact or case-insensitive match against standard options
    if (!foundMatch) {
      foundMatch = STANDARD_REMARKS_OPTIONS.find(opt => opt.toLowerCase() === line.toLowerCase());
    }

    if (foundMatch) {
      if (!rawChecked.includes(foundMatch)) {
        rawChecked.push(foundMatch);
      }
    } else {
      customLines.push(line);
    }
  });

  const checkedRemarks = sanitizeRemarksSelection(rawChecked);

  return {
    checkedRemarks,
    customNotes: customLines.join('\n')
  };
}
