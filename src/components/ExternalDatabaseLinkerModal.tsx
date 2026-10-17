import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  CreditCard, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle,
  Database
} from 'lucide-react';
import { Patient } from '../types';

interface ExternalDatabaseLinkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onLinkSuccess: () => void;
}

const hospitals = [
  { id: 'hosp_apollo', name: 'Apollo Hospitals & Health City', protocol: 'HL7 FHIR v4' },
  { id: 'hosp_aiims', name: 'AIIMS (All India Institute of Medical Sciences)', protocol: 'ABDM Health Gateway' },
  { id: 'hosp_manipal', name: 'Manipal Hospitals Network', protocol: 'HL7 FHIR v4' },
  { id: 'hosp_fortis', name: 'Fortis Memorial Research Institute', protocol: 'FHIR JSON REST' }
];

const insuranceProviders = [
  { id: 'ins_star', name: 'Star Health and Allied Insurance', plan: 'Family Health Optima' },
  { id: 'ins_care', name: 'Care Health Insurance', plan: 'Care Classic' },
  { id: 'ins_hdfc', name: 'HDFC ERGO Health Suraksha', plan: 'Optima Secure' },
  { id: 'ins_ayushman', name: 'Ayushman Bharat PM-JAY (Govt)', plan: 'National Health Protection Scheme (5 Lakh)' }
];

export const ExternalDatabaseLinkerModal: React.FC<ExternalDatabaseLinkerModalProps> = ({
  isOpen,
  onClose,
  patient,
  onLinkSuccess,
}) => {
  const [tab, setTab] = useState<'hospital' | 'insurance'>('hospital');
  const [selectedHospital, setSelectedHospital] = useState('hosp_apollo');
  const [selectedInsurance, setSelectedInsurance] = useState('ins_star');
  const [identifier, setIdentifier] = useState(patient?.aadhaar_number || patient?.id || '9823-4512-8901');
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [linking, setLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setQueryResult(null);
    setLinkSuccess(null);

    try {
      const endpoint = tab === 'hospital' ? '/api/external/query-ehr' : '/api/external/query-insurance';
      const body = tab === 'hospital' 
        ? { identifier, hospitalId: selectedHospital }
        : { identifier, providerId: selectedInsurance };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query external database');
      setQueryResult(data);
    } catch (err: any) {
      setError(err.message || 'API query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!patient || !queryResult) return;
    setLinking(true);
    setError(null);

    try {
      if (tab === 'hospital') {
        const res = await fetch('/api/external/link-hospital', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patient.id,
            hospitalName: queryResult.hospitalName,
            externalId: queryResult.queryKey,
            payload: queryResult.patientSummary
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to link hospital');
        setLinkSuccess(data);
      } else {
        const res = await fetch('/api/external/link-insurance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patient.id,
            policyNumber: queryResult.policyNumber,
            providerName: queryResult.providerName,
            planType: queryResult.planType,
            coverageAmount: queryResult.coverageAmount,
            validityDate: queryResult.validityDate,
            tpaClaimId: queryResult.tpaClaimId
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to link insurance');
        setLinkSuccess(data);
      }
      onLinkSuccess();
    } catch (err: any) {
      setError(err.message || 'Linking failed');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              External Database Linker (Hospital & Insurance APIs)
            </h2>
            <p className="text-xs text-slate-500">
              Query external registries via Patient ID or Aadhaar Card and anchor links to the blockchain.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => {
                setTab('hospital');
                setQueryResult(null);
                setLinkSuccess(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all ${
                tab === 'hospital'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>Hospital EHR Database</span>
            </button>
            <button
              onClick={() => {
                setTab('insurance');
                setQueryResult(null);
                setLinkSuccess(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all ${
                tab === 'insurance'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>Insurance Database</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {tab === 'hospital' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Hospital Registry
              </label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} · {h.protocol}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Insurance Provider
              </label>
              <select
                value={selectedInsurance}
                onChange={(e) => setSelectedInsurance(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {insuranceProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.plan}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Patient ID or Aadhaar Card Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9823-4512-8901 or P-1001"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleQuery}
                disabled={loading || !identifier}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Fetch via API</span>
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Uses national ABDM / FHIR protocols to securely locate records.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Preview */}
          {queryResult && !linkSuccess && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Verified Record Found
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {queryResult.protocol || 'HL7 FHIR'}
                </span>
              </div>

              {tab === 'hospital' ? (
                <div className="text-xs space-y-2 text-slate-700">
                  <p><span className="text-slate-500">Hospital:</span> {queryResult.hospitalName}</p>
                  <p><span className="text-slate-500">Documented Allergies:</span> {queryResult.patientSummary?.knownAllergies?.join(', ')}</p>
                  <p><span className="text-slate-500">Last Discharge:</span> {queryResult.patientSummary?.lastAdmissionDate} ({queryResult.patientSummary?.dischargeCondition})</p>
                  <p className="font-mono text-[11px] text-slate-500 truncate">
                    Identity Digest: {queryResult.verificationFingerprint}
                  </p>
                </div>
              ) : (
                <div className="text-xs space-y-2 text-slate-700">
                  <p><span className="text-slate-500">Provider:</span> {queryResult.providerName}</p>
                  <p><span className="text-slate-500">Policy:</span> <code className="font-mono text-slate-900">{queryResult.policyNumber}</code> ({queryResult.planType})</p>
                  <p><span className="text-slate-500">Sum Insured:</span> ₹{Number(queryResult.coverageAmount).toLocaleString('en-IN')}</p>
                  <p><span className="text-slate-500">Validity:</span> Valid through {queryResult.validityDate}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmLink}
                disabled={linking}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors mt-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{linking ? 'Mining Blockchain Block...' : 'Link & Anchor to Blockchain Ledger'}</span>
              </button>
            </div>
          )}

          {/* Success Message */}
          {linkSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2 text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Successfully linked and anchored!</span>
              </div>
              <p>
                Record is now linked to patient profile and cryptographically anchored into a verified block.
              </p>
              {linkSuccess.minedBlock && (
                <p className="font-mono text-[11px] text-emerald-900">
                  Mined Block #{linkSuccess.minedBlock.block_index}: {linkSuccess.minedBlock.block_hash.slice(0, 24)}...
                </p>
              )}
              <button
                onClick={onClose}
                className="mt-2 w-full rounded bg-emerald-700 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
              >
                Close Linker
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
