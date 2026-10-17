import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  Code2, 
  Layers, 
  Search,
  Sparkles
} from 'lucide-react';
import { MCPTool } from '../types';

interface McpConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatientId?: string;
}

export const McpConsoleModal: React.FC<McpConsoleModalProps> = ({
  isOpen,
  onClose,
  activePatientId,
}) => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('get_patient_records');
  const [toolArgs, setToolArgs] = useState<string>('{\n  "identifier": "P-1001"\n}');
  const [executing, setExecuting] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/mcp/tools')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTools(data);
      })
      .catch(console.error);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    setError(null);
    setResponse(null);

    // Provide pre-populated sample payloads for immediate testing
    if (toolName === 'get_patient_records') {
      setToolArgs(JSON.stringify({ identifier: activePatientId || 'P-1001' }, null, 2));
    } else if (toolName === 'verify_blockchain_audit') {
      setToolArgs(JSON.stringify({ scan_hash_to_verify: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }, null, 2));
    } else if (toolName === 'search_medical_vault') {
      setToolArgs(JSON.stringify({ query: 'Hypertension', category: 'Cardiology' }, null, 2));
    } else if (toolName === 'link_hospital_ehr') {
      setToolArgs(JSON.stringify({
        patient_id: activePatientId || 'P-1001',
        hospital_name: 'Apollo Hospitals EHR Central',
        external_id: 'APOLLO-BLR-EHR-88192'
      }, null, 2));
    } else if (toolName === 'add_diagnosis_prescription') {
      setToolArgs(JSON.stringify({
        patient_id: activePatientId || 'P-1001',
        doctor_id: 'DOC-201',
        category: 'Cardiology',
        condition_name: 'Mild Sinus Arrhythmia',
        severity: 'Mild',
        status: 'Active',
        clinical_notes: 'Asymptomatic periodic sinus rate variance.',
        scan_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        scan_type: 'ECG',
        medications: [
          {
            drug_name: 'Metoprolol Tartrate',
            dosage: '25 mg',
            frequency: 'Once daily morning',
            duration: '30 days'
          }
        ]
      }, null, 2));
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setError(null);
    setResponse(null);

    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolArgs);
      } catch (e) {
        throw new Error('Invalid JSON arguments syntax');
      }

      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: selectedTool,
          arguments: parsedArgs
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'MCP Tool execution error');

      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Execution error');
    } finally {
      setExecuting(false);
    }
  };

  const activeToolDef = tools.find(t => t.name === selectedTool);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-600" />
              Model Context Protocol (MCP) Clinical Engine
            </h2>
            <p className="text-xs text-slate-500">
              Direct JSON-RPC 2.0 tool execution layer enabling AI agents and external clinical nodes.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Tool Directory column */}
          <div className="p-4 space-y-2 max-h-[65vh] overflow-y-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Available MCP Tools ({tools.length})
            </span>
            {tools.map((t) => (
              <button
                key={t.name}
                onClick={() => handleToolSelect(t.name)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${
                  selectedTool === t.name
                    ? 'bg-slate-900 text-white font-medium shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-mono text-xs">{t.name}</div>
                <div className={`mt-0.5 text-[11px] line-clamp-2 ${selectedTool === t.name ? 'text-slate-300' : 'text-slate-500'}`}>
                  {t.description}
                </div>
              </button>
            ))}
          </div>

          {/* Execution & Arguments editor column */}
          <div className="p-4 md:col-span-2 space-y-4 max-h-[65vh] overflow-y-auto">
            {activeToolDef && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
                <span className="font-semibold text-slate-900">{activeToolDef.name}</span>
                <p className="text-slate-600 mt-0.5">{activeToolDef.description}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Tool Arguments (JSON):</label>
                <span className="text-[11px] font-mono text-slate-400">JSON-RPC 2.0 params</span>
              </div>
              <textarea
                rows={6}
                value={toolArgs}
                onChange={(e) => setToolArgs(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900 bg-slate-900 text-emerald-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleExecute}
                disabled={executing}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {executing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                <span>Execute MCP Tool Call</span>
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-mono">
                {error}
              </div>
            )}

            {response && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">MCP Protocol Response:</span>
                  <span className="text-[11px] font-mono text-emerald-700">✓ 200 OK (JSON-RPC)</span>
                </div>
                <pre className="max-h-60 overflow-y-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-300 leading-relaxed">
                  {JSON.stringify(response.result || response, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
