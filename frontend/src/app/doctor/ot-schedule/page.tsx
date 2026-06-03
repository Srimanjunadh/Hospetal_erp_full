"use client";
import { useEffect, useState } from "react";
import { Activity, Clipboard, Clock, Play, Check } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

import { apiService } from "@/services/api";

export default function DoctorOTSchedulePage() {
  const { showToast } = useToast();
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<any>(null);
  const [sessionUser, setSessionUser] = useState("Dr. Sarah Smith");

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session) {
      setSessionUser(session.name);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      if (session?.hospital_id) {
        const data = await apiService.getSurgicalSchedules(session.hospital_id);
        setSurgeries(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch OT data", e);
      setSurgeries([]);
    }
  };

  const toggleChecklist = async (surgeryId: number, item: string) => {
    const surgery = surgeries.find(s => s.id === surgeryId);
    const newChecklist = { ...surgery.checklist_status, [item]: !surgery.checklist_status[item] };
    
    try {
      await apiService.updateSurgicalChecklist(surgeryId, newChecklist);
      showToast("Checklist Updated", "success");
      fetchData();
    } catch (e) {
      showToast("Update failed", "error");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="doctor" userName={sessionUser}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Surgical Center Command
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>
          OPERATING THEATER (OT) QUEUE & READINESS CHECKLISTS
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* OT Queue */}
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px' }}>TODAY'S SURGICAL QUEUE</h3>
              <Clock size={18} />
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {!Array.isArray(surgeries) || surgeries.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, fontWeight: 700, color: 'var(--text-secondary)' }}>NO SURGERIES SCHEDULED</div>
              ) : (
                surgeries.map((s, i) => (
                  <div key={i} 
                    style={{ 
                      padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '20px', alignItems: 'center', cursor: 'pointer', 
                      background: selectedSurgery?.id === s.id ? '#f0fdfa' : '#fff',
                      transition: 'all 0.2s ease',
                      borderLeft: selectedSurgery?.id === s.id ? '4px solid var(--color-accent)' : '4px solid transparent'
                    }} 
                    onMouseOver={(e) => { if(selectedSurgery?.id !== s.id) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseOut={(e) => { if(selectedSurgery?.id !== s.id) e.currentTarget.style.background = '#fff'; }}
                    onClick={() => setSelectedSurgery(s)}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', width: '30px' }}>{(i + 1).toString().padStart(2, '0')}</span>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{s.procedure_name}</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>OT ROOM {s.ot_room_number} • {new Date(s.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: s.status === 'SCHEDULED' ? '#f1f5f9' : '#e0e7ff', color: s.status === 'SCHEDULED' ? 'var(--text-secondary)' : '#4338ca' }}>{s.status}</span>
                        <Activity size={18} color="var(--text-secondary)" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* WHO Checklist */}
          {selectedSurgery ? (
            <div className="card-premium" style={{ borderTop: '4px solid var(--color-accent)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>WHO SAFETY CHECKLIST</h3>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2rem' }}>PROCEDURE: {selectedSurgery.procedure_name.toUpperCase()}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(selectedSurgery.checklist_status).map((item) => (
                  <div key={item} 
                    onClick={() => toggleChecklist(selectedSurgery.id, item)}
                    style={{ 
                      padding: '14px 16px', 
                      borderRadius: '12px',
                      border: selectedSurgery.checklist_status[item] ? '1px solid #10b981' : '1px solid #e2e8f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: selectedSurgery.checklist_status[item] ? '#ecfdf5' : '#f8fafc',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedSurgery.checklist_status[item] ? '0 2px 4px rgba(16, 185, 129, 0.1)' : 'none'
                    }}
                    onMouseOver={(e) => { if(!selectedSurgery.checklist_status[item]) e.currentTarget.style.borderColor = 'var(--color-accent)' }}
                    onMouseOut={(e) => { if(!selectedSurgery.checklist_status[item]) e.currentTarget.style.borderColor = '#e2e8f0' }}
                    >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedSurgery.checklist_status[item] ? '#059669' : 'var(--text-primary)' }}>{item.toUpperCase()}</span>
                    {selectedSurgery.checklist_status[item] ? <Check size={18} color="#059669" /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                  </div>
                ))}
              </div>

              <button className="btn-primary-premium" style={{ width: '100%', marginTop: '2.5rem', height: '54px', justifyContent: 'center' }}>
                <Play size={18} /> COMMENCE SURGERY
              </button>
            </div>
          ) : (
            <div className="card-premium" style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Clipboard size={32} color="var(--text-secondary)" />
              </div>
              <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>SELECT A PROCEDURE TO VIEW READINESS</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
