"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, MessageSquare, ChevronLeft, Send, CheckCircle, Activity, Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);

  const [formData, setFormData] = useState({
    doctor_id: "",
    preferred_time: "",
    reason: "",
    type: "offline"
  });

  const fetchClinicalData = async () => {
    try {
      const dData = await apiService.getDoctors();
      setDoctors(Array.isArray(dData) ? dData : []);
      
      const s = JSON.parse(localStorage.getItem("medclues_session") || "null");
      if (s && s.id) {
        const aData = await apiService.getPatientAppointments(s.id);
        setAppointments(Array.isArray(aData) ? aData : []);
      }
    } catch (e) {
      console.error("Clinical data sync failed:", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    const s = JSON.parse(localStorage.getItem("medclues_session") || "null");
    setSession(s);
    fetchClinicalData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety Check for Session Identity
    const s = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (!s || !s.id) {
      showToast("Identity Token Expired. Please Logout and Login again.", "error");
      return;
    }

    if (!formData.doctor_id || !formData.preferred_time) {
      showToast("Please complete all required fields", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createAppointment({
        patient_id: s.id,
        doctor_id: parseInt(formData.doctor_id),
        hospital_id: s.hospital_id || 1,
        preferred_time: formData.preferred_time,
        reason: formData.reason,
        type: formData.type,
        status: "pending"
      });
      showToast("APPOINTMENT REQUEST TRANSMITTED", "success");
      setTimeout(() => router.push("/patient"), 2000);
    } catch (error: any) {
      showToast(error.message || "Transmission Error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="patient" userName={session?.name || "Patient"}>
      <div style={{ marginBottom: '3rem' }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ChevronLeft size={16} /> Back to Hub
        </button>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Schedule Clinical Visit</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>SECURE APPOINTMENT ORCHESTRATION NODE</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
        <div className="card-premium" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SELECT SPECIALIST / DOCTOR</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <select 
                  required
                  value={formData.doctor_id}
                  onChange={e => setFormData({...formData, doctor_id: e.target.value})}
                  className="search-input-premium"
                  style={{ width: '100%', padding: '12px 16px 12px 45px', cursor: 'pointer' }}
                >
                  <option value="">Select Clinician</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.user?.name?.toUpperCase()} — {d.specialization?.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PREFERRED DATE & TIME</label>
                <div style={{ position: 'relative' }}>
                  <Calendar style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.preferred_time}
                    onChange={e => setFormData({...formData, preferred_time: e.target.value})}
                    className="search-input-premium"
                    style={{ width: '100%', padding: '12px 16px 12px 45px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>VISIT TYPE</label>
                <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {["offline", "online"].map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, type: t})}
                      style={{ 
                        flex: 1, 
                        padding: '10px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        border: 'none', 
                        background: formData.type === t ? 'var(--color-accent)' : 'transparent',
                        color: formData.type === t ? '#fff' : 'var(--text-secondary)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>REASON FOR CLINICAL CONSULTATION</label>
              <div style={{ position: 'relative' }}>
                <MessageSquare style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} size={18} />
                <textarea 
                  required
                  placeholder="Describe your symptoms or reason for visit..."
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="search-input-premium"
                  style={{ width: '100%', padding: '16px 16px 16px 45px', minHeight: '120px', resize: 'none' }}
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary-premium" style={{ padding: '16px', gap: '12px', marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
              {isSubmitting ? <Clock className="animate-spin" size={18} /> : <Send size={18} />}
              {isSubmitting ? "TRANSMITTING REQUEST..." : "SUBMIT APPOINTMENT REQUEST"}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card-premium" style={{ background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', padding: '2.5rem', border: 'none' }}>
             <Shield size={28} style={{ marginBottom: '1.5rem', opacity: 0.9 }} />
             <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>Secure Clinical Routing</h3>
             <p style={{ fontSize: '0.85rem', lineHeight: '1.6', opacity: 0.8, fontWeight: 500 }}>
               Your request will be transmitted directly to the selected clinician's dashboard. The doctor will review your clinical history and confirm a specific time window for your consultation.
             </p>
          </div>

          <div className="card-premium" style={{ padding: '2.5rem' }}>
             <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: 'var(--text-primary)' }}>SCHEDULING PROTOCOLS</h3>
             <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  "Request status updates in real-time.",
                  "Clinician may adjust time based on availability.",
                  "Digital consults require stable network node.",
                  "Emergency cases should use the SOS terminal."
                ].map((text, i) => (
                  <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <CheckCircle size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} /> {text}
                  </li>
                ))}
              </ul>
          </div>
        </div>
      </div>

      {/* Appointment Status Registry (Moved from Dashboard) */}
      <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-side)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={20} />
              <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px' }}>CONSULTATION REQUEST STATUS</h3>
           </div>
           <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>REAL-TIME TRACKING</span>
        </div>
        <div className="table-responsive">
          <table className="data-table-premium">
             <thead>
               <tr>
                 <th style={{ width: '80px' }}>S.NO</th>
                 <th>VISIT REASON</th>
                 <th>PREFERRED TIME</th>
                 <th>FINALIZED SCHEDULE</th>
                 <th style={{ textAlign: 'right' }}>STATUS</th>
               </tr>
             </thead>
             <tbody>
               {appointments.length === 0 ? (
                 <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NO ACTIVE REQUESTS</td></tr>
               ) : appointments.map((a, i) => (
                 <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                   <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                   <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{a.reason?.toUpperCase()}</td>
                   <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{a.preferred_time}</td>
                   <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>TBD BY DOCTOR</span>}
                   </td>
                   <td style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        background: a.status === 'scheduled' ? '#d1fae5' : '#fef3c7',
                        color: a.status === 'scheduled' ? '#059669' : '#d97706'
                      }}>
                        {a.status?.toUpperCase()}
                      </span>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
