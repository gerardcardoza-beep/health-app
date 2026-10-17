import React from 'react';
import { 
  Stethoscope, 
  User, 
  UploadCloud, 
  FileText, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Search,
  Activity,
  Award
} from 'lucide-react';
import { Doctor, Patient, Diagnosis } from '../types';

interface DoctorPortalProps {
  doctor: Doctor;
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  diagnoses: Diagnosis[];
  onOpenUploadScan: () => void;
  onOpenScanViewer: (diagnosis: Diagnosis) => void;
  onViewPatientCard?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  doctor,
  patients,
  selectedPatient,
  onSelectPatient,
  diagnoses,
  onOpenUploadScan,
  onOpenScanViewer,
  onViewPatientCard,
}) => {
  return (
    <div className="space-y-6">
      {/* Doctor Identity Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-emerald-100 bg-slate-100">
              <img 
                src="/src/assets/images/avatar_doctor_specialist_1791501892380.jpg" 
                alt={doctor.full_name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-100 text-emerald-800 font-bold text-lg -z-10">
                {doctor.full_name.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {doctor.full_name}
                </h1>
                <span className="flex items-center text-xs text-emerald-700 font-medium">
                  <Award className="h-3.5 w-3.5 mr-1" />
                  MCI Certified Specialist
                </span>
              </div>
              
              {/* Zero-pill metadata */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{doctor.specialty}</span>
                <span aria-hidden="true">·</span>
                <span>{doctor.designation}</span>
                <span aria-hidden="true">·</span>
                <span>{doctor.hospital_affiliation}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-600">Lic: {doctor.license_number}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenUploadScan}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Scan & Write Diagnosis</span>
          </button>
        </div>
      </div>

      {/* Patient Selection Roster */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Assigned Patient Queue & Medical Records</h2>
          </div>
          <span className="text-xs text-slate-500">
            {patients.length} Registered Patients
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {patients.map((p) => {
            const isSelected = selectedPatient?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPatient(p)}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50 shadow-sm ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 truncate">{p.full_name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{p.id}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  <span>{p.age}y ({p.gender})</span> · <span>Blood {p.blood_group}</span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-600 truncate">
                  Aadhaar: {p.aadhaar_number}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Selected Patient EHR Overview */}
      {selectedPatient && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Clinical Chart: {selectedPatient.full_name} (MRN: {selectedPatient.id})
              </h3>
              <p className="text-xs text-slate-500">
                Aadhaar: {selectedPatient.aadhaar_number} · Age: {selectedPatient.age} · DOB: {selectedPatient.dob}
              </p>
            </div>
          <div className="flex flex-wrap items-center gap-2">
            {onViewPatientCard && (
              <button
                onClick={onViewPatientCard}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="h-3.5 w-3.5 text-blue-600" />
                <span>View Patient Card & Hospitals</span>
              </button>
            )}
            <button
              onClick={onOpenUploadScan}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
              <span>Attach Diagnostic Scan</span>
            </button>
          </div>
          </div>

          <div className="space-y-3">
            {diagnoses.length > 0 ? (
              diagnoses.map((d) => (
                <div key={d.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{d.condition_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">[{d.category}]</span>
                      </div>
                      <p className="mt-1 text-slate-700">{d.clinical_notes}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] text-emerald-700 font-semibold block">
                        Block #{d.blockchain_block_index || 1} Mined
                      </span>
                      <span className="text-[10px] text-slate-400">{d.diagnosed_at.split(' ')[0]}</span>
                    </div>
                  </div>

                  {d.scan_url && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 font-mono truncate max-w-xs">
                        Scan Hash: {d.scan_hash?.slice(0, 20)}...
                      </span>
                      <button
                        onClick={() => onOpenScanViewer(d)}
                        className="text-[11px] font-medium text-blue-600 hover:underline"
                      >
                        Inspect Scan Image →
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No recorded diagnoses for this patient yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
