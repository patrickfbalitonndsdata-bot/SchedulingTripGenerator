import { TripReportData } from '../types';
import { cleanJobTimeString, computeWorkingHours } from './kmlParser';

export interface EmailExportOptions {
  subject: string;
  toRecipients: string;
  ccRecipients: string;
  introMessage: string;
  theme: 'dark' | 'light';
}

/**
 * Generates an inline-styled HTML string optimized for Microsoft Outlook
 * and other email clients.
 */
export function generateTripReportEmailHtml(
  reports: TripReportData[],
  options: EmailExportOptions
): string {
  const isDark = options.theme === 'dark';

  // Styling constants matching reference image
  // Light Cream / Gold (#fff2cc), Black text (#000000), 2px solid black borders (#000000)
  const bgCanvas = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#f4f4f5' : '#000000';
  const tableBorderColor = isDark ? '#525252' : '#000000';
  
  const headerBg = isDark ? '#2e2500' : '#fff2cc';
  const headerText = isDark ? '#fef08a' : '#000000';
  const labelBg = isDark ? '#3f3200' : '#fff2cc';
  const labelText = isDark ? '#fef08a' : '#000000';
  
  const cellBg = isDark ? '#27272a' : '#ffffff';
  const cellAltBg = isDark ? '#18181b' : '#ffffff';

  const getDayOfWeekName = (dateStr?: string) => {
    if (!dateStr) return 'Monday';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Monday';
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return 'Monday';
    }
  };

  let tablesHtml = '';

  reports.forEach((report, index) => {
    const dayName = getDayOfWeekName(report.dateOfSchedule);
    const jobs = report.jobs || [];

    // Format remarks lines (e.g., green highlight for "Assigned project/s Complete")
    const remarksLines = (report.issuesAnomaliesRemarks || 'Assigned project/s Complete\nNo Issues Found')
      .split('\n');

    const remarksFormatted = remarksLines
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (/incomplete/i.test(trimmed) || /job not done|not done/i.test(trimmed)) {
          return `<div style="margin-bottom: 4px;"><span style="background-color: #FFFF00; color: #000000; font-weight: bold; padding: 2px 6px; display: inline-block;">${trimmed}</span></div>`;
        }
        if (/completed|complete/i.test(trimmed)) {
          return `<div style="margin-bottom: 4px;"><span style="background-color: #00FF00; color: #000000; font-weight: bold; padding: 2px 6px; display: inline-block;">${trimmed}</span></div>`;
        }
        return `<div style="font-weight: bold; color: ${textColor}; font-size: 12px; margin-top: 2px;">${trimmed}</div>`;
      })
      .join('');

    tablesHtml += `
      <!-- REPORT BLOCK #${index + 1} -->
      <div style="margin-bottom: 24px; width: 920px; max-width: 920px; min-width: 920px;">
        <div style="font-size: 16px; font-weight: bold; color: ${textColor}; margin-bottom: 8px; font-family: Calibri, Arial, sans-serif;">
          ${dayName}
        </div>

        <table border="1" cellpadding="0" cellspacing="0" width="920" style="width: 920px; max-width: 920px; min-width: 920px; table-layout: fixed; border-collapse: collapse; border: 3px solid ${tableBorderColor}; font-family: Calibri, Arial, sans-serif; font-size: 12px; background-color: ${cellBg}; color: ${textColor};">
          <colgroup>
            <col style="width: 140px;" />
            <col style="width: 110px;" />
            <col style="width: 110px;" />
            <col style="width: 150px;" />
            <col style="width: 140px;" />
            <col style="width: 135px;" />
            <col style="width: 135px;" />
          </colgroup>
          
          <!-- ROW 1: TOP METADATA & SHIFT SUMMARY -->
          <tr>
            <!-- LEFT 5 COLS: Region, Date, License, Technician -->
            <td colspan="5" width="650" style="width: 650px; vertical-align: top; border: 3px solid ${tableBorderColor}; background-color: ${headerBg}; padding: 6px 10px;">
              <table border="0" cellpadding="2" cellspacing="0" width="630" style="width: 630px; table-layout: fixed; border-collapse: collapse; color: ${headerText}; font-size: 12px; font-family: Calibri, Arial, sans-serif;">
                <colgroup>
                  <col style="width: 130px;" />
                  <col style="width: 200px;" />
                  <col style="width: 300px;" />
                </colgroup>
                <tr>
                  <td style="font-weight: bold; text-align: left;">Region:</td>
                  <td style="font-weight: normal; text-align: center;">${report.region || 'South Central'}</td>
                  <td></td>
                </tr>
                <tr>
                  <td style="font-weight: bold; text-align: left;">Date of Schedule</td>
                  <td style="text-align: center; border-bottom: 1px solid ${tableBorderColor}; font-weight: normal;">${report.dateOfSchedule || '7/20/26'}</td>
                  <td style="text-align: right; font-weight: bold;">
                    License plate &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="font-weight: normal; margin-left: 12px;">${report.licensePlate || 'N580724'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: bold; text-align: left; padding-top: 4px;">Technician:</td>
                  <td style="text-align: center; font-weight: normal; padding-top: 4px;">${report.technician || 'Dustin Fullerton'}</td>
                  <td></td>
                </tr>
              </table>
            </td>

            <!-- RIGHT 2 COLS: Start Shift / End Shift / Total Hours -->
            <td colspan="2" width="270" style="width: 270px; vertical-align: top; border: 3px solid ${tableBorderColor}; padding: 0;">
              <table border="1" cellpadding="5" cellspacing="0" width="270" style="width: 270px; table-layout: fixed; border-collapse: collapse; border: none; font-size: 12px; font-family: Calibri, Arial, sans-serif;">
                <colgroup>
                  <col style="width: 135px;" />
                  <col style="width: 135px;" />
                </colgroup>
                <tr>
                  <td style="font-weight: bold; text-align: center; width: 135px; background-color: ${headerBg}; border-right: 3px solid ${tableBorderColor}; border-bottom: 3px solid ${tableBorderColor};">Start Shift</td>
                  <td style="text-align: center; width: 135px; background-color: ${cellBg}; font-weight: bold; border-bottom: 3px solid ${tableBorderColor}; color: ${textColor};">${report.startShift || '7:41 PM'}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; text-align: center; background-color: ${headerBg}; border-right: 3px solid ${tableBorderColor}; border-bottom: 3px solid ${tableBorderColor};">End Shift</td>
                  <td style="text-align: center; background-color: ${cellBg}; font-weight: bold; border-bottom: 3px solid ${tableBorderColor}; color: ${textColor};">${report.endShift || '11:05 PM'}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; text-align: center; background-color: ${headerBg}; border-right: 3px solid ${tableBorderColor};">
                    Total Hours<br/><span style="font-size: 10px; font-style: italic; font-weight: normal;">(Via Samsara)</span>
                  </td>
                  <td style="text-align: center; font-weight: bold; font-size: 13px; background-color: ${cellBg}; color: ${textColor};">
                    ${report.totalHoursSamsara || '3:24'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ROW 2: JOBS TABLE HEADERS -->
          <tr style="background-color: ${headerBg}; color: ${headerText}; font-weight: bold; text-align: center;">
            <td width="140" style="width: 140px; border: 3px solid ${tableBorderColor}; padding: 6px;">Project Number</td>
            <td width="110" style="width: 110px; border: 3px solid ${tableBorderColor}; padding: 6px;">START JOB TIME</td>
            <td width="110" style="width: 110px; border: 3px solid ${tableBorderColor}; padding: 6px;">END JOB TIME</td>
            <td width="150" style="width: 150px; border: 3px solid ${tableBorderColor}; padding: 6px;">Total # of Equipments</td>
            <td width="140" style="width: 140px; border: 3px solid ${tableBorderColor}; padding: 6px;">Total Working Hours</td>
            <!-- Aligned with Top Right Columns -->
            <td width="135" style="width: 135px; border: 3px solid ${tableBorderColor}; padding: 6px;">Job Assigned</td>
            <td width="135" style="width: 135px; border: 3px solid ${tableBorderColor}; padding: 6px;">Job Status</td>
          </tr>

          <!-- ROW 3+: JOB DATA ROWS -->
          ${jobs.map((job) => {
            const computedHrs = computeWorkingHours(job.startJobTime, job.endJobTime) || job.totalWorkingHours || '0:54:00';
            return `
              <tr style="background-color: ${cellBg}; text-align: center; color: ${textColor};">
                <td width="140" style="width: 140px; border: 3px solid ${tableBorderColor}; padding: 6px; font-weight: normal;">${job.projectNumber || ''}</td>
                <td width="110" style="width: 110px; border: 3px solid ${tableBorderColor}; padding: 6px;">${cleanJobTimeString(job.startJobTime)}</td>
                <td width="110" style="width: 110px; border: 3px solid ${tableBorderColor}; padding: 6px;">${cleanJobTimeString(job.endJobTime)}</td>
                <td width="150" style="width: 150px; border: 3px solid ${tableBorderColor}; padding: 6px; font-weight: normal;">${job.totalEquipments || ''}</td>
                <td width="140" style="width: 140px; border: 3px solid ${tableBorderColor}; padding: 6px; font-weight: normal;">${computedHrs}</td>
                <td width="135" style="width: 135px; border: 3px solid ${tableBorderColor}; padding: 6px; font-weight: normal;">${job.jobAssigned || 'Install'}</td>
                <td width="135" style="width: 135px; border: 3px solid ${tableBorderColor}; padding: 6px; font-weight: normal;">${job.jobStatus || 'Job Complete'}</td>
              </tr>
            `;
          }).join('')}

          <!-- BOTTOM SECTION: PREDICTED vs ACTUAL & REMARKS -->
          <tr>
            <!-- BOTTOM LEFT: PREDICTED DAILY HOURS & REMARKS -->
            <td colspan="5" width="650" style="width: 650px; vertical-align: top; border: 3px solid ${tableBorderColor}; padding: 0;">
              <table border="1" cellpadding="6" cellspacing="0" width="650" style="width: 650px; table-layout: fixed; border-collapse: collapse; border: none; font-size: 12px; font-family: Calibri, Arial, sans-serif; color: ${textColor};">
                <tr>
                  <td style="background-color: ${labelBg}; color: ${labelText}; font-weight: bold; text-align: center; border-bottom: 3px solid ${tableBorderColor}; padding: 10px 4px;">
                    Predicted Daily Working Hours<br/><span style="font-size: 11px; font-style: italic; font-weight: normal;">(Via Field Time Calculator)</span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: normal; padding: 8px; background-color: ${cellBg}; border-bottom: 3px solid ${tableBorderColor}; font-size: 13px;">
                    ${report.predictedDailyWorkingHours || '4 hour/s 32 minutes'}
                  </td>
                </tr>
                <tr>
                  <td style="background-color: ${labelBg}; color: ${labelText}; font-weight: bold; text-align: center; border-bottom: 3px solid ${tableBorderColor}; padding: 6px;">
                    Issues/Anomalies/Remarks:
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 16px 8px; background-color: ${cellBg}; min-height: 70px;">
                    ${remarksFormatted}
                  </td>
                </tr>
              </table>
            </td>

            <!-- BOTTOM RIGHT: ACTUAL DAILY HOURS & WEEKLY RUNNING TOTALS -->
            <td colspan="2" width="270" style="width: 270px; vertical-align: top; border: 3px solid ${tableBorderColor}; padding: 0;">
              <table border="1" cellpadding="6" cellspacing="0" width="270" style="width: 270px; table-layout: fixed; border-collapse: collapse; border: none; font-size: 12px; font-family: Calibri, Arial, sans-serif; color: ${textColor};">
                <colgroup>
                  <col style="width: 135px;" />
                  <col style="width: 135px;" />
                </colgroup>
                <tr>
                  <td style="background-color: ${labelBg}; color: ${labelText}; font-weight: bold; text-align: center; border-bottom: 3px solid ${tableBorderColor}; padding: 10px 4px;" colspan="2">
                    Actual Daily Working Hours<br/><span style="font-size: 11px; font-style: italic; font-weight: normal;">(Via - T Sheets)</span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: normal; padding: 8px; background-color: ${cellBg}; border-bottom: 3px solid ${tableBorderColor}; font-size: 13px;" colspan="2">
                    ${report.actualDailyWorkingHours || '3 hour/s 27 minutes'}
                  </td>
                </tr>
                
                <!-- WEEKLY HEADERS SPLIT -->
                <tr style="background-color: ${labelBg}; color: ${labelText}; font-weight: bold; text-align: center;">
                  <td style="width: 135px; border-right: 3px solid ${tableBorderColor}; border-bottom: 3px solid ${tableBorderColor}; padding: 6px;">Predicted Weekly Working Hours</td>
                  <td style="width: 135px; border-bottom: 3px solid ${tableBorderColor}; padding: 6px;">Actual Weekly Working Hours</td>
                </tr>

                <!-- DATE RANGE BANNER -->
                <tr style="background-color: ${labelBg}; color: ${labelText}; font-weight: bold; text-align: center;">
                  <td colspan="2" style="border-bottom: 3px solid ${tableBorderColor}; padding: 6px;">
                    ${report.weeklyDateRange || '07/19/2026 - 7/25/2026'}
                  </td>
                </tr>

                <!-- RUNNING TOTAL SUB-HEADERS -->
                <tr style="background-color: ${labelBg}; color: ${labelText}; font-weight: normal; text-align: center; font-size: 11px;">
                  <td style="border-right: 3px solid ${tableBorderColor}; border-bottom: 3px solid ${tableBorderColor}; padding: 6px;">Running Total - Field Time Cal</td>
                  <td style="border-bottom: 3px solid ${tableBorderColor}; padding: 6px;">Running Total - Tsheets</td>
                </tr>

                <!-- RUNNING TOTAL VALUES -->
                <tr style="background-color: ${cellBg}; font-weight: bold; text-align: center; font-size: 12px;">
                  <td style="border-right: 3px solid ${tableBorderColor}; padding: 12px 4px;">${report.runningTotalFieldTimeCal || '4 hour/s 32 minutes'}</td>
                  <td style="padding: 12px 4px;">${report.runningTotalTsheets || report.actualDailyWorkingHours || '3 hour/s 27 minutes'}</td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${options.subject}</title>
</head>
<body style="background-color: ${bgCanvas}; color: ${textColor}; font-family: Calibri, Arial, sans-serif; font-size: 14px; margin: 0; padding: 16px;">
  <div style="width: 920px; max-width: 920px; min-width: 920px; margin: 0 auto; background-color: ${bgCanvas}; border-radius: 4px; padding: 8px;">
    <!-- INTRO GREETING -->
    <div style="font-size: 14px; color: ${textColor}; line-height: 1.6; margin-bottom: 16px; white-space: pre-wrap; font-family: Calibri, Arial, sans-serif;">${options.introMessage}</div>

    <!-- TRIP ANALYSIS TABLES -->
    ${tablesHtml}
  </div>
</body>
</html>`;
}

/**
 * Constructs an RFC 822 .eml file content for Microsoft Outlook
 */
export function generateEMLContent(
  reports: TripReportData[],
  options: EmailExportOptions
): string {
  const htmlBody = generateTripReportEmailHtml(reports, options);
  const boundary = '----=_NextPart_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  const dateStr = new Date().toUTCString();

  const plainIntro = options.introMessage.replace(/<[^>]+>/g, '');

  let eml = `From: \r\n`;
  if (options.toRecipients) {
    eml += `To: ${options.toRecipients}\r\n`;
  }
  if (options.ccRecipients) {
    eml += `Cc: ${options.ccRecipients}\r\n`;
  }
  eml += `Subject: ${options.subject}\r\n`;
  eml += `X-Unsent: 1\r\n`;
  eml += `Date: ${dateStr}\r\n`;
  eml += `MIME-Version: 1.0\r\n`;
  eml += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

  // Text part
  eml += `--${boundary}\r\n`;
  eml += `Content-Type: text/plain; charset="utf-8"\r\n`;
  eml += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  eml += `${plainIntro}\r\n\r\n(Please view this message in an HTML-enabled email client such as Microsoft Outlook to render the Trip Analysis Report tables.)\r\n\r\n`;

  // HTML part
  eml += `--${boundary}\r\n`;
  eml += `Content-Type: text/html; charset="utf-8"\r\n`;
  eml += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  eml += `${htmlBody}\r\n\r\n`;

  eml += `--${boundary}--\r\n`;

  return eml;
}

/**
 * Triggers browser download of the generated .eml file
 */
export function downloadEMLFile(reports: TripReportData[], options: EmailExportOptions) {
  const emlContent = generateEMLContent(reports, options);
  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  
  const sanitizeFilename = (str: string) => str.replace(/[^a-z0-9_-]/gi, '_').replace(/_+/g, '_');
  const filename = `${sanitizeFilename(options.subject || 'Trip_Analysis_Report')}.eml`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
