export type UserRole = 'patient' | 'doctor' | 'auditor';

export interface Patient {
  id: string;
  aadhaar_number: string;
  full_name: string;
  designation: string;
  age: number;
  dob: string;
  gender: string;
  blood_group: string;
  contact: string;
  email: string;
  address: string;
  emergency_contact?: string;
  created_at?: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  designation: string;
  specialty: string;
  license_number: string;
  hospital_affiliation: string;
  contact: string;
  email: string;
  bio?: string;
  created_at?: string;
}

export interface InsurancePolicy {
  id: string;
  patient_id: string;
  policy_number: string;
  provider_name: string;
  plan_type: string;
  coverage_amount: number;
  validity_date: string;
  tpa_claim_id?: string;
  status: string;
  verified_at?: string;
  blockchain_tx_id?: string;
  metadata_json?: string;
}

export interface Medication {
  id: string;
  diagnosis_id: string;
  patient_id: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  prescribed_by: string;
  start_date: string;
  end_date?: string;
}

export interface Diagnosis {
  id: string;
  patient_id: string;
  doctor_id: string;
  category: string;
  condition_name: string;
  icd10_code?: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  status: 'Active' | 'Under Treatment' | 'Recovered' | 'Chronic';
  clinical_notes: string;
  scan_url?: string;
  scan_name?: string;
  scan_hash?: string;
  scan_type?: string;
  blockchain_block_index?: number;
  blockchain_tx_id?: string;
  diagnosed_at: string;
  doctor_name?: string;
  doctor_specialty?: string;
  medications?: Medication[];
}

export interface ExternalHospitalLink {
  id: string;
  patient_id: string;
  hospital_name: string;
  external_ehr_id: string;
  aadhaar_matched: number | boolean;
  sync_status: string;
  last_sync_at: string;
  ehr_payload_json?: string;
  blockchain_tx_id?: string;
}

export interface BlockchainBlock {
  block_index: number;
  timestamp: number;
  previous_hash: string;
  merkle_root: string;
  nonce: number;
  block_hash: string;
  transaction_count: number;
  transactions: any[];
}

export interface BlockchainState {
  blocks: BlockchainBlock[];
  total_blocks: number;
  is_valid: boolean;
  tamper_detected: boolean;
  integrity_report: string;
  latest_block?: BlockchainBlock;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}
