"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ChevronRight, Activity, Search, ShieldCheck, FileText, X, Clock, Heart } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiService } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function NurseSelectPatientPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const s = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (s && s.role === "nurse") {
      setSession(s);
      if (s.hospital_id) fetchPatients(s.hospital_id);
    }
  }, [router, mounted]);

  const fetchPatients = async (hId: number) => {
    try {
      const [pData, aData, bData] = await Promise.all([
        apiService.getUsers('patient', hId),
        apiService.getAdmissions(),
        apiService.getBeds(hId)
      ]);
      setPatients(Array.isArray(pData) ? pData : []);
      setAdmissions(Array.isArray(aData) ? aData : []);
      setBeds(Array.isArray(bData) ? bData : []);
    } catch (e) {
      console.error("Clinical sync failed:", e);
    }
  };

  const fetchPatientReport = async (patient: any) => {
    setIsLoadingReport(true);
    setSelectedReport(patient);
    try {
      const [vitals, risk] = await Promise.all([
        apiService.getLatestVitals(patient.username),
        apiService.getPatientRiskScore(patient.id)
      ]);
      setReportData({ vitals, risk });
    } catch (e) {
      console.error("Report fetch failed:", e);
      setReportData({ vitals: null, risk: null });
    } finally {
      setIsLoadingReport(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <DashboardLayout role="nurse" userName={session?.name || "Nurse"}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Patient Selection Terminal</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginTop: '8px' }}>Select an active assignment to initiate clinical monitoring</p>
        </div>

        <div style={{ position: 'relative', marginBottom: '3rem' }}>
          <Search size={24} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by name or enrollment ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1.25rem 2rem 1.25rem 3.5rem', 
              fontSize: '1rem', 
              fontWeight: 500, 
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              background: '#fff',
              color: 'var(--text-primary)',
              outline: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }} 
          />
        </div>

        <div className="table-responsive card-premium" style={{ padding: 0 }}>
          <table className="data-table-premium">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>S.NO</th>
                <th>PATIENT IDENTITY</th>
                <th>ADMIT DATE</th>
                <th>PRIMARY DOCTOR</th>
                <th>ROOM/BED</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '5rem', textAlign: 'center' }}>
                    <Users size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                    <h3 style={{ fontWeight: 900, opacity: 0.3 }}>NO MATCHING CLINICAL ASSIGNMENTS FOUND</h3>
                  </td>
                </tr>
              ) : filteredPatients.map((p, i) => {
                const admission = admissions.find(a => a.patient_id === p.id);
                const bed = beds.find(b => b.patient_id === p.id);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 800, opacity: 0.4 }}>
                      {(i + 1).toString().padStart(2, '0')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, borderRadius: '10px' }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <h4 
                            onClick={() => fetchPatientReport(p)}
                            style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--bg-side)', cursor: 'pointer' }}
                          >
                            {p.name}
                          </h4>
                          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{p.username}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {admission ? new Date(admission.admitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {admission?.doctor?.name ? `Dr. ${admission.doctor.name}` : 'Not Assigned'}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, background: bed ? 'rgba(6, 125, 113, 0.1)' : '#f8fafc', color: bed ? 'var(--bg-side)' : 'var(--text-secondary)', padding: '6px 12px', borderRadius: '20px' }}>
                        <ShieldCheck size={14} /> {bed ? `Room ${bed.room_number} / B${bed.bed_number}` : 'Awaiting Room'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => router.push(`/nurse?patient=${p.username}`)}
                        className="btn-primary-premium"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        Update Vitals
                      </button>
                      <button 
                        onClick={() => fetchPatientReport(p)}
                        className="btn-outline-premium"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        View Report
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Report Modal (Read Only) */}
      <AnimatePresence>
        {selectedReport && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                style={{ width: '600px', position: 'relative', padding: '3rem', maxHeight: '90vh', overflowY: 'auto' }}
                className="custom-scrollbar card-premium"
              >
                <button onClick={() => setSelectedReport(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color="var(--text-secondary)" />
                </button>

                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{selectedReport.name}</h2>
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>ID: {selectedReport.username} • Clinical Status Report</p>
                </div>

              {isLoadingReport ? (
                <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 900 }}>TRANSMITTING DATA...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   {/* Vitals Summary */}
                   <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                     <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Latest Vitals</h4>
                     {reportData?.vitals ? (
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div><p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Blood Pressure</p><p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{reportData.vitals.blood_pressure}</p></div>
                          <div><p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Heart Rate</p><p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{reportData.vitals.heart_rate} bpm</p></div>
                          <div><p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SpO2 Level</p><p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{reportData.vitals.spo2}%</p></div>
                          <div><p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Temperature</p><p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{reportData.vitals.temperature}°F</p></div>
                       </div>
                     ) : (
                       <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>No vitals data on record</p>
                     )}
                   </div>

                   {/* AI Risk Score */}
                   <div style={{ background: 'var(--bg-side)', color: '#fff', borderRadius: '12px', padding: '1.5rem' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase', marginBottom: '1rem' }}>AI Risk Analysis</h4>
                      {reportData?.risk ? (
                        <div>
                           <p style={{ fontSize: '1.5rem', fontWeight: 800, color: reportData.risk.risk_level === 'CRITICAL' ? '#fca5a5' : '#6ee7b7' }}>{reportData.risk.risk_level} RISK</p>
                           <p style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>Score: {reportData.risk.score_value}/10</p>
                        </div>
                      ) : (
                        <p style={{ opacity: 0.6, fontSize: '0.85rem', fontWeight: 500 }}>Analysis engine pending sync...</p>
                      )}
                   </div>

                   {/* Observations */}
                   <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                     <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>Nursing Observations</h4>
                     <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: '1.6' }}>
                       {reportData?.vitals?.nursing_notes || "No recent clinical observations recorded in system."}
                     </p>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', borderRadius: '12px' }}>
                      System Notice: Read-only access granted. Modification restricted.
                    </div>
                 </div>
               )}
             </motion.div>
           </div>
         )}
       </AnimatePresence>
       
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
       `}</style>
    </DashboardLayout>
  );
}
