"use client";
import { useState, useEffect } from "react";
import { Video, Mic, MessageSquare, Plus, FileText, Activity, Pill, FlaskConical, Send, X, ShieldCheck, Heart, User } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorConsultationsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("NOTES");

  const [currentPatient, setCurrentPatient] = useState<any>({
    name: "NO ACTIVE SESSION",
    id: "N/A",
    age: 0,
    vitals: { hr: "-- BPM", bp: "--/--", temp: "-- F" },
    history: []
  });

  useEffect(() => {
    // Session initialization logic here
    setCurrentPatient({
      name: "NO ACTIVE SESSION",
      id: "N/A",
      age: 0,
      vitals: { hr: "-- BPM", bp: "--/--", temp: "-- F" },
      history: []
    });
  }, []);

  return (
    <DashboardLayout role="doctor" userName="Dr. Sarah Smith">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Consultation Terminal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>
            STATION ID: <span style={{ color: 'var(--color-accent)', fontWeight: 800 }}>MED-ALPHA-09</span> • ACTIVE SESSION: {currentPatient.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-outline-premium" 
            onClick={() => showToast("Reviewing History...", "info")}
          >
             <FileText size={18} /> <span>FULL EHR</span>
          </button>
          <button className="btn-primary-premium" style={{ background: '#ef4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} onClick={() => showToast("Session Terminated.", "success")}>
             TERMINATE SESSION
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', minHeight: '800px' }} className="grid-split">
        {/* Main Consultation Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Video Feed Placeholder */}
          <div className="card-premium" style={{ height: '450px', background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', padding: '0', overflow: 'hidden' }}>
             <div style={{ textAlign: 'center' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', backdropFilter: 'blur(5px)' }}>
                   <User size={64} style={{ opacity: 0.8 }} />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '1px' }}>{currentPatient.name}</h2>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.7, marginTop: '8px' }}>ENCRYPTED FEED ACTIVE</p>
             </div>
             
             <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.2)', padding: '15px 30px', borderRadius: '50px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button style={{ background: '#fff', border: 'none', color: 'var(--bg-side)', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform='scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}><Video size={20} /></button>
                <button style={{ background: '#fff', border: 'none', color: 'var(--bg-side)', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform='scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}><Mic size={20} /></button>
                <button style={{ background: '#fff', border: 'none', color: 'var(--bg-side)', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform='scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}><MessageSquare size={20} /></button>
                <button style={{ background: '#ef4444', border: 'none', color: '#fff', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform='scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}><X size={20} /></button>
             </div>
          </div>

          {/* Clinical Workstation (Tabs) */}
          <div className="card-premium" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
             <div style={{ display: 'flex', gap: '8px', padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['NOTES', 'PRESCRIPTION', 'LAB ORDERS'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ 
                      padding: '10px 20px', 
                      background: activeTab === tab ? '#fff' : 'transparent', 
                      color: activeTab === tab ? 'var(--bg-side)' : 'var(--text-secondary)', 
                      border: 'none', 
                      fontWeight: 800, 
                      fontSize: '0.8rem', 
                      cursor: 'pointer',
                      borderRadius: '30px',
                      boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab}
                  </button>
                ))}
             </div>
             <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {activeTab === 'NOTES' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <textarea 
                      placeholder="ENTER CLINICAL OBSERVATIONS AND DIAGNOSIS..." 
                      style={{ width: '100%', height: '200px', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '1rem', outline: 'none', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.6', background: '#f8fafc' }}
                    ></textarea>
                    <button className="btn-primary-premium" style={{ width: '100%', justifyContent: 'center', height: '50px' }} onClick={() => showToast("Clinical Notes Archived Successfully", "success")}>
                      SAVE SESSION NOTES
                    </button>
                  </div>
                )}
                {activeTab === 'PRESCRIPTION' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     <div style={{ display: 'flex', gap: '1rem' }}>
                        <input type="text" placeholder="MEDICINE NAME" style={{ flex: 2, padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.85rem' }} />
                        <input type="text" placeholder="DOSAGE" style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.85rem' }} />
                        <button className="btn-primary-premium" style={{ padding: '0 20px', borderRadius: '12px' }} onClick={() => showToast("Prescription Added", "success")}><Plus size={20} /></button>
                     </div>
                     <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NO ACTIVE PRESCRIPTIONS ADDED TO CURRENT SESSION.</p>
                     </div>
                     <button className="btn-outline-premium" style={{ width: '100%', justifyContent: 'center' }} onClick={() => showToast("Final Prescription Generated & Sent to Pharmacy", "success")}>
                        GENERATE FINAL RX
                     </button>
                  </div>
                )}
                {activeTab === 'LAB ORDERS' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                     {['BLOOD TEST', 'MRI SCAN', 'X-RAY', 'URINALYSIS', 'ECG', 'BIOPSY', 'COVID-19', 'LIVER PANEL'].map(lab => (
                       <button key={lab} className="btn-outline-premium" style={{ fontSize: '0.75rem', justifyContent: 'center', padding: '16px 12px' }} onClick={() => showToast(`${lab} Ordered`, "info")}>
                          {lab}
                       </button>
                     ))}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Clinical Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card-premium">
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <Activity size={20} color="var(--color-accent)" />
                <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>LIVE VITALS</h3>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>HEART RATE</span>
                   <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{currentPatient.vitals.hr}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>BLOOD PRESSURE</span>
                   <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{currentPatient.vitals.bp}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>BODY TEMP</span>
                   <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{currentPatient.vitals.temp}</span>
                </div>
             </div>
          </div>

          <div className="card-premium" style={{ background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', border: 'none' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <ShieldCheck size={20} />
                <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px' }}>CLINICAL HISTORY</h3>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                {currentPatient.history.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 700 }}>NO PAST RECORDS</p>
                ) : (
                  currentPatient.history.map((h: any, i: number) => (
                    <div key={i} style={{ padding: '12px 16px', borderLeft: '3px solid #a7f3d0', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                       <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{h}</p>
                       <p style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 600, marginTop: '4px' }}>STATION: MED-ALPHA</p>
                    </div>
                  ))
                )}
             </div>
          </div>

          <button className="btn-primary-premium" style={{ width: '100%', justifyContent: 'center', height: '54px' }} onClick={() => showToast("Accessing File System...", "info")}>
             ATTACH CLINICAL FILE
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
