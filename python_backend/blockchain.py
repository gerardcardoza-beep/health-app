"""
HealthLedger Vault - Cryptographic Blockchain Engine
Implements SHA-256 blocks, Merkle Tree batch hashing, and Proof-of-Work
for tamper-evident electronic health records and scan verification.
"""

import hashlib
import json
import time
from typing import List, Dict, Any, Optional

def sha256(data: str) -> str:
    """Compute SHA-256 hash of a string."""
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def compute_merkle_root(transactions: List[Dict[str, Any]]) -> str:
    """Calculate the Merkle root of a list of transaction dicts."""
    if not transactions:
        return sha256("empty_block_transactions")
    
    hashes = [sha256(json.dumps(tx, sort_keys=True)) for tx in transactions]
    
    while len(hashes) > 1:
        if len(hashes) % 2 != 0:
            hashes.append(hashes[-1]) # Duplicate last element if odd
        
        new_level = []
        for i in range(0, len(hashes), 2):
            combined = hashes[i] + hashes[i+1]
            new_level.append(sha256(combined))
        hashes = new_level
        
    return hashes[0]

class Block:
    def __init__(self, index: int, timestamp: float, transactions: List[Dict[str, Any]], 
                 previous_hash: str, nonce: int = 0, block_hash: Optional[str] = None):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.merkle_root = compute_merkle_root(transactions)
        self.nonce = nonce
        self.hash = block_hash or self.calculate_hash()

    def calculate_hash(self) -> str:
        """Calculate the block hash from header values."""
        header = f"{self.index}{self.timestamp}{self.previous_hash}{self.merkle_root}{self.nonce}"
        return sha256(header)

    def mine_block(self, difficulty: int = 2) -> None:
        """Proof of work mining with prefix zeros."""
        target = "0" * difficulty
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.calculate_hash()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce,
            "hash": self.hash,
            "transaction_count": len(self.transactions),
            "transactions": self.transactions
        }

class Blockchain:
    def __init__(self, difficulty: int = 2):
        self.chain: List[Block] = []
        self.difficulty = difficulty
        self.pending_transactions: List[Dict[str, Any]] = []
        self.create_genesis_block()

    def create_genesis_block(self) -> Block:
        """Create genesis block anchoring the healthcare ledger."""
        genesis_tx = [{
            "type": "GENESIS_ANCHOR",
            "protocol": "HealthLedger Vault MCP 1.0",
            "system": "National Health Network Decentralized EHR",
            "initialized_at": time.time(),
            "standard": "HL7 FHIR / ABDM Compliant"
        }]
        genesis_block = Block(
            index=0,
            timestamp=1704067200.0, # Fixed timestamp for deterministic genesis
            transactions=genesis_tx,
            previous_hash="0" * 64,
            nonce=142
        )
        genesis_block.hash = genesis_block.calculate_hash()
        self.chain.append(genesis_block)
        return genesis_block

    @property
    def latest_block(self) -> Block:
        return self.chain[-1]

    def add_transaction(self, tx_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Record a clinical health event transaction."""
        transaction = {
            "tx_id": sha256(f"{tx_type}_{time.time()}_{json.dumps(data, sort_keys=True)}"),
            "type": tx_type,
            "timestamp": time.time(),
            "data": data
        }
        self.pending_transactions.append(transaction)
        return transaction

    def mine_pending_transactions(self) -> Block:
        """Mine pending transactions into a new block."""
        if not self.pending_transactions:
            # Anchor heartbeat
            self.add_transaction("AUDIT_HEARTBEAT", {"status": "Chain verified active"})

        new_block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            transactions=list(self.pending_transactions),
            previous_hash=self.latest_block.hash
        )
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        self.pending_transactions = []
        return new_block

    def is_chain_valid(self) -> Dict[str, Any]:
        """Verify the cryptographic integrity of the entire blockchain."""
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]

            # 1. Check current hash recalculation
            if current.hash != current.calculate_hash():
                return {
                    "valid": False,
                    "error": f"Block #{current.index} hash corrupted! Calculated {current.calculate_hash()} != Stored {current.hash}",
                    "corrupted_block_index": current.index
                }

            # 2. Check previous hash reference
            if current.previous_hash != previous.hash:
                return {
                    "valid": False,
                    "error": f"Block #{current.index} previous_hash mismatch! Points to {current.previous_hash} but Block #{previous.index} is {previous.hash}",
                    "corrupted_block_index": current.index
                }

            # 3. Check Merkle root integrity
            computed_root = compute_merkle_root(current.transactions)
            if current.merkle_root != computed_root:
                return {
                    "valid": False,
                    "error": f"Block #{current.index} Merkle root altered! Computed {computed_root} != Stored {current.merkle_root}",
                    "corrupted_block_index": current.index
                }

        return {
            "valid": True,
            "block_count": len(self.chain),
            "latest_hash": self.latest_block.hash,
            "verification_timestamp": time.time()
        }

if __name__ == "__main__":
    bc = Blockchain(difficulty=2)
    print(f"Genesis Block Hash: {bc.latest_block.hash}")
    bc.add_transaction("PATIENT_REGISTER", {"patient_id": "P-101", "name": "Aarav Sharma"})
    new_blk = bc.mine_pending_transactions()
    print(f"Mined Block #{new_blk.index} with hash: {new_blk.hash}")
    validation = bc.is_chain_valid()
    print(f"Integrity check: {validation['valid']}")
