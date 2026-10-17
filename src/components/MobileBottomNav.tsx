import React from 'react';
import { 
  User, 
  Activity, 
  Pill, 
  Shield, 
  UploadCloud,
  LayoutDashboard
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenUploadScan: () => void;
  onOpenBlockchainExplorer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenUploadScan,
  onOpenBlockchainExplorer,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md safe-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        <button
          onClick={() => setCurrentTab('patient-dashboard')}
          className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
            currentTab === 'patient-dashboard' || currentTab === 'patient-profile' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 leading-tight text-center">Dashboard</span>
        </button>

        <button
          onClick={() => setCurrentTab('diagnoses')}
          className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
            currentTab === 'diagnoses' || currentTab === 'overview' ? 'text-slate-900 font-medium' : 'text-slate-500'
          }`}
        >
          <Activity className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Diagnoses</span>
        </button>

        {/* Center elevated Action button */}
        <button
          onClick={onOpenUploadScan}
          className="flex flex-col items-center justify-center -mt-5 h-12 w-12 rounded-full bg-slate-900 text-white shadow-md active:scale-95 transition-transform"
          aria-label="Upload Diagnosis Scan"
        >
          <UploadCloud className="h-6 w-6" />
        </button>

        <button
          onClick={() => setCurrentTab('medications')}
          className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
            currentTab === 'medications' ? 'text-slate-900 font-medium' : 'text-slate-500'
          }`}
        >
          <Pill className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Meds</span>
        </button>

        <button
          onClick={onOpenBlockchainExplorer}
          className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
            currentTab === 'ledger' ? 'text-slate-900 font-medium' : 'text-slate-500'
          }`}
        >
          <Shield className="h-5 w-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5">Ledger</span>
        </button>
      </div>
    </nav>
  );
};
