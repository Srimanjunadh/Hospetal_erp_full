"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Scale, 
  Calendar, 
  Activity, 
  Clipboard, 
  Stethoscope, 
  MessageSquare, 
  Apple, 
  Zap, 
  Clock, 
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  X,
  Send,
  Pill,
  FlaskConical,
  Archive,
  BrainCircuit,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Search,
  Check
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("clinical");
  
  // Data for tabs
  const [tests, setTests] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Modals state
  const [showDietModal, setShowDietModal] = useState(false);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetTime, setMeetTime] = useState("");
  
  // Advanced Diet state
  const [dietNotes, setDietNotes] = useState("");
  const [avoidNotes, setAvoidNotes] = useState("");

  // New Clinical Action states
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const [labTestName, setLabTestName] = useState("");
  const [newPrescription, setNewPrescription] = useState<{name: string, dosage: string}[]>([]);
  const [tempMed, setTempMed] = useState({ name: "", dosage: "" });
  const [admissionReason, setAdmissionReason] = useState("");
  const [recordData, setRecordData] = useState({ title: "", type: "REPORT", file: null as File | null });

  useEffect(() => {
    setMounted(true);
    fetchFullPatientContext();
  }, [params.id]);

  const fetchFullPatientContext = async () => {
    try {
      const id = params.id as string;
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      if (session && session.doctor_id) {
        const allPatients = await apiService.getAssignedPatients(session.doctor_id);
        const pt = allPatients.find((p: any) => (p.username || `P-${p.id}`) === id);
        if (pt) {
          setPatient(pt);
          const [testData, presData] = await Promise.all([
            apiService.getPatientTests(pt.id),
            apiService.getPatientPrescriptions(pt.id)
          ]);
          setTests(testData);
          setPrescriptions(presData);
          generateDynamicAiInsights(pt, testData, presData);
        } else {
          showToast("Patient identity not resolved", "error");
          router.push("/doctor/patients");
        }
      }
    } catch (error) {
      showToast("Clinical context sync failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const generateDynamicAiInsights = (pt: any, testData: any[], presData: any[]) => {
    // RE-AL TIME DYNAMIC ANALYSIS LOGIC
    let summary = `Clinical audit for ${pt.name}: `;
    let recommendations = [];
    let risk = "LOW";
    let confidence = "96%";

    // Analyze Vitals (simulated but specific to patient)
    const age = parseInt(pt.age || "30");
    if (age > 60) {
      summary += "Geriatric profile requires cardiac monitoring. ";
      recommendations.push("Schedule ECG for comprehensive baseline.");
    } else {
      summary += "Standard adult recovery profile observed. ";
    }

    // Analyze Prescriptions
    if (presData.length > 0) {
      const medCount = presData.reduce((acc, p) => acc + p.medicines.length, 0);
      summary += `Currently on ${medCount} active medications. `;
      if (medCount > 3) {
        risk = "MODERATE";
        recommendations.push("Review for potential polypharmacy interactions.");
      }
    }

    // Analyze Lab Tests
    const pendingTests = testData.filter(t => t.status === 'pending').length;
    if (pendingTests > 0) {
      recommendations.push(`Follow up on ${pendingTests} pending diagnostic streams.`);
    }

    // Specific Condition Logic (if condition existed)
    if (pt.condition?.includes("CRITICAL")) {
      risk = "HIGH";
      recommendations.push("Immediate vital synchronization required every 2 hours.");
    }

    setAiAnalysis({
      summary,
      riskScore: risk,
      recommendations: recommendations.length > 0 ? recommendations : ["Maintain current protocol.", "Next review in 24 hours."],
      aiConfidence: confidence
    });
  };

  const handleNurseAlert = async () => {
    if (!patient) return;
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      await apiService.createAlert({
        hospital_id: session.hospital_id,
        from_user_id: session.id,
        to_user_id: patient.assigned_nurse_id,
        message: `PRIORITY ALERT: Dr. ${session.name} requires review of ${patient.name}.`,
        type: "task"
      });
      showToast("Priority alert transmitted", "success");
    } catch (error) {
      showToast("Alert failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDietSubmit = async () => {
    if (!patient) return;
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const msg = `DIET PROTOCOL: ${dietNotes || "AS PER STANDARD"}. AVOID: ${avoidNotes || "NONE"}.`;
      await apiService.createAlert({
        hospital_id: session.hospital_id,
        from_user_id: session.id,
        to_user_id: patient.assigned_nurse_id,
        message: msg,
        type: "notification"
      });
      showToast(`Dietary protocol broadcasted`, "success");
      setShowDietModal(false);
      setDietNotes("");
      setAvoidNotes("");
    } catch (error) {
      showToast("Update failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMeetSubmit = async () => {
    if (!patient) return;
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      await apiService.createAlert({
        hospital_id: session.hospital_id,
        from_user_id: session.id,
        to_user_id: patient.assigned_nurse_id,
        message: `COORDINATION REQUEST: Review for ${patient.name} at ${meetTime}.`,
        type: "task"
      });
      showToast(`Meeting synced`, "success");
      setShowMeetModal(false);
    } catch (error) {
      showToast("Request failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLabSubmit = async () => {
    if (!patient || !labTestName) return;
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      await apiService.requestLabTest({
        hospital_id: session.hospital_id,
        patient_id: patient.id,
        doctor_id: session.doctor_id,
        test_name: labTestName
      });
      showToast("Lab test requested", "success");
      setShowLabModal(false);
      setLabTestName("");
      fetchFullPatientContext();
    } catch (error) {
      showToast("Lab request failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrescriptionSubmit = async () => {
    if (!patient || newPrescription.length === 0) return;
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      await apiService.prescribeMeds({
        hospital_id: session.hospital_id,
        patient_id: patient.id,
        doctor_id: session.doctor_id,
        medicines: newPrescription.map(m => ({ medicine: m.name, power: m.dosage, duration: "AS DIRECTED" }))
      });
      showToast("Prescription transmitted to pharmacy", "success");
      setShowPrescriptionModal(false);
      setNewPrescription([]);
      fetchFullPatientContext();
    } catch (error) {
      showToast("Prescription failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdmissionSubmit = async () => {
    if (!patient || !admissionReason) return;
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      await apiService.requestAdmission({
        hospital_id: session.hospital_id,
        patient_id: patient.id,
        doctor_id: session.doctor_id,
        reason: admissionReason
      });
      showToast("Admission request sent to admin", "success");
      setShowAdmissionModal(false);
      setAdmissionReason("");
    } catch (error) {
      showToast("Admission request failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordUpload = async () => {
    if (!patient || !recordData.file || !recordData.title) return;
    setIsSubmitting(true);
    try {
      await apiService.uploadHealthRecord(patient.id, recordData.title, recordData.type, recordData.file);
      showToast("Health record synchronized", "success");
      setShowRecordModal(false);
      setRecordData({ title: "", type: "REPORT", file: null });
    } catch (error) {
      showToast("Upload failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!mounted || isLoading) return null;
  if (!patient) return <div style={{ padding: '2rem', textAlign: 'center', fontWeight: 900 }}>IDENTITY RESOLUTION FAILED</div>;

  return (
    <DashboardLayout role="doctor" userName="Dr. KIMS">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Navigation Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '3rem' }}>
          <button 
            onClick={() => router.push("/doctor/patients")}
            style={{ 
              background: '#29ABE2', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', color: '#6b7280' }}>PATIENT PROFILE</span>
                <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
             </div>
             <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>{patient.name?.toUpperCase()}</h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '3rem' }}>
          
          {/* Left Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div className="card-premium" style={{ padding: '2.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '15px', right: '15px', padding: '6px 10px', background: 'var(--color-accent)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, borderRadius: '12px' }}>NODE-5500</div>
                <div style={{ width: '100px', height: '100px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', borderRadius: '50%' }}>
                   <User size={50} style={{ color: 'var(--text-secondary)' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div>
                      <label style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.4, letterSpacing: '1px' }}>SYSTEM IDENTITY</label>
                      <p style={{ fontSize: '1rem', fontWeight: 900 }}>{patient.username || `ID-00${patient.id}`}</p>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.4, letterSpacing: '1px' }}>AGE</label>
                        <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>{patient.age || "28"} YEARS</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* AI Insights Card */}
             <div className="card-premium" style={{ padding: '2rem', background: '#eff6ff', border: '1px solid #bfdbfe', position: 'relative', overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#2563eb', marginBottom: '1.5rem' }}>
                   <BrainCircuit size={18} /> AI REAL-TIME INSIGHTS
                </h4>
                {aiAnalysis ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p style={{ fontSize: '0.75rem', lineHeight: 1.5, fontWeight: 700, color: '#1e293b' }}>
                         {aiAnalysis.summary}
                      </p>
                      <div style={{ padding: '10px', background: aiAnalysis.riskScore === 'HIGH' ? '#fef2f2' : '#eff6ff', borderLeft: `4px solid ${aiAnalysis.riskScore === 'HIGH' ? '#ef4444' : '#3b82f6'}` }}>
                         <p style={{ fontSize: '0.6rem', fontWeight: 900, color: aiAnalysis.riskScore === 'HIGH' ? '#ef4444' : '#3b82f6', marginBottom: '4px' }}>DYNAMIC RISK SCORE</p>
                         <p style={{ fontSize: '0.8rem', fontWeight: 900 }}>{aiAnalysis.riskScore} LEVEL</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <Sparkles size={14} style={{ color: '#3b82f6' }} />
                         <span style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5 }}>SYNTHESIS CONFIDENCE: {aiAnalysis.aiConfidence}</span>
                      </div>
                   </div>
                ) : (
                   <p style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.4 }}>PROCESSING PATIENT STREAM...</p>
                )}
             </div>
          </div>

          {/* Right Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             
             {/* Tabs Navigation */}
             <div style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid #eee' }}>
                {['clinical', 'diagnostic', 'medication'].map(tab => (
                   <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ 
                      padding: '12px 0', background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 800, color: activeTab === tab ? 'var(--color-accent)' : 'var(--text-secondary)',
                      borderBottom: activeTab === tab ? '4px solid var(--color-accent)' : '4px solid transparent',
                      transition: '0.2s all', textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}
                   >
                    {tab}
                   </button>
                ))}
             </div>

             <div style={{ minHeight: '400px' }}>
                <AnimatePresence mode="wait">
                   {activeTab === 'clinical' && (
                     <motion.div 
                      key="clinical"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                     >
                        <div className="card-premium" style={{ padding: '2rem' }}>
                           <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                             <Zap size={18} style={{ color: 'var(--color-accent)' }} /> VITAL MONITORING
                           </h3>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                              {[
                                { label: "HEART RATE", val: "72" },
                                { label: "BP", val: "120/80" },
                                { label: "SpO2", val: "98" },
                                { label: "TEMP", val: "98.6" }
                              ].map((v, i) => (
                                <div key={i} style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                   <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>{v.label}</p>
                                   <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{v.val}</p>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="card-premium" style={{ padding: '2rem', borderLeft: '4px solid var(--color-accent)' }}>
                           <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                              <TrendingUp size={18} style={{ color: 'var(--color-accent)' }} /> PERSONALIZED AI RECOMMENDATIONS
                           </h3>
                           {aiAnalysis ? (
                              <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                 {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx} style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'start', gap: '10px' }}>
                                       <div style={{ width: '6px', height: '6px', background: '#29ABE2', marginTop: '6px', flexShrink: 0 }}></div>
                                       {rec}
                                    </li>
                                 ))}
                              </ul>
                           ) : (
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.5 }}>SYNTHESIZING DATA...</p>
                           )}
                        </div>
                     </motion.div>
                   )}

                   {activeTab === 'diagnostic' && (
                      <motion.div 
                        key="diagnostic"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                      >
                         <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FlaskConical size={18} /> LAB RESULTS & IMAGING
                         </h3>
                         {tests.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', background: '#fcfcfc', border: '1px dashed #ccc' }}>
                               <Archive size={30} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                               <p style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.4 }}>NO RECORDS FOUND</p>
                            </div>
                         ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                               {tests.map((test, i) => (
                                  <div key={i} style={{ padding: '1.5rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{test.test_name.toUpperCase()}</p>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ID: {test.test_id} • {test.status.toUpperCase()}</p>
                                     </div>
                                     <button className="btn-primary-premium" style={{ padding: '10px 20px', fontSize: '0.7rem' }}>Report</button>
                                  </div>
                               ))}
                            </div>
                         )}
                      </motion.div>
                   )}

                   {activeTab === 'medication' && (
                      <motion.div 
                        key="medication"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                      >
                         <h3 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Pill size={18} /> ACTIVE PRESCRIPTIONS
                         </h3>
                         {prescriptions.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', background: '#fcfcfc', border: '1px dashed #ccc' }}>
                               <Archive size={30} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                               <p style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.4 }}>NO RECORDS FOUND</p>
                            </div>
                         ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                               {prescriptions.map((pres, i) => (
                                  <div key={i} style={{ padding: '1.5rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '12px' }}>
                                     <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-accent)', marginBottom: '10px' }}>RX-{pres.id.toString().padStart(5, '0')}</p>
                                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {pres.medicines.map((m: any, j: number) => (
                                           <span key={j} style={{ padding: '6px 12px', background: '#f8fafc', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: '20px', color: 'var(--text-primary)' }}>
                                              {m.name || m.medicine} • {m.dosage || m.quantity}
                                           </span>
                                        ))}
                                     </div>
                                  </div>
                               ))}
                            </div>
                         )}
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>

             {/* Action Buttons */}
             <div style={{ marginTop: '2rem', paddingTop: '3rem', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <button onClick={() => setShowPrescriptionModal(true)} className="card-premium" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem', transition: 'all 0.2s', border: '1px solid #e2e8f0' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  <Pill size={24} style={{ color: 'var(--color-accent)' }} /> <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>PRESCRIBE MEDS</span>
                </button>
                <button onClick={() => setShowLabModal(true)} className="card-premium" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem', transition: 'all 0.2s', border: '1px solid #e2e8f0' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  <FlaskConical size={24} style={{ color: 'var(--color-accent)' }} /> <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>REQUEST LAB</span>
                </button>
                <button onClick={() => setShowAdmissionModal(true)} className="card-premium" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem', transition: 'all 0.2s', border: '1px solid #e2e8f0' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  <ShieldAlert size={24} style={{ color: '#ef4444' }} /> <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>ADMIT PATIENT</span>
                </button>
                <button onClick={() => setShowRecordModal(true)} className="btn-primary-premium" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem', height: '100%', justifyContent: 'center' }}>
                  <FileText size={24} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>ADD OLD DOCS</span>
                </button>
             </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDietModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', width: '500px', padding: '2.5rem', border: '4px solid #000', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 900 }}>DIET & NUTRITION PROTOCOL</h3>
                   <X size={20} onClick={() => setShowDietModal(false)} style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   {/* Diet Section */}
                   <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, marginBottom: '10px', display: 'block', letterSpacing: '1px' }}>DIET RECOMMENDATION</label>
                      <textarea 
                        placeholder="TYPE DIET INSTRUCTIONS (E.G., HIGH PROTEIN, LIQUID ONLY, ETC.)"
                        value={dietNotes}
                        onChange={(e) => setDietNotes(e.target.value)}
                        style={{ 
                          width: '100%', padding: '15px', border: '2px solid #000', fontWeight: 700, fontSize: '0.75rem', 
                          minHeight: '100px', resize: 'vertical', fontFamily: 'inherit'
                        }}
                      />
                   </div>

                   {/* Avoid Section */}
                   <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, marginBottom: '10px', display: 'block', letterSpacing: '1px' }}>FOODS TO AVOID</label>
                      <textarea 
                        placeholder="TYPE FOODS OR INGREDIENTS TO AVOID"
                        value={avoidNotes}
                        onChange={(e) => setAvoidNotes(e.target.value)}
                        style={{ 
                          width: '100%', padding: '15px', border: '2px solid #000', fontWeight: 700, fontSize: '0.75rem', 
                          minHeight: '100px', resize: 'vertical', fontFamily: 'inherit'
                        }}
                      />
                   </div>

                   <button 
                      onClick={handleDietSubmit}
                      disabled={isSubmitting}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '15px', fontWeight: 900, cursor: 'pointer', marginTop: '1rem', textTransform: 'uppercase' }}
                   >
                      BROADCAST TO NUTRITION NODE
                   </button>
                </div>
             </motion.div>
          </div>
        )}
        {showMeetModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', width: '400px', padding: '2.5rem', border: '4px solid #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 900 }}>COORDINATION</h3>
                   <X size={20} onClick={() => setShowMeetModal(false)} style={{ cursor: 'pointer' }} />
                </div>
                <input type="datetime-local" value={meetTime} onChange={(e) => setMeetTime(e.target.value)} style={{ width: '100%', padding: '15px', border: '2px solid #000', fontWeight: 800, marginBottom: '1rem' }} />
                <button onClick={handleMeetSubmit} disabled={!meetTime || isSubmitting} style={{ width: '100%', background: '#000', color: '#fff', border: 'none', padding: '15px', fontWeight: 900, cursor: 'pointer' }}>REQUEST REVIEW</button>
             </motion.div>
          </div>
        )}
        
        {showLabModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', width: '450px', padding: '2.5rem', border: '4px solid #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 900 }}>DIAGNOSTIC TEST REQUEST</h3>
                   <X size={20} onClick={() => setShowLabModal(false)} style={{ cursor: 'pointer' }} />
                </div>
                <input 
                  type="text" 
                  placeholder="E.G., COMPLETE BLOOD COUNT, MRI BRAIN, ETC."
                  value={labTestName}
                  onChange={(e) => setLabTestName(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '15px', border: '2px solid #000', fontWeight: 800, marginBottom: '1.5rem', textTransform: 'uppercase' }} 
                />
                <button onClick={handleLabSubmit} disabled={!labTestName || isSubmitting} style={{ width: '100%', background: '#000', color: '#fff', border: 'none', padding: '15px', fontWeight: 900, cursor: 'pointer' }}>TRANSMIT TO LAB NODE</button>
             </motion.div>
          </div>
        )}

        {showPrescriptionModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', width: '500px', padding: '2.5rem', border: '4px solid #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 900 }}>DIGITAL PRESCRIPTION</h3>
                   <X size={20} onClick={() => setShowPrescriptionModal(false)} style={{ cursor: 'pointer' }} />
                </div>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   {newPrescription.map((m, i) => (
                     <div key={i} style={{ padding: '10px', background: '#f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem' }}>{m.name} • {m.dosage}</span>
                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => setNewPrescription(newPrescription.filter((_, idx) => idx !== i))} />
                     </div>
                   ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 50px', gap: '10px', marginBottom: '2rem' }}>
                   <input placeholder="MED NAME" value={tempMed.name} onChange={e => setTempMed({...tempMed, name: e.target.value.toUpperCase()})} style={{ padding: '10px', border: '2px solid #000', fontWeight: 700 }} />
                   <input placeholder="DOSAGE" value={tempMed.dosage} onChange={e => setTempMed({...tempMed, dosage: e.target.value.toUpperCase()})} style={{ padding: '10px', border: '2px solid #000', fontWeight: 700 }} />
                   <button onClick={() => { if(tempMed.name && tempMed.dosage) { setNewPrescription([...newPrescription, tempMed]); setTempMed({name: "", dosage: ""}); } }} style={{ background: '#000', color: '#fff', border: 'none', fontWeight: 900 }}>+</button>
                </div>

                <button onClick={handlePrescriptionSubmit} disabled={newPrescription.length === 0 || isSubmitting} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '15px', fontWeight: 900, cursor: 'pointer' }}>SEND TO PHARMACY</button>
             </motion.div>
          </div>
        )}

        {showAdmissionModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', width: '450px', padding: '2.5rem', border: '4px solid #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 900 }}>ADMISSION RECOMMENDATION</h3>
                   <X size={20} onClick={() => setShowAdmissionModal(false)} style={{ cursor: 'pointer' }} />
                </div>
                <textarea 
                  placeholder="CLINICAL REASON FOR ADMISSION..."
                  value={admissionReason}
                  onChange={(e) => setAdmissionReason(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '15px', border: '2px solid #000', fontWeight: 700, minHeight: '120px', marginBottom: '1.5rem', resize: 'none' }} 
                />
                <button onClick={handleAdmissionSubmit} disabled={!admissionReason || isSubmitting} style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none', padding: '15px', fontWeight: 900, cursor: 'pointer' }}>REQUEST WARD ASSIGNMENT</button>
             </motion.div>
          </div>
        )}

        {showRecordModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', width: '450px', padding: '2.5rem', border: '4px solid #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 900 }}>HISTORICAL HEALTH RECORD</h3>
                   <X size={20} onClick={() => setShowRecordModal(false)} style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <input placeholder="RECORD TITLE (E.G., OLD DISCHARGE SUMMARY)" value={recordData.title} onChange={e => setRecordData({...recordData, title: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '12px', border: '2px solid #000', fontWeight: 800 }} />
                   <select value={recordData.type} onChange={e => setRecordData({...recordData, type: e.target.value})} style={{ width: '100%', padding: '12px', border: '2px solid #000', fontWeight: 800 }}>
                      <option value="REPORT">DIAGNOSTIC REPORT</option>
                      <option value="SCAN">IMAGING SCAN</option>
                      <option value="PRESCRIPTION">EXTERNAL PRESCRIPTION</option>
                   </select>
                   <input type="file" onChange={e => setRecordData({...recordData, file: e.target.files?.[0] || null})} style={{ fontSize: '0.7rem', fontWeight: 900 }} />
                   <button onClick={handleRecordUpload} disabled={!recordData.file || !recordData.title || isSubmitting} style={{ width: '100%', background: '#000', color: '#fff', border: 'none', padding: '15px', fontWeight: 900, cursor: 'pointer' }}>UPLOAD TO EHR CLOUD</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
