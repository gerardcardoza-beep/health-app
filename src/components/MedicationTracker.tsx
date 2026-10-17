import React, { useState } from 'react';
import { Pill, Clock, AlertCircle, CheckCircle2, Calendar, Stethoscope, Search } from 'lucide-react';
import { Medication, Diagnosis } from '../types';

interface MedicationTrackerProps {
  medications: Medication[];
  diagnoses: Diagnosis[];
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({ medications, diagnoses }) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Map diagnosis details by ID for easy clinical context lookups
  const diagnosisMap = diagnoses.reduce<Record<string, Diagnosis>>((acc, d) => {
    acc[d.id] = d;
    return acc;
  }, {});

  const filtered = medications.filter(m => 
    !filterQuery || 
    m.drug_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    m.prescribed_by.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (diagnosisMap[m.diagnosis_id]?.condition_name || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Active Pharmacotherapy & Medication Schedule
          </h2>
          <p className="text-xs text-slate-500">
            Medications linked to specific specialty diagnoses, dosages, and administration guidelines.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search medications or doctors..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-56 sm:w-64 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-medium text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Medication & Dosage</th>
                  <th scope="col" className="px-4 py-3">Specialty / Treated Condition</th>
                  <th scope="col" className="px-4 py-3">Frequency & Schedule</th>
                  <th scope="col" className="px-4 py-3">Duration & Dates</th>
                  <th scope="col" className="px-4 py-3">Prescribing Physician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {filtered.map((med) => {
                  const diag = diagnosisMap[med.diagnosis_id];
                  return (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="rounded p-1.5 bg-emerald-50 text-emerald-700">
                            <Pill className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">{med.drug_name}</span>
                            <span className="block text-[11px] text-slate-500 font-mono">{med.dosage}</span>
                          </div>
                        </div>
                        {med.instructions && (
                          <p className="mt-1 text-[11px] text-slate-600 italic">
                            “{med.instructions}”
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {diag ? (
                          <div>
                            <span className="font-medium text-slate-900 block">{diag.condition_name}</span>
                            <span className="text-[11px] text-slate-500">{diag.category}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">General Clinical</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{med.frequency}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <span className="font-medium text-slate-900">{med.duration}</span>
                          <span className="block text-[11px] text-slate-400 font-mono">
                            Start: {med.start_date}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                          <span>{med.prescribed_by}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center bg-white">
          <Pill className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-xs font-semibold text-slate-700">No active medications registered</p>
        </div>
      )}
    </div>
  );
};
