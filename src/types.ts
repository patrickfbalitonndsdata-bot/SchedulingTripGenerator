export interface JobRow {
  id: string;
  projectNumber: string;
  startJobTime: string;
  endJobTime: string;
  totalEquipments: string;
  totalWorkingHours: string;
  jobAssigned: string;
  jobStatus: 'Job Complete' | 'Incomplete' | 'Not done' | string;
}

export interface KmlWaypoint {
  lat: number;
  lng: number;
  elevation?: number;
  timestamp?: string;
  speed?: number;
}

export interface KmlPlacemark {
  id: string;
  name: string;
  description: string;
  type: 'start' | 'end' | 'stop' | 'job_site' | 'waypoint';
  lat: number;
  lng: number;
  timestamp?: string;
  duration?: string;
  extendedData?: Record<string, string>;
}

export interface ParsedKmlDetails {
  rawFileName: string;
  fileSize: number;
  parsedWaypointsCount: number;
  stopsCount: number;
  totalDistanceMiles: number;
  earliestTimestamp: string;
  latestTimestamp: string;
  durationFormatted: string;
  extractedVehicle: string;
  extractedDriver: string;
  extractedProjectNumbers: string[];
  extractedEquipments: string[];
  waypoints: KmlWaypoint[];
  placemarks: KmlPlacemark[];
  samsaraLogFolderFound?: boolean;
  samsaraFolderName?: string;
  samsaraExtractedTimestamps?: {
    startShift?: string;
    endShift?: string;
    startJobTime?: string;
    endJobTime?: string;
  };
}

export interface TripReportData {
  id: string;
  fileName: string;
  uploadedAt: string;
  mode: 'MANUAL' | 'AUTOMATED';
  region: string;
  dateOfSchedule: string;
  technician: string;
  licensePlate: string;
  startShift: string;
  endShift: string;
  totalHoursSamsara: string;
  jobs: JobRow[];
  predictedDailyWorkingHours: string;
  actualDailyWorkingHours: string;
  issuesAnomaliesRemarks: string;
  weeklyDateRange: string;
  runningTotalFieldTimeCal: string;
  runningTotalTsheets: string;
  isSingleProject?: boolean;
  isNoSchedule?: boolean;
  isLadotExclusive?: boolean;
  kmlData?: ParsedKmlDetails;
}

export interface TechnicianOption {
  id: string;
  name: string;
  defaultRegion: string;
  defaultLicensePlate: string;
  active: boolean;
}

export interface SettingsConfig {
  regions: string[];
  jobTypes: string[];
  jobStatuses: string[];
  technicians: TechnicianOption[];
  fieldTimeBufferMinutes: number;
  samsaraAutoExtract: boolean;
  defaultIssuesText: string;
  adminPasscode?: string;
}
