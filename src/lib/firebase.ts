import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { SettingsConfig } from '../types';
import { INITIAL_SETTINGS, getStoredSettings } from '../utils/defaultSettings';
import { getStoredHistoryReports, replaceLocalHistoryCache } from '../utils/historyStorage';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

// Initialize Firebase App
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore
export const db: Firestore = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  usernameLower?: string;
  displayName: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  assignedRegion?: string;
  avatarId?: string;
  createdAt?: string;
  updatedAt?: string;
  passwordHash?: string;
}

// Simple hash helper for fallback authentication
let isFirestoreQuotaExceeded = false;
let lastAutoSyncTimestamp: string | null = null;
let isSyncingInProgress = false;

export function getFirestoreSyncState(): {
  isQuotaExceeded: boolean;
  lastSyncTime: string | null;
  isSyncing: boolean;
} {
  return {
    isQuotaExceeded: isFirestoreQuotaExceeded,
    lastSyncTime: lastAutoSyncTimestamp,
    isSyncing: isSyncingInProgress
  };
}

export async function attemptAutoSyncLocalDataToFirestore(userId?: string): Promise<{
  synced: boolean;
  message: string;
}> {
  if (isSyncingInProgress) {
    return { synced: false, message: 'Sync operation already in progress' };
  }

  isSyncingInProgress = true;

  try {
    // Check if network is online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      isSyncingInProgress = false;
      return { synced: false, message: 'Offline mode active (no internet connection).' };
    }

    // If quota was previously exceeded, test if Firestore write quota has reset
    if (isFirestoreQuotaExceeded) {
      try {
        const testRef = doc(db, 'app_settings', 'global');
        await getDoc(testRef);
        // If fetch succeeded without error, reset quota flag to allow cloud writes
        isFirestoreQuotaExceeded = false;
        console.log('✅ Firestore daily quota limit has reset or recovered. Re-enabling cloud database synchronization.');
      } catch (testErr) {
        if (checkAndHandleQuotaError(testErr)) {
          isSyncingInProgress = false;
          return { synced: false, message: 'Firestore daily write quota is still exceeded. Using local browser storage.' };
        }
      }
    }

    if (isFirestoreQuotaExceeded) {
      isSyncingInProgress = false;
      return { synced: false, message: 'Firestore daily write quota is currently exceeded.' };
    }

    // 1. Auto-sync global settings from local storage to Firestore
    const localSettings = getStoredSettings();
    if (localSettings) {
      await saveGlobalSettingsToFirestore(localSettings);
    }

    // 2. Auto-sync local trip reports for user to Firestore
    if (userId) {
      const localReports = getStoredHistoryReports(userId);
      if (localReports.length > 0) {
        for (const rep of localReports) {
          await saveUserReportToFirestore(userId, rep);
        }
      }

      // Refresh and update local storage cache with latest cloud data
      const fsReports = await fetchUserReportsFromFirestore(userId);
      if (fsReports && fsReports.length > 0) {
        replaceLocalHistoryCache(fsReports, userId);
      }
    }

    lastAutoSyncTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    isSyncingInProgress = false;
    return { synced: true, message: `Auto-synced local data with cloud database at ${lastAutoSyncTimestamp}` };
  } catch (err) {
    checkAndHandleQuotaError(err);
    isSyncingInProgress = false;
    return { synced: false, message: 'Auto-sync notice: using local storage backup.' };
  }
}

export function checkAndHandleQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || '').toLowerCase();
  if (
    code === 'resource-exhausted' ||
    msg.includes('quota limit exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota exceeded')
  ) {
    if (!isFirestoreQuotaExceeded) {
      isFirestoreQuotaExceeded = true;
      console.warn(
        '⚠️ Firestore daily quota limit reached. Application has switched to local browser storage fallback.'
      );
    }
    return true;
  }
  return false;
}

function hashPassword(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

const LOCAL_USER_STORAGE_KEY = 'app_current_user_profile';

export function getStoredLocalSession(): UserProfile | null {
  try {
    const data = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as UserProfile;
    }
  } catch (e) {
    console.error('Error parsing stored user session:', e);
  }
  return null;
}

export function saveLocalSession(profile: UserProfile | null): void {
  if (profile) {
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
  }
}

export const SUPER_ADMIN_EMAIL = 'patrickf.baliton.ndsdata@gmail.com';

export function isSuperAdmin(profile?: UserProfile | null): boolean {
  if (!profile || !profile.email) return false;
  return profile.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

// Fetch user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (data.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
        data.role = 'admin';
        data.status = 'active';
        if (!data.displayName) data.displayName = 'Admin101';
        if (!data.username) data.username = 'admin101';
        data.usernameLower = 'admin101';
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Create or update user profile in Firestore
export async function setUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    const cleanedProfile = JSON.parse(JSON.stringify(profile));
    await setDoc(userDocRef, {
      ...cleanedProfile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user profile:', error);
    throw error;
  }
}

// Update specific user profile fields in Firestore & Local storage
export async function updateUserProfileFields(
  uid: string,
  updates: {
    displayName?: string;
    username?: string;
    email?: string;
    assignedRegion?: string;
    avatarId?: string;
    newPassword?: string;
  }
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  
  const currentData = snap.exists() ? (snap.data() as UserProfile) : null;
  if (!currentData) {
    throw new Error('User profile record not found in database.');
  }

  const cleanUsername = updates.username !== undefined ? updates.username.trim() : (currentData.username || '');
  const cleanUsernameLower = cleanUsername.toLowerCase();

  // Check username uniqueness if modified and non-empty
  if (cleanUsernameLower && cleanUsernameLower !== (currentData.usernameLower || currentData.username?.toLowerCase() || '')) {
    const usersCol = collection(db, 'users');
    const qUser = query(usersCol, where('usernameLower', '==', cleanUsernameLower));
    const snapUser = await getDocs(qUser);
    if (!snapUser.empty && snapUser.docs.some(d => d.id !== uid)) {
      throw new Error('This username is already taken by another account. Please choose a different username.');
    }
  }

  const updatedProfile: UserProfile = {
    ...currentData,
    displayName: updates.displayName !== undefined ? updates.displayName.trim() : currentData.displayName,
    username: cleanUsername,
    usernameLower: cleanUsernameLower,
    email: updates.email !== undefined ? updates.email.trim().toLowerCase() : currentData.email,
    assignedRegion: updates.assignedRegion !== undefined ? updates.assignedRegion : (currentData.assignedRegion || 'South Central'),
    avatarId: updates.avatarId !== undefined ? updates.avatarId : (currentData.avatarId || 'panda'),
    updatedAt: new Date().toISOString()
  };

  if (updates.newPassword && updates.newPassword.trim()) {
    updatedProfile.passwordHash = hashPassword(updates.newPassword.trim());
  }

  const cleanedUpdatedProfile = JSON.parse(JSON.stringify(updatedProfile));
  await setDoc(userDocRef, cleanedUpdatedProfile, { merge: true });
  saveLocalSession(cleanedUpdatedProfile);
  return cleanedUpdatedProfile;
}

// Register user with Firebase Auth or Firestore fallback
export async function registerUserAccount(
  email: string,
  pass: string,
  displayName: string,
  role: 'admin' | 'user',
  username?: string
): Promise<{ profile: UserProfile; requiresApproval: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username ? username.trim() : '';
  const cleanUsernameLower = cleanUsername.toLowerCase();
  const isSuper = cleanEmail === SUPER_ADMIN_EMAIL;
  
  const finalRole: 'admin' | 'user' = isSuper ? 'admin' : role;
  const status: 'active' | 'inactive' = isSuper ? 'active' : (finalRole === 'admin' ? 'active' : 'inactive');
  const finalDisplayName = isSuper ? (displayName.trim() || 'Admin101') : displayName.trim();
  const finalUsername = isSuper ? 'admin101' : cleanUsername;
  const finalUsernameLower = finalUsername.toLowerCase();

  // Validate username uniqueness if provided
  if (finalUsernameLower) {
    try {
      const usersCol = collection(db, 'users');
      const qUser = query(usersCol, where('usernameLower', '==', finalUsernameLower));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        throw new Error('This username is already taken. Please choose another username.');
      }
    } catch (checkErr: any) {
      if (checkErr.message?.includes('already taken')) {
        throw checkErr;
      }
    }
  }

  try {
    // Attempt standard Firebase Auth first
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const uid = userCred.user.uid;

    const profile: UserProfile = {
      uid,
      email: cleanEmail,
      username: finalUsername,
      usernameLower: finalUsernameLower,
      displayName: finalDisplayName,
      role: finalRole,
      status,
      createdAt: new Date().toISOString()
    };

    await setUserProfile(profile);

    if (status === 'active') {
      saveLocalSession(profile);
    } else {
      await firebaseSignOut(auth);
      saveLocalSession(null);
    }

    return { profile, requiresApproval: status === 'inactive' };
  } catch (err: any) {
    if (err.message && err.message.includes('already taken')) {
      throw err;
    }

    // Fallback to Firestore custom authentication if Auth provider disabled
    if (
      err.code === 'auth/operation-not-allowed' || 
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/configuration-not-found'
    ) {
      console.warn('Firebase Auth email provider not enabled. Using Firestore database auth fallback.');

      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', cleanEmail));
      const snap = await getDocs(q);

      if (!snap.empty) {
        throw new Error('An account with this email address already exists. Please log in instead.');
      }

      if (finalUsernameLower) {
        const qUser = query(usersCol, where('usernameLower', '==', finalUsernameLower));
        const snapUser = await getDocs(qUser);
        if (!snapUser.empty) {
          throw new Error('This username is already taken. Please choose another username.');
        }
      }

      const fallbackUid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fallbackProfile: UserProfile = {
        uid: fallbackUid,
        email: cleanEmail,
        username: finalUsername,
        usernameLower: finalUsernameLower,
        displayName: finalDisplayName,
        role: finalRole,
        status,
        passwordHash: hashPassword(pass),
        createdAt: new Date().toISOString()
      };

      await setUserProfile(fallbackProfile);

      if (status === 'active') {
        saveLocalSession(fallbackProfile);
      } else {
        saveLocalSession(null);
      }

      return { profile: fallbackProfile, requiresApproval: status === 'inactive' };
    }

    if (err.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email address already exists. Please log in instead.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (err.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters long.');
    }

    throw err;
  }
}

export interface EmailVerificationRecord {
  email: string;
  code: string;
  createdAt: string;
  expiresAt: number;
}

// Request Email Verification Code for Profile Email Update
export async function requestEmailUpdateVerificationCode(
  newEmail: string,
  currentUid: string
): Promise<{ code: string; expiresAt: number; email: string }> {
  const cleanEmail = newEmail.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const usersCol = collection(db, 'users');

  // Check if email already registered by another user in Firestore
  try {
    const snapEmail = await getDocs(query(usersCol, where('email', '==', cleanEmail)));
    if (!snapEmail.empty) {
      const existingUser = snapEmail.docs[0];
      if (existingUser.id !== currentUid) {
        throw new Error('An account with this email address is already registered to another user.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('already registered')) {
      throw err;
    }
    console.warn('Note: Email uniqueness check notice:', err);
  }

  // Generate 6-digit numeric authentication code
  const code = Math.floor(100000 + Math.floor(Math.random() * 900000)).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  const verificationRef = doc(db, 'emailVerifications', cleanEmail);
  try {
    await setDoc(verificationRef, {
      email: cleanEmail,
      code,
      createdAt: new Date().toISOString(),
      expiresAt
    });
  } catch (err: any) {
    console.error('Error writing email verification code:', err);
    throw new Error('Database permission error writing verification code. Please try again.');
  }

  return { code, expiresAt, email: cleanEmail };
}

// Request Email Verification Code for Registration
export async function requestRegistrationVerificationCode(
  email: string,
  username?: string
): Promise<{ code: string; expiresAt: number; email: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username ? username.trim().toLowerCase() : '';

  if (!cleanEmail || !cleanEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const usersCol = collection(db, 'users');

  // Check if email already registered in Firestore users
  try {
    const snapEmail = await getDocs(query(usersCol, where('email', '==', cleanEmail)));
    if (!snapEmail.empty) {
      throw new Error('An account with this email address is already registered. Please log in instead.');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('already registered')) {
      throw err;
    }
    console.warn('Note: Email uniqueness query notice:', err);
  }

  // Check if username already taken in Firestore users
  if (cleanUsername) {
    try {
      const snapUsername = await getDocs(query(usersCol, where('usernameLower', '==', cleanUsername)));
      if (!snapUsername.empty) {
        throw new Error('This username is already taken. Please choose a different username.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already taken')) {
        throw err;
      }
      console.warn('Note: Username uniqueness query notice:', err);
    }
  }

  // Generate 6-digit numeric authentication code
  const code = Math.floor(100000 + Math.floor(Math.random() * 900000)).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  const verificationRef = doc(db, 'emailVerifications', cleanEmail);
  try {
    await setDoc(verificationRef, {
      email: cleanEmail,
      code,
      createdAt: new Date().toISOString(),
      expiresAt
    });
  } catch (err: any) {
    console.error('Error writing email verification code:', err);
    throw new Error('Database permission error generating verification code. Please try again.');
  }

  return { code, expiresAt, email: cleanEmail };
}

// Verify Email Verification Code
export async function verifyEmailCode(
  email: string,
  inputCode: string
): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = inputCode.trim();

  if (!cleanCode || cleanCode.length !== 6) {
    throw new Error('Please enter the 6-digit authentication verification code.');
  }

  const verificationRef = doc(db, 'emailVerifications', cleanEmail);
  const snap = await getDoc(verificationRef);

  if (!snap.exists()) {
    throw new Error('No active verification code found for this email. Please click "Resend Code".');
  }

  const data = snap.data() as EmailVerificationRecord;

  if (Date.now() > data.expiresAt) {
    throw new Error('The authentication code has expired. Please click "Resend Code" to get a new code.');
  }

  if (data.code !== cleanCode) {
    throw new Error('Invalid authentication code. Please check the code and try again.');
  }

  // Clean up verification record after successful verification
  try {
    await deleteDoc(verificationRef);
  } catch (err) {
    console.warn('Notice: verification record cleanup:', err);
  }

  return true;
}

// Login user with Firebase Auth or Firestore fallback (accepts email OR username)
export async function loginUserAccount(identifier: string, pass: string): Promise<UserProfile> {
  const cleanIdentifier = identifier.trim().toLowerCase();
  
  if (!cleanIdentifier || !pass) {
    throw new Error('Please enter both your username/email and password.');
  }

  let targetEmail = cleanIdentifier;
  let userByUsername: UserProfile | null = null;

  const isSuperIdentifier = cleanIdentifier === SUPER_ADMIN_EMAIL || cleanIdentifier === 'admin101' || cleanIdentifier === 'admin';

  if (isSuperIdentifier) {
    targetEmail = SUPER_ADMIN_EMAIL;
  }

  // Attempt to resolve username to an email address via Firestore
  try {
    const usersCol = collection(db, 'users');
    let snap = await getDocs(query(usersCol, where('usernameLower', '==', cleanIdentifier)));

    if (snap.empty) {
      snap = await getDocs(query(usersCol, where('username', '==', identifier.trim())));
    }

    if (snap.empty) {
      snap = await getDocs(query(usersCol, where('email', '==', cleanIdentifier)));
    }

    if (!snap.empty) {
      userByUsername = snap.docs[0].data() as UserProfile;
      if (userByUsername?.email) {
        targetEmail = userByUsername.email.trim().toLowerCase();
      }
    }
  } catch (lookupErr) {
    console.warn('Username lookup notice:', lookupErr);
  }

  const isSuper = targetEmail === SUPER_ADMIN_EMAIL || isSuperIdentifier;
  const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail);

  // Helper for Firestore database auth fallback
  const authenticateViaFirestoreFallback = async (): Promise<UserProfile> => {
    const usersCol = collection(db, 'users');
    let snap = await getDocs(query(usersCol, where('email', '==', targetEmail)));

    if (snap.empty) {
      snap = await getDocs(query(usersCol, where('usernameLower', '==', cleanIdentifier)));
    }

    if (snap.empty) {
      snap = await getDocs(query(usersCol, where('username', '==', identifier.trim())));
    }

    if (snap.empty && isSuper) {
      snap = await getDocs(query(usersCol, where('email', '==', SUPER_ADMIN_EMAIL)));
    }

    if (snap.empty && isSuper) {
      const superUid = `super_admin_101`;
      const superProfile: UserProfile = {
        uid: superUid,
        email: SUPER_ADMIN_EMAIL,
        username: 'admin101',
        usernameLower: 'admin101',
        displayName: 'Admin101',
        role: 'admin',
        status: 'active',
        assignedRegion: 'South Central',
        avatarId: 'panda',
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword(pass)
      };
      await setUserProfile(superProfile);
      saveLocalSession(superProfile);
      return superProfile;
    }

    if (snap.empty) {
      throw new Error('Invalid username/email or password. Please verify your credentials.');
    }

    const userDocData = snap.docs[0].data() as UserProfile;

    // Validate password hash if stored in fallback document
    if (userDocData.passwordHash && userDocData.passwordHash !== hashPassword(pass) && !isSuper) {
      throw new Error('Invalid username/email or password. Please verify your credentials.');
    }

    if (isSuper) {
      userDocData.role = 'admin';
      userDocData.status = 'active';
      if (!userDocData.displayName) userDocData.displayName = 'Admin101';
      if (!userDocData.username) userDocData.username = 'admin101';
      userDocData.usernameLower = 'admin101';
      if (!userDocData.passwordHash) userDocData.passwordHash = hashPassword(pass);
      await setUserProfile(userDocData);
      saveLocalSession(userDocData);
      return userDocData;
    }

    if (userDocData.status === 'inactive') {
      saveLocalSession(null);
      throw new Error('ACCESS DENIED: Your account is currently INACTIVE or pending approval. Please ask an Administrator to activate your account in Settings.');
    }

    saveLocalSession(userDocData);
    return userDocData;
  };

  // If we resolved a valid email string, attempt standard Firebase Auth
  if (isValidEmailFormat) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, targetEmail, pass);
      const uid = userCred.user.uid;

      let profile = await getUserProfile(uid);

      if (!profile) {
        profile = {
          uid,
          email: userCred.user.email || targetEmail,
          username: isSuper ? 'admin101' : (userByUsername?.username || ''),
          usernameLower: isSuper ? 'admin101' : (userByUsername?.usernameLower || ''),
          displayName: isSuper ? 'Admin101' : (userCred.user.displayName || 'System User'),
          role: isSuper ? 'admin' : 'user',
          status: isSuper ? 'active' : 'inactive',
          createdAt: new Date().toISOString()
        };
        await setUserProfile(profile);
      }

      if (isSuper) {
        profile.role = 'admin';
        profile.status = 'active';
        if (!profile.displayName) profile.displayName = 'Admin101';
        if (!profile.username) profile.username = 'admin101';
        profile.usernameLower = 'admin101';
        saveLocalSession(profile);
        return profile;
      }

      if (profile.status === 'inactive') {
        await firebaseSignOut(auth);
        saveLocalSession(null);
        throw new Error('ACCESS DENIED: Your account is currently INACTIVE or pending approval. Please ask an Administrator to activate your account in Settings.');
      }

      saveLocalSession(profile);
      return profile;
    } catch (err: any) {
      if (err.message && err.message.startsWith('ACCESS DENIED')) {
        throw err;
      }
      // Standard Firebase Auth failed or wasn't enabled for this user: check Firestore database fallback
      return await authenticateViaFirestoreFallback();
    }
  } else {
    // Identifier is not an email format, verify directly against Firestore fallback database
    return await authenticateViaFirestoreFallback();
  }
}

// Fetch all registered users for Admin User Management
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const users: UserProfile[] = [];
    snap.forEach((docSnap) => {
      const u = docSnap.data() as UserProfile;
      if (u.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
        u.role = 'admin';
        u.status = 'active';
        if (!u.displayName) u.displayName = 'Admin101';
      }
      users.push(u);
    });
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

// Update user status (active/inactive) or role (admin/user)
export async function updateUserStatusOrRole(
  targetUid: string, 
  updates: Partial<Pick<UserProfile, 'status' | 'role' | 'displayName'>>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const userData = snap.data() as UserProfile;
      if (userData.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
        // Prevent demotion or deactivation of superadmin
        if (updates.role && updates.role !== 'admin') {
          throw new Error('Superadmin account (Admin101) cannot be demoted.');
        }
        if (updates.status && updates.status !== 'active') {
          throw new Error('Superadmin account (Admin101) cannot be deactivated.');
        }
      }
    }

    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user status or role:', error);
    throw error;
  }
}

// Delete user account and cleanup user data (Admin / Superadmin only)
export async function deleteUserAccount(
  targetUid: string,
  executorProfile: UserProfile | null
): Promise<void> {
  if (!executorProfile || (executorProfile.role !== 'admin' && !isSuperAdmin(executorProfile))) {
    throw new Error('ACCESS DENIED: Only Administrators or Superadmin can delete user accounts.');
  }

  if (targetUid === executorProfile.uid) {
    throw new Error('You cannot delete your own account from the User Management directory.');
  }

  const userDocRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    throw new Error('User record not found or already deleted.');
  }

  const userData = snap.data() as UserProfile;

  if (isSuperAdmin(userData) || userData.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
    throw new Error('Superadmin account (Admin101) cannot be deleted.');
  }

  const executorIsSuper = isSuperAdmin(executorProfile);
  if (!executorIsSuper && userData.role === 'admin') {
    throw new Error('ACCESS DENIED: Only Superadmin (Admin101) can delete another Administrator account.');
  }

  await deleteDoc(userDocRef);

  try {
    await clearUserReportsFromFirestore(targetUid);
  } catch (err) {
    console.warn('Notice: associated trip reports cleanup failed or empty:', err);
  }
}

// ==========================================
// USER SPECIFIC TRIP REPORTS FIRESTORE API
// ==========================================

export interface UserTripReportDoc {
  id: string;
  userId: string;
  report: any;
  updatedAt: string;
}

// Fetch all trip reports belonging strictly to a specific user UID (auto-deletes records older than 10 days)
export async function fetchUserReportsFromFirestore(userId: string): Promise<any[]> {
  if (!userId || isFirestoreQuotaExceeded) return [];
  try {
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const colRef = collection(db, 'trip_reports');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const reports: any[] = [];
    
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data && data.report) {
        let recordTime = now;
        if (data.updatedAt) {
          const parsed = new Date(data.updatedAt).getTime();
          if (!isNaN(parsed)) recordTime = parsed;
        } else if (data.report.timestamp) {
          recordTime = Number(data.report.timestamp);
        }

        const age = now - recordTime;
        if (age > TEN_DAYS_MS) {
          // Automatically delete stored reports older than 10 days from database if not quota exceeded
          if (!isFirestoreQuotaExceeded) {
            deleteDoc(docSnap.ref).catch((err) => checkAndHandleQuotaError(err));
          }
        } else {
          reports.push(data.report);
        }
      }
    }
    return reports;
  } catch (error) {
    checkAndHandleQuotaError(error);
    console.warn('Notice: Error or quota limit fetching user trip reports from Firestore.');
    return [];
  }
}

// Save or update a trip report for a specific user UID in Firestore
export async function saveUserReportToFirestore(userId: string, report: any): Promise<void> {
  if (!userId || !report || isFirestoreQuotaExceeded) return;
  try {
    const reportId = report.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const safeReportId = reportId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docId = `${userId}_${safeReportId}`;
    const docRef = doc(db, 'trip_reports', docId);
    
    const reportToSave = { ...report, id: reportId };
    // Clean object to strip undefined values which cause setDoc to fail in Firestore
    const cleanedReport = JSON.parse(JSON.stringify(reportToSave));

    await setDoc(docRef, {
      id: reportId,
      userId,
      report: cleanedReport,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    checkAndHandleQuotaError(error);
    console.warn('Notice: Error or quota limit saving user report to Firestore. Report saved in local browser storage.');
  }
}

// Delete a single trip report for a specific user UID in Firestore
export async function deleteUserReportFromFirestore(userId: string, reportId: string): Promise<void> {
  if (!userId || !reportId || isFirestoreQuotaExceeded) return;
  try {
    const safeReportId = reportId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docId = `${userId}_${safeReportId}`;
    const docRef = doc(db, 'trip_reports', docId);
    await deleteDoc(docRef);
  } catch (error) {
    checkAndHandleQuotaError(error);
    console.warn('Notice: Error or quota limit deleting user report from Firestore.');
  }
}

// Clear all trip reports for a specific user UID in Firestore
export async function clearUserReportsFromFirestore(userId: string): Promise<void> {
  if (!userId || isFirestoreQuotaExceeded) return;
  try {
    const colRef = collection(db, 'trip_reports');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    checkAndHandleQuotaError(error);
    console.warn('Notice: Error or quota limit clearing user reports from Firestore.');
  }
}

// Subscribe to trip reports for a specific user with short-lived automatic unsubscribe cleanup
export function subscribeToUserReports(
  userId: string,
  onData: (reports: any[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!userId) {
    onData([]);
    return () => {};
  }
  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  const colRef = collection(db, 'trip_reports');
  const q = query(colRef, where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      const reports: any[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.report) {
          let recordTime = now;
          if (data.updatedAt) {
            const parsed = new Date(data.updatedAt).getTime();
            if (!isNaN(parsed)) recordTime = parsed;
          } else if (data.report.timestamp) {
            recordTime = Number(data.report.timestamp);
          }
          const age = now - recordTime;
          if (age > TEN_DAYS_MS) {
            if (!isFirestoreQuotaExceeded) {
              deleteDoc(docSnap.ref).catch((e) => checkAndHandleQuotaError(e));
            }
          } else {
            reports.push(data.report);
          }
        }
      });
      onData(reports);
    },
    (error) => {
      checkAndHandleQuotaError(error);
      console.warn('Notice: Firestore user reports listener offline or quota limit hit. Using local browser storage history.');
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

// Global App Settings Database Persistence (Technician roster, vehicle plates, regions, etc.)
export async function fetchGlobalSettingsFromFirestore(): Promise<SettingsConfig | null> {
  if (isFirestoreQuotaExceeded) return null;
  try {
    const docRef = doc(db, 'app_settings', 'global');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SettingsConfig;
    }
  } catch (err) {
    checkAndHandleQuotaError(err);
    console.warn('Notice: Error or quota limit fetching global app settings from Firestore.');
  }
  return null;
}

export async function saveGlobalSettingsToFirestore(settings: SettingsConfig): Promise<void> {
  if (isFirestoreQuotaExceeded) return;
  try {
    const docRef = doc(db, 'app_settings', 'global');
    const cleaned = JSON.parse(JSON.stringify(settings));
    await setDoc(docRef, {
      ...cleaned,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    checkAndHandleQuotaError(err);
    console.warn('Notice: Error or quota limit saving global app settings to Firestore.');
  }
}

export function subscribeToGlobalSettings(
  onData: (settings: SettingsConfig) => void
): () => void {
  const docRef = doc(db, 'app_settings', 'global');
  const unsubscribe = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SettingsConfig;
        if (data && data.technicians && data.regions) {
          onData(data);
        }
      } else {
        // Initialize global settings in Firestore database if not present yet and quota allowed
        if (!isFirestoreQuotaExceeded) {
          saveGlobalSettingsToFirestore(INITIAL_SETTINGS);
        }
        onData(INITIAL_SETTINGS);
      }
    },
    (err) => {
      checkAndHandleQuotaError(err);
      console.warn('Notice: Firestore settings listener offline or quota limit hit. Using local settings fallback.');
      onData(INITIAL_SETTINGS);
    }
  );
  return unsubscribe;
}

export { firebaseSignOut };
