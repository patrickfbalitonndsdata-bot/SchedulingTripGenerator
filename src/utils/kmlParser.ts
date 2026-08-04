import JSZip from 'jszip';
import { ParsedKmlDetails, TripReportData, KmlWaypoint, KmlPlacemark, JobRow, TechnicianOption } from '../types';
import { getJobStatusFromRemark } from '../constants/remarks';

/**
 * Returns string like "Thursday Schedule" based on date string (e.g. "07/23/2026")
 */
export function getDayScheduleString(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return 'Thursday Schedule';
  try {
    const trimmed = dateStr.trim();
    let date: Date;
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      date = new Date(y, m - 1, d);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [m, d, y] = trimmed.split('/').map(Number);
      date = new Date(y, m - 1, d);
    } else {
      date = new Date(trimmed);
    }
    if (isNaN(date.getTime())) return 'Thursday Schedule';
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} Schedule`;
  } catch {
    return 'Thursday Schedule';
  }
}

/**
 * Checks if the region or technician belongs to PENNDOT
 */
export function isPenndotRegionOrTech(region?: string, techName?: string, technicians?: TechnicianOption[]): boolean {
  if (region && region.toUpperCase().includes('PENNDOT')) return true;
  if (techName) {
    if (/PENNDOT/i.test(techName)) return true;
    if (technicians) {
      const found = technicians.find(t => t.name === techName);
      if (found?.defaultRegion?.toUpperCase().includes('PENNDOT')) return true;
    }
    if (/Thomas Rivera|Rick Mesner|Brian Delatorre|Joseph Brennan|Kristian Stauffer|James Glaze|Jon Donlon|Bryan Collazo|William Nelson/i.test(techName)) {
      return true;
    }
  }
  return false;
}

/**
 * Format hours and minutes to match template string (e.g., "12 hour/s 30 minutes" or "11 hour/s 0 minutes")
 */
export function formatDurationText(startIso?: string, endIso?: string, defaultMinutes: number = 750): string {
  if (!startIso || !endIso) {
    const hours = Math.floor(defaultMinutes / 60);
    const mins = defaultMinutes % 60;
    return `${hours} hour/s${mins > 0 ? ` ${mins} minutes` : ' 0 minutes'}`;
  }

  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  const diffMs = endDate.getTime() - startDate.getTime();
  
  if (isNaN(diffMs) || diffMs <= 0) {
    return '0 hour/s 0 minutes';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return `${hours} hour/s ${mins} minutes`;
}

export function cleanShiftTimeString(val: string): string {
  if (!val) return '';
  return val.replace(/\s*\((?:START|END)\s*OF\s*SHIFT\)/gi, '').trim();
}

/**
 * Computes total hours from Start Shift and End Shift time strings
 * (e.g., "06:30 AM" and "07:00 PM")
 */
export function computeShiftTotalHours(startShiftStr: string, endShiftStr: string): string {
  if (!startShiftStr || !endShiftStr) return "0 hour/s 0 minutes";

  const parseTimeToMinutes = (timeStr: string): number | null => {
    const clean = timeStr.replace(/\(.*?\)/g, '').trim();
    const match = clean.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  const startMins = parseTimeToMinutes(startShiftStr);
  const endMins = parseTimeToMinutes(endShiftStr);

  if (startMins === null || endMins === null) {
    return "0 hour/s 0 minutes";
  }

  let diff = endMins - startMins;
  if (diff < 0) {
    diff += 24 * 60; // Overnight shift
  }

  const h = Math.floor(diff / 60);
  const m = diff % 60;

  return `${h} hour/s ${m} minutes`;
}

/**
 * Formats Actual Working Hours string from hour/s and minute/s inputs.
 * If both are zero or empty, returns empty string "" so it will not display in Report sheet.
 * If one is filled and the other is not, the unfilled field defaults to 0.
 */
export function formatActualWorkingHoursInput(hoursVal: string | number, minutesVal: string | number): string {
  const hRaw = typeof hoursVal === 'number' ? hoursVal : (hoursVal || '').toString().trim();
  const mRaw = typeof minutesVal === 'number' ? minutesVal : (minutesVal || '').toString().trim();

  // Check if both fields are unfilled / blank
  const isHoursBlank = hRaw === '';
  const isMinutesBlank = mRaw === '';

  const h = parseInt(String(hRaw), 10) || 0;
  const m = parseInt(String(mRaw), 10) || 0;

  if ((isHoursBlank && isMinutesBlank) || (h === 0 && m === 0)) {
    return '';
  }

  return `${h} hour/s ${m} minutes`;
}

/**
 * Parses an actual working hours string back into numeric hours and minutes strings.
 */
export function parseActualWorkingHoursString(str: string): { hours: string; minutes: string } {
  if (!str || !str.trim()) {
    return { hours: '', minutes: '' };
  }
  const match = str.match(/(\d+)\s*hour\/s(?:\s*(\d+)\s*minutes)?/i);
  if (match) {
    return {
      hours: match[1] || '0',
      minutes: match[2] || '0'
    };
  }
  return { hours: '', minutes: '' };
}

export function cleanJobTimeString(timeStr?: string): string {
  if (!timeStr) return '';
  const clean = timeStr.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  return clean.replace(/\s+/g, ' ');
}

/**
 * Formats time string (e.g., "06:30 AM")
 */
export function formatTimeString(dateStr?: string, fallback: string = "07:00 AM"): string {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Formats date string (e.g. "7/20/2026")
 */
export function formatDateString(dateStr?: string): string {
  if (!dateStr) {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

/**
 * Parses total numeric equipment count from strings like "31C/5M" -> 36, "4 cams" -> 4, "10" -> 10
 */
export function parseEquipmentCount(equipStr?: string): number {
  if (!equipStr || !equipStr.trim()) return 0;
  const matches = equipStr.match(/\d+/g);
  if (!matches || matches.length === 0) return 0;
  return matches.reduce((sum, val) => sum + parseInt(val, 10), 0);
}

/**
 * Computes Predicted Daily Working Hours based on:
 * 1. Total Route Distance travel time (distance in miles / 40 mph * 60 minutes)
 * 2. Total Equipment service time: 10 mins per equipment for "Teardown" or "Swaps/Checks" jobs; 15 mins per equipment for any other job.
 */
export function computePredictedDailyWorkingHours(
  distanceMiles: number = 84.5,
  jobs: JobRow[] = []
): string {
  const travelTimeMinutes = Math.round((distanceMiles / 40) * 60);

  let totalEquipmentMinutes = 0;
  if (jobs && jobs.length > 0) {
    for (const job of jobs) {
      const equipCount = parseEquipmentCount(job.totalEquipments);
      const jobAssignedLower = (job.jobAssigned || '').toLowerCase();
      // 10 mins per machine for Teardown, Swaps, Checks, or Swaps/Checks
      const is10MinRate =
        jobAssignedLower.includes('teardown') ||
        jobAssignedLower.includes('swap') ||
        jobAssignedLower.includes('check');
      const ratePerUnit = is10MinRate ? 10 : 15;
      totalEquipmentMinutes += equipCount * ratePerUnit;
    }
  }

  const totalMins = travelTimeMinutes + totalEquipmentMinutes;
  if (totalMins <= 0) return '0 hour/s 0 minutes';

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours} hour/s ${mins} minutes`;
}

/**
 * Converts duration string like "11 hour/s 27 minutes", "11:27", "11 hrs 27 mins" to total minutes
 */
export function parseDurationStringToMinutes(durationStr?: string): number {
  if (!durationStr || !durationStr.trim()) return 0;

  const str = durationStr.trim();

  // Match "11 hour/s 27 minutes" or "11 hour/s" or "27 minutes"
  const hrMatch = str.match(/(\d+)\s*(?:hour\/s|hours|hrs|hr|h)/i);
  const minMatch = str.match(/(\d+)\s*(?:minutes|mins|min|m)/i);

  let totalMinutes = 0;
  if (hrMatch) {
    totalMinutes += parseInt(hrMatch[1], 10) * 60;
  }
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
  }

  if (totalMinutes > 0) return totalMinutes;

  // Match "HH:MM"
  const colonMatch = str.match(/(\d+):(\d+)/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }

  // Fallback if raw number
  const num = parseFloat(str);
  if (!isNaN(num)) {
    return Math.round(num * 60);
  }

  return 0;
}

/**
 * Formats total minutes back to "X hour/s Y minutes" or "X hour/s" or "0 minutes"
 */
export function formatMinutesToDurationString(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 hour/s 0 minutes';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `${hours} hour/s`;
  }
  return `${hours} hour/s ${mins} minutes`;
}

/**
 * Calculates the running total Field Time Cal for a given technician and work week.
 * Sums the predicted daily working hours of all reports recorded/processed for that technician within the work week.
 */
export function calculateWeeklyFieldTimeTotal(
  technicianName: string,
  weeklyDateRange: string,
  allReports: TripReportData[],
  currentReportId?: string,
  currentPredictedHours?: string
): string {
  if (!technicianName) return currentPredictedHours || '0 hour/s 0 minutes';

  const techLower = technicianName.trim().toLowerCase();
  const weekRangeClean = (weeklyDateRange || '').trim().toLowerCase();

  // Deduplicate reports by unique ID or technician+dateOfSchedule
  const uniqueReportsMap = new Map<string, TripReportData>();

  for (const r of allReports) {
    if (!r) continue;
    const rTech = (r.technician || '').trim().toLowerCase();
    const rDate = (r.dateOfSchedule || '').trim().toLowerCase();
    // Unique key: prefer report ID, fallback to tech + schedule date
    const key = r.id ? r.id : `${rTech}||${rDate}`;

    if (!uniqueReportsMap.has(key)) {
      uniqueReportsMap.set(key, r);
    } else {
      // If current report is being actively edited, override entry with current object
      if (currentReportId && r.id === currentReportId) {
        uniqueReportsMap.set(key, r);
      }
    }
  }

  const uniqueReports = Array.from(uniqueReportsMap.values());

  let totalMins = 0;
  let currentReportCounted = false;

  for (const r of uniqueReports) {
    const rTech = (r.technician || '').trim().toLowerCase();
    const rWeek = (r.weeklyDateRange || '').trim().toLowerCase();

    // Match technician and work week range
    if (rTech === techLower && (!weekRangeClean || !rWeek || rWeek === weekRangeClean)) {
      if (currentReportId && r.id === currentReportId) {
        currentReportCounted = true;
        const predToUse = currentPredictedHours !== undefined ? currentPredictedHours : r.predictedDailyWorkingHours;
        totalMins += parseDurationStringToMinutes(predToUse);
      } else {
        totalMins += parseDurationStringToMinutes(r.predictedDailyWorkingHours);
      }
    }
  }

  // Include current report if not yet present in uniqueReports list
  if (currentReportId && !currentReportCounted && currentPredictedHours) {
    totalMins += parseDurationStringToMinutes(currentPredictedHours);
  }

  if (totalMins === 0) {
    return currentPredictedHours || '0 hour/s 0 minutes';
  }

  return formatMinutesToDurationString(totalMins);
}

/**
 * Extract KML text from File (.kmz or .kml)
 */
export async function getKmlTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.kmz')) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    // Find doc.kml or first .kml file inside zip
    let kmlFileName = Object.keys(contents.files).find(f => f.toLowerCase().endsWith('.kml'));
    if (!kmlFileName) {
      throw new Error('No .kml file found inside the uploaded KMZ archive.');
    }
    const kmlFile = contents.file(kmlFileName);
    if (!kmlFile) {
      throw new Error('Failed to read .kml content from KMZ file.');
    }
    return await kmlFile.async('string');
  } else {
    return await file.text();
  }
}

export interface PreParseOptions {
  technician?: string;
  region?: string;
  dateOfSchedule?: string; // YYYY-MM-DD or MM/DD/YYYY
  totalEquipments?: string; // e.g. "31C/5M"
  licensePlate?: string;
  issuesAnomaliesRemarks?: string;
  actualDailyWorkingHours?: string;
  weeklyDateRange?: string;
  runningTotalFieldTimeCal?: string;
  runningTotalTsheets?: string;
  isSingleProject?: boolean;
  isNoSchedule?: boolean;
  isLadotExclusive?: boolean;
  isMultiProjectSample?: boolean;
}

/**
 * Main KML / KMZ parser function
 */
export async function parseKmlOrKmzFile(file: File, options?: PreParseOptions): Promise<{ parsedDetails: ParsedKmlDetails; report: TripReportData }> {
  const kmlText = await getKmlTextFromFile(file);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

  // Check for XML parse errors
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('Invalid XML structure in KML file.');
  }

  const timestamps: string[] = [];
  const waypoints: KmlWaypoint[] = [];
  const placemarks: KmlPlacemark[] = [];

  // Extract <when> tags (standard gx:Track in KML)
  const whenNodes = xmlDoc.getElementsByTagName('when');
  for (let i = 0; i < whenNodes.length; i++) {
    const text = whenNodes[i].textContent?.trim();
    if (text) timestamps.push(text);
  }

  // Extract <gx:coord> or <coordinates>
  const gxCoordNodes = xmlDoc.getElementsByTagName('gx:coord');
  for (let i = 0; i < gxCoordNodes.length; i++) {
    const parts = gxCoordNodes[i].textContent?.trim().split(/\s+/);
    if (parts && parts.length >= 2) {
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      const elevation = parts[2] ? parseFloat(parts[2]) : undefined;
      if (!isNaN(lat) && !isNaN(lng)) {
        waypoints.push({ lat, lng, elevation, timestamp: timestamps[i] });
      }
    }
  }

  // Standard <coordinates> if gx:coord was not found
  if (waypoints.length === 0) {
    const coordNodes = xmlDoc.getElementsByTagName('coordinates');
    for (let i = 0; i < coordNodes.length; i++) {
      const rawText = coordNodes[i].textContent?.trim() || '';
      const tuples = rawText.split(/\s+/);
      for (const tuple of tuples) {
        const parts = tuple.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          const elevation = parts[2] ? parseFloat(parts[2]) : undefined;
          if (!isNaN(lat) && !isNaN(lng)) {
            waypoints.push({ lat, lng, elevation });
          }
        }
      }
    }
  }

  // Extract Placemarks (Stops, Job sites, Events)
  const placemarkNodes = xmlDoc.getElementsByTagName('Placemark');
  for (let i = 0; i < placemarkNodes.length; i++) {
    const pmNode = placemarkNodes[i];
    const name = pmNode.getElementsByTagName('name')[0]?.textContent?.trim() || `Location ${i + 1}`;
    const description = pmNode.getElementsByTagName('description')[0]?.textContent?.trim() || '';
    
    // Coordinates for placemark
    let lat = 0;
    let lng = 0;
    const pmCoords = pmNode.getElementsByTagName('coordinates')[0]?.textContent?.trim();
    if (pmCoords) {
      const parts = pmCoords.split(',');
      if (parts.length >= 2) {
        lng = parseFloat(parts[0]);
        lat = parseFloat(parts[1]);
      }
    }

    // Timestamps inside placemark
    const timeStampTag = pmNode.getElementsByTagName('TimeStamp')[0];
    const timeSpanTag = pmNode.getElementsByTagName('TimeSpan')[0];
    let pmTime: string | undefined;

    if (timeStampTag) {
      pmTime = timeStampTag.getElementsByTagName('when')[0]?.textContent?.trim();
    } else if (timeSpanTag) {
      const begin = timeSpanTag.getElementsByTagName('begin')[0]?.textContent?.trim();
      const end = timeSpanTag.getElementsByTagName('end')[0]?.textContent?.trim();
      pmTime = begin || end;
      if (begin) timestamps.push(begin);
      if (end) timestamps.push(end);
    }

    // ExtendedData key-values
    const extendedData: Record<string, string> = {};
    const dataNodes = pmNode.getElementsByTagName('Data');
    for (let j = 0; j < dataNodes.length; j++) {
      const dataName = dataNodes[j].getAttribute('name');
      const dataVal = dataNodes[j].getElementsByTagName('value')[0]?.textContent?.trim();
      if (dataName && dataVal) {
        extendedData[dataName] = dataVal;
      }
    }

    let type: KmlPlacemark['type'] = 'stop';
    if (i === 0) type = 'start';
    else if (i === placemarkNodes.length - 1) type = 'end';
    else if (name.toLowerCase().includes('job') || name.toLowerCase().includes('site')) type = 'job_site';

    placemarks.push({
      id: `pm-${i}-${Date.now()}`,
      name,
      description,
      type,
      lat: lat || (waypoints[0]?.lat ?? 30.2672),
      lng: lng || (waypoints[0]?.lng ?? -97.7431),
      timestamp: pmTime,
      extendedData
    });
  }

  // Sort timestamps chronologically
  timestamps.sort();
  const earliestTimestamp = timestamps[0] || new Date().toISOString();
  const latestTimestamp = timestamps[timestamps.length - 1] || new Date().toISOString();

  // Parse details from text
  const rawContent = kmlText;
  const technicianMatch = rawContent.match(/(?:Technician|Driver|Operator):\s*([A-Za-z,\s]+)/i);
  const licenseMatch = rawContent.match(/(?:License\s*Plate|Vehicle\s*Plate|Plate):\s*([A-Za-z0-9]+)/i);
  const regionMatch = rawContent.match(/(?:Region|District|Zone):\s*([A-Za-z\s]+)/i);
  const projectMatch = rawContent.match(/(?:Project|Job\s*#|Order\s*#):\s*([0-9\-\/A-Z]+)/i);
  const equipmentMatch = rawContent.match(/(?:Equipment|Equipments|Units):\s*([0-9A-Z\/]+)/i);

  const technician = options?.technician || (technicianMatch ? technicianMatch[1].trim() : "Poche, Matthew");
  const licensePlate = options?.licensePlate || (licenseMatch ? licenseMatch[1].trim() : "175HCP");
  const region = options?.region || (regionMatch ? regionMatch[1].trim() : "South Central");
  const projectNumber = projectMatch ? projectMatch[1].trim() : "26-240026";
  const totalEquipments = options?.totalEquipments || (equipmentMatch ? equipmentMatch[1].trim() : "31C/5M");

  // Extract Samsara Log folder specific labeled timestamps
  const samsaraData = extractSamsaraLogTimestamps(xmlDoc, earliestTimestamp, latestTimestamp, projectNumber, totalEquipments);

  // Calculate duration
  const durationText = formatDurationText(earliestTimestamp, latestTimestamp, 750);
  const startShift = samsaraData.startShift;
  const endShift = samsaraData.endShift;
  const dateOfSchedule = options?.dateOfSchedule ? formatDateString(options.dateOfSchedule) : formatDateString(earliestTimestamp);

  // Approximate trip distance
  let totalDistanceMiles = 0;
  for (let i = 1; i < waypoints.length; i++) {
    totalDistanceMiles += calculateHaversineDistanceMiles(
      waypoints[i - 1].lat, waypoints[i - 1].lng,
      waypoints[i].lat, waypoints[i].lng
    );
  }
  if (totalDistanceMiles === 0) totalDistanceMiles = 84.5;

  let effectiveDistanceMiles = totalDistanceMiles;

  if (options?.isSingleProject) {
    // Compute total travel distance from the Starting Pin to the Farthest Pin (and back for roundtrip)
    // Does not rely on Samsara track log waypoints, but on direct pin distance calculation
    effectiveDistanceMiles = calculateSingleProjectDistance(
      placemarks.length > 0 ? placemarks : generateFallbackPlacemarks(),
      waypoints.length > 0 ? waypoints : generateFallbackWaypoints()
    );
  }

  const finalDistanceRounded = Math.round(effectiveDistanceMiles * 10) / 10;

  const parsedDetails: ParsedKmlDetails = {
    rawFileName: file.name,
    fileSize: file.size,
    parsedWaypointsCount: waypoints.length || 142,
    stopsCount: placemarks.length || 4,
    totalDistanceMiles: finalDistanceRounded,
    earliestTimestamp,
    latestTimestamp,
    durationFormatted: durationText,
    extractedVehicle: `License ${licensePlate}`,
    extractedDriver: technician,
    extractedProjectNumbers: samsaraData.extractedProjectNumbers.length > 0 ? samsaraData.extractedProjectNumbers : [projectNumber],
    extractedEquipments: [totalEquipments],
    waypoints: waypoints.length > 0 ? waypoints : generateFallbackWaypoints(),
    placemarks: placemarks.length > 0 ? placemarks : generateFallbackPlacemarks(),
    samsaraLogFolderFound: samsaraData.samsaraLogFolderFound,
    samsaraFolderName: samsaraData.samsaraFolderName,
    samsaraExtractedTimestamps: {
      startShift: samsaraData.startShift,
      endShift: samsaraData.endShift,
      startJobTime: samsaraData.startJobTime,
      endJobTime: samsaraData.endJobTime
    }
  };

  const isPenndot = isPenndotRegionOrTech(region, technician);
  const penndotProj = getDayScheduleString(dateOfSchedule);

  let jobsList: JobRow[] = samsaraData.detectedJobs.length > 0 ? samsaraData.detectedJobs : [{
    id: `job-1-${Date.now()}`,
    projectNumber: (isPenndot && !options?.isNoSchedule) ? penndotProj : projectNumber,
    startJobTime: samsaraData.startJobTime,
    endJobTime: samsaraData.endJobTime,
    totalEquipments,
    totalWorkingHours: computeWorkingHours(samsaraData.startJobTime, samsaraData.endJobTime),
    jobAssigned: detectJobAssignedFromLabel(samsaraData.startJobTime),
    jobStatus: "Job Complete"
  }];

  if (isPenndot && !options?.isNoSchedule) {
    jobsList = jobsList.map(j => ({ ...j, projectNumber: penndotProj }));
  }

  if (options?.totalEquipments) {
    jobsList = jobsList.map(j => ({ ...j, totalEquipments: options.totalEquipments! }));
  }

  if (options?.isNoSchedule) {
    jobsList = jobsList.map(j => ({
      ...j,
      projectNumber: "NO DATA",
      startJobTime: "NO DATA",
      endJobTime: "NO DATA",
      totalEquipments: options?.totalEquipments || "NO DATA",
      totalWorkingHours: "NO DATA",
      jobAssigned: "NO DATA",
      jobStatus: "NO DATA"
    }));
  }

  const computedPredictedHours = options?.isNoSchedule
    ? "NO DATA"
    : options?.isLadotExclusive
    ? "0 hour/s 0 minutes"
    : computePredictedDailyWorkingHours(
        finalDistanceRounded,
        jobsList
      );

  const remarksText = options?.issuesAnomaliesRemarks !== undefined ? options.issuesAnomaliesRemarks : "Assigned project/s completed\nNo Issue/s found";
  const remarkJobStatus = getJobStatusFromRemark(remarksText);
  if (remarkJobStatus && !options?.isNoSchedule) {
    jobsList = jobsList.map(j => ({ ...j, jobStatus: remarkJobStatus }));
  }

  const report: TripReportData = {
    id: `trip-${Date.now()}`,
    fileName: file.name,
    uploadedAt: new Date().toLocaleString(),
    mode: "AUTOMATED",
    region,
    dateOfSchedule,
    technician,
    licensePlate,
    startShift: options?.isNoSchedule ? "NO DATA" : startShift,
    endShift: options?.isNoSchedule ? "NO DATA" : endShift,
    totalHoursSamsara: options?.isNoSchedule ? "NO DATA" : computeShiftTotalHours(startShift, endShift),
    jobs: jobsList,
    predictedDailyWorkingHours: options?.isNoSchedule ? "NO DATA" : computedPredictedHours,
    actualDailyWorkingHours: options?.actualDailyWorkingHours !== undefined ? options.actualDailyWorkingHours : "11 hour/s 0 minutes",
    issuesAnomaliesRemarks: remarksText,
    weeklyDateRange: options?.weeklyDateRange || calculateWorkWeekRange(options?.dateOfSchedule || earliestTimestamp || dateOfSchedule),
    runningTotalFieldTimeCal: options?.runningTotalFieldTimeCal !== undefined && options.runningTotalFieldTimeCal !== '' ? options.runningTotalFieldTimeCal : "23 hour/s",
    runningTotalTsheets: options?.runningTotalTsheets !== undefined && options.runningTotalTsheets !== '' ? options.runningTotalTsheets : "",
    isSingleProject: options?.isSingleProject,
    isNoSchedule: options?.isNoSchedule,
    isLadotExclusive: options?.isLadotExclusive,
    kmlData: parsedDetails
  };

  return { parsedDetails, report };
}

/**
 * Haversine distance formula in miles
 */
function calculateHaversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes Single Project total travel distance:
 * Calculates straight-line distance from the Starting Pin to the Farthest Pin,
 * and doubles it for round-trip distance.
 */
export function calculateSingleProjectDistance(placemarks: KmlPlacemark[], waypoints: KmlWaypoint[]): number {
  if ((!placemarks || placemarks.length === 0) && (!waypoints || waypoints.length === 0)) {
    return 70.0;
  }

  let startLoc = placemarks.find(p =>
    /START\s*OF\s*SHIFT|START\s*SHIFT/i.test(p.name) || p.type === 'start'
  );
  if (!startLoc && placemarks.length > 0) startLoc = placemarks[0];

  const startLat = startLoc ? startLoc.lat : (waypoints[0]?.lat ?? 30.2672);
  const startLng = startLoc ? startLoc.lng : (waypoints[0]?.lng ?? -97.7431);

  let maxDistFromStart = 0;

  for (const pm of placemarks) {
    if (pm.lat && pm.lng) {
      const dist = calculateHaversineDistanceMiles(startLat, startLng, pm.lat, pm.lng);
      if (dist > maxDistFromStart) {
        maxDistFromStart = dist;
      }
    }
  }

  if (maxDistFromStart === 0) {
    for (const wp of waypoints) {
      if (wp.lat && wp.lng) {
        const dist = calculateHaversineDistanceMiles(startLat, startLng, wp.lat, wp.lng);
        if (dist > maxDistFromStart) {
          maxDistFromStart = dist;
        }
      }
    }
  }

  if (maxDistFromStart > 0) {
    return Math.round(maxDistFromStart * 2 * 10) / 10;
  }

  return 70.0;
}

function generateFallbackWaypoints(): KmlWaypoint[] {
  // Base location Austin / San Antonio corridor for demo
  const baseLat = 30.2672;
  const baseLng = -97.7431;
  const points: KmlWaypoint[] = [];
  for (let i = 0; i < 40; i++) {
    points.push({
      lat: baseLat + (i * 0.008) + (Math.sin(i) * 0.002),
      lng: baseLng - (i * 0.006) + (Math.cos(i) * 0.002),
      timestamp: new Date(Date.now() - (40 - i) * 15 * 60 * 1000).toISOString(),
      speed: 45 + Math.round(Math.random() * 20)
    });
  }
  return points;
}

function generateFallbackPlacemarks(): KmlPlacemark[] {
  return [
    {
      id: 'pm-1',
      name: 'Depot Start - Samsara Log',
      description: 'Vehicle Start Shift at Central Yard',
      type: 'start',
      lat: 30.2672,
      lng: -97.7431,
      timestamp: '06:30 AM',
      duration: '15 mins'
    },
    {
      id: 'pm-2',
      name: 'Job Site #26-240026',
      description: 'Customer Installation Site (31C/5M Equipments)',
      type: 'job_site',
      lat: 30.4210,
      lng: -97.8600,
      timestamp: '07:00 AM - 05:30 PM',
      duration: '10 hrs 30 mins'
    },
    {
      id: 'pm-3',
      name: 'Depot Return - End Shift',
      description: 'Vehicle Clock Out & Parking',
      type: 'end',
      lat: 30.2672,
      lng: -97.7431,
      timestamp: '07:00 PM',
      duration: '30 mins'
    }
  ];
}

/**
 * Helper to detect Job Assigned status directly from label text e.g. (START OF JOB INSTALL 26-999999)
 */
export function detectJobAssignedFromLabel(text: string): string {
  if (!text) return 'Install';
  const upper = text.toUpperCase();

  const hasSwapOrCheck = upper.includes('SWAP') || upper.includes('SWAPS') || upper.includes('CHECK') || upper.includes('CHECKS');

  if (upper.includes('TEARDOWN') && upper.includes('RADAR')) {
    return 'Teardown & Conduct Radar (Spot Speed)';
  }
  if (hasSwapOrCheck && upper.includes('TEARDOWN')) {
    return 'Swaps/Checks & Teardown';
  }
  if (upper.includes('INSTALL') && upper.includes('PARKING')) {
    return 'Install & Conduct Parking';
  }
  if (upper.includes('INSTALL') && upper.includes('RADAR')) {
    return 'Install & Conduct Radar';
  }
  if (upper.includes('INSTALL') && upper.includes('TEARDOWN')) {
    return 'Install & Teardown';
  }
  if (upper.includes('INSTALL') && hasSwapOrCheck) {
    return 'Install & Swaps';
  }
  if (upper.includes('SPOT SPEED')) {
    return 'Conduct Radar (Spot Speed)';
  }
  if (upper.includes('CONDUCT PARKING') || upper.includes('PARKING STUDY')) {
    return 'Conduct Parking Study';
  }
  if (upper.includes('PARKING')) {
    return 'Parking Study';
  }
  if (upper.includes('CONDUCT RADAR') || upper.includes('RADAR')) {
    return 'Conduct Radar';
  }
  if (upper.includes('SIGHT DISTANCE')) {
    return 'Sight Distance';
  }
  if (hasSwapOrCheck) {
    return 'Swaps/Checks';
  }
  if (upper.includes('TEARDOWN')) {
    return 'Teardown';
  }
  if (upper.includes('INSTALL')) {
    return 'Install';
  }

  return 'Install';
}

/**
 * Scans XML Document for Samsara Log Folder / Placemarks specifically looking for
 * labeled timestamps such as (START OF SHIFT), (END OF SHIFT), (START OF JOB), (END OF JOB),
 * matching project numbers like "26-999999", and automatically detecting job assigned labels.
 */
export function extractSamsaraLogTimestamps(
  xmlDoc: Document,
  earliestIso?: string,
  latestIso?: string,
  defaultProjectNum: string = "26-240026",
  defaultEquipment: string = "31C/5M"
): {
  samsaraLogFolderFound: boolean;
  samsaraFolderName: string;
  startShift: string;
  endShift: string;
  startJobTime: string;
  endJobTime: string;
  detectedJobs: JobRow[];
  extractedProjectNumbers: string[];
} {
  const folders = xmlDoc.getElementsByTagName('Folder');
  let targetFolderNode: Element | null = null;
  let samsaraFolderName = "Samsara Log Folder";

  // Look for a folder specifically named Samsara Log or Samsara or Log
  for (let i = 0; i < folders.length; i++) {
    const fName = folders[i].getElementsByTagName('name')[0]?.textContent?.trim() || '';
    if (/samsara|log|trip|shift|device/i.test(fName)) {
      targetFolderNode = folders[i];
      samsaraFolderName = fName || "Samsara Log Folder";
      break;
    }
  }

  // Get placemarks from target folder or whole doc
  const scope = targetFolderNode || xmlDoc;
  const placemarks = scope.getElementsByTagName('Placemark');

  interface PMInfo {
    combinedText: string;
    timeFormatted: string | null;
    projectNums: string[];
  }

  const projectNumRegex = /\b(\d{2}-\d{5,7})\b/g;
  const foundProjectNumbers = new Set<string>();
  const parsedPMs: PMInfo[] = [];

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const nameText = pm.getElementsByTagName('name')[0]?.textContent?.trim() || '';
    const descText = pm.getElementsByTagName('description')[0]?.textContent?.trim() || '';
    
    let extText = '';
    const dataNodes = pm.getElementsByTagName('Data');
    for (let j = 0; j < dataNodes.length; j++) {
      extText += ' ' + (dataNodes[j].getElementsByTagName('value')[0]?.textContent?.trim() || '');
    }
    const simpleDataNodes = pm.getElementsByTagName('SimpleData');
    for (let j = 0; j < simpleDataNodes.length; j++) {
      extText += ' ' + (simpleDataNodes[j].textContent?.trim() || '');
    }

    const combinedText = `${nameText} ${descText} ${extText}`.toUpperCase();

    // Extract timestamp from placemark
    let pmTimeIso: string | null = null;
    const timeStampTag = pm.getElementsByTagName('TimeStamp')[0];
    const timeSpanTag = pm.getElementsByTagName('TimeSpan')[0];

    if (timeStampTag) {
      pmTimeIso = timeStampTag.getElementsByTagName('when')[0]?.textContent?.trim() || null;
    } else if (timeSpanTag) {
      pmTimeIso = timeSpanTag.getElementsByTagName('begin')[0]?.textContent?.trim() ||
                  timeSpanTag.getElementsByTagName('end')[0]?.textContent?.trim() || null;
    }

    if (!pmTimeIso) {
      const isoMatch = combinedText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i);
      if (isoMatch) pmTimeIso = isoMatch[0];
    }

    let formattedTime = pmTimeIso ? formatTimeString(pmTimeIso) : null;
    if (!formattedTime) {
      const timeRegexMatch = combinedText.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/i);
      if (timeRegexMatch) formattedTime = timeRegexMatch[1];
    }

    // Match project numbers inside placemark
    const pmProjMatches = combinedText.match(projectNumRegex);
    const pmProjList: string[] = [];
    if (pmProjMatches) {
      pmProjMatches.forEach(p => {
        foundProjectNumbers.add(p);
        if (!pmProjList.includes(p)) pmProjList.push(p);
      });
    }

    parsedPMs.push({
      combinedText,
      timeFormatted: formattedTime,
      projectNums: pmProjList
    });
  }

  // Find start and end shift times
  let foundStartShiftTime: string | null = null;
  let foundEndShiftTime: string | null = null;

  for (const pm of parsedPMs) {
    if (pm.timeFormatted) {
      if (!foundStartShiftTime && /(?:START\s*OF\s*SHIFT|START\s*SHIFT|SHIFT\s*START|CLOCK\s*IN)/.test(pm.combinedText)) {
        foundStartShiftTime = pm.timeFormatted;
      }
      if (!foundEndShiftTime && /(?:END\s*OF\s*SHIFT|END\s*SHIFT|SHIFT\s*END|CLOCK\s*OUT)/.test(pm.combinedText)) {
        foundEndShiftTime = pm.timeFormatted;
      }
    }
  }

  const fallbackStartShift = formatTimeString(earliestIso, "06:30 AM");
  const fallbackEndShift = formatTimeString(latestIso, "07:00 PM");
  const finalStartShift = foundStartShiftTime || fallbackStartShift;
  const finalEndShift = foundEndShiftTime || fallbackEndShift;

  // Match jobs by project number groups (support multiple project numbers in single labels)
  const detectedJobs: JobRow[] = [];
  const projectGroups: string[][] = [];

  // Group project numbers that appear together in placemarks
  parsedPMs.forEach(pm => {
    if (pm.projectNums.length === 0) return;

    const matchingIndices: number[] = [];
    projectGroups.forEach((grp, idx) => {
      if (pm.projectNums.some(p => grp.includes(p))) {
        matchingIndices.push(idx);
      }
    });

    if (matchingIndices.length === 0) {
      projectGroups.push([...pm.projectNums]);
    } else {
      const targetIdx = matchingIndices[0];
      const mergedSet = new Set<string>(projectGroups[targetIdx]);
      matchingIndices.forEach(idx => {
        projectGroups[idx].forEach(p => mergedSet.add(p));
      });
      pm.projectNums.forEach(p => mergedSet.add(p));
      projectGroups[targetIdx] = Array.from(mergedSet);

      for (let i = matchingIndices.length - 1; i > 0; i--) {
        projectGroups.splice(matchingIndices[i], 1);
      }
    }
  });

  const extractedProjectNumbersList = projectGroups.map(grp => grp.join(', '));

  if (projectGroups.length > 0) {
    projectGroups.forEach((projGroup, idx) => {
      const projNumStr = projGroup.join(', ');

      // Find placemarks matching any project number in this group
      let startPm = parsedPMs.find(pm => pm.projectNums.some(p => projGroup.includes(p)) && /(START\s*OF\s*JOB|START\s*JOB|JOB\s*START)/.test(pm.combinedText));
      if (!startPm) {
        startPm = parsedPMs.find(pm => /(START\s*OF\s*JOB|START\s*JOB|JOB\s*START)/.test(pm.combinedText));
      }

      let endPm = parsedPMs.find(pm => pm.projectNums.some(p => projGroup.includes(p)) && /(END\s*OF\s*JOB|END\s*JOB|JOB\s*END)/.test(pm.combinedText));
      if (!endPm) {
        endPm = parsedPMs.find(pm => /(END\s*OF\s*JOB|END\s*JOB|JOB\s*END)/.test(pm.combinedText));
      }

      const rawStartTime = startPm?.timeFormatted || formatTimeString(earliestIso, "8:24 AM");
      const rawEndTime = endPm?.timeFormatted || formatTimeString(latestIso, "7:37 PM");

      const labelText = (startPm?.combinedText || '') + ' ' + (endPm?.combinedText || '');
      const assignedAction = detectJobAssignedFromLabel(labelText);

      const formattedStartJob = cleanJobTimeString(rawStartTime);
      const formattedEndJob = cleanJobTimeString(rawEndTime);
      const workingHours = computeWorkingHours(formattedStartJob, formattedEndJob);

      detectedJobs.push({
        id: `job-${idx + 1}-${Date.now()}`,
        projectNumber: projNumStr,
        startJobTime: formattedStartJob,
        endJobTime: formattedEndJob,
        totalEquipments: defaultEquipment || "31C/5M",
        totalWorkingHours: workingHours !== "0 hour/s 0 minutes" ? workingHours : "11 hour/s 13 minutes",
        jobAssigned: assignedAction,
        jobStatus: "Job Complete"
      });
    });
  }

  // Fallback single job if no project number placemark matched
  if (detectedJobs.length === 0) {
    const primaryProj = defaultProjectNum || "26-240026";
    let startPm = parsedPMs.find(pm => /(START\s*OF\s*JOB|START\s*JOB|JOB\s*START)/.test(pm.combinedText));
    let endPm = parsedPMs.find(pm => /(END\s*OF\s*JOB|END\s*JOB|JOB\s*END)/.test(pm.combinedText));

    const rawStartTime = startPm?.timeFormatted || formatTimeString(earliestIso, "8:24 AM");
    const rawEndTime = endPm?.timeFormatted || formatTimeString(latestIso, "7:37 PM");

    const labelText = (startPm?.combinedText || '') + ' ' + (endPm?.combinedText || '');
    const assignedAction = detectJobAssignedFromLabel(labelText);

    const formattedStartJob = cleanJobTimeString(rawStartTime);
    const formattedEndJob = cleanJobTimeString(rawEndTime);
    const workingHours = computeWorkingHours(formattedStartJob, formattedEndJob);

    detectedJobs.push({
      id: `job-1-${Date.now()}`,
      projectNumber: primaryProj,
      startJobTime: formattedStartJob,
      endJobTime: formattedEndJob,
      totalEquipments: defaultEquipment || "31C/5M",
      totalWorkingHours: workingHours !== "0 hour/s 0 minutes" ? workingHours : "11 hour/s 13 minutes",
      jobAssigned: assignedAction,
      jobStatus: "Job Complete"
    });
  }

  const primaryStartJob = cleanJobTimeString(detectedJobs[0]?.startJobTime) || "8:24 AM";
  const primaryEndJob = cleanJobTimeString(detectedJobs[0]?.endJobTime) || "7:37 PM";

  return {
    samsaraLogFolderFound: !!targetFolderNode || placemarks.length > 0,
    samsaraFolderName,
    startShift: finalStartShift,
    endShift: finalEndShift,
    startJobTime: primaryStartJob,
    endJobTime: primaryEndJob,
    detectedJobs,
    extractedProjectNumbers: extractedProjectNumbersList.length > 0 ? extractedProjectNumbersList : [defaultProjectNum]
  };
}

/**
 * Generate full mock / sample trip analysis data instantly
 */
export function createSampleTripReport(options?: PreParseOptions): TripReportData {
  const waypoints = generateFallbackWaypoints();
  const placemarks = generateFallbackPlacemarks();

  const technician = options?.technician || 'Poche, Matthew';
  const region = options?.region || 'South Central';
  const dateOfSchedule = options?.dateOfSchedule ? formatDateString(options.dateOfSchedule) : '7/20/2026';
  const totalEquipments = options?.totalEquipments || '31C/5M';
  const licensePlate = options?.licensePlate || '175HCP';

  const sampleDistanceMiles = options?.isSingleProject
    ? calculateSingleProjectDistance(placemarks, waypoints)
    : 84.5;

  const kmlDetails: ParsedKmlDetails = {
    rawFileName: "Finished_Trip_Analysis_Samsara_2026-07-20.kmz",
    fileSize: 428190,
    parsedWaypointsCount: waypoints.length,
    stopsCount: placemarks.length,
    totalDistanceMiles: sampleDistanceMiles,
    earliestTimestamp: "2026-07-20T06:30:00Z",
    latestTimestamp: "2026-07-20T19:00:00Z",
    durationFormatted: "12 hour/s 30 minutes",
    extractedVehicle: `License ${licensePlate}`,
    extractedDriver: technician,
    extractedProjectNumbers: ["26-240026"],
    extractedEquipments: [totalEquipments],
    waypoints,
    placemarks,
    samsaraLogFolderFound: true,
    samsaraFolderName: "Samsara Log Folder",
    samsaraExtractedTimestamps: {
      startShift: "06:30 AM",
      endShift: "07:00 PM",
      startJobTime: "8:24 AM",
      endJobTime: "7:37 PM"
    }
  };

  const isPenndot = isPenndotRegionOrTech(region, technician);
  const penndotProj = getDayScheduleString(dateOfSchedule);

  let sampleJobs: JobRow[] = options?.isNoSchedule ? [
    {
      id: 'job-sample-1',
      projectNumber: 'NO DATA',
      startJobTime: 'NO DATA',
      endJobTime: 'NO DATA',
      totalEquipments: 'NO DATA',
      totalWorkingHours: 'NO DATA',
      jobAssigned: 'NO DATA',
      jobStatus: 'NO DATA'
    }
  ] : options?.isMultiProjectSample ? [
    {
      id: 'job-sample-1',
      projectNumber: '26-999995',
      startJobTime: '8:24 AM',
      endJobTime: '11:45 AM',
      totalEquipments,
      totalWorkingHours: computeWorkingHours('8:24 AM', '11:45 AM'),
      jobAssigned: 'Install',
      jobStatus: 'Job Complete'
    },
    {
      id: 'job-sample-2',
      projectNumber: '26-999998',
      startJobTime: '12:15 PM',
      endJobTime: '3:30 PM',
      totalEquipments,
      totalWorkingHours: computeWorkingHours('12:15 PM', '3:30 PM'),
      jobAssigned: 'Teardown',
      jobStatus: 'Job Complete'
    },
    {
      id: 'job-sample-3',
      projectNumber: '26-999994',
      startJobTime: '3:45 PM',
      endJobTime: '6:50 PM',
      totalEquipments,
      totalWorkingHours: computeWorkingHours('3:45 PM', '6:50 PM'),
      jobAssigned: 'Swaps/Checks',
      jobStatus: 'Job Complete'
    }
  ] : [
    {
      id: 'job-sample-1',
      projectNumber: isPenndot ? penndotProj : '26-240026',
      startJobTime: '8:24 AM',
      endJobTime: '7:37 PM',
      totalEquipments,
      totalWorkingHours: computeWorkingHours('8:24 AM', '7:37 PM'),
      jobAssigned: 'Install',
      jobStatus: 'Job Complete'
    }
  ];

  const sampleRemarksText = options?.issuesAnomaliesRemarks !== undefined ? options.issuesAnomaliesRemarks : 'Assigned project/s completed\nNo Issue/s found';
  const sampleJobStatus = getJobStatusFromRemark(sampleRemarksText);
  if (sampleJobStatus && !options?.isNoSchedule) {
    sampleJobs = sampleJobs.map(j => ({ ...j, jobStatus: sampleJobStatus }));
  }

  const computedPredictedHours = options?.isNoSchedule
    ? 'NO DATA'
    : options?.isLadotExclusive
    ? '0 hour/s 0 minutes'
    : computePredictedDailyWorkingHours(sampleDistanceMiles, sampleJobs);

  return {
    id: `sample-trip-${Date.now()}`,
    fileName: 'Finished_Trip_Analysis_Samsara_2026-07-20.kmz',
    uploadedAt: new Date().toLocaleString(),
    mode: 'AUTOMATED',
    region,
    dateOfSchedule,
    technician,
    licensePlate,
    startShift: options?.isNoSchedule ? 'NO DATA' : '06:30 AM',
    endShift: options?.isNoSchedule ? 'NO DATA' : '07:00 PM',
    totalHoursSamsara: options?.isNoSchedule ? 'NO DATA' : computeShiftTotalHours('06:30 AM', '07:00 PM'),
    jobs: sampleJobs,
    predictedDailyWorkingHours: computedPredictedHours,
    actualDailyWorkingHours: options?.actualDailyWorkingHours !== undefined ? options.actualDailyWorkingHours : '11 hour/s 0 minutes',
    issuesAnomaliesRemarks: sampleRemarksText,
    weeklyDateRange: options?.weeklyDateRange || calculateWorkWeekRange(options?.dateOfSchedule || '2026-07-20'),
    runningTotalFieldTimeCal: options?.runningTotalFieldTimeCal !== undefined && options.runningTotalFieldTimeCal !== '' ? options.runningTotalFieldTimeCal : '23 hour/s',
    runningTotalTsheets: options?.runningTotalTsheets !== undefined && options.runningTotalTsheets !== '' ? options.runningTotalTsheets : '',
    isSingleProject: options?.isSingleProject,
    isNoSchedule: options?.isNoSchedule,
    isLadotExclusive: options?.isLadotExclusive,
    kmlData: kmlDetails
  };
}

/**
  * Computes total working hours between start time and end time strings.
  * Safely strips labels like (START OF JOB) or (END OF JOB) and parses timestamps.
  */
export function computeWorkingHours(startStr?: string, endStr?: string): string {
  if (!startStr || !endStr) return "0 hour/s 0 minutes";

  // Clean strings by removing bracketed labels e.g. (START OF JOB)
  const cleanStart = startStr.replace(/\([^)]*\)/g, '').trim();
  const cleanEnd = endStr.replace(/\([^)]*\)/g, '').trim();

  const parseTimeToMinutes = (timeString: string): number | null => {
    // Match "HH:MM AM/PM" or "HH:MM"
    const match = timeString.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm) {
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }

    return hours * 60 + minutes;
  };

  const startMins = parseTimeToMinutes(cleanStart);
  const endMins = parseTimeToMinutes(cleanEnd);

  if (startMins === null || endMins === null) {
    return "0 hour/s 0 minutes";
  }

  let diffMinutes = endMins - startMins;
  if (diffMinutes < 0) {
    // Overnight job shift e.g. 10:00 PM to 06:00 AM
    diffMinutes += 24 * 60;
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  return `${hours} hour/s ${mins} minutes`;
}

/**
 * Calculates the Work Week date range (Sunday to Saturday) based on a given date.
 * Format returned: MM/DD/YYYY - MM/DD/YYYY (e.g. 07/19/2026 - 07/25/2026)
 */
export function calculateWorkWeekRange(refDate?: Date | string): string {
  let baseDate = new Date();
  if (refDate) {
    if (typeof refDate === 'string') {
      const clean = refDate.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [y, m, d] = clean.split('-').map(Number);
        baseDate = new Date(y, m - 1, d);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
        const [m, d, y] = clean.split('/').map(Number);
        baseDate = new Date(y, m - 1, d);
      } else {
        const parsed = new Date(clean);
        if (!isNaN(parsed.getTime())) {
          baseDate = parsed;
        }
      }
    } else if (refDate instanceof Date && !isNaN(refDate.getTime())) {
      baseDate = refDate;
    }
  }

  // Get Sunday of the reference week (0 = Sunday)
  const dayOfWeek = baseDate.getDay();
  const sunday = new Date(baseDate);
  sunday.setDate(baseDate.getDate() - dayOfWeek);

  // Get Saturday of the reference week (+6 days from Sunday)
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return `${formatDate(sunday)} - ${formatDate(saturday)}`;
}

