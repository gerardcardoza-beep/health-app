/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Pill, 
  Database, 
  UploadCloud, 
  Layers, 
  Cpu, 
  User, 
  Stethoscope, 
  Plus, 
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { UserRole, Patient, Doctor, Diagnosis, Medication, InsurancePolicy, ExternalHospitalLink, BlockchainState } from './types';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PatientProfileCard } from './components/PatientProfileCard';
import { PatientAndHospitalsPage } from './components/PatientAndHospitalsPage';
import { DiagnosisSegregationView } from './components/DiagnosisSegregationView';
import { MedicationTracker } from './components/MedicationTracker';
import { DoctorPortal } from './components/DoctorPortal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { ExternalDatabaseLinkerModal } from './components/ExternalDatabaseLinkerModal';
import { ScanUploadModal } from './components/ScanUploadModal';
import { BlockchainExplorerModal } from './components/BlockchainExplorerModal';
import { McpConsoleModal } from './components/McpConsoleModal';
import { ScanViewerModal } from './components/ScanViewerModal';
import { testConnection } from './firebase';

export default function App() {
  const [role, setRole] = useState<UserRole>('patient');
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Loaded Data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentUser, setCurrentUser] = useState<Patient | Doctor | any>(null);

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalHospitalLink[]>([]);
  const [blockchainState, setBlockchainState] = useState<BlockchainState | null>(null);

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploadScanOpen, setIsUploadScanOpen] = useState(false);
  const [isExternalLinkerOpen, setIsExternalLinkerOpen] = useState(false);
  const [isBlockchainExplorerOpen, setIsBlockchainExplorerOpen] = useState(false);
  const [isMcpConsoleOpen, setIsMcpConsoleOpen] = useState(false);
  const [viewingDiagnosis, setViewingDiagnosis] = useState<Diagnosis | null>(null);

  const [loading, setLoading] = useState(true);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      setLoading(true);
      testConnection().catch(console.warn);

      // Load patients and doctors
      const [ptsRes, docsRes, chainRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/doctors'),
        fetch('/api/blockchain')
      ]);

      const ptsData = await ptsRes.json();
      const docsData = await docsRes.json();
      const chainData = await chainRes.json();

      setPatients(ptsData);
      setDoctors(docsData);
      setBlockchainState(chainData);

      // Default active patient: P-1001 (Aarav Sharma)
      const defaultPt = ptsData.find((p: Patient) => p.id === 'P-1001') || ptsData[0];
      setSelectedPatient(defaultPt);
      // Do not auto-login: user sees the dedicated Login Page first

      // Load detailed patient records
      if (defaultPt) {
        await loadPatientDetails(defaultPt.id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();

      if (data.patient) {
        setInsurancePolicies(data.insurance_policies || []);
        setExternalLinks(data.external_hospital_links || []);
        setMedications(data.all_medications || []);

        // Flatten segregated diagnoses for view
        const allDiags: Diagnosis[] = [];
        if (data.segregated_diagnoses) {
          Object.values(data.segregated_diagnoses).forEach((dList: any) => {
            allDiags.push(...dList);
          });
        }
        setDiagnoses(allDiags);
      }
    } catch (err) {
      console.error('Failed to load patient records:', err);
    }
  };

  const refreshBlockchain = async () => {
    try {
      const res = await fetch('/api/blockchain');
      const data = await res.json();
      setBlockchainState(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'doctor') {
      const defaultDoc = doctors[0];
      if (defaultDoc) setCurrentUser(defaultDoc);
    } else {
      if (selectedPatient) setCurrentUser(selectedPatient);
    }
  };

  const handleLoginSuccess = (user: any, userRole: UserRole) => {
    setRole(userRole);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsLoginOpen(false);
    if (userRole === 'patient') {
      const p = user as Patient;
      setSelectedPatient(p);
      loadPatientDetails(p.id);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    if (role === 'patient') {
      setCurrentUser(patient);
    }
    loadPatientDetails(patient.id);
  };

  const handleScanUploadSuccess = async () => {
    if (selectedPatient) {
      await loadPatientDetails(selectedPatient.id);
    }
    await refreshBlockchain();
  };

  const handleExternalLinkSuccess = async () => {
    if (selectedPatient) {
      await loadPatientDetails(selectedPatient.id);
    }
    await refreshBlockchain();
  };

  // If loading initial state
  if (loading && !patients.length) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 font-bold mb-4 shadow-xl">
          <ShieldCheck className="h-7 w-7 text-slate-950 animate-pulse" />
        </div>
        <p className="text-sm font-semibold tracking-tight text-white">Loading HealthLedger Vault...</p>
        <p className="text-xs text-slate-500 mt-1">Connecting cryptographic ledger and patient nodes</p>
      </div>
    );
  }

  // If user is not yet logged in, render the dedicated Login Page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        availablePatients={patients}
        availableDoctors={doctors}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-20 lg:pb-8 selection:bg-slate-900 selection:text-white">
      {/* 3-Zone Navigation Top Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        role={role}
        setRole={handleRoleChange}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenBlockchainExplorer={() => setIsBlockchainExplorerOpen(true)}
        onOpenMcpConsole={() => setIsMcpConsoleOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Editorial Sub-Header Banner (Quiet visual anchor) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative grid grid-cols-1 lg:grid-cols-12 items-center">
            
            <div className="lg:col-span-8 p-6 sm:p-8 space-y-3">
              {/* Unboxed Zero-Pill Header Kicker */}
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                <span>NIST SHA-256 Ledger · ABDM & HL7 FHIR Compliant · Bi-Directional EHR</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-balance">
                Decentralized Health Records & Diagnostic Vault
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Seamlessly connect hospital electronic health records and insurance databases using Patient ID or Aadhaar Card. Local doctors can securely upload diagnostic scans, segregate treatments by specialty, prescribe medications, and anchor tamper-proof proofs directly to the blockchain.
              </p>

              {/* Action buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsUploadScanOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Local Diagnosis Scan</span>
                </button>

                <button
                  onClick={() => setCurrentTab('patient-dashboard')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span>Patient Dashboard & Hospitals</span>
                </button>

                <button
                  onClick={() => setIsExternalLinkerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Database className="h-3.5 w-3.5 text-blue-600" />
                  <span>Connect Hospital / Insurance API</span>
                </button>

                <button
                  onClick={() => setIsBlockchainExplorerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <Layers className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Verify Blockchain Ledger ({blockchainState?.blocks.length || 0} Blocks)</span>
                </button>
              </div>
            </div>

            {/* High-Fidelity Clinical Workstation Visual */}
            <div className="lg:col-span-4 h-48 lg:h-full relative overflow-hidden bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200">
              <img
                src="/src/assets/images/medical_hero_banner_1791501882787.jpg"
                alt="Medical Workstation"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent flex items-end p-4">
                <span className="text-[11px] font-mono text-white/90">
                  Secure Cryptographic Vault Active
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Content based on Active Tab or Role */}
        {role === 'doctor' ? (
          <DoctorPortal
            doctor={currentUser as Doctor || doctors[0]}
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={handleSelectPatient}
            diagnoses={diagnoses}
            onOpenUploadScan={() => setIsUploadScanOpen(true)}
            onOpenScanViewer={(d) => setViewingDiagnosis(d)}
            onViewPatientCard={() => setCurrentTab('patient-dashboard')}
          />
        ) : (
          <>
            {(currentTab === 'overview' || currentTab === 'diagnoses') && (
              <DiagnosisSegregationView
                diagnoses={diagnoses}
                onOpenScanViewer={(d) => setViewingDiagnosis(d)}
                onOpenUploadScan={() => setIsUploadScanOpen(true)}
              />
            )}

            {(currentTab === 'patient-dashboard' || currentTab === 'patient-profile' || currentTab === 'links') && selectedPatient && (
              <PatientAndHospitalsPage
                patient={selectedPatient}
                patients={patients}
                onSelectPatient={handleSelectPatient}
                insurancePolicies={insurancePolicies}
                externalLinks={externalLinks}
                onOpenExternalLinker={() => setIsExternalLinkerOpen(true)}
                onOpenBlockchainDetails={() => setIsBlockchainExplorerOpen(true)}
                onNavigateToDiagnoses={() => setCurrentTab('diagnoses')}
              />
            )}

            {currentTab === 'medications' && (
              <MedicationTracker
                medications={medications}
                diagnoses={diagnoses}
              />
            )}
          </>
        )}

      </main>

      {/* Mobile Bottom Thumb Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenUploadScan={() => setIsUploadScanOpen(true)}
        onOpenBlockchainExplorer={() => setIsBlockchainExplorerOpen(true)}
      />

      {/* Dialog Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <ExternalDatabaseLinkerModal
        isOpen={isExternalLinkerOpen}
        onClose={() => setIsExternalLinkerOpen(false)}
        patient={selectedPatient}
        onLinkSuccess={handleExternalLinkSuccess}
      />

      <ScanUploadModal
        isOpen={isUploadScanOpen}
        onClose={() => setIsUploadScanOpen(false)}
        patients={patients}
        selectedPatientId={selectedPatient?.id}
        doctor={role === 'doctor' ? (currentUser as Doctor) : doctors[0]}
        onSuccess={handleScanUploadSuccess}
      />

      <BlockchainExplorerModal
        isOpen={isBlockchainExplorerOpen}
        onClose={() => setIsBlockchainExplorerOpen(false)}
        blockchainState={blockchainState}
        onRefresh={refreshBlockchain}
      />

      <McpConsoleModal
        isOpen={isMcpConsoleOpen}
        onClose={() => setIsMcpConsoleOpen(false)}
        activePatientId={selectedPatient?.id}
      />

      <ScanViewerModal
        diagnosis={viewingDiagnosis}
        onClose={() => setViewingDiagnosis(null)}
      />
    </div>
  );
}
