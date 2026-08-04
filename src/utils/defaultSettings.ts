import { SettingsConfig } from '../types';

export const INITIAL_SETTINGS: SettingsConfig & { version?: number } = {
  version: 3,
  regions: [
    'South Central',
    'North East',
    'Mid Atlantic',
    'Florida',
    'South East',
    'NYCDOT',
    'SOCAL',
    'NOCAL',
    'Nationwide',
    'PENNDOT',
    'Midwest',
    'Pacific Northwest',
    'Mountain West'
  ],
  jobTypes: [
    'Install',
    'Teardown',
    'Swaps/Checks',
    'Sight Distance',
    'Swaps/Checks & Teardown',
    'Parking Study',
    'Install & Conduct Parking',
    'Install & Conduct Radar',
    'Conduct Radar',
    'Conduct Parking Study',
    'Install & Teardown',
    'Conduct Radar (Spot Speed)',
    'Install & Swaps',
    'Teardown & Conduct Radar (Spot Speed)'
  ],
  jobStatuses: [
    'Job Complete',
    'Incomplete',
    'Not done'
  ],
  technicians: [
    { id: 'tech-1', name: 'Bobby Cannon', defaultRegion: 'Mid Atlantic', defaultLicensePlate: '', active: true },
    { id: 'tech-2', name: 'Anderson Saint Louis', defaultRegion: 'Mid Atlantic', defaultLicensePlate: '', active: true },
    { id: 'tech-3', name: 'Jerome Williams', defaultRegion: 'Mid Atlantic', defaultLicensePlate: '', active: true },
    { id: 'tech-4', name: 'Michael Chase', defaultRegion: 'Mid Atlantic', defaultLicensePlate: '', active: true },
    { id: 'tech-5', name: 'Mercedes Smith', defaultRegion: 'Mid Atlantic', defaultLicensePlate: '', active: true },
    { id: 'tech-6', name: 'Anthony Dyson', defaultRegion: 'Mid Atlantic', defaultLicensePlate: 'UAV8560', active: true },
    { id: 'tech-7', name: 'John Lee', defaultRegion: 'North East', defaultLicensePlate: 'KTG2472', active: true },
    { id: 'tech-8', name: 'Ramon Profitt', defaultRegion: 'North East', defaultLicensePlate: '', active: true },
    { id: 'tech-9', name: 'Angel Rodriguez', defaultRegion: 'North East', defaultLicensePlate: 'LRB6288', active: true },
    { id: 'tech-10', name: 'Alexander Shaw', defaultRegion: 'North East', defaultLicensePlate: 'LFR2411', active: true },
    { id: 'tech-11', name: 'Justin Gutierrez', defaultRegion: 'North East', defaultLicensePlate: 'LNG8004', active: true },
    { id: 'tech-12', name: 'Joshua McDougal', defaultRegion: 'North East', defaultLicensePlate: 'LRB6287', active: true },
    { id: 'tech-13', name: 'Igor Neves', defaultRegion: 'North East', defaultLicensePlate: 'LNG8003', active: true },
    { id: 'tech-14', name: 'Yahshua Berry', defaultRegion: 'North East', defaultLicensePlate: '', active: true },
    { id: 'tech-15', name: 'Miguel Hendry', defaultRegion: 'North East', defaultLicensePlate: 'LRT1473', active: true },
    { id: 'tech-16', name: 'Cristopher Torres', defaultRegion: 'North East', defaultLicensePlate: '76398NA', active: true },
    { id: 'tech-17', name: 'Adewale Babatunde', defaultRegion: 'North East', defaultLicensePlate: 'LPF5931', active: true },
    { id: 'tech-18', name: 'John Cave Torres', defaultRegion: 'Florida', defaultLicensePlate: 'LPG3942', active: true },
    { id: 'tech-19', name: 'Adrian Creagh-Diaz', defaultRegion: 'Florida', defaultLicensePlate: 'CVV8041', active: true },
    { id: 'tech-20', name: 'Marcel Denbow', defaultRegion: 'Florida', defaultLicensePlate: '', active: true },
    { id: 'tech-21', name: 'Cadoy Depass', defaultRegion: 'Florida', defaultLicensePlate: 'TDN6244', active: true },
    { id: 'tech-22', name: 'John Greist', defaultRegion: 'Florida', defaultLicensePlate: '', active: true },
    { id: 'tech-23', name: 'Davian Jones', defaultRegion: 'Florida', defaultLicensePlate: 'DSOOUT', active: true },
    { id: 'tech-24', name: 'Rodolfo Lopez-Vazquez', defaultRegion: 'Florida', defaultLicensePlate: '', active: true },
    { id: 'tech-25', name: 'Kenneth Mayon', defaultRegion: 'Florida', defaultLicensePlate: 'JQKA82', active: true },
    { id: 'tech-26', name: 'Justin Giuca', defaultRegion: 'Florida', defaultLicensePlate: '35TGCI', active: true },
    { id: 'tech-27', name: 'Jason Hall', defaultRegion: 'Florida', defaultLicensePlate: 'GXCF04', active: true },
    { id: 'tech-28', name: 'Timothy Miller', defaultRegion: 'Florida', defaultLicensePlate: '', active: true },
    { id: 'tech-29', name: 'Dylan Smith', defaultRegion: 'Florida', defaultLicensePlate: 'LPG3941', active: true },
    { id: 'tech-30', name: 'Scott Pillar', defaultRegion: 'Florida', defaultLicensePlate: '14DSCW', active: true },
    { id: 'tech-31', name: 'Dalton Duble', defaultRegion: 'South East', defaultLicensePlate: 'KKB5932', active: true },
    { id: 'tech-32', name: 'Jehu Fuller', defaultRegion: 'South East', defaultLicensePlate: '', active: true },
    { id: 'tech-33', name: 'Anthony Moore', defaultRegion: 'South East', defaultLicensePlate: 'TEJ8227', active: true },
    { id: 'tech-34', name: 'Michael Woodard', defaultRegion: 'South East', defaultLicensePlate: 'TDV0199', active: true },
    { id: 'tech-35', name: 'Chris Rhyne', defaultRegion: 'South East', defaultLicensePlate: 'CVV8041', active: true },
    { id: 'tech-36', name: 'Tarel Bartell', defaultRegion: 'South East', defaultLicensePlate: 'KKB5931', active: true },
    { id: 'tech-37', name: 'Andrew Eckert', defaultRegion: 'South Central', defaultLicensePlate: 'N591113', active: true },
    { id: 'tech-38', name: 'Tyler Shaw', defaultRegion: 'South Central', defaultLicensePlate: '', active: true },
    { id: 'tech-39', name: 'Dustin Fullerton', defaultRegion: 'South Central', defaultLicensePlate: 'N580724', active: true },
    { id: 'tech-40', name: 'Justin Windecker', defaultRegion: 'South Central', defaultLicensePlate: 'Y459821', active: true },
    { id: 'tech-41', name: 'Richard Rafeedie', defaultRegion: 'South Central', defaultLicensePlate: '', active: true },
    { id: 'tech-42', name: 'Doug Thomas', defaultRegion: 'South Central', defaultLicensePlate: '', active: true },
    { id: 'tech-43', name: 'Dustyn May', defaultRegion: 'South Central', defaultLicensePlate: 'Y417117', active: true },
    { id: 'tech-44', name: 'Juan Espinoza', defaultRegion: 'South Central', defaultLicensePlate: 'Y459822', active: true },
    { id: 'tech-45', name: 'Gilliam Johns', defaultRegion: 'South Central', defaultLicensePlate: 'N580723', active: true },
    { id: 'tech-46', name: 'Timothy Addison', defaultRegion: 'South Central', defaultLicensePlate: 'N580726', active: true },
    { id: 'tech-47', name: 'Lara, Eduardo', defaultRegion: 'South Central', defaultLicensePlate: 'Y417116', active: true },
    { id: 'tech-48', name: 'Coreas, Carlos', defaultRegion: 'South Central', defaultLicensePlate: 'Y459832', active: true },
    { id: 'tech-49', name: 'Oliphant, Anthony', defaultRegion: 'South Central', defaultLicensePlate: '22408772', active: true },
    { id: 'tech-50', name: 'Grant, Travis', defaultRegion: 'South Central', defaultLicensePlate: 'N580723', active: true },
    { id: 'tech-51', name: 'White, Jhonathan', defaultRegion: 'South Central', defaultLicensePlate: 'Y459823', active: true },
    { id: 'tech-52', name: 'Alexis Astudillo-Vasquez', defaultRegion: 'NYCDOT', defaultLicensePlate: '', active: true },
    { id: 'tech-53', name: 'Kevin Budhu', defaultRegion: 'NYCDOT', defaultLicensePlate: 'KML9940', active: true },
    { id: 'tech-54', name: 'Elijah Mbewe', defaultRegion: 'NYCDOT', defaultLicensePlate: '', active: true },
    { id: 'tech-55', name: 'Albieri Medina', defaultRegion: 'NYCDOT', defaultLicensePlate: 'LRB6277', active: true },
    { id: 'tech-56', name: 'Mohammad Rafi Mohebi', defaultRegion: 'NYCDOT', defaultLicensePlate: 'LPF5931', active: true },
    { id: 'tech-57', name: 'Sayed Mousavi', defaultRegion: 'NYCDOT', defaultLicensePlate: '', active: true },
    { id: 'tech-58', name: 'Khaled Nuri', defaultRegion: 'NYCDOT', defaultLicensePlate: '', active: true },
    { id: 'tech-59', name: 'Cristopher Torres (NYCDOT)', defaultRegion: 'NYCDOT', defaultLicensePlate: '76398NA', active: true },
    { id: 'tech-60', name: 'Mohammad Zamani', defaultRegion: 'NYCDOT', defaultLicensePlate: '', active: true },
    { id: 'tech-61', name: 'Mahmoud Elsaid', defaultRegion: 'NYCDOT', defaultLicensePlate: 'LCB8547', active: true },
    { id: 'tech-62', name: 'Luis Castro', defaultRegion: 'NYCDOT', defaultLicensePlate: '', active: true },
    { id: 'tech-63', name: 'Osvaldo Castro', defaultRegion: 'SOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-64', name: 'Jabari Dickson', defaultRegion: 'SOCAL', defaultLicensePlate: '6YAE621', active: true },
    { id: 'tech-65', name: 'Ruben Gallegos Peinado', defaultRegion: 'SOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-66', name: 'Michael Heralda', defaultRegion: 'SOCAL', defaultLicensePlate: '51894X3', active: true },
    { id: 'tech-67', name: 'David Huntsinger', defaultRegion: 'SOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-68', name: 'Stephanie Irineo', defaultRegion: 'SOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-69', name: 'Omar Ortiz Medina', defaultRegion: 'SOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-70', name: 'Justin Pina', defaultRegion: 'SOCAL', defaultLicensePlate: '9NSG392', active: true },
    { id: 'tech-71', name: 'Hugo Robles', defaultRegion: 'SOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-72', name: 'Jackson Stump', defaultRegion: 'SOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-73', name: 'Alberto Vasquez', defaultRegion: 'SOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-74', name: 'Anthony Pineda', defaultRegion: 'SOCAL', defaultLicensePlate: '48916F4', active: true },
    { id: 'tech-75', name: 'Rafael Godoy', defaultRegion: 'SOCAL', defaultLicensePlate: '39373G4', active: true },
    { id: 'tech-76', name: 'Marie French', defaultRegion: 'NOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-77', name: 'James Goodall', defaultRegion: 'NOCAL', defaultLicensePlate: '9FAX834', active: true },
    { id: 'tech-78', name: 'Daniel Harper', defaultRegion: 'NOCAL', defaultLicensePlate: '7PBJ730', active: true },
    { id: 'tech-79', name: 'William Hollingshead', defaultRegion: 'NOCAL', defaultLicensePlate: '17457Z3', active: true },
    { id: 'tech-80', name: 'Matt Kalinin', defaultRegion: 'NOCAL', defaultLicensePlate: '6JQW048', active: true },
    { id: 'tech-81', name: 'Joan McCracken', defaultRegion: 'NOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-82', name: 'Truc Nguyen', defaultRegion: 'NOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-83', name: 'Anthony Perez', defaultRegion: 'NOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-84', name: 'Steve Sandbank', defaultRegion: 'NOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-85', name: 'Edward Sisneroz', defaultRegion: 'NOCAL', defaultLicensePlate: '5MPG211', active: true },
    { id: 'tech-86', name: 'Julian Torres', defaultRegion: 'NOCAL', defaultLicensePlate: '8NLV010', active: true },
    { id: 'tech-87', name: 'Anthony Hall', defaultRegion: 'NOCAL', defaultLicensePlate: '6JQW048', active: true },
    { id: 'tech-88', name: 'Brian Aguilar', defaultRegion: 'NOCAL', defaultLicensePlate: '', active: true },
    { id: 'tech-89', name: 'David Dunkley', defaultRegion: 'Nationwide', defaultLicensePlate: 'KXC2585', active: true },
    { id: 'tech-90', name: 'Esteban Yepes', defaultRegion: 'Nationwide', defaultLicensePlate: '', active: true },
    { id: 'tech-91', name: 'John Cave Torres (Nationwide)', defaultRegion: 'Nationwide', defaultLicensePlate: 'LPG3942', active: true },
    { id: 'tech-92', name: 'Kevin Budhu (Nationwide)', defaultRegion: 'Nationwide', defaultLicensePlate: 'KML9940', active: true },
    { id: 'tech-93', name: 'Brian Agulilar (NYCDOT)', defaultRegion: 'NYCDOT', defaultLicensePlate: 'ULA9781', active: true },
    { id: 'tech-94', name: 'Bismillah Qasemi', defaultRegion: 'NYCDOT', defaultLicensePlate: 'ULA9781', active: true },
    { id: 'tech-95', name: 'Anthony Roman', defaultRegion: 'NYCDOT', defaultLicensePlate: 'LWM1112', active: true },
    { id: 'tech-96', name: 'Dykes, Jeremy', defaultRegion: 'South East', defaultLicensePlate: 'KKB5931', active: true },
    { id: 'tech-97', name: 'Palmer, Theron', defaultRegion: 'South East', defaultLicensePlate: 'LMW3396', active: true },
    { id: 'tech-98', name: 'Christopher Schanding', defaultRegion: 'Florida', defaultLicensePlate: 'LPG3941', active: true },
    { id: 'tech-99', name: 'Julian Fernandez', defaultRegion: 'Florida', defaultLicensePlate: '', active: true },
    { id: 'tech-100', name: 'Treyvon Watts-Hale', defaultRegion: 'South Central', defaultLicensePlate: 'SLX1325', active: true },
    { id: 'tech-101', name: 'Poche, Matthew', defaultRegion: 'South Central', defaultLicensePlate: '175HCP', active: true },
    { id: 'tech-102', name: 'Gabriel Nieves', defaultRegion: 'Florida', defaultLicensePlate: '14DSCW', active: true },
    { id: 'tech-103', name: 'Juvoney Bailey', defaultRegion: 'Florida', defaultLicensePlate: '', active: true },
    { id: 'tech-104', name: 'Jim Hoskin', defaultRegion: 'PENNDOT', defaultLicensePlate: '67466NF', active: true },
    { id: 'tech-105', name: 'Andrew Eckert (PENNDOT)', defaultRegion: 'PENNDOT', defaultLicensePlate: 'N591113', active: true },
    { id: 'tech-106', name: 'Connor Brien', defaultRegion: 'PENNDOT', defaultLicensePlate: '53813NF', active: true },
    { id: 'tech-107', name: 'Thomas Rivera', defaultRegion: 'PENNDOT', defaultLicensePlate: '16DAHQ', active: true },
    { id: 'tech-108', name: 'Rick Mesner', defaultRegion: 'PENNDOT', defaultLicensePlate: 'TDN6243', active: true },
    { id: 'tech-109', name: 'Brian Delatorre', defaultRegion: 'PENNDOT', defaultLicensePlate: 'DUL7558', active: true },
    { id: 'tech-110', name: 'Joseph Brennan', defaultRegion: 'PENNDOT', defaultLicensePlate: 'TAU3734', active: true },
    { id: 'tech-111', name: 'Kristian Stauffer', defaultRegion: 'PENNDOT', defaultLicensePlate: 'PTGK20', active: true },
    { id: 'tech-112', name: 'Gavin Adams', defaultRegion: 'South Central', defaultLicensePlate: '750GXI', active: true },
    { id: 'tech-113', name: 'James Duncan', defaultRegion: 'Florida', defaultLicensePlate: '', active: true },
    { id: 'tech-114', name: 'Mark Jones', defaultRegion: 'Florida', defaultLicensePlate: '', active: true },
    { id: 'tech-115', name: 'Diego Coreas', defaultRegion: 'South Central', defaultLicensePlate: '662HIH', active: true },
    { id: 'tech-116', name: 'James Glaze', defaultRegion: 'PENNDOT', defaultLicensePlate: '46403NH', active: true },
    { id: 'tech-117', name: 'Jon Donlon', defaultRegion: 'PENNDOT', defaultLicensePlate: '46404NH', active: true },
    { id: 'tech-118', name: 'Bryan Collazo', defaultRegion: 'PENNDOT', defaultLicensePlate: '', active: true },
    { id: 'tech-119', name: 'William Nelson', defaultRegion: 'PENNDOT', defaultLicensePlate: '46402NH', active: true },
    { id: 'tech-120', name: 'Koda Costello', defaultRegion: 'South Central', defaultLicensePlate: '20SB0180', active: true }
  ],
  fieldTimeBufferMinutes: 30,
  samsaraAutoExtract: true,
  defaultIssuesText: 'Assigned Project/s Completed\nNo Issue/s Found\nNote: -----',
  adminPasscode: 'admin123'
};

export function getStoredSettings(): SettingsConfig {
  try {
    const data = localStorage.getItem('trip_analysis_settings');
    if (data) {
      const parsed = JSON.parse(data);
      // Upgrade technicians and regions to version 3 roster
      if (!parsed.version || parsed.version < 3) {
        parsed.version = 3;
        parsed.technicians = INITIAL_SETTINGS.technicians;
        parsed.regions = INITIAL_SETTINGS.regions;
        saveSettings(parsed);
      }
      // Migrate or replace jobTypes if using legacy list
      if (!parsed.jobTypes || parsed.jobTypes.includes('Maintenance') || parsed.jobTypes.includes('Inspection')) {
        parsed.jobTypes = INITIAL_SETTINGS.jobTypes;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return INITIAL_SETTINGS;
}

export function saveSettings(settings: SettingsConfig): void {
  try {
    localStorage.setItem('trip_analysis_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}
