"""
HealthLedger Vault - Database Abstraction Layer
Supports PostgreSQL with transparent SQLite fallback.
Provides comprehensive operations for patients, doctors, insurance, diagnoses,
medications, external EHR linkages, and blockchain block storage.
"""

import os
import json
import sqlite3
import time
from typing import Dict, List, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "healthledger.db")
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_connection():
    """Get database connection (SQLite by default, or Postgres if DATABASE_URL is configured)."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initialize relational database tables."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        aadhaar_number TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        designation TEXT DEFAULT 'Individual / Patient',
        age INTEGER NOT NULL,
        dob TEXT NOT NULL,
        gender TEXT NOT NULL,
        blood_group TEXT NOT NULL,
        contact TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        emergency_contact TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        designation TEXT NOT NULL,
        specialty TEXT NOT NULL,
        license_number TEXT UNIQUE NOT NULL,
        hospital_affiliation TEXT NOT NULL,
        contact TEXT NOT NULL,
        email TEXT NOT NULL,
        bio TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insurance_policies (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        policy_number TEXT UNIQUE NOT NULL,
        provider_name TEXT NOT NULL,
        plan_type TEXT NOT NULL,
        coverage_amount REAL NOT NULL,
        validity_date TEXT NOT NULL,
        tpa_claim_id TEXT,
        status TEXT DEFAULT 'Active',
        verified_at TEXT,
        blockchain_tx_id TEXT,
        metadata_json TEXT DEFAULT '{}',
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        doctor_id TEXT NOT NULL,
        category TEXT NOT NULL,
        condition_name TEXT NOT NULL,
        icd10_code TEXT,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        clinical_notes TEXT NOT NULL,
        scan_url TEXT,
        scan_name TEXT,
        scan_hash TEXT,
        scan_type TEXT,
        blockchain_block_index INTEGER,
        blockchain_tx_id TEXT,
        diagnosed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY,
        diagnosis_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        drug_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        duration TEXT NOT NULL,
        instructions TEXT,
        prescribed_by TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS external_hospital_links (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        hospital_name TEXT NOT NULL,
        external_ehr_id TEXT NOT NULL,
        aadhaar_matched INTEGER DEFAULT 1,
        sync_status TEXT DEFAULT 'Synced',
        last_sync_at TEXT DEFAULT CURRENT_TIMESTAMP,
        ehr_payload_json TEXT DEFAULT '{}',
        blockchain_tx_id TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blockchain_blocks (
        block_index INTEGER PRIMARY KEY,
        timestamp REAL NOT NULL,
        previous_hash TEXT NOT NULL,
        merkle_root TEXT NOT NULL,
        nonce INTEGER NOT NULL,
        block_hash TEXT UNIQUE NOT NULL,
        transaction_count INTEGER NOT NULL,
        transactions_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_integrations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'hospital' | 'insurance'
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        endpoint_url TEXT NOT NULL,
        api_key_masked TEXT NOT NULL,
        protocol TEXT NOT NULL,
        region TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        status TEXT DEFAULT 'Connected',
        latency_ms INTEGER DEFAULT 45,
        last_ping TEXT DEFAULT CURRENT_TIMESTAMP,
        rate_limit_per_min INTEGER DEFAULT 1200,
        plans_or_services_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        designation TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        clearance_level TEXT DEFAULT 'SuperAdmin / Full Network Access',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

def seed_initial_data_if_empty():
    """Seed initial clinical demo dataset if database is empty."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM patients")
    patients_count = cursor.fetchone()[0]

    if patients_count == 0:
        # Seed Patients
        patients = [
            ("P-1001", "9823-4512-8901", "Aarav Sharma", "Senior Software Architect", 34, "1992-04-15", "Male", "O+", "+91 98765 43210", "aarav.sharma@example.com", "42 Green Glen Layout, Bellandur, Bengaluru, Karnataka", "+91 98765 00001"),
            ("P-1002", "7612-9843-1256", "Priya Patel", "Research Scientist", 29, "1997-09-22", "Female", "B+", "+91 91234 56789", "priya.patel@example.com", "18 Sunrise Park, Bodakdev, Ahmedabad, Gujarat", "+91 91234 00002"),
            ("P-1003", "5432-1098-7654", "Vikram Malhotra", "Civil Engineer", 48, "1978-11-03", "Male", "A+", "+91 94567 89012", "vikram.m@example.com", "88 Marine Drive, Churchgate, Mumbai, Maharashtra", "+91 94567 00003")
        ]
        cursor.executemany("""
        INSERT INTO patients (id, aadhaar_number, full_name, designation, age, dob, gender, blood_group, contact, email, address, emergency_contact)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, patients)

        # Seed Doctors
        doctors = [
            ("DOC-201", "Dr. Elena Vance, MD", "Chief Consultant Cardiologist", "Cardiology", "MCI-CARD-90821", "Apollo Hospitals & Heart Center", "+91 80 2630 4000", "dr.elena.vance@apolloheart.org", "Fellow of American College of Cardiology with 16+ years clinical experience."),
            ("DOC-202", "Dr. Marcus Brody, MS", "Lead Orthopedic & Spine Surgeon", "Orthopedics", "MCI-ORTHO-44120", "Fortis Memorial Research Institute", "+91 80 4011 5000", "dr.marcus.brody@fortishealth.org", "Specializing in arthroscopy, joint reconstruction, and sports traumatology."),
            ("DOC-203", "Dr. Ananya Sen, MD", "Consultant Pulmonologist & Critical Care", "Pulmonology", "MCI-PULM-77319", "Max Super Speciality Hospital", "+91 80 6620 9000", "dr.ananya.sen@maxhealthcare.in", "Expertise in interstitial lung diseases, chronic asthma, and sleep disorders.")
        ]
        cursor.executemany("""
        INSERT INTO doctors (id, full_name, designation, specialty, license_number, hospital_affiliation, contact, email, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, doctors)

        # Seed Insurance Policies
        insurances = [
            ("INS-801", "P-1001", "POL-STAR-772184", "Star Health & Allied Insurance", "Comprehensive Health Platinum", 1500000.00, "2027-08-31", "TPA-STAR-092", "Active", "2026-01-10", "tx_star_init_01", json.dumps({"cashless_network": True, "co_pay": "0%", "maternity_covered": True})),
            ("INS-802", "P-1002", "POL-HDFC-994321", "HDFC ERGO General Insurance", "Optima Secure Super Health", 2000000.00, "2028-02-15", "TPA-HDFC-814", "Active", "2026-02-01", "tx_hdfc_init_02", json.dumps({"cashless_network": True, "restore_benefit": "Unlimited", "wellness_rewards": True})),
            ("INS-803", "P-1003", "POL-CARE-551209", "Care Health Insurance", "Care Supreme Plus", 1000000.00, "2027-04-30", "TPA-CARE-319", "Active", "2025-11-20", "tx_care_init_03", json.dumps({"cashless_network": True, "annual_health_checkup": True}))
        ]
        cursor.executemany("""
        INSERT INTO insurance_policies (id, patient_id, policy_number, provider_name, plan_type, coverage_amount, validity_date, tpa_claim_id, status, verified_at, blockchain_tx_id, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, insurances)

        # Seed Diagnoses
        diagnoses = [
            (
                "DIAG-301", "P-1001", "DOC-201", "Cardiology", "Essential Hypertension & Mild Sinus Arrhythmia", "I10.9", "Moderate", "Under Treatment",
                "Patient presented with episodic morning occipital headaches and resting BP 148/94 mmHg. Resting 12-lead ECG indicates normal axis with mild sinus irregularity. Echocardiogram shows preserved LVEF 62% without LVH. Initiated ACE inhibitor therapy with lifestyle dietary salt restriction.",
                "/scans/ecg_strip_p1001.png", "12_Lead_ECG_Rhythm_Strip.png", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "ECG", 1, "tx_diag_cardio_101", "2026-02-18 10:30:00"
            ),
            (
                "DIAG-302", "P-1001", "DOC-202", "Orthopedics", "Right Knee Medial Meniscal Fraying (Grade 1)", "M23.2", "Mild", "Active",
                "Subacute right knee joint line tenderness post marathon training. Weight bearing AP & lateral radiographs unremarkable. Low-grade signal alteration on proton density coronal MRI corresponding to non-displaced medial meniscus fraying. Conservative management recommended with targeted quadriceps physical therapy.",
                "/scans/knee_mri_p1001.png", "Right_Knee_Coronal_PD_MRI.png", "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945", "MRI", 2, "tx_diag_ortho_102", "2026-03-02 15:45:00"
            ),
            (
                "DIAG-303", "P-1002", "DOC-203", "Pulmonology", "Allergic Bronchial Asthma (Moderate Persistent)", "J45.4", "Moderate", "Under Treatment",
                "Bilateral expiratory wheezing during seasonal pollen bloom. Spirometry demonstrates FEV1/FVC ratio 68% with 16% post-bronchodilator reversibility (+280ml). Normal chest X-ray. Prescribed inhaled corticosteroid/formoterol maintenance and reliever regimen.",
                "/scans/chest_xray_p1002.png", "Chest_PA_Radiograph_Normal.png", "8a9e229c117b9c3f5631bfa2b35a72f0c78a0d9b736b8ef6c3b6e8d19a28cf11", "X-Ray", 3, "tx_diag_pulm_201", "2026-02-28 11:15:00"
            ),
            (
                "DIAG-304", "P-1003", "DOC-201", "Cardiology", "Dyslipidemia & Coronary Atherosclerosis Screening", "E78.5", "Moderate", "Under Treatment",
                "Routine cardiovascular profile: Total Cholesterol 242 mg/dL, LDL 162 mg/dL, Triglycerides 195 mg/dL. Calcium score 42 Agatston units. Initiated Rosuvastatin 10mg daily and Mediterranean nutritional regimen.",
                "/scans/lipid_panel_p1003.png", "Comprehensive_Lipid_Panel_Report.png", "99e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1", "Blood Report", 4, "tx_diag_cardio_301", "2026-03-10 14:00:00"
            )
        ]
        cursor.executemany("""
        INSERT INTO diagnoses (id, patient_id, doctor_id, category, condition_name, icd10_code, severity, status, clinical_notes, scan_url, scan_name, scan_hash, scan_type, blockchain_block_index, blockchain_tx_id, diagnosed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, diagnoses)

        # Seed Medications
        medications = [
            ("MED-501", "DIAG-301", "P-1001", "Telmisartan", "40 mg", "Once daily morning (08:00)", "Lifelong / 90 days review", "Take with or without food. Monitor home BP weekly.", "Dr. Elena Vance, MD", "2026-02-18", "2026-05-18"),
            ("MED-502", "DIAG-301", "P-1001", "Amlodipine", "5 mg", "Once daily morning", "90 days", "Can be taken concurrently with Telmisartan. Watch for ankle edema.", "Dr. Elena Vance, MD", "2026-02-18", "2026-05-18"),
            ("MED-503", "DIAG-302", "P-1001", "Aceclofenac + Paracetamol", "100 mg / 325 mg", "Twice daily after food", "7 days PRN for pain", "Take strictly after meals with plenty of water. Do not exceed 7 days.", "Dr. Marcus Brody, MS", "2026-03-02", "2026-03-09"),
            ("MED-504", "DIAG-302", "P-1001", "Glucosamine Sulfate + Chondroitin", "1500 mg / 1200 mg", "Once daily", "60 days", "Joint cartilage nutritional support. Take with lunch.", "Dr. Marcus Brody, MS", "2026-03-02", "2026-05-02"),
            ("MED-505", "DIAG-303", "P-1002", "Budesonide + Formoterol Inhaler", "200 mcg / 6 mcg", "2 puffs twice daily", "Continuous / 180 days", "Rinse mouth thoroughly with water after inhalation. Keep spacer clean.", "Dr. Ananya Sen, MD", "2026-02-28", "2026-08-28"),
            ("MED-506", "DIAG-303", "P-1002", "Montelukast", "10 mg", "Once daily at bedtime", "30 days", "Antileukotriene agent for nocturnal asthma prophylaxis.", "Dr. Ananya Sen, MD", "2026-02-28", "2026-03-28"),
            ("MED-507", "DIAG-304", "P-1003", "Rosuvastatin", "10 mg", "Once daily at bedtime", "180 days", "Statin for LDL cholesterol reduction. Re-check lipid panel at 12 weeks.", "Dr. Elena Vance, MD", "2026-03-10", "2026-09-10")
        ]
        cursor.executemany("""
        INSERT INTO medications (id, diagnosis_id, patient_id, drug_name, dosage, frequency, duration, instructions, prescribed_by, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, medications)

        # Seed External Hospital EHR Links
        external_links = [
            ("EXT-701", "P-1001", "Apollo Hospitals EHR Central", "APOLLO-BLR-EHR-88192", 1, "Synced", "2026-03-14 09:30:00", json.dumps({"admissions": 0, "verified_blood_group": "O+", "allergies": ["Penicillin - Mild rash"], "last_triage": "2026-02-18", "vaccinations": ["Covishield 2 Doses + Booster", "Hepatitis B Complete"]}), "tx_link_apollo_01"),
            ("EXT-702", "P-1001", "National ABDM Health Repository", "ABDM-IN-9823-4512-8901", 1, "Synced", "2026-03-15 11:20:00", json.dumps({"ayushman_bharat_id": "98-2345-1289-0122", "linked_aadhaar_match": True, "consent_artifact": "CONS-2026-ACTIVE"}), "tx_link_abdm_02"),
            ("EXT-703", "P-1002", "AIIMS Western Regional EHR", "AIIMS-WR-EHR-44109", 1, "Synced", "2026-03-12 16:15:00", json.dumps({"admissions": 1, "past_procedure": "Appendectomy (Lap) - 2021", "allergies": ["None reported"]}), "tx_link_aiims_01")
        ]
        cursor.executemany("""
        INSERT INTO external_hospital_links (id, patient_id, hospital_name, external_ehr_id, aadhaar_matched, sync_status, last_sync_at, ehr_payload_json, blockchain_tx_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, external_links)

        # Seed Genesis and Block Records in Blockchain Table
        blocks = [
            (0, 1704067200.0, "0000000000000000000000000000000000000000000000000000000000000000", "0a29b28a994ef93bcda219803cf81297d264f3312ca192a0e281bb82a72518e9", 142, "00a184e1b827f311ca9940285a812384f880290bb34708a987c1265db2650081", 1, json.dumps([{"type": "GENESIS_ANCHOR", "system": "HealthLedger Vault ABDM 1.0"}])),
            (1, 1771410600.0, "00a184e1b827f311ca9940285a812384f880290bb34708a987c1265db2650081", "1f98bcda4981a3297a7cb45100918732dfa981240a239bca40285a812384f880", 218, "00b49231809a4718ba72c81a293817f6c91a0384729104bcda4981a3297a7cb4", 2, json.dumps([{"type": "DIAGNOSIS_ANCHOR", "patient_id": "P-1001", "category": "Cardiology", "scan_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}])),
            (2, 1772466300.0, "00b49231809a4718ba72c81a293817f6c91a0384729104bcda4981a3297a7cb4", "2a34bcda4981a3297a7cb45100918732dfa981240a239bca40285a812384f880", 419, "00c718293817f6c91a0384729104bcda4981a3297a7cb45100918732dfa98124", 2, json.dumps([{"type": "DIAGNOSIS_ANCHOR", "patient_id": "P-1001", "category": "Orthopedics", "scan_hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}])),
            (3, 1772277300.0, "00c718293817f6c91a0384729104bcda4981a3297a7cb45100918732dfa98124", "3d76bcda4981a3297a7cb45100918732dfa981240a239bca40285a812384f880", 305, "00d89201948271038475829102938475829104bcda4981a3297a7cb451009187", 2, json.dumps([{"type": "DIAGNOSIS_ANCHOR", "patient_id": "P-1002", "category": "Pulmonology", "scan_hash": "8a9e229c117b9c3f5631bfa2b35a72f0c78a0d9b736b8ef6c3b6e8d19a28cf11"}])),
            (4, 1773151200.0, "00d89201948271038475829102938475829104bcda4981a3297a7cb451009187", "4e89bcda4981a3297a7cb45100918732dfa981240a239bca40285a812384f880", 521, "00e99182746352910482759102938475829104bcda4981a3297a7cb451009187", 2, json.dumps([{"type": "DIAGNOSIS_ANCHOR", "patient_id": "P-1003", "category": "Cardiology", "scan_hash": "99e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"}]))
        ]
        cursor.executemany("""
        INSERT INTO blockchain_blocks (block_index, timestamp, previous_hash, merkle_root, nonce, block_hash, transaction_count, transactions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, blocks)

    # Check and Seed api_integrations
    cursor.execute("SELECT COUNT(*) FROM api_integrations")
    if cursor.fetchone()[0] == 0:
        integrations = [
            ("hosp_apollo", "hospital", "Apollo Hospitals EHR Central", "APOLLO-EHR", "https://api.apollohospitals.com/fhir/v4", "live_pk_apollo_99182348", "HL7 FHIR v4", "Pan-India", 1, "Connected", 38, json.dumps(["Inpatient EHR", "Diagnostic Pathology", "Cardiology PACS"]), 2500),
            ("hosp_aiims", "hospital", "AIIMS Central Clinical Repository", "AIIMS-EHR", "https://gateway.abdm.gov.in/api/v1/aiims", "abdm_cert_aiims_8821941", "ABDM Health Gateway", "New Delhi / NCR", 1, "Connected", 42, json.dumps(["National Registry", "Immunization Grid", "Surgical EHR"]), 3000),
            ("hosp_fortis", "hospital", "Fortis Memorial Health Network", "FORTIS-EHR", "https://fhir.fortishealthcare.com/r4", "live_pk_fortis_3310928", "HL7 FHIR v4", "Gurugram / Mumbai", 1, "Connected", 51, json.dumps(["Emergency Triage", "Orthopedic Records", "Oncology"]), 1800),
            ("hosp_max", "hospital", "Max Super Speciality Healthcare", "MAX-EHR", "https://api.maxhealthcare.in/fhir/v1", "max_api_key_7718290", "FHIR REST API", "North India", 1, "Connected", 48, json.dumps(["Pulmonology", "Critical Care", "Radiology"]), 1500),
            ("hosp_abdm", "hospital", "National ABDM / Ayushman Bharat Grid", "ABDM-M1", "https://dev.abdm.gov.in/gateway/v0.5", "gov_in_abdm_token_5521", "ABDM Unified API", "Government of India", 1, "Connected", 29, json.dumps(["ABHA ID Linking", "Consent Artifacts", "Health Data Exchange"]), 5000),
            ("ins_star", "insurance", "Star Health & Allied Insurance", "POL-STAR", "https://api.starhealth.in/v2/claims-verify", "star_ins_sec_88192301", "ISO 27001 Gateway", "Pan-India", 1, "Connected", 62, json.dumps(["Comprehensive Platinum", "Senior Citizen Red Carpet", "Family Health Optima"]), 2000),
            ("ins_hdfc", "insurance", "HDFC ERGO General Insurance", "POL-HDFC", "https://partner.hdfcergo.com/health/v3", "hdfc_ergo_api_9941824", "REST JSON-RPC", "National", 1, "Connected", 44, json.dumps(["Optima Secure Super Health", "My:Health Medisure Classic", "Energy Diabetes"]), 2000),
            ("ins_care", "insurance", "Care Health Insurance", "POL-CARE", "https://api.careinsurance.com/gateway/v1", "care_health_token_11928", "HL7 FHIR v4", "Pan-India", 1, "Connected", 55, json.dumps(["Care Supreme Plus", "Care Advantage 1 Cr", "Care Heart Cover"]), 1500),
            ("ins_niva", "insurance", "Niva Bupa Health Insurance", "POL-NIVA", "https://integration.nivabupa.com/b2b/v2", "niva_bupa_key_662819", "REST Webhook API", "National", 1, "Connected", 49, json.dumps(["ReAssure 2.0 Titanium", "Health Companion Gold", "Premia Ultra"]), 1800)
        ]
        cursor.executemany("""
        INSERT OR IGNORE INTO api_integrations (id, type, name, code, endpoint_url, api_key_masked, protocol, region, is_active, status, latency_ms, plans_or_services_json, rate_limit_per_min)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, integrations)

    # Check and Seed Admins
    cursor.execute("SELECT COUNT(*) FROM admins")
    if cursor.fetchone()[0] == 0:
        admins = [
            ("ADM-001", "Dr. Rajesh Varma", "Chief Healthcare Information Officer / Network Admin", "admin@healthvault.gov", "SuperAdmin / Full Network Access")
        ]
        cursor.executemany("""
        INSERT OR IGNORE INTO admins (id, full_name, designation, email, clearance_level)
        VALUES (?, ?, ?, ?, ?)
        """, admins)

    conn.commit()
    conn.close()

# Auto-initialize and seed when module loads
init_db()
seed_initial_data_if_empty()
