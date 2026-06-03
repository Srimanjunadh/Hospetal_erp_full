"use client";
import { useState, useEffect, useCallback } from "react";
import { Activity, Clipboard, Clock, Play, Check, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

interface Doctor {
  id: number;
  user?: {
    name: string;
  };
  specialization?: string;
}

interface Patient {
  id: number;
  name: string;
}

interface Surgery {
  id: number;
  procedure_name: string;
  doctor: Doctor;
  patient: Patient;
  ot_room_number: string;
  scheduled_at: string;
  notes?: string;
  status: string;
  checklist_status: Record<string, boolean>;
}

export default function OTSchedulePage() {
  const { showToast } = useToast();
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSurgery, setNewSurgery] = useState({
    procedure_name: '',
    doctor_id: '',
    patient_id: '',
    ot_room_number: 'OT-101',
    scheduled_at: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      if (session?.hospital_id) {
        const data = await apiService.getSurgicalSchedules(session.hospital_id);
        setSurgeries(Array.isArray(data) ? data : []);

        const docs = await apiService.getDoctors(session.hospital_id);
        setDoctors(Array.isArray(docs) ? docs : []);

        const pats = await apiService.getPatients(session.hospital_id);
        setPatients(Array.isArray(pats) ? pats : []);
      }
    } catch {
      setSurgeries([]);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  const toggleChecklist = async (surgeryId: number, item: string) => {
    const surgery = surgeries.find(s => s.id === surgeryId);
    if (!surgery) return;
    const newChecklist = { ...surgery.checklist_status, [item]: !surgery.checklist_status[item] };
    
    try {
      await apiService.updateSurgicalChecklist(surgeryId, newChecklist);
      showToast("Checklist Updated", "success");
      fetchData();
    } catch {
      showToast("Update failed", "error");
    }
  };

  const handleAddSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurgery.procedure_name || !newSurgery.doctor_id || !newSurgery.patient_id) {
      showToast("Please fill all required fields", "error");
      return;
    }

    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const payload = {
        hospital_id: session?.hospital_id || 1,
        patient_id: Number(newSurgery.patient_id),
        doctor_id: Number(newSurgery.doctor_id),
        ot_room_number: newSurgery.ot_room_number,
        procedure_name: newSurgery.procedure_name,
        scheduled_at: new Date(newSurgery.scheduled_at).toISOString(),
        notes: newSurgery.notes
      };

      await apiService.scheduleSurgery(payload);
      showToast("Surgery scheduled & notification sent to Doctor", "success");
      setIsAddModalOpen(false);
      // Reset form
      setNewSurgery({
        procedure_name: '',
        doctor_id: '',
        patient_id: '',
        ot_room_number: 'OT-101',
        scheduled_at: new Date().toISOString().slice(0, 16),
        notes: ''
      });
      fetchData();
    } catch (err) {
      showToast((err as Error).message || "Failed to schedule surgery", "error");
    }
  };

  const handleDeleteSurgery = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this surgical schedule?")) return;
    try {
      await apiService.deleteSurgery(id);
      showToast("Surgery schedule deleted successfully", "success");
      if (selectedSurgery?.id === id) setSelectedSurgery(null);
      fetchData();
    } catch (err) {
      showToast((err as Error).message || "Failed to delete surgery", "error");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="hospital_admin" userName="Admin Manju">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Surgical Center Command</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Operating Theater (OT) Queue & Readiness Checklists</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary-premium" 
          style={{ height: '42px', padding: '0 1.5rem', borderRadius: '30px' }}
        >
          <Plus size={16} />
          <span>Schedule Procedure</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* OT Queue */}
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', background: 'rgba(14, 165, 233, 0.06)', borderBottom: '1px solid rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} style={{ color: '#0ea5e9' }} />
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0ea5e9', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Today&apos;s Surgical Queue</h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>
                {surgeries.length} Slotted
              </span>
            </div>
            
            <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="custom-scrollbar">
              {!Array.isArray(surgeries) || surgeries.length === 0 ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Activity size={36} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No surgeries scheduled for today</p>
                </div>
              ) : (
                surgeries.map((s, i) => {
                  const isSelected = selectedSurgery?.id === s.id;
                  let statusBg = '#fffbeb';
                  let statusColor = '#d97706';
                  if (s.status === 'IN-PROGRESS') {
                    statusBg = '#e0f2fe';
                    statusColor = '#0284c7';
                  } else if (s.status === 'COMPLETED') {
                    statusBg = '#ecfdf5';
                    statusColor = '#059669';
                  }
                  
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        padding: '1.25rem 2rem', 
                        borderBottom: '1px solid #f1f5f9', 
                        display: 'flex', 
                        gap: '20px', 
                        alignItems: 'center', 
                        cursor: 'pointer', 
                        background: isSelected ? 'rgba(6, 125, 113, 0.04)' : '#fff',
                        borderLeft: isSelected ? '4px solid var(--bg-side)' : '4px solid transparent',
                        transition: 'all 0.2s ease'
                      }} 
                      onClick={() => setSelectedSurgery(s)}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.4 }}>{(i + 1).toString().padStart(2, '0')}</span>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{s.procedure_name}</h4>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: '4px' }}>{s.ot_room_number}</span>
                            <span style={{ width: '4px', height: '4px', background: '#cbd5e1', borderRadius: '50%' }}></span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                              Dr. {s.doctor?.user?.name}
                            </span>
                            <span style={{ width: '4px', height: '4px', background: '#cbd5e1', borderRadius: '50%' }}></span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700, 
                            padding: '4px 8px', 
                            borderRadius: '12px',
                            background: statusBg,
                            color: statusColor
                          }}>
                            {s.status}
                          </span>
                          <button 
                            onClick={(e) => handleDeleteSurgery(s.id, e)}
                            style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '50%', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#ffe4e6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            title="Delete Schedule"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* WHO Checklist */}
          {selectedSurgery ? (
            <div className="card-premium" style={{ borderTop: '4px solid var(--bg-side)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>WHO Safety Checklist</h3>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Proc: {selectedSurgery.procedure_name}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.keys(selectedSurgery.checklist_status).map((item) => {
                  const checked = selectedSurgery.checklist_status[item];
                  return (
                    <div key={item} 
                      onClick={() => toggleChecklist(selectedSurgery.id, item)}
                      style={{ 
                        padding: '12px 16px', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '10px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: checked ? 'rgba(16, 185, 129, 0.06)' : '#fff',
                        borderColor: checked ? 'rgba(16, 185, 129, 0.25)' : '#e2e8f0',
                        color: checked ? '#047857' : 'var(--text-primary)',
                        transition: 'all 0.15s ease'
                      }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.replace(/_/g, ' ')}</span>
                      {checked ? (
                        <Check size={16} style={{ color: '#10b981' }} />
                      ) : (
                        <div style={{ width: '16px', height: '16px', border: '2px solid #cbd5e1', borderRadius: '4px' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              <button className="btn-primary-premium" style={{ width: '100%', marginTop: '2rem', height: '46px', justifyContent: 'center' }}>
                <Play size={14} />
                <span>Commence Surgical Operation</span>
              </button>
            </div>
          ) : (
            <div className="card-premium" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Clipboard size={36} style={{ opacity: 0.3 }} />
              <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Select a procedure to view readiness checklist</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Surgery Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card-premium" style={{ width: '100%', maxWidth: '580px', background: '#fff', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Schedule Surgical Procedure</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>

            <form onSubmit={handleAddSurgery} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Procedure Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Appendectomy, CABG, Knee Replacement"
                  value={newSurgery.procedure_name}
                  onChange={e => setNewSurgery({...newSurgery, procedure_name: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Assign Surgeon *</label>
                  <select 
                    required
                    value={newSurgery.doctor_id} 
                    onChange={e => setNewSurgery({...newSurgery, doctor_id: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                    title="Assign Surgeon"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.user?.name || d.specialization}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Select Patient *</label>
                  <select 
                    required
                    value={newSurgery.patient_id} 
                    onChange={e => setNewSurgery({...newSurgery, patient_id: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                    title="Select Patient"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Operating Theater (OT) Room *</label>
                  <select 
                    value={newSurgery.ot_room_number} 
                    onChange={e => setNewSurgery({...newSurgery, ot_room_number: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                    title="Operating Theater Room"
                  >
                    <option value="OT-101">OT Room 101 (Cardiac / Major)</option>
                    <option value="OT-102">OT Room 102 (Ortho / General)</option>
                    <option value="OT-204">OT Room 204 (Neuro / Special)</option>
                    <option value="OT-305">OT Room 305 (Emergency)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Date & Scheduled Time *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={newSurgery.scheduled_at}
                    onChange={e => setNewSurgery({...newSurgery, scheduled_at: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Surgical Notes / Pre-Op Instructions</label>
                <textarea 
                  placeholder="Enter pre-op specifications or special equipment requirements..."
                  value={newSurgery.notes}
                  onChange={e => setNewSurgery({...newSurgery, notes: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                <button type="button" className="btn-outline-premium" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-premium" style={{ flex: 2, justifyContent: 'center' }}>
                  Schedule & Notify Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
