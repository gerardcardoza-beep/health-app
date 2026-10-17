import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Pill, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Patient, Doctor } from '../types';

interface ScanUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  selectedPatientId?: string;
  doctor: Doctor | null;
  onSuccess: () => void;
}

export const ScanUploadModal: React.FC<ScanUploadModalProps> = ({
  isOpen,
  onClose,
  patients,
  selectedPatientId,
  doctor,
  onSuccess,
}) => {
  const [patientId, setPatientId] = useState(selectedPatientId || (patients[0]?.id ?? 'P-1001'));
  const [category, setCategory] = useState('Cardiology');
  const [conditionName, setConditionName] = useState('Sinus Tachycardia & Hypertension Evaluation');
  const [icd10Code, setIcd10Code] = useState('I47.1');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe' | 'Critical'>('Moderate');
  const [status, setStatus] = useState<'Active' | 'Under Treatment' | 'Recovered' | 'Chronic'>('Under Treatment');
  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient presented with palpitations following exertion. Resting heart rate elevated at 108 bpm. ECG rhythm verified. Prescribed selective beta-blocker therapy with home BP monitoring.'
  );

  // Scan file state
  const [scanFile, setScanFile] = useState<{
    name: string;
    type: string;
    base64: string;
    sha256Hash: string;
    scanType: string;
  } | null>(null);

  // Medications state
  const [medications, setMedications] = useState<Array<{
    drug_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    {
      drug_name: 'Bisoprolol Fumarate',
      dosage: '5 mg',
      frequency: 'Once daily morning after breakfast',
      duration: '30 days',
      instructions: 'Check pulse before taking. Avoid abrupt discontinuation.'
    }
  ]);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      // Calculate SHA-256 hash
      try {
        const uploadRes = await fetch('/api/scans/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data: base64,
            scanType: category
          })
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to process file');

        setScanFile({
          name: file.name,
          type: file.type,
          base64: uploadData.scanUrl,
          sha256Hash: uploadData.sha256Hash,
          scanType: uploadData.scanType
        });
      } catch (err: any) {
        setError(err.message || 'File upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick preset clinical sample scans
  const handleLoadSampleScan = (sampleType: string) => {
    if (sampleType === 'ecg') {
      setCategory('Cardiology');
      setConditionName('12-Lead Electrocardiogram Rhythm Analysis');
      setIcd10Code('I49.9');
      setScanFile({
        name: 'Clinical_12_Lead_ECG_Rhythm_Strip.png',
        type: 'image/png',
        base64: '/scans/ecg_strip_p1001.png',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        scanType: 'ECG'
      });
    } else if (sampleType === 'knee_mri') {
      setCategory('Orthopedics');
      setConditionName('Coronal PD-Fat Sat Knee MRI');
      setIcd10Code('M23.2');
      setScanFile({
        name: 'Right_Knee_Coronal_PD_MRI.png',
        type: 'image/png',
        base64: '/scans/knee_mri_p1001.png',
        sha256Hash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
        scanType: 'MRI'
      });
    } else if (sampleType === 'chest_xray') {
      setCategory('Pulmonology');
      setConditionName('Thoracic PA Radiograph');
      setIcd10Code('J45.4');
      setScanFile({
        name: 'Chest_PA_Radiograph_Normal.png',
        type: 'image/png',
        base64: '/scans/chest_xray_p1002.png',
        sha256Hash: '8a9e229c117b9c3f5631bfa2b35a72f0c78a0d9b736b8ef6c3b6e8d19a28cf11',
        scanType: 'X-Ray'
      });
    } else {
      setCategory('Cardiology');
      setConditionName('Lipid & Metabolic Profile');
      setIcd10Code('E78.5');
      setScanFile({
        name: 'Comprehensive_Lipid_Panel_Report.png',
        type: 'image/png',
        base64: '/scans/lipid_panel_p1003.png',
        sha256Hash: '99e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
        scanType: 'Blood Report'
      });
    }
  };

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        drug_name: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '14 days',
        instructions: ''
      }
    ]);
  };

  const handleRemoveMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const payload = {
        patient_id: patientId,
        doctor_id: doctor?.id || 'DOC-201',
        category,
        condition_name: conditionName,
        icd10_code: icd10Code,
        severity,
        status,
        clinical_notes: clinicalNotes,
        scan_url: scanFile?.base64 || '',
        scan_name: scanFile?.name || 'Diagnostic_Scan.png',
        scan_hash: scanFile?.sha256Hash || 'none',
        scan_type: scanFile?.scanType || 'Clinical Scan',
        prescribed_by: doctor?.full_name || 'Attending Physician',
        medications: medications.filter(m => m.drug_name.trim() !== '')
      };

      const res = await fetch('/api/diagnoses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save diagnosis');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-emerald-600" />
              Upload Diagnosis Scan & Prescribe Medications
            </h2>
            <p className="text-xs text-slate-500">
              Categorize diagnosis by medical specialty, attach high-res scans, and anchor proof into the blockchain ledger.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Patient and Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Select Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.id} · Aadhaar: {p.aadhaar_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Medical Specialty Segregation
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {['Cardiology', 'Orthopedics', 'Pulmonology', 'Dermatology', 'Neurology', 'Endocrinology', 'General Medicine', 'Gastroenterology'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Condition / Diagnosis Name</label>
              <input
                type="text"
                required
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
                placeholder="e.g. Essential Hypertension"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ICD-10 Code</label>
              <input
                type="text"
                value={icd10Code}
                onChange={(e) => setIcd10Code(e.target.value)}
                placeholder="e.g. I10.9"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Treatment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Recovered">Recovered</option>
                <option value="Chronic">Chronic</option>
              </select>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Physician Clinical Findings & Notes</label>
            <textarea
              rows={3}
              required
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Clinical exam, vitals, findings, and treatment trajectory..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* Diagnostic Scan Upload Section */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600" />
                Diagnostic Scan / Medical Report
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                SHA-256 Digest Verification
              </span>
            </div>

            {/* Quick Sample Selector */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">Load Clinical Sample:</span>
              <button
                type="button"
                onClick={() => handleLoadSampleScan('ecg')}
                className="rounded bg-white px-2 py-1 border border-slate-200 text-[11px] hover:bg-slate-100"
              >
                12-Lead ECG
              </button>
              <button
                type="button"
                onClick={() => handleLoadSampleScan('knee_mri')}
                className="rounded bg-white px-2 py-1 border border-slate-200 text-[11px] hover:bg-slate-100"
              >
                Knee MRI
              </button>
              <button
                type="button"
                onClick={() => handleLoadSampleScan('chest_xray')}
                className="rounded bg-white px-2 py-1 border border-slate-200 text-[11px] hover:bg-slate-100"
              >
                Chest X-Ray
              </button>
              <button
                type="button"
                onClick={() => handleLoadSampleScan('lipid')}
                className="rounded bg-white px-2 py-1 border border-slate-200 text-[11px] hover:bg-slate-100"
              >
                Lipid Panel
              </button>
            </div>

            {/* File Upload Input */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="text-xs text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
              />
            </div>

            {/* Scan preview & cryptographic details */}
            {scanFile && (
              <div className="rounded bg-white p-3 border border-slate-200 flex items-center gap-3">
                <div className="h-12 w-16 overflow-hidden rounded bg-slate-900 shrink-0">
                  <img src={scanFile.base64} alt="Scan preview" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-medium text-slate-900 truncate">{scanFile.name}</p>
                  <p className="font-mono text-[10px] text-slate-500 truncate" title={scanFile.sha256Hash}>
                    SHA-256: {scanFile.sha256Hash}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-medium">✓ Cryptographic hash generated</span>
                </div>
              </div>
            )}
          </div>

          {/* Prescribed Medications Section */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-emerald-600" />
                Prescribe Linked Medications ({medications.length})
              </span>
              <button
                type="button"
                onClick={handleAddMedication}
                className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add Drug</span>
              </button>
            </div>

            <div className="space-y-2">
              {medications.map((med, idx) => (
                <div key={idx} className="rounded bg-white p-3 border border-slate-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Drug Name (e.g. Telmisartan)"
                      value={med.drug_name}
                      onChange={(e) => {
                        const copy = [...medications];
                        copy[idx].drug_name = e.target.value;
                        setMedications(copy);
                      }}
                      className="rounded border border-slate-200 px-2.5 py-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 40 mg)"
                      value={med.dosage}
                      onChange={(e) => {
                        const copy = [...medications];
                        copy[idx].dosage = e.target.value;
                        setMedications(copy);
                      }}
                      className="rounded border border-slate-200 px-2.5 py-1 text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Frequency (e.g. Once daily)"
                        value={med.frequency}
                        onChange={(e) => {
                          const copy = [...medications];
                          copy[idx].frequency = e.target.value;
                          setMedications(copy);
                        }}
                        className="flex-1 rounded border border-slate-200 px-2.5 py-1 text-xs"
                      />
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 30 days)"
                      value={med.duration}
                      onChange={(e) => {
                        const copy = [...medications];
                        copy[idx].duration = e.target.value;
                        setMedications(copy);
                      }}
                      className="rounded border border-slate-200 px-2.5 py-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Special Instructions"
                      value={med.instructions}
                      onChange={(e) => {
                        const copy = [...medications];
                        copy[idx].instructions = e.target.value;
                        setMedications(copy);
                      }}
                      className="rounded border border-slate-200 px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-xs font-semibold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Mining Proof-of-Work Block & Anchoring Scan...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Anchor Diagnosis & Mine Blockchain Block</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
