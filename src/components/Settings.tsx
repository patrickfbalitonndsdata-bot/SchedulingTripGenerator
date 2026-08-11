import React, { useState } from 'react';
import { SettingsConfig, TechnicianOption } from '../types';
import { saveSettings } from '../utils/defaultSettings';
import { UserManagement } from './UserManagement';
import { UserProfile } from '../lib/firebase';
import { Users, MapPin, Wrench, Clock, Save, Plus, Trash2, CheckCircle2, Shield, Settings as SettingsIcon, UserCog, Pencil, Check, X, Search } from 'lucide-react';

interface SettingsProps {
  settings: SettingsConfig;
  onUpdateSettings: (newSettings: SettingsConfig) => void;
  onLockAdminSession?: () => void;
  currentUserProfile?: UserProfile | null;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onLockAdminSession, currentUserProfile }) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'users'>('roster');
  const [localSettings, setLocalSettings] = useState<SettingsConfig>({ ...settings });
  const [savedToast, setSavedToast] = useState(false);

  // Technician handlers
  const [newTechName, setNewTechName] = useState('');
  const [newTechRegion, setNewTechRegion] = useState(localSettings.regions[0] || 'South Central');
  const [newTechPlate, setNewTechPlate] = useState('');

  // Editing Technician State
  const [editingTechId, setEditingTechId] = useState<string | null>(null);
  const [editTechName, setEditTechName] = useState('');
  const [editTechRegion, setEditTechRegion] = useState('');
  const [editTechPlate, setEditTechPlate] = useState('');

  // Search/Filter State for Technician Roster
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');

  const filteredTechnicians = localSettings.technicians.filter((tech) => {
    const q = rosterSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      tech.name.toLowerCase().includes(q) ||
      tech.defaultRegion.toLowerCase().includes(q) ||
      tech.defaultLicensePlate.toLowerCase().includes(q)
    );
  });

  const handleStartEditTechnician = (tech: TechnicianOption) => {
    setEditingTechId(tech.id);
    setEditTechName(tech.name);
    setEditTechRegion(tech.defaultRegion);
    setEditTechPlate(tech.defaultLicensePlate);
  };

  const handleCancelEditTechnician = () => {
    setEditingTechId(null);
    setEditTechName('');
    setEditTechRegion('');
    setEditTechPlate('');
  };

  const handleSaveEditTechnician = (id: string) => {
    if (!editTechName.trim()) return;
    const updatedTechs = localSettings.technicians.map(t => {
      if (t.id === id) {
        return {
          ...t,
          name: editTechName.trim(),
          defaultRegion: editTechRegion || 'South Central',
          defaultLicensePlate: editTechPlate.trim() || '100XYZ'
        };
      }
      return t;
    });
    setLocalSettings({ ...localSettings, technicians: updatedTechs });
    setEditingTechId(null);
  };

  const handleAddTechnician = () => {
    if (!newTechName.trim()) return;
    const newTech: TechnicianOption = {
      id: `tech-${Date.now()}`,
      name: newTechName.trim(),
      defaultRegion: newTechRegion,
      defaultLicensePlate: newTechPlate.trim() || '100XYZ',
      active: true
    };
    const updatedTechs = [...localSettings.technicians, newTech];
    setLocalSettings({ ...localSettings, technicians: updatedTechs });
    setNewTechName('');
    setNewTechPlate('');
  };

  const handleRemoveTechnician = (id: string) => {
    if (localSettings.technicians.length <= 1) return;
    const updatedTechs = localSettings.technicians.filter(t => t.id !== id);
    setLocalSettings({ ...localSettings, technicians: updatedTechs });
  };

  // Region handlers
  const [newRegion, setNewRegion] = useState('');
  const handleAddRegion = () => {
    if (!newRegion.trim()) return;
    if (localSettings.regions.includes(newRegion.trim())) return;
    setLocalSettings({
      ...localSettings,
      regions: [...localSettings.regions, newRegion.trim()]
    });
    setNewRegion('');
  };

  const handleRemoveRegion = (region: string) => {
    if (localSettings.regions.length <= 1) return;
    setLocalSettings({
      ...localSettings,
      regions: localSettings.regions.filter(r => r !== region)
    });
  };

  // Job Type handlers
  const [newJobType, setNewJobType] = useState('');
  const handleAddJobType = () => {
    if (!newJobType.trim()) return;
    if (localSettings.jobTypes.includes(newJobType.trim())) return;
    setLocalSettings({
      ...localSettings,
      jobTypes: [...localSettings.jobTypes, newJobType.trim()]
    });
    setNewJobType('');
  };

  const handleRemoveJobType = (jt: string) => {
    if (localSettings.jobTypes.length <= 1) return;
    setLocalSettings({
      ...localSettings,
      jobTypes: localSettings.jobTypes.filter(j => j !== jt)
    });
  };

  const handleSaveAll = () => {
    saveSettings(localSettings);
    onUpdateSettings(localSettings);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-500" />
            <span>System Settings & Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage technician rosters, default regions, user permissions, and Samsara log extraction rules.
          </p>
        </div>

        {activeSubTab === 'roster' && (
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        )}
      </div>

      {/* Settings Sub-Tab Selector */}
      <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'roster'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-amber-500" />
          <span>Technician Rosters & Service Rules</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCog className="w-4 h-4 text-emerald-600" />
          <span>User Accounts & Approval Directory</span>
        </button>
      </div>

      {savedToast && activeSubTab === 'roster' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-800 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings saved successfully! Future uploaded KMZ files will use this configuration.</span>
        </div>
      )}

      {activeSubTab === 'users' ? (
        <UserManagement 
          currentUserProfile={currentUserProfile || null} 
          availableRegions={localSettings.regions}
        />
      ) : (
        <>

      {/* Technician Roster */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>Technician Roster & Vehicle License Plates</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {rosterSearchQuery.trim() 
              ? `Showing ${filteredTechnicians.length} of ${localSettings.technicians.length} technicians`
              : `${localSettings.technicians.length} Technicians active`}
          </span>
        </div>

        {/* Search Bar for Filtering Technicians */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={rosterSearchQuery}
            onChange={(e) => setRosterSearchQuery(e.target.value)}
            placeholder="Search technician by name, default region, or license plate..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
          {rosterSearchQuery && (
            <button
              type="button"
              onClick={() => setRosterSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/80 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Existing Tech Table */}
        <div className="overflow-x-auto">
          {filteredTechnicians.length > 0 ? (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3">Technician Name</th>
                  <th className="p-3">Default Region</th>
                  <th className="p-3">License Plate</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTechnicians.map((tech) => {
                  const isEditing = editingTechId === tech.id;
                  return (
                    <tr key={tech.id} className={isEditing ? "bg-amber-50/50" : "hover:bg-slate-50"}>
                      <td className="p-2.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTechName}
                            onChange={(e) => setEditTechName(e.target.value)}
                            placeholder="Technician name..."
                            className="w-full px-2 py-1 bg-white border border-amber-400 rounded-lg text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        ) : (
                          <span className="font-bold text-slate-900">{tech.name}</span>
                        )}
                      </td>

                      <td className="p-2.5">
                        {isEditing ? (
                          <select
                            value={editTechRegion}
                            onChange={(e) => setEditTechRegion(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-amber-400 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          >
                            {localSettings.regions.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-medium text-slate-600">{tech.defaultRegion}</span>
                        )}
                      </td>

                      <td className="p-2.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTechPlate}
                            onChange={(e) => setEditTechPlate(e.target.value)}
                            placeholder="License plate..."
                            className="w-full px-2 py-1 bg-white border border-amber-400 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        ) : (
                          <span className="font-mono font-semibold text-slate-800">{tech.defaultLicensePlate}</span>
                        )}
                      </td>

                      <td className="p-2.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleSaveEditTechnician(tech.id)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-100/80 rounded-lg border border-emerald-300 bg-emerald-50 transition-all cursor-pointer"
                              title="Save Technician Details"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEditTechnician}
                              className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg border border-slate-300 bg-slate-100 transition-all cursor-pointer"
                              title="Cancel Editing"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleStartEditTechnician(tech)}
                              className="p-1.5 text-amber-800 hover:bg-amber-100/80 rounded-lg border border-amber-300 bg-amber-50 transition-all cursor-pointer"
                              title="Edit Technician Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {localSettings.technicians.length > 1 && (
                              <button
                                onClick={() => handleRemoveTechnician(tech.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Remove Technician"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                No technicians match "{rosterSearchQuery}"
              </p>
              <p className="text-[11px] text-slate-500">
                Try searching by a different name, default region, or license plate.
              </p>
              <button
                type="button"
                onClick={() => setRosterSearchQuery('')}
                className="mt-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>

        {/* Add New Tech Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-800 block">Add New Technician</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="e.g., Poche, Matthew"
              value={newTechName}
              onChange={(e) => setNewTechName(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <select
              value={newTechRegion}
              onChange={(e) => setNewTechRegion(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {localSettings.regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="License Plate (e.g., 175HCP)"
                value={newTechPlate}
                onChange={(e) => setNewTechPlate(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                onClick={handleAddTechnician}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg shrink-0 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Regions & Job Types Dual Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-5 h-5 text-amber-600" />
            <span>Service Regions</span>
          </h2>

          <div className="flex flex-wrap gap-2">
            {localSettings.regions.map(r => (
              <span key={r} className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200">
                <span>{r}</span>
                {localSettings.regions.length > 1 && (
                  <button onClick={() => handleRemoveRegion(r)} className="text-slate-400 hover:text-rose-600 ml-1">
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="New region name..."
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              onClick={handleAddRegion}
              className="px-3 py-1.5 bg-slate-900 text-amber-400 text-xs font-bold rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Job Types */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wrench className="w-5 h-5 text-amber-600" />
            <span>Job Assigned Categories</span>
          </h2>

          <div className="flex flex-wrap gap-2">
            {localSettings.jobTypes.map(jt => (
              <span key={jt} className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200">
                <span>{jt}</span>
                {localSettings.jobTypes.length > 1 && (
                  <button onClick={() => handleRemoveJobType(jt)} className="text-slate-400 hover:text-rose-600 ml-1">
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="New job type..."
              value={newJobType}
              onChange={(e) => setNewJobType(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              onClick={handleAddJobType}
              className="px-3 py-1.5 bg-slate-900 text-amber-400 text-xs font-bold rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Field Time Calculator Rules */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-amber-600" />
          <span>Field Time Calculator & Default Remarks</span>
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Field Time Calculator Buffer (Minutes)
            </label>
            <input
              type="number"
              value={localSettings.fieldTimeBufferMinutes}
              onChange={(e) => setLocalSettings({ ...localSettings, fieldTimeBufferMinutes: parseInt(e.target.value) || 0 })}
              className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used to calculate predicted vs actual daily working hours.
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Default Issues / Anomalies / Remarks Template
            </label>
            <textarea
              rows={3}
              value={localSettings.defaultIssuesText}
              onChange={(e) => setLocalSettings({ ...localSettings, defaultIssuesText: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Admin Passcode & Security Settings */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Admin Access & Security Passcode</span>
          </h2>

          {onLockAdminSession && (
            <button
              onClick={onLockAdminSession}
              className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Lock Admin Session</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
          <div>
            <label className="font-bold text-slate-200 block mb-1">
              Administrator Security Passcode
            </label>
            <input
              type="text"
              value={localSettings.adminPasscode || 'admin123'}
              onChange={(e) => setLocalSettings({ ...localSettings, adminPasscode: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-amber-300 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              This passcode is required to unlock system settings. You can change it anytime above.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-slate-300 text-xs">
            <p className="font-bold text-amber-400 flex items-center gap-1">
              <span>🔒 Admin Protection Status</span>
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Non-admin users cannot view or modify service regions, technician rosters, license plate lookups, or field buffer rules.
            </p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
