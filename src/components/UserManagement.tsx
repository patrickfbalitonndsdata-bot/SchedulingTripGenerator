import React, { useState, useEffect } from 'react';
import { UserProfile, getAllUsers, updateUserStatusOrRole, deleteUserAccount, updateUserProfileFields, SUPER_ADMIN_EMAIL, isSuperAdmin } from '../lib/firebase';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UserCog, 
  Trash2, 
  Crown, 
  User,
  Lock,
  Settings,
  X,
  KeyRound,
  Save,
  MapPin,
  Mail,
  Sliders
} from 'lucide-react';

interface UserManagementProps {
  currentUserProfile: UserProfile | null;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUserProfile }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Super Admin Profile Management State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAssignedRegion, setEditAssignedRegion] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState<string | null>(null);

  const currentIsSuper = isSuperAdmin(currentUserProfile);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleStatus = async (user: UserProfile) => {
    if (user.uid === currentUserProfile?.uid) {
      alert("You cannot change your own account status.");
      return;
    }

    if (isSuperAdmin(user)) {
      alert("Superadmin account (Admin101) cannot be deactivated.");
      return;
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    setActionInProgress(user.uid);
    try {
      await updateUserStatusOrRole(user.uid, { status: newStatus });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: newStatus } : u));
      showToast(`User ${user.displayName || user.email} status set to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      alert(err.message || "Failed to update user status.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    if (!currentIsSuper) {
      alert("ACCESS DENIED: Only Superadmin (Admin101 / patrickf.baliton.ndsdata@gmail.com) can change user roles.");
      return;
    }

    if (user.uid === currentUserProfile?.uid) {
      alert("You cannot demote or change your own role.");
      return;
    }

    if (isSuperAdmin(user)) {
      alert("Superadmin account (Admin101) role cannot be changed.");
      return;
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setActionInProgress(user.uid);
    try {
      await updateUserStatusOrRole(user.uid, { role: newRole });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
      showToast(`User ${user.displayName || user.email} role updated to ${newRole.toUpperCase()}`);
    } catch (err: any) {
      alert(err.message || "Failed to update user role.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !currentUserProfile) return;
    setIsDeleting(true);
    setActionInProgress(userToDelete.uid);
    try {
      await deleteUserAccount(userToDelete.uid, currentUserProfile);
      setUsers(prev => prev.filter(u => u.uid !== userToDelete.uid));
      showToast(`User account for ${userToDelete.displayName || userToDelete.email} has been permanently deleted.`);
      setUserToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user account.');
    } finally {
      setIsDeleting(false);
      setActionInProgress(null);
    }
  };

  const openEditProfileModal = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setEditDisplayName(user.displayName || '');
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditAssignedRegion(user.assignedRegion || 'South Central');
    setEditRole(user.role || 'user');
    setEditStatus(user.status || 'active');
    setEditNewPassword('');
    setEditProfileError(null);
  };

  const handleSaveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    setEditProfileError(null);
    setIsSavingProfile(true);

    try {
      // 1. Update status/role if changed
      if (selectedUserForEdit.role !== editRole || selectedUserForEdit.status !== editStatus) {
        await updateUserStatusOrRole(selectedUserForEdit.uid, {
          role: editRole,
          status: editStatus
        });
      }

      // 2. Update profile fields & optional new password
      const updated = await updateUserProfileFields(selectedUserForEdit.uid, {
        displayName: editDisplayName,
        username: editUsername,
        email: editEmail,
        assignedRegion: editAssignedRegion,
        newPassword: editNewPassword.trim() ? editNewPassword.trim() : undefined
      });

      // Update local state list
      setUsers(prev => prev.map(u => u.uid === selectedUserForEdit.uid ? {
        ...u,
        ...updated,
        role: editRole,
        status: editStatus
      } : u));

      showToast(`Profile settings for ${updated.displayName || updated.email} updated successfully!`);
      setSelectedUserForEdit(null);
    } catch (err: any) {
      console.error('Failed to update user profile:', err);
      setEditProfileError(err.message || 'Failed to update user profile settings.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.uid || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'active') return matchesSearch && u.status === 'active';
    if (statusFilter === 'inactive') return matchesSearch && u.status === 'inactive';
    return matchesSearch;
  });

  const activeCount = users.filter(u => u.status === 'active').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <UserCog className="w-5 h-5 text-amber-600" />
            <span>User Account Permissions & Approval Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user authorization, activate pending registrations, and set administrator permissions.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-medium block">Total Users</span>
            <span className="text-lg font-bold text-slate-900">{users.length}</span>
          </div>
          <Users className="w-6 h-6 text-slate-400" />
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-emerald-700 font-medium block">Active Users</span>
            <span className="text-lg font-bold text-emerald-900">{activeCount}</span>
          </div>
          <UserCheck className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-amber-800 font-medium block">Pending / Inactive</span>
            <span className="text-lg font-bold text-amber-900">{inactiveCount}</span>
          </div>
          <UserX className="w-6 h-6 text-amber-600" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg transition-all ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1 rounded-lg transition-all ${statusFilter === 'inactive' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="p-3">User / Name</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">System Role</th>
              <th className="p-3">Account Status</th>
              <th className="p-3 text-right">Actions / Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Loading registered users directory...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No users found matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isCurrent = u.uid === currentUserProfile?.uid;
                const isWorking = actionInProgress === u.uid;
                const targetIsSuper = isSuperAdmin(u);

                return (
                  <tr key={u.uid} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-amber-50/30' : ''}`}>
                    <td className="p-3 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          targetIsSuper ? 'bg-amber-500 text-slate-950 shadow-sm' : u.role === 'admin' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {u.displayName ? u.displayName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.displayName || 'Technician / User'}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-300 font-bold">You</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                            {u.username && <span className="text-amber-700 font-semibold">@{u.username}</span>}
                            <span>UID: {u.uid.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-medium text-slate-700 font-mono">{u.email}</td>

                    <td className="p-3">
                      {targetIsSuper ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 border border-amber-300 shadow-xs">
                          <Crown className="w-3 h-3 fill-slate-950" />
                          <span>Superadmin</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {u.role === 'admin' ? <Crown className="w-3 h-3 text-amber-600" /> : <User className="w-3 h-3 text-slate-500" />}
                          <span className="capitalize">{u.role}</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                      }`}>
                        {u.status === 'active' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <UserX className="w-3 h-3 text-rose-600" />}
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Toggle Status Button */}
                        <button
                          disabled={isCurrent || isWorking || targetIsSuper}
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-xs'
                          } ${isCurrent || targetIsSuper ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={targetIsSuper ? 'Superadmin account cannot be deactivated' : u.status === 'active' ? 'Deactivate User Account' : 'Activate User Account'}
                        >
                          {isWorking ? 'Updating...' : u.status === 'active' ? 'Deactivate' : 'Activate User'}
                        </button>

                        {/* Toggle Role Button - Restricted to Superadmin */}
                        <button
                          disabled={!currentIsSuper || isCurrent || isWorking || targetIsSuper}
                          onClick={() => handleToggleRole(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            !currentIsSuper || isCurrent || targetIsSuper
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer'
                          }`}
                          title={
                            targetIsSuper
                              ? 'Superadmin role cannot be modified'
                              : !currentIsSuper
                              ? 'Only Superadmin (Admin101) can modify administrator roles'
                              : u.role === 'admin'
                              ? 'Demote to User'
                              : 'Promote to Admin'
                          }
                        >
                          {!currentIsSuper && <Lock className="w-3 h-3 text-slate-400" />}
                          <span>{u.role === 'admin' ? 'Make User' : 'Make Admin'}</span>
                        </button>

                        {/* Profile Settings Icon Button - Super Admin */}
                        {currentIsSuper && (
                          <button
                            onClick={() => openEditProfileModal(u)}
                            className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-100/80 border border-amber-300 transition-all cursor-pointer bg-amber-50"
                            title="Super Admin: Edit Profile & Settings"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Account Button - Admin & Superadmin */}
                        <button
                          disabled={isCurrent || isWorking || targetIsSuper || (!currentIsSuper && u.role === 'admin')}
                          onClick={() => setUserToDelete(u)}
                          className={`p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 transition-all cursor-pointer ${
                            isCurrent || targetIsSuper || (!currentIsSuper && u.role === 'admin')
                              ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-rose-600 border-slate-200'
                              : ''
                          }`}
                          title={
                            targetIsSuper
                              ? 'Superadmin account cannot be deleted'
                              : isCurrent
                              ? 'You cannot delete your own account'
                              : !currentIsSuper && u.role === 'admin'
                              ? 'Only Superadmin can delete Administrator accounts'
                              : 'Delete User Account Permanently'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Account Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action will permanently delete the account.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="text-slate-700"><strong>User:</strong> {userToDelete.displayName || 'Unnamed User'}</p>
              <p className="text-slate-700 font-mono"><strong>Email:</strong> {userToDelete.email}</p>
              {userToDelete.username && (
                <p className="text-slate-700 font-mono"><strong>Username:</strong> @{userToDelete.username}</p>
              )}
              <p className="text-slate-700"><strong>Role:</strong> <span className="capitalize">{userToDelete.role}</span></p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this user account and remove their associated records from Firestore?
            </p>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Profile & Account Settings Modal */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5 text-amber-800">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Sliders className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Account Profile & System Settings</h3>
                  <p className="text-xs text-slate-500 font-mono">UID: {selectedUserForEdit.uid}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editProfileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editProfileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfileSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Full Display Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Display Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <span>Username</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="e.g. john_doe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Assigned Region */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned Region</span>
                  </label>
                  <select
                    value={editAssignedRegion}
                    onChange={(e) => setEditAssignedRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  >
                    <option value="South Central">South Central</option>
                    <option value="North">North</option>
                    <option value="West">West</option>
                    <option value="East">East</option>
                    <option value="Central">Central</option>
                  </select>
                </div>

                {/* System Role */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Role</span>
                  </label>
                  <select
                    value={editRole}
                    disabled={isSuperAdmin(selectedUserForEdit)}
                    onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none disabled:opacity-50"
                  >
                    <option value="user">Technician / Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {/* Account Status */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Approval Status</span>
                  </label>
                  <div className="flex items-center space-x-3 pt-1">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="accountStatus"
                        value="active"
                        checked={editStatus === 'active'}
                        onChange={() => setEditStatus('active')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-emerald-700 font-bold">Active (Approved)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="accountStatus"
                        value="inactive"
                        checked={editStatus === 'inactive'}
                        onChange={() => setEditStatus('inactive')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-amber-800 font-bold">Inactive (Pending / Suspended)</span>
                    </label>
                  </div>
                </div>

                {/* Reset / Change Password (Super Admin override) */}
                <div className="space-y-1 sm:col-span-2 border-t border-slate-100 pt-3 mt-1">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Set New Account Password (Optional)</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Leave blank to keep the current password unchanged. Enter a new password to directly update credentials for this account.
                  </p>
                  <input
                    type="text"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingProfile}
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Profile Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
