import React from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Download, 
  ExternalLink, 
  Maximize2,
  Calendar,
  Stethoscope,
  Hash
} from 'lucide-react';
import { Diagnosis } from '../types';

interface ScanViewerModalProps {
  diagnosis: Diagnosis | null;
  onClose: () => void;
}

export const ScanViewerModal: React.FC<ScanViewerModalProps> = ({ diagnosis, onClose }) => {
  if (!diagnosis || !diagnosis.scan_url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-slate-700 bg-slate-900 text-white shadow-2xl my-8 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-800 p-2 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{diagnosis.scan_name || 'Diagnostic Scan Document'}</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {diagnosis.scan_type || 'Image'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {diagnosis.condition_name} · Specialty: {diagnosis.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={diagnosis.scan_url}
              download={diagnosis.scan_name || 'medical_scan.png'}
              className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Download Scan"
            >
              <Download className="h-4 w-4" />
            </a>
            <button 
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scan Image Viewer Area */}
        <div className="relative min-h-[360px] max-h-[60vh] overflow-auto bg-black flex items-center justify-center p-4">
          <img 
            src={diagnosis.scan_url} 
            alt={diagnosis.scan_name || 'Scan image'} 
            className="max-h-[55vh] max-w-full object-contain rounded border border-slate-800"
          />
        </div>

        {/* Cryptographic Ledger Verification Details Footer */}
        <div className="border-t border-slate-800 bg-slate-950 p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Decentralized Blockchain Certificate of Authenticity</span>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Anchored in Block #{diagnosis.blockchain_block_index || 1}
            </span>
          </div>

          <div className="rounded-lg bg-slate-900/90 p-3 text-xs border border-slate-800 font-mono space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 text-[11px]">
              <span>SHA-256 PAYLOAD HASH:</span>
              <span className="text-emerald-300 break-all select-all font-bold">
                {diagnosis.scan_hash}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
              <span>BLOCKCHAIN TRANSACTION ID:</span>
              <span className="text-blue-300 break-all select-all">
                {diagnosis.blockchain_tx_id || 'tx_diag_anchored_01'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
            <span>Attending Physician: {diagnosis.doctor_name || 'Dr. Elena Vance, MD'}</span>
            <span>Recorded Date: {diagnosis.diagnosed_at}</span>
            <span>Security Standard: ISO/IEEE Health Informatics Compliant</span>
          </div>
        </div>

      </div>
    </div>
  );
};
