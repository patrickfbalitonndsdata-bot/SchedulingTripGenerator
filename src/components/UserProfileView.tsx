import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  updateUserProfileFields,
  requestEmailUpdateVerificationCode,
  verifyEmailCode
} from '../lib/firebase';
import { CUTE_AVATARS, getAvatarById, AvatarOption } from '../utils/avatars';
import { SettingsConfig } from '../types';
import { 
  User, 
  Mail, 
  Lock, 
  MapPin, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  Save, 
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Smile,
  X,
  Crown,
  Send,
  Copy,
  Check,
  RotateCcw,
  RefreshCw
} from 'lucide-react';

interface UserProfileViewProps {
  currentUserProfile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  settings: SettingsConfig;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUserProfile,
  onProfileUpdated,
  settings
}) => {
  const [displayName, setDisplayName] = useState(currentUserProfile.displayName || '');
  const [username, setUsername] = useState(currentUserProfile.username || '');
  const [email, setEmail] = useState(currentUserProfile.email || '');
  const [assignedRegion, setAssignedRegion] = useState(
    currentUserProfile.assignedRegion || settings.regions[0] || 'South Central'
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentUserProfile.avatarId || 'panda');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Email Change Verification Modal States
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const currentAvatar = getAvatarById(selectedAvatarId);
  const isSuperAdmin = currentUserProfile.email?.toLowerCase() === 'patrickf.baliton.ndsdata@gmail.com';

  // Resend timer countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const executeProfileUpdate = async () => {
    setSaving(true);
    try {
      const updated = await updateUserProfileFields(currentUserProfile.uid, {
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim(),
        assignedRegion,
        avatarId: selectedAvatarId,
        newPassword: newPassword.trim() ? newPassword.trim() : undefined
      });

      onProfileUpdated(updated);
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Your profile and preferences have been successfully saved!');

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Display Name cannot be empty.');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('Username cannot be empty.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      setErrorMsg('Username can only contain letters, numbers, underscores, dots, and hyphens.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New passwords do not match. Please verify your entries.');
        return;
      }
    }

    // Check if email address is being changed
    const isEmailChanged = email.trim().toLowerCase() !== (currentUserProfile.email || '').trim().toLowerCase();

    if (isEmailChanged) {
      setSaving(true);
      try {
        const { code } = await requestEmailUpdateVerificationCode(
          email.trim().toLowerCase(),
          currentUserProfile.uid
        );
        setSentCode(code);
        setVerificationCode('');
        setModalError(null);
        setResendCooldown(30);
        setShowEmailVerifyModal(true);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to send email verification code.');
      } finally {
        setSaving(false);
      }
      return;
    }

    await executeProfileUpdate();
  };

  const handleConfirmEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setModalError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingCode(true);

    try {
      await verifyEmailCode(email.trim().toLowerCase(), verificationCode.trim());
      setShowEmailVerifyModal(false);
      await executeProfileUpdate();
    } catch (err: any) {
      setModalError(err.message || 'Failed to verify email code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setModalError(null);
    setVerifyingCode(true);
    try {
      const { code } = await requestEmailUpdateVerificationCode(
        email.trim().toLowerCase(),
        currentUserProfile.uid
      );
      setSentCode(code);
      setResendCooldown(30);
      setCodeCopied(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to resend verification code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/80 p-6 sm:p-8 rounded-3xl border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Avatar Display with Edit Button */}
          <div className="relative group">
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br ${currentAvatar.bgGradient} flex items-center justify-center text-4xl sm:text-5xl shadow-2xl border-2 ${currentAvatar.borderColor} transition-transform group-hover:scale-105`}>
              <span>{currentAvatar.emoji}</span>
            </div>
            
            {/* Change Avatar Button */}
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="absolute -bottom-2 -right-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-xl text-xs font-extrabold shadow-lg flex items-center gap-1.5 border border-amber-300 transition-all cursor-pointer hover:scale-105"
              title="Choose Profile Avatar"
            >
              <Smile className="w-4 h-4" />
              <span>Avatar</span>
            </button>
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {displayName || 'User Profile'}
              </h1>
              {isSuperAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider border bg-amber-500 text-slate-950 border-amber-300 shadow-sm flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-slate-950" />
                  <span>SUPERADMIN</span>
                </span>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  currentUserProfile.role === 'admin' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {currentUserProfile.role}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-300 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>{email}</span>
              </span>
              {username && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                  @{username}
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-400">
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Region: <strong className="text-amber-300 font-semibold">{assignedRegion}</strong></span>
              </span>
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Status: <strong className="text-emerald-400 capitalize font-semibold">{currentUserProfile.status}</strong></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Personal Information Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              <span>Personal Details & Region</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your display name, username, login email, and assigned operating region</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Matthew Poche"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Account Username
              </label>
              <div className="relative">
                <span className="text-slate-400 absolute left-3.5 top-2.5 font-bold text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., matthew_p"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Pick Assigned Region */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Assigned Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={assignedRegion}
                  onChange={(e) => setAssignedRegion(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none cursor-pointer"
                >
                  {settings.regions.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Role & Status (Readonly indicator) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Account Privilege & Status
              </label>
              <div className="flex items-center space-x-3 px-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                <span className="capitalize">{isSuperAdmin ? 'Superadmin' : `${currentUserProfile.role} Account`}</span>
                <span>•</span>
                <span className="text-emerald-600 capitalize">{currentUserProfile.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Change Security Password</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Leave blank if you do not want to update your current account password</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters (optional)"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* AVATAR SELECTOR MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Smile className="w-6 h-6 text-amber-500" />
                  <span>Choose Profile Avatar</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a cute icon avatar to represent your account</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CUTE_AVATARS.map((avatar: AvatarOption) => {
                const isSelected = selectedAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatarId(avatar.id);
                      setShowAvatarModal(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-400/30 scale-105'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-3xl shadow-sm border ${avatar.borderColor}`}>
                      <span>{avatar.emoji}</span>
                    </div>
                    <span className={`text-xs font-bold mt-2 text-center line-clamp-1 ${
                      isSelected ? 'text-amber-900' : 'text-slate-700 group-hover:text-slate-900'
                    }`}>
                      {avatar.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL VERIFICATION MODAL FOR PROFILE EMAIL CHANGE */}
      {showEmailVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Verify New Email Address</h3>
                  <p className="text-xs text-slate-500">Authentication code required for email change</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailVerifyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-3">
              <div className="text-xs text-slate-300 leading-relaxed">
                We sent a 6-digit verification code to <span className="font-mono text-amber-300 font-bold">{email}</span> to verify ownership of your new email address.
              </div>

              {sentCode && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Authentication Code:</span>
                    <span className="text-base font-mono font-extrabold text-amber-400 tracking-widest">{sentCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationCode(sentCode);
                      navigator.clipboard.writeText(sentCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmEmailVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-center text-xl font-mono font-bold text-amber-600 tracking-[0.5em] focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || verifyingCode}
                  onClick={handleResendCode}
                  className="text-xs text-slate-500 hover:text-amber-600 font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  {resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <span>Resend Code</span>
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailVerifyModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingCode}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {verifyingCode ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

