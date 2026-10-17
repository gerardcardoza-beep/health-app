import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Lock,
  FileCode,
  ArrowDown,
  Hash
} from 'lucide-react';
import { BlockchainState, BlockchainBlock } from '../types';

interface BlockchainExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockchainState: BlockchainState | null;
  onRefresh: () => void;
}

export const BlockchainExplorerModal: React.FC<BlockchainExplorerModalProps> = ({
  isOpen,
  onClose,
  blockchainState,
  onRefresh,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [tampering, setTampering] = useState(false);
  const [tamperedState, setTamperedState] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleTamper = async () => {
    setTampering(true);
    const newTamper = !tamperedState;
    try {
      await fetch('/api/blockchain/tamper-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockIndex: 1, simulateTamper: newTamper })
      });
      setTamperedState(newTamper);
      onRefresh();
      // Auto verify after tamper toggle
      const res = await fetch('/api/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTampering(false);
    }
  };

  const blocks = blockchainState?.blocks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              Cryptographic Blockchain Audit Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Immutable SHA-256 block sequence, Merkle tree batch roots, and tamper verification.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Audit Verification Control Bar */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {blockchainState?.is_valid && !tamperedState ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Ledger Chain Authentic (100% Invariant Match)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                <ShieldAlert className="h-4 w-4" />
                Tamper Detected in Block Sequence!
              </span>
            )}
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-600 font-mono">
              {blocks.length} Blocks Anchored
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleTamper}
              disabled={tampering}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tamperedState
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {tamperedState ? 'Restore Genuine Hash' : 'Simulate Data Tamper Attack'}
            </button>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${verifying ? 'animate-spin' : ''}`} />
              <span>Verify Cryptographic Audit</span>
            </button>
          </div>
        </div>

        {/* Verification Result Notification */}
        {verificationResult && (
          <div className={`mx-6 mt-4 rounded-lg p-3 text-xs border ${
            verificationResult.valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                {verificationResult.valid ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
                {verificationResult.valid ? 'All Block Cryptographic Invariants Valid' : 'Integrity Audit Failed!'}
              </span>
              <span className="font-mono text-[10px]">{verificationResult.consensus_protocol}</span>
            </div>
            {verificationResult.corrupted_detail && (
              <p className="mt-1 font-mono text-[11px] font-semibold text-rose-900">
                ⚠️ {verificationResult.corrupted_detail}
              </p>
            )}
          </div>
        )}

        {/* Blocks sequence list */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {blocks.map((block, idx) => {
            const isGenesis = block.block_index === 0;
            return (
              <div key={block.block_index} className="relative">
                <div className={`rounded-xl border p-4 text-xs transition-all ${
                  isGenesis
                    ? 'border-slate-300 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  {/* Block Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Block #{block.block_index}
                      </span>
                      {isGenesis && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          GENESIS ANCHOR
                        </span>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-500 font-mono">
                      Nonce: {block.nonce} · {block.transaction_count} Transactions
                    </div>
                  </div>

                  {/* Hashes Grid */}
                  <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400">BLOCK HASH: </span>
                      <span className="text-slate-900 font-semibold break-all">
                        {block.block_hash}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400">PREV HASH: </span>
                      <span className="text-slate-500 break-all">
                        {block.previous_hash}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400">MERKLE ROOT: </span>
                      <span className="text-slate-600 break-all">
                        {block.merkle_root}
                      </span>
                    </div>
                  </div>

                  {/* Transactions summary */}
                  {block.transactions && block.transactions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-700 space-y-1">
                      <span className="font-semibold text-slate-800">Payload Events:</span>
                      {block.transactions.map((tx: any, tIdx: number) => (
                        <div key={tIdx} className="rounded bg-slate-50 p-2 font-mono text-[10px] text-slate-600">
                          {JSON.stringify(tx)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Connector Arrow between blocks */}
                {idx < blocks.length - 1 && (
                  <div className="flex justify-center my-1.5">
                    <ArrowDown className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Consensus: Proof-of-Work (Difficulty 2)</span>
          <span>Hash Algorithm: NIST SHA-256</span>
        </div>
      </div>
    </div>
  );
};
