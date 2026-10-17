import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Menu, 
  X, 
  Cpu, 
  Layers, 
  UserCircle2, 
  Stethoscope, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { UserRole, Patient, Doctor } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: Patient | Doctor | any;
  onOpenLogin: () => void;
  onOpenBlockchainExplorer: () => void;
  onOpenMcpConsole: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  role,
  setRole,
  currentUser,
  onOpenLogin,
  onOpenBlockchainExplorer,
  onOpenMcpConsole,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'patient-dashboard', label: 'Patient Dashboard' },
    { id: 'diagnoses', label: 'Clinical Diagnoses' },
    { id: 'medications', label: 'Medications' },
    { id: 'ledger', label: 'Blockchain Ledger' },
    { id: 'mcp', label: 'MCP Clinical Agent' },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
    if (id === 'ledger') onOpenBlockchainExplorer();
    if (id === 'mcp') onOpenMcpConsole();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleNavClick('overview')} 
            className="flex items-center gap-2 text-left focus-visible:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              HealthLedger Vault
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id || (link.id === 'patient-dashboard' && (currentTab === 'patient-profile' || currentTab === 'patient-dashboard'));
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
                  isActive
                    ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-slate-900'
                    : 'text-slate-600'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile / Role Selector */}
          <div className="relative">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-medium text-slate-900 transition-colors hover:bg-slate-100"
                >
                  {role === 'doctor' ? (
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <UserCircle2 className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="hidden sm:inline font-medium max-w-[120px] truncate">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                    {role}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg z-50">
                    <div className="px-2 py-1.5 border-b border-slate-100 text-xs">
                      <p className="font-semibold text-slate-900 truncate">{currentUser.full_name}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{currentUser.designation}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setRole('patient');
                          setRoleDropdownOpen(false);
                          setCurrentTab('patient-dashboard');
                        }}
                        className={`w-full flex items-center justify-between rounded px-2 py-1.5 text-xs text-left ${
                          role === 'patient' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>Switch to Patient Portal</span>
                        {role === 'patient' && <span className="text-emerald-600 text-[10px]">Active</span>}
                      </button>

                      <button
                        onClick={() => {
                          setRole('doctor');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded px-2 py-1.5 text-xs text-left ${
                          role === 'doctor' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>Switch to Doctor Portal</span>
                        {role === 'doctor' && <span className="text-emerald-600 text-[10px]">Active</span>}
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Log Out / Switch Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                Sign In / Register
              </button>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id || (link.id === 'patient-dashboard' && (currentTab === 'patient-profile' || currentTab === 'patient-dashboard'));
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`block w-full text-left py-2 px-3 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
