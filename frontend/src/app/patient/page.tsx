"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, FileText, Pill, ShieldCheck, TrendingUp, Zap, Plus, Search, User, Key, MessageSquare, Hospital, Globe, LayoutDashboard, LogOut, Package, ShieldAlert, X, Shield, Star, Smartphone, Laptop, Database, Bell, UserCheck, Heart, Calendar } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

export default function PatientDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [sessionName, setSessionName] = useState("John Doe");
  const [activeMetrics, setActiveMetrics] = useState({
    hr: 0,
    glucose: 0,
    nurse: "NOT ASSIGNED",
    doctor: "NOT ASSIGNED",
    lastSync: "NEVER"
  });
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [expenditure, setExpenditure] = useState({ total: 0, history: [] });
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session && session.role === "patient") {
      setSessionName(session.name);
      fetchPatientHubData(session);
    }
  }, []);
  
  const fetchPatientHubData = async (session: any) => {
    try {
      // Vitals
      const vitals = await apiService.getLatestVitals(session.username);
      if (vitals) {
        setActiveMetrics(prev => ({
          ...prev,
          hr: vitals.heart_rate || 0,
          glucose: vitals.glucose || 0,
          lastSync: vitals.created_at ? new Date(vitals.created_at).toLocaleTimeString() : "NEVER",
        }));
      }

      setActiveMetrics(prev => ({
        ...prev,
        doctor: session.doctor || "NOT ASSIGNED",
        nurse: session.nurse || "NOT ASSIGNED"
      }));
      
      // Prescriptions
      const presData = await apiService.getPrescriptions(session.username);
      if (Array.isArray(presData)) {
        setPrescriptions(presData.flatMap(p => 
          (p.medicines || []).map((m: any) => ({
            name: m.name || "UNKNOWN MEDICINE",
            dosage: m.dosage || "N/A",
            instructions: m.instructions || "TAKE AS DIRECTED",
            status: "ACTIVE"
          }))
        ));
      }
      
      // Appointments
      const appts = await apiService.getPatientAppointments(session.id);
      setAppointments(Array.isArray(appts) ? appts : []);

      // Expenditure
      const billing = await apiService.getPatientExpenditure(session.id);
      setExpenditure(billing);

      // Lab Tests
      const tests = await apiService.getPatientTests(session.id);
      setTestResults(Array.isArray(tests) ? tests : []);
    } catch (error) {
      console.error("Hub sync failed:", error);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="patient" userName={sessionName}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Patient Health Repository</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '1px' }}>
          SECURE CLINICAL ARCHIVE • READ-ONLY ACCESS
        </p>
      </div>

      {/* Real-time Notifications */}
      <AnimatePresence>
        {appointments.filter(a => a.status === 'scheduled').map((a, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ 
              backgroundColor: '#10b981', 
              color: '#fff', 
              padding: '1.5rem 2rem', 
              borderRadius: '1px', 
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '2px solid #29ABE2'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Bell size={20} fill="#fff" />
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px' }}>APPOINTMENT FINALIZED</h4>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.9 }}>Your consultation for "{a.reason}" has been scheduled for {new Date(a.scheduled_at).toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={() => router.push("/patient/appointments")}
              style={{ backgroundColor: '#000', color: '#fff', border: 'none', padding: '8px 15px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}
            >
              VIEW DETAILS
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Financial Overview Banner */}
      <div className="card-premium" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fcd34d', padding: '1.5rem 2.5rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#b45309', letterSpacing: '1px' }}>TOTAL CUMULATIVE EXPENDITURE</h4>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#78350f', marginTop: '4px' }}>₹{expenditure.total?.toLocaleString()}</h2>
        </div>
        <button onClick={() => router.push("/patient/billing")} className="btn-outline-premium" style={{ background: '#fff', color: '#92400e', borderColor: '#fcd34d' }}>
          VIEW BILLING STATEMENTS
        </button>
      </div>

      {/* Vital Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>HEART RATE</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{activeMetrics.hr} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>BPM</span></h2>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SYNCHRONIZED: {activeMetrics.lastSync}</p>
          </div>
          <div style={{ height: '80px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { time: '08:00', value: Math.max(60, activeMetrics.hr - 5) },
                { time: '12:00', value: Math.max(60, activeMetrics.hr + 2) },
                { time: '16:00', value: Math.max(60, activeMetrics.hr - 3) },
                { time: '20:00', value: Math.max(60, activeMetrics.hr + 4) },
                { time: 'Now', value: activeMetrics.hr || 75 }
              ]}>
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>GLUCOSE LEVEL</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{activeMetrics.glucose} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>mg/dL</span></h2>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SYNCHRONIZED: {activeMetrics.lastSync}</p>
          </div>
          <div style={{ height: '80px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { time: 'Mon', value: Math.max(80, activeMetrics.glucose - 10) },
                { time: 'Tue', value: Math.max(80, activeMetrics.glucose - 5) },
                { time: 'Wed', value: Math.max(80, activeMetrics.glucose + 5) },
                { time: 'Thu', value: Math.max(80, activeMetrics.glucose + 12) },
                { time: 'Today', value: activeMetrics.glucose || 90 }
              ]}>
                <defs>
                  <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorGlucose)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card-premium" style={{ background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 700 }}>ASSIGNED CLINICIAN</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem', marginBottom: '1rem' }}>DR. {activeMetrics.doctor.toUpperCase()}</h2>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a7f3d0', padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'inline-block', width: 'fit-content' }}>PRIMARY CARE NODE</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
        
        {/* ACTIVE PRESCRIPTION REGISTRY */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.2rem 2rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>ACTIVE PRESCRIPTION REGISTRY</h3>
             <Pill size={18} color="var(--color-accent)" />
          </div>
          <div className="table-responsive">
            <table className="data-table-premium" style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr>
                   <th style={{ width: '80px' }}>S.NO</th>
                   <th>MEDICATION</th>
                   <th>DOSAGE</th>
                   <th style={{ textAlign: 'right' }}>STATUS</th>
                 </tr>
               </thead>
               <tbody>
                 {prescriptions.length === 0 ? (
                   <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>EMPTY REGISTRY</td></tr>
                 ) : prescriptions.map((p, i) => (
                   <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                     <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.name.toUpperCase()}</td>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{p.dosage}</td>
                     <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: '#d1fae5', color: '#059669' }}>{p.status}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>

        {/* CONSULTATION REQUEST STATUS */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.2rem 2rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>CONSULTATION REQUEST STATUS</h3>
             <Calendar size={18} color="#10b981" />
          </div>
          <div className="table-responsive">
            <table className="data-table-premium" style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr>
                   <th style={{ width: '80px' }}>S.NO</th>
                   <th>CONSULTATION</th>
                   <th>SCHEDULE</th>
                   <th style={{ textAlign: 'right' }}>STATUS</th>
                 </tr>
               </thead>
               <tbody>
                 {appointments.length === 0 ? (
                   <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NO ACTIVE REQUESTS</td></tr>
                 ) : appointments.map((a, i) => (
                   <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                     <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{a.reason?.toUpperCase()}</td>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{new Date(a.scheduled_at).toLocaleDateString()}</td>
                     <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: a.status === 'scheduled' ? '#d1fae5' : '#f1f5f9', color: a.status === 'scheduled' ? '#059669' : 'var(--text-secondary)' }}>{a.status.toUpperCase()}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>

        {/* ELECTRONIC HEALTH RECORDS (EHR) */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.2rem 2rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>ELECTRONIC HEALTH RECORDS</h3>
             <Database size={18} color="#3b82f6" />
          </div>
          <div className="table-responsive">
            <table className="data-table-premium" style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr>
                   <th style={{ width: '80px' }}>S.NO</th>
                   <th>DIAGNOSTIC REPORT</th>
                   <th>DATE</th>
                   <th style={{ textAlign: 'right' }}>ACTION</th>
                 </tr>
               </thead>
               <tbody>
                 {testResults.length === 0 ? (
                   <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NO EHR DATA FOUND</td></tr>
                 ) : testResults.map((t, i) => (
                   <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                     <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{t.test_name.toUpperCase()}</td>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                     <td style={{ textAlign: 'right' }}>
                        {t.status === 'pending' ? <Clock size={16} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} /> : (
                          <button onClick={() => {
                             const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');
                             window.open(`${backendBase}/${t.file_path}`, '_blank');
                           }} className="btn-outline-premium" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>PDF</button>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>

        {/* PRESCRIPTION INVENTORY */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.2rem 2rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>PRESCRIPTION INVENTORY</h3>
             <Package size={18} color="#f59e0b" />
          </div>
          <div className="table-responsive">
            <table className="data-table-premium" style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr>
                   <th style={{ width: '80px' }}>S.NO</th>
                   <th>STOCK ITEM</th>
                   <th>REMAINING</th>
                   <th style={{ textAlign: 'right' }}>REFILL</th>
                 </tr>
               </thead>
               <tbody>
                 {prescriptions.length === 0 ? (
                   <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>EMPTY INVENTORY</td></tr>
                 ) : prescriptions.map((p, i) => (
                   <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                     <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.name.toUpperCase()}</td>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>7 DAYS LEFT</td>
                     <td style={{ textAlign: 'right' }}>
                        <button className="btn-outline-premium" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>REQUEST</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 0; }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </DashboardLayout>
  );
}
