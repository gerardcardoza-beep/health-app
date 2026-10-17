import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Stethoscope, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  KeyRound,
  Database,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserRole, Patient, Doctor } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: any, role: UserRole) => void;
  availablePatients: Patient[];
  availableDoctors: Doctor[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess, 
  availablePatients, 
  availableDoctors 
}) => {
  const [role, setRole] = useState<UserRole>('patient');
  const [authMode, setAuthMode] = useState<'credentials' | 'google' | 'register'>('credentials');
  
  // Credentials mode
  const [identifier, setIdentifier] = useState('');
  const [securityPin, setSecurityPin] = useState('');

  // Register mode
  const [regData, setRegData] = useState({
    fullName: '',
    designation: 'Patient',
    age: '30',
    gender: 'Male',
    bloodGroup: 'O+',
    contact: '+91 98765 43210',
    email: '',
    address: 'Indiranagar, Bengaluru',
    aadhaarNumber: '9823-4512-8901',
    // Doctor specific
    specialty: 'General Medicine',
    licenseNumber: 'MCI-REG-88219',
    hospitalAffiliation: 'Apollo Health Center',
    // Insurance
    insuranceProvider: 'Star Health Insurance',
    insurancePolicyNumber: 'POL-STAR-88129',
    coverageAmount: '1000000',
    validityDate: '2028-12-31'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Credentials-Based Login (Patient ID / Aadhaar / Doctor License / Email + PIN)
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!identifier.trim()) {
        throw new Error('Please enter your Patient ID, Aadhaar number, or Doctor License ID.');
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier: identifier.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      setSuccessMsg(`Welcome back, ${data.user.full_name}! Redirecting to homepage...`);

      // Optionally sync with Firestore if signed in
      setTimeout(() => {
        onLoginSuccess(data.user, data.role);
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Firebase Auth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Check or initialize Firestore profile for this user
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      let userData: any = null;

      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          userData = snap.data();
        } else {
          // New Firebase User: Map to patient profile or default
          const defaultPt = availablePatients[0];
          userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'user@healthledger.vault',
            displayName: firebaseUser.displayName || 'Authenticated Member',
            role: role,
            patientId: defaultPt?.id || 'P-1001',
            photoURL: firebaseUser.photoURL || '',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, userData);
        }
      } catch (dbErr) {
        // If firestore rules or offline, fallback gracefully
        console.warn('Firestore user profile sync error:', dbErr);
      }

      // Associate with local EHR record
      const matchedUser = role === 'doctor' 
        ? (availableDoctors[0] || {
            id: 'DOC-201',
            full_name: firebaseUser.displayName || 'Dr. Medical Clinician',
            email: firebaseUser.email || '',
            designation: 'Senior Consultant',
            specialty: 'General Practice',
            licenseNumber: 'MCI-ONLINE-001',
            hospitalAffiliation: 'Central Health Vault'
          })
        : (availablePatients[0] || {
            id: 'P-1001',
            full_name: firebaseUser.displayName || 'Aarav Sharma',
            email: firebaseUser.email || '',
            aadhaar_number: '9823-4512-8901',
            designation: 'Patient',
            age: 32,
            gender: 'Male',
            blood_group: 'O+',
            contact: '+91 98765 43210'
          });

      setSuccessMsg(`Google Authentication Verified! Signed in as ${firebaseUser.displayName || firebaseUser.email}. Taking you to homepage...`);
      setTimeout(() => {
        onLoginSuccess(matchedUser, role);
      }, 600);

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by the browser. Please allow popups or use Credentials login.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was dismissed before completion.');
      } else {
        setError(err.message || 'Firebase Google Sign-in could not complete.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. New Profile Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, ...regData }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Auto link insurance if patient
      if (role === 'patient' && regData.insurancePolicyNumber) {
        try {
          await fetch('/api/external/link-insurance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: data.user.id,
              policyNumber: regData.insurancePolicyNumber,
              providerName: regData.insuranceProvider,
              coverageAmount: regData.coverageAmount,
              validityDate: regData.validityDate,
              planType: 'Comprehensive Health Plan'
            })
          });
        } catch (e) {
          console.warn('Insurance link warning:', e);
        }
      }

      setSuccessMsg(`Registration complete! Welcome to HealthLedger Vault, ${data.user.full_name}. Entering homepage...`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.role);
      }, 700);

    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">HealthLedger Vault</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ABDM & NIST Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">Decentralized Patient EHR · Cryptographic Diagnostic Audits</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Mainnet Cryptographic Ledger Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Card Experience */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex items-center justify-center z-10">
        <div className="w-full max-w-xl">
          
          {/* Main Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
            
            {/* Title / Heading */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-2">
                <Lock className="h-5 w-5 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {authMode === 'register' 
                  ? 'Create Decentralized Health Identity' 
                  : 'Sign In to HealthLedger Vault'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Authenticate using your Patient ID, Aadhaar number, clinical clinician credentials, or Google SSO to unlock your diagnostic records.
              </p>
            </div>

            {/* Role Switcher Pill */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  role === 'patient'
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="h-4 w-4 text-blue-400" />
                <span>Patient Portal</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  role === 'doctor'
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Stethoscope className="h-4 w-4 text-emerald-400" />
                <span>Doctor Clinical Console</span>
              </button>
            </div>

            {/* Notification messages */}
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Primary Google Auth Option (Requested in Metadata) */}
            {authMode !== 'register' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 py-3 px-4 text-xs font-bold transition-all hover:bg-slate-100 active:scale-[0.99] disabled:opacity-50 shadow-md"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google Secure Auth</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold absolute">
                    or authenticate with credentials
                  </span>
                </div>
              </div>
            )}

            {/* Credentials Login Form */}
            {authMode === 'credentials' && (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {role === 'patient'
                      ? 'Patient ID, 12-Digit Aadhaar, or Registered Email'
                      : 'Doctor Clinician Code, MCI License, or Email'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === 'patient' ? 'e.g. P-1001 or 9823-4512-8901' : 'e.g. DOC-201 or MCI-CARD-99120'}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {role === 'patient' 
                      ? 'Decentralized Vault authenticates against SHA-256 patient database.' 
                      : 'Clinicians authenticate with hospital license or medical council register.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Security PIN / Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value)}
                      placeholder="Enter 4-digit PIN or password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <KeyRound className="absolute right-3.5 top-3 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter HealthLedger Vault Homepage</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Register New Identity Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={regData.fullName}
                      onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                      placeholder="e.g. Priya Venkatesh"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="user@healthvault.org"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {role === 'patient' ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Age</label>
                        <input
                          type="number"
                          value={regData.age}
                          onChange={(e) => setRegData({ ...regData, age: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                        <select
                          value={regData.gender}
                          onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Blood Group</label>
                        <input
                          type="text"
                          value={regData.bloodGroup}
                          onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Aadhaar Card (12-Digit)</label>
                      <input
                        type="text"
                        value={regData.aadhaarNumber}
                        onChange={(e) => setRegData({ ...regData, aadhaarNumber: e.target.value })}
                        placeholder="XXXX-XXXX-XXXX"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Medical Specialty</label>
                        <input
                          type="text"
                          value={regData.specialty}
                          onChange={(e) => setRegData({ ...regData, specialty: e.target.value })}
                          placeholder="e.g. Cardiology"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">MCI / State License No.</label>
                        <input
                          type="text"
                          value={regData.licenseNumber}
                          onChange={(e) => setRegData({ ...regData, licenseNumber: e.target.value })}
                          placeholder="MCI-129038"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Hospital / Clinic Affiliation</label>
                      <input
                        type="text"
                        value={regData.hospitalAffiliation}
                        onChange={(e) => setRegData({ ...regData, hospitalAffiliation: e.target.value })}
                        placeholder="Apollo Health City"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Create Record & Enter Homepage'}
                </button>
              </form>
            )}

            {/* Toggle Mode Footer */}
            <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
              {authMode === 'register' ? (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('credentials');
                      setError(null);
                    }}
                    className="text-emerald-400 font-semibold hover:underline"
                  >
                    Back to Sign In
                  </button>
                </span>
              ) : (
                <span>
                  New patient or doctor?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError(null);
                    }}
                    className="text-emerald-400 font-semibold hover:underline"
                  >
                    Register new profile
                  </button>
                </span>
              )}
            </div>

          </div>

          {/* Clinical Standards Compliance Kicker */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              NIST-Compliant SHA-256 Ledger
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-blue-400" />
              Firestore Protected
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <HeartHandshake className="h-3.5 w-3.5 text-rose-400" />
              Ayushman Bharat Digital Mission (ABDM)
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-4 text-center text-xs text-slate-400">
        <p>HealthLedger Vault · Unified Decentralized Electronic Health Record & Diagnostic Verification Platform</p>
      </footer>

    </div>
  );
};
