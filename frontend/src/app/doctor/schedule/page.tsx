"use client";
import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle, AlertCircle, RefreshCcw, ShieldCheck, Activity } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

export default function DoctorSchedulePage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState("");

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session) {
      setSessionUser(session.name);
      if (session.doctor_id) {
        fetchSchedule(session.doctor_id);
      }
    }
  }, []);

  const fetchSchedule = async (doctorId: number) => {
    setIsLoading(true);
    try {
      const data = await apiService.getDoctorSchedule(doctorId);
      if (Array.isArray(data)) {
        setSchedules(data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      }
    } catch (error) {
      showToast("Failed to sync clinical schedule", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="doctor" userName={sessionUser}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Clinical Schedule
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>
            ROOT OPERATIONS LOG • ASSIGNED BY FACILITY ADMIN
          </p>
        </div>
        <button 
          onClick={() => {
            const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
            if (session?.doctor_id) fetchSchedule(session.doctor_id);
          }}
          className="btn-outline-premium"
        >
          <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} /> <span>REFRESH FEED</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
        <div className="card-premium" style={{ background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', border: 'none' }}>
           <p className="card-title" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 700 }}>NEXT OPERATION</p>
           <h2 className="card-value" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '8px' }}>
             {schedules.find(s => s.status === 'pending') ? schedules.find(s => s.status === 'pending').task_name : "NONE"}
           </h2>
           <p style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '1rem', color: '#a7f3d0' }}>SYSTEM READY</p>
        </div>
        <div className="card-premium">
           <p className="card-title" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>TOTAL TASKS TODAY</p>
           <h2 className="card-value" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '8px' }}>{schedules.length < 10 ? `0${schedules.length}` : schedules.length}</h2>
           <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '1rem', color: 'var(--text-secondary)' }}>ACROSS ALL WARDS</p>
        </div>
        <div className="card-premium">
           <p className="card-title" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>PENDING ACTIONS</p>
           <h2 className="card-value" style={{ fontSize: '2rem', fontWeight: 900, color: schedules.filter(s => s.status === 'pending').length > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '8px' }}>
             {schedules.filter(s => s.status === 'pending').length < 10 ? `0${schedules.filter(s => s.status === 'pending').length}` : schedules.filter(s => s.status === 'pending').length}
           </h2>
           <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '1rem', color: 'var(--text-secondary)' }}>REQUIRES ATTENTION</p>
        </div>
      </div>

      <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} color="var(--color-accent)" />
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>ASSIGNED OPERATIONS & TASKS</h3>
        </div>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.5 }}>SYNCHRONIZING WITH FACILITY HUB...</div>
          ) : schedules.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.5 }}>NO OPERATIONS ASSIGNED BY ADMIN</div>
          ) : (
            schedules.map((s, i) => (
              <div key={i} style={{ padding: '2rem 2.5rem', borderBottom: i < schedules.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '20px', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6, width: '30px' }}>{(i + 1).toString().padStart(2, '0')}</span>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ padding: '14px', borderRadius: '12px', background: s.status === 'pending' ? '#fee2e2' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.status === 'pending' ? <Clock size={24} color="#ef4444" /> : <CheckCircle size={24} color="#10b981" />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px', color: 'var(--text-primary)' }}>{s.task_name}</h4>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {new Date(s.start_time).toLocaleString([], {weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})} — {new Date(s.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      {s.notes && <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-secondary)' }}>NOTES: {s.notes}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <span style={{ 
                       padding: '6px 14px', 
                       fontSize: '0.7rem', 
                       fontWeight: 800, 
                       borderRadius: '20px',
                       background: s.status === 'pending' ? '#fef2f2' : '#ecfdf5', 
                       color: s.status === 'pending' ? '#ef4444' : '#10b981',
                       border: s.status === 'pending' ? '1px solid #fecaca' : '1px solid #a7f3d0'
                     }}>
                       {s.status.toUpperCase()}
                     </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
