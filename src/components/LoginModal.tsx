import React, { useState } from 'react';
import { 
  X, 
  User, 
  Stethoscope, 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { UserRole, Patient, Doctor } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('patient');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration Form State
  const [regData, setRegData] = useState({
    fullName: '',
    designation: '',
    age: '32',
    dob: '1994-06-15',
    gender: 'Male',
    bloodGroup: 'O+',
    contact: '+91 98765 43210',
    email: '',
    address: '42 Green Glen Layout, Bengaluru',
    aadhaarNumber: '9823-4512-8901',
    // Doctor specific
    specialty: 'Cardiology',
    licenseNumber: 'MCI-CARD-99120',
    hospitalAffiliation: 'Apollo Hospitals & Heart Center',
    // Insurance specific
    insuranceProvider: 'Star Health & Allied Insurance',
    insurancePolicyNumber: 'POL-STAR-772184',
    coverageAmount: '1500000',
    validityDate: '2028-12-31'
  });

  if (!isOpen) return null;


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier: identifier.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please verify credentials.');
      }

      onLoginSuccess(data.user, data.role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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

      // If registered patient with insurance details, auto link insurance
      if (role === 'patient' && regData.insurancePolicyNumber) {
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
      }

      onLoginSuccess(data.user, data.role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'login' ? 'Sign In to HealthLedger' : 'Register New Health Profile'}
            </h2>
            <p className="text-xs text-slate-500">
              {role === 'patient' 
                ? 'Patient Portal & Personal EHR' 
                : 'Doctor Clinical & Diagnostic Console'
              }
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Segmented Selector */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all ${
                role === 'patient'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="h-4 w-4 text-blue-600" />
              <span>Patient Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all ${
                role === 'doctor'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="h-4 w-4 text-emerald-600" />
              <span>Doctor Portal</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Mode content */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {role === 'patient' 
                  ? 'Patient ID, Aadhaar Card, or Email' 
                  : 'Doctor ID, MCI License Number, or Email'}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'patient' ? 'e.g. P-1001 or 9823-4512-8901' : 'e.g. DOC-201 or MCI-CARD-90821'}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                {role === 'patient' 
                  ? 'Supports Indian Aadhaar (12-digit) or registered Patient MRN' 
                  : 'Requires registered medical license ID or assigned clinician code'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Authenticating with Vault...' : 'Enter Secure Portal'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Don't have an existing profile?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-medium text-slate-900 underline hover:text-blue-600"
              >
                Register as {role === 'patient' ? 'Patient' : 'Doctor'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder={role === 'doctor' ? 'Dr. Sarah Connor' : 'Rahul Varma'}
                  value={regData.fullName}
                  onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  placeholder={role === 'doctor' ? 'Senior Cardiologist' : 'Software Engineer'}
                  value={regData.designation}
                  onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {role === 'patient' ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      required
                      value={regData.age}
                      onChange={(e) => setRegData({ ...regData, age: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">DOB</label>
                    <input
                      type="date"
                      required
                      value={regData.dob}
                      onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={regData.bloodGroup}
                      onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Aadhaar Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="XXXX-XXXX-XXXX"
                      value={regData.aadhaarNumber}
                      onChange={(e) => setRegData({ ...regData, aadhaarNumber: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={regData.contact}
                      onChange={(e) => setRegData({ ...regData, contact: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="patient@example.com"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {/* Insurance Details Section */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                    Insurance Policy Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600">Insurance Provider</label>
                      <input
                        type="text"
                        value={regData.insuranceProvider}
                        onChange={(e) => setRegData({ ...regData, insuranceProvider: e.target.value })}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600">Policy Number</label>
                      <input
                        type="text"
                        value={regData.insurancePolicyNumber}
                        onChange={(e) => setRegData({ ...regData, insurancePolicyNumber: e.target.value })}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600">Coverage Limit (₹)</label>
                      <input
                        type="number"
                        value={regData.coverageAmount}
                        onChange={(e) => setRegData({ ...regData, coverageAmount: e.target.value })}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600">Validity Expiry</label>
                      <input
                        type="date"
                        value={regData.validityDate}
                        onChange={(e) => setRegData({ ...regData, validityDate: e.target.value })}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Medical Specialty</label>
                    <select
                      value={regData.specialty}
                      onChange={(e) => setRegData({ ...regData, specialty: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    >
                      {['Cardiology', 'Orthopedics', 'Pulmonology', 'Dermatology', 'Neurology', 'Endocrinology', 'General Medicine', 'Gastroenterology'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">MCI / NMC License Number</label>
                    <input
                      type="text"
                      required
                      placeholder="MCI-XXXX-XXXX"
                      value={regData.licenseNumber}
                      onChange={(e) => setRegData({ ...regData, licenseNumber: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Hospital / Clinic Affiliation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apollo Hospitals / Private Clinic"
                    value={regData.hospitalAffiliation}
                    onChange={(e) => setRegData({ ...regData, hospitalAffiliation: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="doctor@hospital.org"
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={regData.contact}
                      onChange={(e) => setRegData({ ...regData, contact: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 mt-4"
            >
              {loading ? 'Creating Profile & Anchoring to Ledger...' : 'Complete Registration'}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-medium text-slate-900 underline hover:text-blue-600"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
