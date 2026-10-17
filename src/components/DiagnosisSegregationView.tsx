import React, { useState } from 'react';
import { 
  Activity, 
  Heart, 
  Bone, 
  Wind, 
  Brain, 
  Stethoscope, 
  FileText, 
  Pill, 
  Eye, 
  ShieldCheck, 
  Search,
  UploadCloud,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { Diagnosis, Medication } from '../types';

interface DiagnosisSegregationViewProps {
  diagnoses: Diagnosis[];
  onOpenScanViewer: (diagnosis: Diagnosis) => void;
  onOpenUploadScan: () => void;
}

export const DiagnosisSegregationView: React.FC<DiagnosisSegregationViewProps> = ({
  diagnoses,
  onOpenScanViewer,
  onOpenUploadScan,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Cardiology',
    'Orthopedics',
    'Pulmonology',
    'General Medicine',
    'Neurology',
    'Dermatology',
    'Endocrinology',
  ];

  // Helper for category icons
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cardiology':
        return <Heart className="h-4 w-4 text-rose-600" />;
      case 'orthopedics':
        return <Bone className="h-4 w-4 text-amber-600" />;
      case 'pulmonology':
        return <Wind className="h-4 w-4 text-cyan-600" />;
      case 'neurology':
        return <Brain className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredDiagnoses = diagnoses.filter((d) => {
    const matchesCat = selectedCategory === 'All' || d.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || 
      d.condition_name.toLowerCase().includes(query) ||
      d.category.toLowerCase().includes(query) ||
      d.clinical_notes.toLowerCase().includes(query) ||
      (d.medications && d.medications.some(m => m.drug_name.toLowerCase().includes(query)));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Segregated Clinical Diagnoses & Treatment Records
          </h2>
          <p className="text-xs text-slate-500">
            Diagnoses segregated by clinical specialty with verified scan hashes and active medications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search condition or medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <button
            onClick={onOpenUploadScan}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Add Diagnosis & Scan</span>
          </button>
        </div>
      </div>

      {/* Specialty Category Filter Bar (Interactive Buttons) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const count = cat === 'All' 
            ? diagnoses.length 
            : diagnoses.filter(d => d.category.toLowerCase() === cat.toLowerCase()).length;
          
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] tabular-nums ${selectedCategory === cat ? 'text-slate-300' : 'text-slate-400'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Diagnoses List */}
      {filteredDiagnoses.length > 0 ? (
        <div className="space-y-4">
          {filteredDiagnoses.map((diag) => (
            <div 
              key={diag.id} 
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
            >
              {/* Card Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-700">
                    {getCategoryIcon(diag.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900">
                        {diag.condition_name}
                      </h3>
                      {diag.icd10_code && (
                        <span className="font-mono text-xs text-slate-500">
                          (ICD-10: {diag.icd10_code})
                        </span>
                      )}
                    </div>
                    
                    {/* Unboxed Zero-Pill Metadata */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{diag.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700">{diag.doctor_name || 'Dr. Elena Vance, MD'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{diag.status}</span>
                      <span aria-hidden="true">·</span>
                      <span>Severity: {diag.severity}</span>
                      <span aria-hidden="true">·</span>
                      <span>{diag.diagnosed_at.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Blockchain Block Anchor Indicator */}
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-slate-50 px-2.5 py-1 text-right border border-slate-100">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Blockchain Audit</span>
                    <span className="font-mono text-xs font-semibold text-emerald-700 flex items-center justify-end gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Block #{diag.blockchain_block_index || 1} Mined
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical Notes Body */}
              <div className="mt-3 text-xs text-slate-700 leading-relaxed bg-slate-50/60 rounded-lg p-3 border border-slate-100">
                <span className="font-medium text-slate-900">Physician Clinical Findings: </span>
                {diag.clinical_notes}
              </div>

              {/* Two Columns: Attached Scan & Prescribed Medications */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 1. Medical Scan / Diagnostic Artifact */}
                <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      Diagnostic Scan & Lab Report
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {diag.scan_type || 'Image'}
                    </span>
                  </div>

                  {diag.scan_url ? (
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => onOpenScanViewer(diag)}
                        className="relative h-16 w-24 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-900 cursor-pointer group"
                      >
                        <img 
                          src={diag.scan_url} 
                          alt={diag.scan_name || 'Medical Scan'} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {diag.scan_name || 'Diagnostic_Image.png'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 truncate" title={diag.scan_hash}>
                          SHA-256: {diag.scan_hash ? `${diag.scan_hash.slice(0, 16)}...` : 'Anchored'}
                        </p>
                        <button
                          onClick={() => onOpenScanViewer(diag)}
                          className="mt-1 text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Inspect High-Res Scan & Cryptographic Proof</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No scan uploaded for this diagnosis record.</p>
                  )}
                </div>

                {/* 2. Medications Segregated for this diagnosis */}
                <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Pill className="h-3.5 w-3.5 text-emerald-600" />
                      Prescribed Medications
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {diag.medications ? diag.medications.length : 0} active
                    </span>
                  </div>

                  {diag.medications && diag.medications.length > 0 ? (
                    <div className="space-y-1.5">
                      {diag.medications.map((med) => (
                        <div key={med.id} className="rounded bg-slate-50 px-2.5 py-1.5 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-medium text-slate-900">{med.drug_name}</span>
                            <span className="text-slate-500 ml-1.5">({med.dosage})</span>
                          </div>
                          <span className="text-[11px] text-slate-600">{med.frequency}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No medications linked with this diagnosis.</p>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <Activity className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No diagnoses found</h3>
          <p className="mt-1 text-xs text-slate-500">
            No clinical records matched the selected specialty filter or query.
          </p>
          <button
            onClick={onOpenUploadScan}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            Upload New Diagnosis
          </button>
        </div>
      )}
    </div>
  );
};
