-- ====================================================================
-- HealthLedger Vault - PostgreSQL Production Relational Schema
-- High performance, ACID-compliant schema with JSONB metadata and indexing
-- ====================================================================

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(64) PRIMARY KEY,
    aadhaar_number VARCHAR(16) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    designation VARCHAR(128) DEFAULT 'Individual / Patient',
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 130),
    dob DATE NOT NULL,
    gender VARCHAR(16) NOT NULL,
    blood_group VARCHAR(8) NOT NULL,
    contact VARCHAR(32) NOT NULL,
    email VARCHAR(128) NOT NULL,
    address TEXT NOT NULL,
    emergency_contact VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_aadhaar ON patients(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    specialty VARCHAR(128) NOT NULL,
    license_number VARCHAR(64) UNIQUE NOT NULL,
    hospital_affiliation VARCHAR(128) NOT NULL,
    contact VARCHAR(32) NOT NULL,
    email VARCHAR(128) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);

-- 3. Insurance Policies Table
CREATE TABLE IF NOT EXISTS insurance_policies (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    policy_number VARCHAR(64) UNIQUE NOT NULL,
    provider_name VARCHAR(128) NOT NULL,
    plan_type VARCHAR(64) NOT NULL,
    coverage_amount NUMERIC(12, 2) NOT NULL,
    validity_date DATE NOT NULL,
    tpa_claim_id VARCHAR(64),
    status VARCHAR(32) DEFAULT 'Active',
    verified_at TIMESTAMP WITH TIME ZONE,
    blockchain_tx_id VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_patient ON insurance_policies(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policy_no ON insurance_policies(policy_number);

-- 4. Diagnoses Table (Categorized & Segregated)
CREATE TABLE IF NOT EXISTS diagnoses (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id),
    category VARCHAR(64) NOT NULL, -- Cardiology, Orthopedics, Pulmonology, General, etc.
    condition_name VARCHAR(128) NOT NULL,
    icd10_code VARCHAR(32),
    severity VARCHAR(32) NOT NULL, -- Mild, Moderate, Severe, Critical
    status VARCHAR(32) NOT NULL,   -- Active, Under Treatment, Recovered, Chronic
    clinical_notes TEXT NOT NULL,
    scan_url TEXT,
    scan_name VARCHAR(255),
    scan_hash VARCHAR(64),          -- SHA-256 hash of uploaded medical scan/document
    scan_type VARCHAR(64),          -- X-Ray, MRI, CT, Blood Report, ECG, Prescription
    blockchain_block_index INTEGER,
    blockchain_tx_id VARCHAR(64),
    diagnosed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_category ON diagnoses(category);
CREATE INDEX IF NOT EXISTS idx_diagnoses_scan_hash ON diagnoses(scan_hash);

-- 5. Medications Table (Linked to Diagnoses)
CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(64) PRIMARY KEY,
    diagnosis_id VARCHAR(64) NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    drug_name VARCHAR(128) NOT NULL,
    dosage VARCHAR(64) NOT NULL,       -- e.g. '500 mg', '10 ml', '1 puff'
    frequency VARCHAR(64) NOT NULL,    -- e.g. 'Once daily', 'Twice daily after meals'
    duration VARCHAR(64) NOT NULL,     -- e.g. '14 days', '3 months', 'Lifelong'
    instructions TEXT,
    prescribed_by VARCHAR(128) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_diagnosis ON medications(diagnosis_id);

-- 6. External Hospital EHR Links Table
CREATE TABLE IF NOT EXISTS external_hospital_links (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_name VARCHAR(128) NOT NULL,
    external_ehr_id VARCHAR(64) NOT NULL,
    aadhaar_matched BOOLEAN DEFAULT TRUE,
    sync_status VARCHAR(32) DEFAULT 'Synced',
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ehr_payload JSONB DEFAULT '{}'::jsonb,
    blockchain_tx_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_external_links_patient ON external_hospital_links(patient_id);

-- 7. Blockchain Blocks Table
CREATE TABLE IF NOT EXISTS blockchain_blocks (
    block_index INTEGER PRIMARY KEY,
    timestamp DOUBLE PRECISION NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    merkle_root VARCHAR(64) NOT NULL,
    nonce BIGINT NOT NULL,
    block_hash VARCHAR(64) UNIQUE NOT NULL,
    transaction_count INTEGER NOT NULL,
    transactions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blockchain_blocks(block_hash);
