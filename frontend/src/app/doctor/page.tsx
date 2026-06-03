"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Users,
  Clock,
  MessageSquare,
  Plus,
  ArrowRight,
  AlertCircle,
  FileText,
  TrendingUp,
  Heart,
  Zap,
  Globe,
  Cpu,
  FlaskConical,
  Bell,
  Search,
  CheckCircle,
  Eye,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

export default function DoctorDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [sessionUser, setSessionUser] = useState("Dr. Sarah Smith");
  const [stationId, setStationId] = useState("MED-ALPHA-09");
  const [highRiskPatients, setHighRiskPatients] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState<any>(null);
  const { showToast } = useToast();

  const fetchDoctorData = async (doctorId: number) => {
    if (!doctorId) return;
    try {
      const { apiService } = await import("@/services/api");

      // Fetch Patients
      const patients = await apiService.getAssignedPatients(doctorId);
      setHighRiskPatients(
        patients.map((p: any) => ({
          name: p.name.toUpperCase(),
          status: "STABLE",
          vitals: "72 BPM",
          condition: "ROUTINE CHECKUP",
          id: p.username,
          dbId: p.id,
        })),
      );

      // Fetch Appointments
      const allAppts = await apiService.getDoctorAppointments(doctorId);
      setPendingAppointments(
        allAppts.filter((a: any) => a.status === "admin_approved"),
      );
      setQueue(
        allAppts
          .filter((a: any) => a.status === "scheduled")
          .map((a: any) => ({
            name: a.patient.name.toUpperCase(),
            id: a.patient.username,
            type: a.type.toUpperCase(),
            time: a.scheduled_at
              ? new Date(a.scheduled_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "TBD",
            status: "CONFIRMED",
          })),
      );
    } catch (e) {
      console.error("Clinical sync failed:", e);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const { apiService } = await import("@/services/api");
      const appt = pendingAppointments.find((a) => a.id === id);
      await apiService.updateAppointment(id, {
        status: "scheduled",
        scheduled_at: new Date().toISOString(), // Or take from a picker
      });
      const session = JSON.parse(
        localStorage.getItem("medclues_session") || "null",
      );
      if (session?.doctor_id) {
        fetchDoctorData(session.doctor_id);
      }
    } catch (e) {
      console.error("Approval failed:", e);
    }
  };

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Clinical Status");
  const [prescription, setPrescription] = useState({
    medicine: "",
    power: "",
    amount: "",
  });
  const [testName, setTestName] = useState("");
  const [queuedTests, setQueuedTests] = useState<string[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [prescribedMedsList, setPrescribedMedsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInventory = async (hospitalId: number) => {
    try {
      const { apiService } = await import("@/services/api");
      const data = await apiService.getHospitalInventory(hospitalId);
      // Mock if empty for demo
      const items =
        data.length > 0
          ? data
          : [
              {
                name: "PARACETAMOL",
                quantity: 500,
                unit_price: 10,
                power: "500MG",
              },
              {
                name: "AMOXICILLIN",
                quantity: 0,
                unit_price: 25,
                power: "250MG",
              },
              {
                name: "IBUPROFEN",
                quantity: 150,
                unit_price: 15,
                power: "400MG",
              },
              {
                name: "METFORMIN",
                quantity: 300,
                unit_price: 20,
                power: "500MG",
              },
              { name: "LIPITOR", quantity: 0, unit_price: 45, power: "10MG" },
            ];
      setInventory(items);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestRequest = async () => {
    if (queuedTests.length === 0) return;
    try {
      const { apiService } = await import("@/services/api");
      const session = JSON.parse(
        localStorage.getItem("medclues_session") || "null",
      );
      await apiService.requestLabTest({
        patient_id: selectedPatient.dbId,
        doctor_id: session.doctor_id,
        hospital_id: session.hospital_id,
        test_name: queuedTests.join(", "),
      });
      showToast(
        `${queuedTests.length} Diagnostic Requests Transmitted`,
        "success",
      );
      setQueuedTests([]);
      setTestName("");
    } catch (e) {
      showToast("Transmission Error", "error");
    }
  };

  const handleAddTest = () => {
    if (testName && !queuedTests.includes(testName)) {
      setQueuedTests([...queuedTests, testName]);
      setTestName("");
    }
  };

  const handleAddMed = () => {
    if (prescription.medicine && prescription.amount) {
      setPrescribedMedsList([...prescribedMedsList, { ...prescription }]);
      setPrescription({ medicine: "", power: "", amount: "" });
    }
  };

  const handleFinalPrescribe = async () => {
    try {
      const { apiService } = await import("@/services/api");
      const session = JSON.parse(
        localStorage.getItem("medclues_session") || "null",
      );
      await apiService.prescribeMeds({
        patient_id: selectedPatient.dbId,
        doctor_id: session.doctor_id,
        hospital_id: session.hospital_id,
        medicines: prescribedMedsList,
      });
      showToast(
        `${prescribedMedsList.length} Medications Transmitted`,
        "success",
      );
      setPrescribedMedsList([]);
      setSelectedPatient(null);
    } catch (e) {
      showToast("Transmission Error", "error");
    }
  };

  const handleAdmit = async () => {
    try {
      const { apiService } = await import("@/services/api");
      const session = JSON.parse(
        localStorage.getItem("medclues_session") || "null",
      );
      await apiService.requestAdmission({
        patient_id: selectedPatient.dbId,
        doctor_id: session.doctor_id,
        hospital_id: session.hospital_id,
        reason: "DOCTOR INITIATED ADMISSION",
      });
      showToast("Admission Protocol Initiated", "success");
    } catch (e) {
      showToast("Admission Failure", "error");
    }
  };

  useEffect(() => {
    const fetchRisk = async () => {
      if (selectedPatient?.dbId) {
        try {
          const { apiService } = await import("@/services/api");
          const score = await apiService.getPatientRiskScore(
            selectedPatient.dbId,
          );
          setRiskScore(score);
        } catch (e) {
          console.error("Risk sync failed:", e);
          setRiskScore(null);
        }
      }
    };
    fetchRisk();
  }, [selectedPatient]);

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session && session.role === "doctor") {
      setSessionUser(session.name);
      if (session.doctor_id) fetchDoctorData(session.doctor_id);
      if (session.hospital_id) fetchInventory(session.hospital_id);
    }

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) +
          " • " +
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  if (!mounted) return null;

  return (
    <DashboardLayout role="doctor" userName={sessionUser}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            Clinical Command Center
          </h1>
          <p style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.9rem", marginTop: '4px' }}>
            STATION ID: <span style={{ color: "var(--color-accent)", fontWeight: 800 }}>{stationId}</span> • {currentDateTime.toUpperCase()}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              background: '#fff',
              color: 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <FileText size={18} /> <span>REPORTS</span>
          </button>
          <button 
            className="btn-primary-premium"
          >
            <Plus size={18} /> <span>NEW ENCOUNTER</span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: "2rem",
        }}
      >
        {/* Patient Roster */}
        <div
          className="card-premium"
          style={{
            padding: "0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1.25rem 2rem",
              borderBottom: "1px solid #f1f5f9",
              background: "#fff",
            }}
          >
            <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>
              Assigned Patients
            </h3>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                background: "rgba(14, 168, 155, 0.1)",
                color: "var(--color-accent)",
                padding: "6px 12px",
                borderRadius: "20px",
              }}
            >
              {highRiskPatients.length} ACTIVE
            </span>
          </div>

          <div style={{ width: "100%", overflowX: "auto", height: "700px", overflowY: "auto" }} className="custom-scrollbar">
            <table className="data-table-premium" style={{ minWidth: "100%" }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
                  <th style={{ width: "80px" }}>S.NO</th>
                  <th style={{ minWidth: "250px" }}>IDENTITY</th>
                  <th style={{ width: "180px" }}>CONDITION</th>
                  <th style={{ width: "200px" }}>VITALS TREND</th>
                  <th style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {highRiskPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                      NO CLINICAL SESSIONS ACTIVE
                    </td>
                  </tr>
                ) : (
                  highRiskPatients.map((patient, i) => (
                    <tr 
                      key={i} 
                      style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.transform = 'scale(1.005)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <td style={{ fontWeight: 700, color: "var(--text-secondary)", opacity: 0.6 }}>{(i + 1).toString().padStart(2, "0")}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              background: "linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)",
                              color: "#fff",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1rem",
                              fontWeight: 800,
                              boxShadow: "0 4px 10px rgba(14, 168, 155, 0.2)"
                            }}
                          >
                            <Eye size={18} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                              PATIENT #{i + 1}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                              Click for details
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px' }}>{patient.condition}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>{patient.vitals}</span>
                            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#10b981" }}>+2.4% STABLE</span>
                          </div>
                          {/* Mini Sparkline Graph */}
                          <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.8 }}>
                            <path d="M0 20C5 20 8 5 15 5C22 5 25 18 30 18C35 18 40 8 45 8C50 8 55 15 60 15" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <defs>
                              <linearGradient id="paint0_linear" x1="0" y1="20" x2="60" y2="20" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#10b981"/>
                                <stop offset="1" stopColor="#3b82f6"/>
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); }}
                          className="btn-primary-premium"
                          style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                        >
                          DIAGNOSE
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Section: Alerts and Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Pending Consultation Requests */}
          {/* Pending Consultation Requests */}
          <div
            className="card-premium"
            style={{ padding: "0", border: "1px solid #e0f2fe", overflow: 'hidden' }}
          >
            <div
              style={{
                padding: "1.25rem",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "1px" }}>
                PENDING REQUESTS
              </h3>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }}>
                <Bell size={16} />
              </div>
            </div>
            <div style={{ padding: "1rem", height: "250px", overflowY: "auto" }} className="custom-scrollbar">
              {pendingAppointments.length === 0 ? (
                <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
                  NO PENDING TASKS
                </p>
              ) : (
                pendingAppointments.map((appt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      gap: "15px",
                      alignItems: "center",
                      transition: 'background 0.2s',
                      borderRadius: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-secondary)", opacity: 0.5 }}>{(i + 1).toString().padStart(2, "0")}</span>
                    <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: "0.85rem", color: 'var(--text-primary)' }}>
                          {appt.patient.name.toUpperCase()}
                        </p>
                        <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                          {appt.type} • {appt.preferred_time}
                        </p>
                      </div>
                      <button
                        onClick={() => handleApprove(appt.id)}
                        className="btn-primary-premium"
                        style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                      >
                        APPROVE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="card-premium"
            style={{ 
              background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)", 
              color: "#fff", 
              padding: "2rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background scanning animation effect */}
            <div className="ai-scan-line" style={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              height: "2px", 
              background: "linear-gradient(90deg, transparent, #38bdf8, transparent)",
              boxShadow: "0 0 15px #38bdf8",
              zIndex: 1,
              animation: "scan 3s linear infinite"
            }}></div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", position: "relative", zIndex: 2 }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "2px", color: "#38bdf8" }}>
                  AI RISK ANALYSIS
                </h3>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", letterSpacing: "1px", marginTop: '4px' }}>
                  COGNITIVE DIAGNOSTIC NODE: V1.0.4
                </p>
              </div>
              <div className="pulse-slow" style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '12px' }}>
                <Cpu size={24} color="#38bdf8" />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", position: "relative", zIndex: 2 }}>
              {riskScore ? (
                <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: riskScore.risk_level === "CRITICAL" ? "#ef4444" : "#10b981", letterSpacing: "1px" }}>
                      STATUS: {riskScore.risk_level}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: '#94a3b8' }}>LATEST SYNC</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "15px" }}>
                    <h2 style={{ fontSize: "3rem", fontWeight: 800, margin: 0 }}>{riskScore.score_value}<span style={{ fontSize: "1.2rem", color: '#94a3b8' }}>/10</span></h2>
                    <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${riskScore.score_value * 10}%`, height: "100%", background: riskScore.score_value > 7 ? "#ef4444" : "#38bdf8", boxShadow: "0 0 10px currentColor", borderRadius: '3px' }}></div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", marginTop: "1rem" }}>
                    CALCULATED AT: {new Date(riskScore.calculated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              ) : (
                <>
                  {/* Predictive Alert Block */}
                  <div style={{ borderLeft: "4px solid #f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "1.2rem", borderRadius: '0 12px 12px 0' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "#fcd34d", letterSpacing: "1px" }}>PREDICTIVE ALERT</p>
                      <Activity size={14} color="#fcd34d" className="pulse" />
                    </div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", lineHeight: "1.5" }}>
                      82% RISK OF HYPERTENSIVE CRISIS DETECTED IN ROOM 102
                    </p>
                    <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
                       <span style={{ fontSize: "0.65rem", padding: "4px 8px", background: "rgba(0,0,0,0.2)", borderRadius: '4px', fontWeight: 800, color: '#fcd34d' }}>TREND: RISING</span>
                       <span style={{ fontSize: "0.65rem", padding: "4px 8px", background: "rgba(239, 68, 68, 0.2)", borderRadius: '4px', fontWeight: 800, color: '#fca5a5' }}>PRIORITY: HIGH</span>
                    </div>
                  </div>

                  {/* Recovery Trend Block */}
                  <div style={{ borderLeft: "4px solid #10b981", background: "rgba(16, 185, 129, 0.1)", padding: "1.2rem", borderRadius: '0 12px 12px 0' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6ee7b7", letterSpacing: "1px" }}>RECOVERY TREND</p>
                      <CheckCircle size={14} color="#6ee7b7" />
                    </div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", lineHeight: "1.5" }}>
                      STABLE VITALS IMPROVEMENT OBSERVED ACROSS WARD-ALPHA
                    </p>
                  </div>
                </>
              )}
            </div>

            <style jsx>{`
              @keyframes scan {
                0% { top: 0; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
              .pulse-slow {
                animation: pulse 3s infinite;
              }
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
          </div>

          <div className="card-premium" style={{ borderLeft: "4px solid #ef4444" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontWeight: 800, fontSize: "0.85rem", color: 'var(--text-primary)' }}>
                CRITICAL LOGISTICS
              </h3>
              <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '50%' }}>
                <Activity size={18} color="#ef4444" />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <FlaskConical size={24} color="#ef4444" />
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ef4444" }}>
                  BLOOD BANK SHORTAGE
                </p>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: 'var(--text-secondary)' }}>
                  O- RESERVES BELOW 10%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Drill-down Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(8px)",
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{
                width: "900px",
                maxWidth: "95vw",
                background: "#fff",
                position: "relative",
                borderRadius: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              className="custom-scrollbar"
            >
              <div
                style={{
                  padding: "2rem",
                  background: "linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                    {selectedPatient.name[0]}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                      {selectedPatient.name}
                    </h2>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.8, marginTop: '4px' }}>
                      {selectedPatient.id} • CLINICAL HISTORY
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAdmit}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    padding: "12px 24px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    borderRadius: '12px',
                    cursor: "pointer",
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  ADMIT PATIENT
                </button>
              </div>

              <div style={{ padding: "2.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "2.5rem",
                    background: '#f8fafc',
                    padding: '8px',
                    borderRadius: '16px'
                  }}
                >
                  {[
                    "Clinical Status",
                    "Past Records",
                    "Diagnostics",
                    "Pharmacy",
                  ].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: "12px 24px",
                        background: activeTab === tab ? "#fff" : "transparent",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: activeTab === tab ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                        color: activeTab === tab ? "var(--color-accent)" : "var(--text-secondary)",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        flex: 1,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>

                {activeTab === "Clinical Status" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2rem",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "1.5rem",
                      }}
                    >
                      <div className="card-premium" style={{ padding: "1.5rem", textAlign: 'center' }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: '8px' }}>BLOOD PRESSURE</p>
                        <p style={{ fontSize: "2rem", fontWeight: 800, color: 'var(--color-accent)' }}>120<span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/80</span></p>
                        <div style={{ marginTop: '10px' }}>
                          <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path d="M0,15 L20,15 L30,5 L40,25 L50,15 L100,15" stroke="var(--color-accent)" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                      </div>
                      <div className="card-premium" style={{ padding: "1.5rem", textAlign: 'center' }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: '8px' }}>HEART RATE</p>
                        <p style={{ fontSize: "2rem", fontWeight: 800, color: '#ef4444' }}>72 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>BPM</span></p>
                        <div style={{ marginTop: '10px' }}>
                          <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path d="M0,20 Q25,20 25,5 T50,20 T75,25 T100,20" stroke="#ef4444" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                      </div>
                      <div className="card-premium" style={{ padding: "1.5rem", textAlign: 'center' }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: '8px' }}>SPO2</p>
                        <p style={{ fontSize: "2rem", fontWeight: 800, color: '#3b82f6' }}>98<span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>%</span></p>
                        <div style={{ marginTop: '10px' }}>
                          <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path d="M0,5 L100,5" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div
                      className="card-premium"
                      style={{
                        padding: "1.5rem",
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: "#ef4444",
                          marginBottom: "1rem",
                        }}
                      >
                        ACTIVE PROBLEMS & COMPLAINTS
                      </h4>
                      <ul
                        style={{
                          paddingLeft: "1.25rem",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: '#7f1d1d',
                          lineHeight: "1.8",
                        }}
                      >
                        <li>CHRONIC HYPERTENSION (STAGE 1)</li>
                        <li>TYPE 2 DIABETES MELLITUS</li>
                        <li>OCCASIONAL CHEST DISCOMFORT</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "Past Records" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {[
                      {
                        date: "2024-03-12",
                        type: "ANNUAL PHYSICAL",
                        provider: "DR. SARAH SMITH",
                      },
                      {
                        date: "2023-11-05",
                        type: "CARDIOLOGY CONSULT",
                        provider: "DR. MICHAEL ROSS",
                      },
                      {
                        date: "2023-08-19",
                        type: "ER VISIT - CHEST PAIN",
                        provider: "CITY GENERAL",
                      },
                    ].map((rec, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "1.25rem",
                          borderBottom: "1px solid #f1f5f9",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: 'background 0.2s',
                          borderRadius: '8px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <p style={{ fontWeight: 800, fontSize: "0.85rem", color: 'var(--text-primary)' }}>
                            {rec.type}
                          </p>
                          <p
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {rec.date} • {rec.provider}
                          </p>
                        </div>
                        <button
                          className="btn-outline-premium"
                          style={{ fontSize: "0.7rem", padding: "6px 14px" }}
                        >
                          View Record
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "Diagnostics" && (
                  <div>
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "1.5rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        marginBottom: "2rem",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          marginBottom: "1rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        REQUISITION NEW DIAGNOSTIC
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginBottom: "1rem",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Test Name (e.g. Blood Sugar)"
                          value={testName}
                          onChange={(e) => setTestName(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "12px 16px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "12px",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={handleAddTest}
                          disabled={!testName}
                          className={testName ? "btn-primary-premium" : ""}
                          style={{
                            padding: "10px 20px",
                            background: testName ? "" : "#e2e8f0",
                            color: testName ? "" : "#94a3b8",
                            border: "none",
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: testName ? "pointer" : "not-allowed",
                          }}
                        >
                          Add to Order
                        </button>
                      </div>
                      <p
                        style={{
                          fontSize: "0.55rem",
                          fontWeight: 900,
                          opacity: 0.5,
                          marginBottom: "0.5rem",
                        }}
                      >
                        QUICK SELECT STANDARD TESTS:
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {[
                          "COMPLETE BLOOD COUNT (CBC)",
                          "LIPID PANEL",
                          "LIVER FUNCTION TEST (LFT)",
                          "KIDNEY FUNCTION TEST (KFT)",
                          "THYROID PROFILE",
                          "BLOOD SUGAR (FASTING)",
                          "URINALYSIS",
                          "X-RAY CHEST",
                          "ECG",
                          "MRI BRAIN",
                        ].map((test, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              !queuedTests.includes(test) &&
                              setQueuedTests([...queuedTests, test])
                            }
                            style={{
                              padding: "8px 16px",
                              background: queuedTests.includes(test)
                                ? "var(--color-accent)"
                                : "#fff",
                              color: queuedTests.includes(test)
                                ? "#fff"
                                : "var(--text-primary)",
                              border: queuedTests.includes(test) ? "1px solid var(--color-accent)" : "1px solid #e2e8f0",
                              borderRadius: "20px",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              cursor: queuedTests.includes(test)
                                ? "default"
                                : "pointer",
                              transition: "all 0.2s",
                              boxShadow: queuedTests.includes(test) ? "0 2px 8px rgba(14,168,155,0.2)" : "0 2px 4px rgba(0,0,0,0.02)"
                            }}
                          >
                            {test} {queuedTests.includes(test) && "✓"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {queuedTests.length > 0 && (
                      <div
                        className="card-premium"
                        style={{ padding: "1.5rem", marginBottom: "2rem" }}
                      >
                        <h4
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                            marginBottom: "1.5rem",
                            color: "var(--text-primary)"
                          }}
                        >
                          QUEUED DIAGNOSTICS ({queuedTests.length})
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {queuedTests.map((t, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px",
                                borderBottom: "1px solid #f1f5f9",
                              }}
                            >
                              <span
                                style={{ fontWeight: 700, fontSize: "0.85rem", color: 'var(--text-primary)' }}
                              >
                                {t}
                              </span>
                              <button
                                onClick={() =>
                                  setQueuedTests(
                                    queuedTests.filter((_, idx) => idx !== i),
                                  )
                                }
                                style={{
                                  background: "rgba(239, 68, 68, 0.1)",
                                  border: "none",
                                  color: "#ef4444",
                                  fontWeight: 700,
                                  fontSize: "0.7rem",
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleTestRequest}
                          className="btn-primary-premium"
                          style={{
                            width: "100%",
                            marginTop: "1.5rem",
                            padding: "16px",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            justifyContent: "center",
                          }}
                        >
                          TRANSMIT FULL DIAGNOSTICS ORDER TO LAB
                        </button>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          opacity: 0.5,
                        }}
                      >
                        PREVIOUS RESULTS
                      </p>
                      <div
                        style={{
                          padding: "1rem",
                          border: "1px solid #eee",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <span
                            style={{ fontWeight: 800, fontSize: "0.75rem" }}
                          >
                            HEMATOLOGY PANEL
                          </span>
                          <p
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              opacity: 0.5,
                            }}
                          >
                            UPLOADED BY LAB NODE • 2H AGO
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 900,
                            color: "#10b981",
                          }}
                        >
                          COMPLETED
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Pharmacy" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2rem",
                    }}
                  >
                    {/* Medicine Selection Engine */}
                    <div
                      className="card-premium"
                      style={{
                        padding: "1.5rem",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "1.5rem",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                            color: "var(--text-primary)",
                          }}
                        >
                          PHARMACEUTICAL INVENTORY SELECTOR
                        </p>
                        <div style={{ position: "relative", width: "250px" }}>
                          <Search
                            size={16}
                            style={{
                              position: "absolute",
                              left: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "var(--text-secondary)",
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Search medicines..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px 10px 36px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "12px",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              outline: "none",
                            }}
                          />
                        </div>
                      </div>

                      {/* Inventory Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(150px, 1fr))",
                          gap: "10px",
                          maxHeight: "200px",
                          overflowY: "auto",
                          padding: "4px",
                          marginBottom: "1.5rem",
                        }}
                      >
                        {inventory
                          .filter((i) =>
                            i.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()),
                          )
                          .map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() =>
                                item.quantity > 0 &&
                                setPrescription({
                                  ...prescription,
                                  medicine: item.name,
                                  power: item.power,
                                })
                              }
                              style={{
                                padding: "16px",
                                background:
                                  item.quantity > 0 ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
                                color: "var(--text-primary)",
                                cursor:
                                  item.quantity > 0 ? "pointer" : "not-allowed",
                                opacity: item.quantity > 0 ? 1 : 0.6,
                                border:
                                  prescription.medicine === item.name
                                    ? "2px solid var(--color-accent)"
                                    : item.quantity > 0 ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                                borderRadius: "12px",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                transition: "all 0.2s"
                              }}
                            >
                              <p
                                style={{ fontSize: "0.8rem", fontWeight: 800 }}
                              >
                                {item.name}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.55rem",
                                  fontWeight: 800,
                                  opacity: 0.8,
                                }}
                              >
                                {item.quantity > 0
                                  ? `IN STOCK (${item.quantity})`
                                  : "OUT OF STOCK"}
                              </p>
                            </div>
                          ))}
                      </div>

                      {/* Quick Selection Form */}
                      {prescription.medicine && (
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr auto",
                            gap: "15px",
                            alignItems: "flex-end",
                            background: "#f8fafc",
                            padding: "1.5rem",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                display: "block",
                                marginBottom: "8px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              Selected Medicine
                            </label>
                            <div
                              style={{
                                padding: "12px 16px",
                                background: "#fff",
                                border: "1px solid #cbd5e1",
                                borderRadius: "12px",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                color: "var(--text-primary)",
                              }}
                            >
                              {prescription.medicine}
                            </div>
                          </div>
                          <div>
                            <label
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                display: "block",
                                marginBottom: "8px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              Power / Dosage
                            </label>
                            <input
                              type="text"
                              value={prescription.power || ""}
                              onChange={(e) =>
                                setPrescription({
                                  ...prescription,
                                  power: e.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "12px",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                outline: "none",
                              }}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                display: "block",
                                marginBottom: "8px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              Amount (Qty)
                            </label>
                            <input
                              type="number"
                              value={prescription.amount}
                              onChange={(e) =>
                                setPrescription({
                                  ...prescription,
                                  amount: e.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "12px",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                outline: "none",
                              }}
                            />
                          </div>
                          <button
                            onClick={handleAddMed}
                            className="btn-primary-premium"
                            style={{
                              padding: "12px 20px",
                              height: "45px",
                            }}
                          >
                            Add
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* Prescribed List Queued */}
                    {prescribedMedsList.length > 0 && (
                      <div className="card-premium" style={{ padding: "1.5rem" }}>
                        <h4
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                            marginBottom: "1.5rem",
                            color: "var(--text-primary)"
                          }}
                        >
                          QUEUED PRESCRIPTION ({prescribedMedsList.length})
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {prescribedMedsList.map((med, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px",
                                borderBottom: "1px solid #f1f5f9",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: "0.85rem",
                                    color: "var(--text-primary)"
                                  }}
                                >
                                  {med.medicine}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    marginLeft: "10px",
                                  }}
                                >
                                  {med.power} • {med.amount} UNITS
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setPrescribedMedsList(
                                    prescribedMedsList.filter(
                                      (_, idx) => idx !== i,
                                    ),
                                  )
                                }
                                style={{
                                  background: "rgba(239, 68, 68, 0.1)",
                                  border: "none",
                                  color: "#ef4444",
                                  fontWeight: 700,
                                  fontSize: "0.7rem",
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleFinalPrescribe}
                          className="btn-primary-premium"
                          style={{
                            width: "100%",
                            marginTop: "1.5rem",
                            padding: "16px",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            justifyContent: "center",
                          }}
                        >
                          TRANSMIT FULL PRESCRIPTION TO PHARMACY
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
