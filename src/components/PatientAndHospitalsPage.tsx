import React from 'react';
import { 
  User, 
  Building2, 
  CreditCard, 
  Database, 
  Plus, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Patient, InsurancePolicy, ExternalHospitalLink } from '../types';
import { PatientProfileCard } from './PatientProfileCard';

interface PatientAndHospitalsPageProps {
  patient: Patient;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  insurancePolicies: InsurancePolicy[];
  externalLinks: ExternalHospitalLink[];
  onOpenExternalLinker: () => void;
  onOpenBlockchainDetails?: (txId?: string) => void;
  onNavigateToDiagnoses: () => void;
}

export const PatientAndHospitalsPage: React.FC<PatientAndHospitalsPageProps> = ({
  patient,
  patients,
  onSelectPatient,
  insurancePolicies,
  externalLinks,
  onOpenExternalLinker,
  onOpenBlockchainDetails,
  onNavigateToDiagnoses,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <button
          onClick={onNavigateToDiagnoses}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span>← Back to Diagnoses & Scans</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenExternalLinker}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap"
          >
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <span>Connect Hospital / Insurance API</span>
          </button>

          <button
            onClick={onNavigateToDiagnoses}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <span>View Diagnoses & Scans</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Patient Switcher Bar if multiple patients */}
      {patients.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap text-[11px]">Select Patient:</span>
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPatient(p)}
              className={`rounded-lg px-3 py-1.5 transition-all whitespace-nowrap font-medium ${
                patient.id === p.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.full_name} <span className="text-[10px] opacity-75 font-mono">({p.id})</span>
            </button>
          ))}
        </div>
      )}

      {/* Patient Profile Card (Contains Demographics, Insurance, and Connected Hospitals) */}
      <PatientProfileCard
        patient={patient}
        insurancePolicies={insurancePolicies}
        externalLinks={externalLinks}
        onOpenExternalLinker={onOpenExternalLinker}
        onOpenBlockchainDetails={onOpenBlockchainDetails}
      />
    </div>
  );
};
