import React from 'react';
import { 
  User, 
  CreditCard, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Droplet, 
  Fingerprint, 
  Building2, 
  CheckCircle2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Patient, InsurancePolicy, ExternalHospitalLink } from '../types';

interface PatientProfileCardProps {
  patient: Patient;
  insurancePolicies: InsurancePolicy[];
  externalLinks: ExternalHospitalLink[];
  onOpenExternalLinker: () => void;
  onOpenBlockchainDetails?: (txId?: string) => void;
}

export const PatientProfileCard: React.FC<PatientProfileCardProps> = ({
  patient,
  insurancePolicies,
  externalLinks,
  onOpenExternalLinker,
  onOpenBlockchainDetails,
}) => {
  const activeInsurance = insurancePolicies.length > 0 ? insurancePolicies[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Patient Header & Details */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-100">
              <img 
                src="/src/assets/images/avatar_patient_profile_1791501906081.jpg" 
                alt={patient.full_name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback container
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-200 text-slate-600 font-bold text-lg -z-10">
                {patient.full_name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {patient.full_name}
                </h1>
                <span className="flex items-center text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Verified Identity
                </span>
              </div>
              
              {/* Zero-pill metadata */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{patient.designation || 'Patient'}</span>
                <span aria-hidden="true">·</span>
                <span>{patient.age} years ({patient.gender})</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">Blood {patient.blood_group}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-600">MRN: {patient.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={onOpenExternalLinker}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Connect Hospital / EHR</span>
            </button>
          </div>
        </div>

        {/* Detailed Demographics Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-slate-500 flex items-center gap-1">
              <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
              Aadhaar Identification
            </span>
            <p className="mt-1 font-mono font-medium text-slate-900 text-sm">
              {patient.aadhaar_number}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-700">UIDAI Vault Linked</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Date of Birth
            </span>
            <p className="mt-1 font-medium text-slate-900 text-sm">
              {patient.dob}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">{patient.age} yrs completed</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-slate-500 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Contact & Emergency
            </span>
            <p className="mt-1 font-medium text-slate-900 truncate">
              {patient.contact}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 truncate">
              ICE: {patient.emergency_contact || 'None registered'}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-slate-500 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Email & Address
            </span>
            <p className="mt-1 font-medium text-slate-900 truncate">
              {patient.email}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 truncate" title={patient.address}>
              {patient.address}
            </p>
          </div>
        </div>
      </div>

      {/* Insurance & Hospital Connectivity Duo Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Insurance Details Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Health Insurance Coverage</h2>
            </div>
            {activeInsurance && (
              <span className="text-xs text-emerald-700 font-medium">
                {activeInsurance.status} · Cashless Approved
              </span>
            )}
          </div>

          {activeInsurance ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{activeInsurance.provider_name}</p>
                  <p className="text-xs text-slate-500">{activeInsurance.plan_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Coverage Limit</p>
                  <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    ₹{Number(activeInsurance.coverage_amount).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-xs">
                <div>
                  <span className="text-slate-500">Policy Number:</span>
                  <p className="font-mono font-medium text-slate-800">{activeInsurance.policy_number}</p>
                </div>
                <div>
                  <span className="text-slate-500">Validity Expiry:</span>
                  <p className="font-mono font-medium text-slate-800">{activeInsurance.validity_date}</p>
                </div>
                <div>
                  <span className="text-slate-500">TPA Claim ID:</span>
                  <p className="font-mono text-slate-800">{activeInsurance.tpa_claim_id || 'TPA-DIRECT'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Blockchain Anchor:</span>
                  <p className="font-mono text-[11px] text-blue-600 truncate">
                    {activeInsurance.blockchain_tx_id || 'tx_verified_01'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center py-4">
              <p className="text-xs text-slate-500">No active insurance policy linked yet.</p>
              <button
                onClick={onOpenExternalLinker}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                + Connect Insurance Database
              </button>
            </div>
          )}
        </div>

        {/* Linked Hospital EHR Repositories */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">Connected Hospital Databases</h2>
            </div>
            <button
              onClick={onOpenExternalLinker}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Link Hospital</span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {externalLinks.length > 0 ? (
              externalLinks.map((link) => {
                let payloadObj: any = {};
                try {
                  payloadObj = link.ehr_payload_json ? JSON.parse(link.ehr_payload_json) : {};
                } catch (e) {}

                return (
                  <div key={link.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{link.hospital_name}</span>
                      <span className="text-[11px] text-emerald-700 font-medium">● {link.sync_status}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-slate-500 text-[11px]">
                      <span>ID: <code className="font-mono text-slate-700">{link.external_ehr_id}</code></span>
                      <span>·</span>
                      <span>Synced: {link.last_sync_at.split(' ')[0]}</span>
                    </div>
                    {payloadObj.allergies && (
                      <p className="mt-1.5 text-[11px] text-amber-700">
                        Noted Allergies: {payloadObj.allergies.join(', ')}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                No external hospital EHR databases linked.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
