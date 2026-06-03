"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Users, Clock, ClipboardList, Heart, Droplets, ChevronRight, Save } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function NurseDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NurseDashboardContent />
    </Suspense>
  );
}

function NurseDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetPatientId = searchParams.get("patient");
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [vitals, setVitals] = useState({ hr: "", glucose: "", bp: "", spo2: "", temp: "", notes: "" });
  const [patientTests, setPatientTests] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [nurseMedicines, setNurseMedicines] = useState<any[]>([]);
  const [doctorPrescriptions, setDoctorPrescriptions] = useState<any[]>([]);
  const [newMed, setNewMed] = useState({ name: "", quantity: "" });
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordData, setRecordData] = useState({ title: "", type: "REPORT", file: null as File | null });
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const fetchPatients = async (nurseId: number) => {
    try {
      const data = await apiService.getNursePatients(nurseId);
      const patientList = Array.isArray(data) ? data : [];
      setPatients(patientList);
      
      if (targetPatientId && patientList.length > 0) {
        const target = patientList.find(p => p.username === targetPatientId || p.id.toString() === targetPatientId);
        if (target) setSelectedPatient(target);
      }
    } catch (e) {
      console.error("Patient sync failed:", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    const s = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (s && s.role === "nurse") {
      setSession(s);
      fetchPatients(s.id);
    }
  }, [router, mounted]);

  useEffect(() => {
    if (selectedPatient) {
      apiService.getPatientTests(selectedPatient.id).then(data => {
        setPatientTests(Array.isArray(data) ? data : []);
      }).catch(e => console.error(e));
    } else {
      setPatientTests([]);
    }
  }, [selectedPatient]);

  const handleUpdateVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      await apiService.updateVitals({
        patient_id: selectedPatient.id,
        nurse_id: session.id,
        blood_pressure: vitals.bp || "120/80",
        heart_rate: parseInt(vitals.hr) || 72,
        temperature: parseFloat(vitals.temp) || 98.6,
        spo2: parseInt(vitals.spo2) || 99,
        glucose: parseFloat(vitals.glucose) || 100,
        nursing_notes: vitals.notes
      });
      showToast("VITALS SYNCHRONIZED SUCCESSFULLY", "success");
      setVitals({ hr: "", glucose: "", bp: "", spo2: "", temp: "", notes: "" });
      setSelectedPatient(null);
    } catch (e) {
      showToast("Update Failed", "error");
    }
  };

  const openMedicineModal = async () => {
    if (!selectedPatient) return;
    try {
      const data = await apiService.getPatientPrescriptions(selectedPatient.id);
      // Flatten all prescriptions into a single list of medicines
      // Use medicine field from DB if present
      const allMeds = data.flatMap((p: any) => (p.medicines || []).map((m: any) => ({
        name: m.medicine || m.name,
        dosage: m.power || m.dosage,
        duration: m.duration || m.amount
      })));
      setDoctorPrescriptions(allMeds);
      setIsMedicineModalOpen(true);
    } catch (e) {
      showToast("Failed to fetch prescriptions", "error");
    }
  };

  const handleSendMedicineRequest = async () => {
    try {
      if (nurseMedicines.length === 0) {
        showToast("Please add medicines to request", "info");
        return;
      }
      
      await apiService.createNurseMedicineRequest({
        hospital_id: session.hospital_id,
        patient_id: selectedPatient.id,
        nurse_id: session.id,
        medicines: nurseMedicines
      });
      
      showToast("MEDICINE REQUEST SENT TO PHARMACY", "success");
      setIsMedicineModalOpen(false);
      setNurseMedicines([]);
    } catch (e) {
      showToast("Request Failed", "error");
    }
  };

  const handleRecordUpload = async () => {
    if (!selectedPatient || !recordData.file || !recordData.title) return;
    setIsSubmittingRecord(true);
    try {
      await apiService.uploadHealthRecord(selectedPatient.id, recordData.title, recordData.type, recordData.file);
      showToast("HEALTH RECORD SYNCHRONIZED", "success");
      setShowRecordModal(false);
      setRecordData({ title: "", type: "REPORT", file: null });
    } catch (error) {
      showToast("Upload failed", "error");
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="nurse" userName={session?.name || "Nurse"}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Nursing Command Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem', marginTop: '4px' }}>Synchronized Patient Care Node</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '3rem' }}>
        {/* Patient Roster */}
        <div>
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', background: 'rgba(6, 125, 113, 0.05)', color: 'var(--bg-side)', borderBottom: '1px solid rgba(6, 125, 113, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Assigned Patients</h3>
               <Users size={18} />
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {patients.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.3, fontWeight: 800 }}>NO ASSIGNED PATIENTS</div>
              ) : patients.map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedPatient(p)}
                  style={{ 
                    padding: '1.5rem 2rem', 
                    borderBottom: '1px solid #eee', 
                    cursor: 'pointer', 
                    background: selectedPatient?.id === p.id ? '#f4f4f5' : 'transparent',
                    transition: '0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.4, color: 'var(--text-secondary)' }}>{(i + 1).toString().padStart(2, '0')}</span>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.name}</h4>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ID: {p.username}</p>
                    </div>
                    <ChevronRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vital Update Terminal */}
        <div>
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card-premium" 
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                   <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, borderRadius: '10px' }}>{selectedPatient.name.charAt(0)}</div>
                   <div>
                     <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{selectedPatient.name}</h3>
                     <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>VITAL SYNCHRONIZATION TERMINAL</p>
                   </div>
                </div>

                <form onSubmit={handleUpdateVitals} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Heart Rate (BPM)</label>
                       <div style={{ position: 'relative' }}>
                          <Heart size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input type="number" required placeholder="72" value={vitals.hr} onChange={e => setVitals({...vitals, hr: e.target.value})} style={{ width: '100%', padding: '12px 12px 12px 40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                       </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Glucose (mg/dL)</label>
                       <div style={{ position: 'relative' }}>
                          <Droplets size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input type="number" required placeholder="100" value={vitals.glucose} onChange={e => setVitals({...vitals, glucose: e.target.value})} style={{ width: '100%', padding: '12px 12px 12px 40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                       </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Blood Pressure</label>
                       <input type="text" placeholder="120/80" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Temperature (°F)</label>
                       <input type="number" step="0.1" placeholder="98.6" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nursing Observations</label>
                    <textarea 
                      placeholder="Enter clinical notes..."
                      value={vitals.notes}
                      onChange={e => setVitals({...vitals, notes: e.target.value})}
                      style={{ width: '100%', padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 500, color: 'var(--text-primary)', outline: 'none', minHeight: '100px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                      type="button" 
                      onClick={async () => {
                        try {
                          await apiService.sendEmergencyAlert({
                            hospital_id: session.hospital_id,
                            from_user_id: session.id,
                            message: `EMERGENCY ALERT: PATIENT ${selectedPatient.name} NEEDS IMMEDIATE ATTENTION`
                          });
                          showToast("EMERGENCY BROADCAST SENT TO ALL DOCTORS", "error");
                        } catch (e) { showToast("Broadcast Failed", "error"); }
                      }}
                      className="btn-primary-premium" 
                      style={{ background: '#ef4444', justifyContent: 'center' }}
                    >
                      Emergency Alert
                    </button>

                    <button 
                      type="button" 
                      onClick={async () => {
                        try {
                          await apiService.requestAmbulance({
                            hospital_id: session.hospital_id,
                            patient_id: selectedPatient.id,
                            nurse_id: session.id,
                            pickup_location: "EMERGENCY WING"
                          });
                          showToast("AMBULANCE DISPATCHED", "success");
                        } catch (e) { showToast("Dispatch Failed", "error"); }
                      }}
                      className="btn-outline-premium" 
                      style={{ justifyContent: 'center' }}
                    >
                      Request Ambulance
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setShowRecordModal(true)}
                      className="btn-outline-premium" 
                      style={{ justifyContent: 'center' }}
                    >
                      Add Old Docs
                    </button>

                    <button 
                      type="button" 
                      onClick={openMedicineModal}
                      className="btn-outline-premium" 
                      style={{ justifyContent: 'center', gridColumn: '1 / span 3' }}
                    >
                      Request Medicine
                    </button>
                  </div>

                  <button type="submit" className="btn-primary-premium" style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '1.5rem', borderRadius: '30px' }}>
                    <Save size={18} /> Synchronize Data
                  </button>
                </form>

                <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Diagnostic Test Results</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {patientTests.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', padding: '1rem' }}>No tests requested</p>
                    ) : patientTests.map((t, i) => (
                      <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'center', opacity: t.status === 'pending' ? 0.6 : 1 }}>
                         <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{(i + 1).toString().padStart(2, '0')}</span>
                         <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div>
                             <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t.test_name}</p>
                             <p style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '2px' }}>{t.status === 'pending' ? 'Pending Lab Verification' : `Released: ${new Date(t.created_at).toLocaleDateString()}`}</p>
                           </div>
                           {t.status === 'pending' ? <Clock size={16} color="var(--text-secondary)" /> : (
                             <button type="button" onClick={() => window.open(`http://localhost:8000/${t.file_path}`, '_blank')} className="btn-primary-premium" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px' }}>View PDF</button>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-premium" 
                style={{ padding: '5rem', textAlign: 'center', border: '1px dashed #cbd5e1' }}
              >
                <ClipboardList size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--text-secondary)', opacity: 0.5 }} />
                <h3 style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Select a patient to update vitals</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Medicine Request Modal */}
      {isMedicineModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setIsMedicineModalOpen(false)} />
          <div className="card-premium" style={{ width: '600px', position: 'relative', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2rem' }}>Medicine Request Terminal</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.65rem', fontWeight: 900, marginBottom: '1rem', opacity: 0.5 }}>DOCTOR PRESCRIBED MEDICINES</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {doctorPrescriptions.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.3 }}>NO PRESCRIBED MEDICINES FOUND</p>
                ) : doctorPrescriptions.map((m, i) => (
                  <div key={i} style={{ padding: '12px', background: '#f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{m.name}</span>
                      <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.5 }}>{m.dosage} • {m.duration}</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (!nurseMedicines.some(nm => nm.name === m.name)) {
                          setNurseMedicines([...nurseMedicines, { ...m, source: 'doctor' }]);
                        }
                      }}
                      style={{ background: '#29ABE2', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}
                    >
                      ADD
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.65rem', fontWeight: 900, marginBottom: '1rem', opacity: 0.5 }}>REQUEST LIST</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                {nurseMedicines.map((m, i) => (
                  <div key={i} style={{ padding: '12px', background: m.source === 'doctor' ? '#f4f4f5' : '#000', color: m.source === 'doctor' ? '#000' : '#fff', border: '2px solid #29ABE2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{m.name}</span>
                      <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.5 }}>{m.source === 'doctor' ? 'DOCTOR PRESCRIBED' : 'NURSE REQUESTED'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>{m.dosage || `QTY: ${m.quantity}`}</span>
                      <button 
                        onClick={() => setNurseMedicines(nurseMedicines.filter((_, idx) => idx !== i))}
                        style={{ background: 'transparent', color: m.source === 'doctor' ? '#000' : '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                      >×</button>
                    </div>
                  </div>
                ))}
              </div>
              <h4 style={{ fontSize: '0.65rem', fontWeight: 900, marginBottom: '1rem', opacity: 0.5 }}>ADD OTHER MEDICINES</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 50px', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="MEDICINE NAME" 
                  value={newMed.name}
                  onChange={e => setNewMed({...newMed, name: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #29ABE2', fontWeight: 800, fontSize: '0.75rem' }} 
                />
                <input 
                  type="text" 
                  placeholder="QTY" 
                  value={newMed.quantity}
                  onChange={e => setNewMed({...newMed, quantity: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #29ABE2', fontWeight: 800, fontSize: '0.75rem' }} 
                />
                <button 
                  onClick={() => {
                    if (newMed.name && newMed.quantity) {
                      setNurseMedicines([...nurseMedicines, { ...newMed, source: 'nurse' }]);
                      setNewMed({ name: "", quantity: "" });
                    }
                  }}
                  style={{ background: '#29ABE2', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
              <button onClick={() => setIsMedicineModalOpen(false)} className="btn-outline-premium" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={handleSendMedicineRequest} className="btn-primary-premium" style={{ flex: 1, justifyContent: 'center' }}>Send to Pharmacy</button>
            </div>
          </div>
        </div>
      )}

      {/* Health Record Upload Modal */}
      {showRecordModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowRecordModal(false)} />
          <div className="card-premium" style={{ width: '450px', position: 'relative', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
               <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Historical Health Record</h3>
               <X size={20} onClick={() => setShowRecordModal(false)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Record Title</label>
                  <input placeholder="e.g., Old Discharge Summary" value={recordData.title} onChange={e => setRecordData({...recordData, title: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', fontWeight: 500, outline: 'none' }} />
               </div>
               <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Category</label>
                  <select value={recordData.type} onChange={e => setRecordData({...recordData, type: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', fontWeight: 500, outline: 'none' }}>
                      <option value="REPORT">Diagnostic Report</option>
                      <option value="SCAN">Imaging Scan</option>
                      <option value="PRESCRIPTION">External Prescription</option>
                   </select>
               </div>
               <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Document File (PDF/IMG)</label>
                  <input type="file" onChange={e => setRecordData({...recordData, file: e.target.files?.[0] || null})} style={{ fontSize: '0.8rem', fontWeight: 500 }} />
               </div>
               <button onClick={handleRecordUpload} disabled={!recordData.file || !recordData.title || isSubmittingRecord} className="btn-primary-premium" style={{ width: '100%', justifyContent: 'center', opacity: isSubmittingRecord ? 0.5 : 1 }}>
                 {isSubmittingRecord ? "Synchronizing..." : "Upload to EHR Cloud"}
               </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
