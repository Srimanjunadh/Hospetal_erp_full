"use client";
import { useEffect, useState } from "react";
import { Activity, Users, Hospital, TrendingUp, AlertTriangle, ShieldCheck, Zap, ArrowRight, BarChart3, Plus, Bed, Clock, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

export default function HospitalAdminDashboard() {
  const { showToast } = useToast();
  const [hospitalCode, setHospitalCode] = useState("METRO-CORE-01");
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = require("next/navigation").useRouter();
  
  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session && (session.role === "hospital_admin" || session.role === "super_admin")) {
      setHospitalCode(session.username?.toUpperCase() || "");
      fetchAdmissionsAndAlerts(session.id);
    }

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + " • " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [rooms, setRooms] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [bedLoad, setBedLoad] = useState(0);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [appointmentQueue, setAppointmentQueue] = useState<any[]>([]);
  const [roomMap, setRoomMap] = useState(new Map());
  const [activeFloor, setActiveFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedPendingAdmission, setSelectedPendingAdmission] = useState("");
  const [isAddingBed, setIsAddingBed] = useState(false);
  const [riskScores, setRiskScores] = useState<any[]>([]);
  const [newBedData, setNewBedData] = useState({
    room_number: "",
    bed_number: "",
    floor: 1
  });

  const fetchAdmissionsAndAlerts = async (userId: number) => {
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const { apiService } = await import("@/services/api");
      const data = await apiService.getAdmissions();
      setAdmissions(data);
      if (data.length > 0) setBedLoad(Math.min(100, data.length * 10));

      const activeAdmissions = data.filter((a: any) => a.status === "admitted" && a.room_number);
      const rMap = new Map(activeAdmissions.map((a: any) => [a.room_number, a]));
      setRoomMap(rMap);

      if (userId) {
        const alertData = await apiService.getSystemAlerts(userId);
        setAlerts(alertData.map((a: any) => ({ msg: a.message, priority: a.type === "emergency" ? "CRITICAL" : "HIGH", id: a.id })));
      }

      if (session?.hospital_id) {
        const dbBeds = await apiService.getBeds(session.hospital_id);
        const mappedBeds = dbBeds.map((b: any) => {
           const id = `${b.room_number}-${b.bed_number}`;
           const type = b.floor === "1" ? "GENERAL WARD" : b.floor === "2" ? "ICU" : "VIP SUITE";
           const admission: any = rMap.get(id);
           if (admission) {
              return { id, type, status: "OCCUPIED", pt: admission.patient?.name?.toUpperCase(), dbId: b.id, floor: parseInt(b.floor) };
           }
           return { id, type, status: "AVAILABLE", pt: "READY", dbId: b.id, floor: parseInt(b.floor) };
        });
        setRooms(mappedBeds);
        console.log("Rooms Mapped:", mappedBeds.length);

        const appts = await apiService.getHospitalAppointments(session.hospital_id);
        setAppointmentQueue(appts.filter((a: any) => a.status === "pending"));
        console.log("Pending Appts:", appts.length);

        const risks = await apiService.getHospitalRiskScores(session.hospital_id);
        const severityMap: { [key: string]: number } = { 'CRITICAL': 3, 'HIGH': 2, 'MODERATE': 1 };
        const sortedRisks = [...risks].sort((a: any, b: any) => {
          const valA = severityMap[a.risk_level?.toUpperCase()] || 0;
          const valB = severityMap[b.risk_level?.toUpperCase()] || 0;
          return valB - valA;
        });
        setRiskScores(sortedRisks.slice(0, 5));
      } else {
        console.warn("No Hospital ID found in session");
      }
    } catch (e: any) { 
      console.error("Data sync failed:", e.message); 
      showToast("Real-time sync error: " + e.message, "error");
    }
  };

  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  useEffect(() => {
    const filtered = rooms.filter(r => r.floor === activeFloor || (!r.floor && activeFloor === 1));
    setFilteredRooms(filtered.length > 0 ? filtered : rooms.slice(0, 8)); // Fallback to show something if filter fails
    console.log("Filtered Rooms:", filtered.length, "for Floor", activeFloor);
  }, [activeFloor, rooms]);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    const userId = session?.id || 0;
    
    fetchAdmissionsAndAlerts(userId);
    
    const interval = setInterval(() => {
      fetchAdmissionsAndAlerts(userId);
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const handleRoomClick = (room: any) => {
    if (room.status === "OCCUPIED") {
      showToast(`Audit: Bed ${room.id} is occupied by ${room.pt}`, "info");
      return;
    }
    setSelectedRoom(room.id);
  };

  const handleAddBed = async () => {
    try {
      const { apiService } = await import("@/services/api");
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      await apiService.addBed({
        ...newBedData,
        hospital_id: session.hospital_id
      });
      showToast(`New Bed ${newBedData.room_number}-${newBedData.bed_number} Registered`, "success");
      setIsAddingBed(false);
      setNewBedData({ room_number: "", bed_number: "", floor: activeFloor });
      fetchAdmissionsAndAlerts(session.id);
    } catch (e) { showToast("Bed registration failed", "error"); }
  };

  const handleFinalizeAdmission = async () => {
    try {
      const { apiService } = await import("@/services/api");
      await apiService.finalizeAdmission({
        admission_id: selectedPendingAdmission,
        room_number: selectedRoom
      });
      showToast(`Bed ${selectedRoom} Allotted Successfully`, "success");
      setSelectedRoom(null);
      setSelectedPendingAdmission("");
      
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      if (session && (session.role === "hospital_admin" || session.role === "super_admin")) {
      fetchAdmissionsAndAlerts(session.id);
    } else {
      if (mounted) router.push("/login");
    }
    } catch (e) {
      showToast("Allotment failed", "error");
    }
  };

  const handleApproveAppointment = async (apptId: number) => {
    try {
      const { apiService } = await import("@/services/api");
      await apiService.approveAppointment(apptId);
      showToast("Appointment Approved & Synced to Doctor", "success");
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      fetchAdmissionsAndAlerts(session?.id);
    } catch (e) { showToast("Approval failed", "error"); }
  };


  return (
    <DashboardLayout role="hospital_admin" userName="Admin Manju">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>PMS COMMAND CENTER</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>FACILITY ID: {hospitalCode} • {currentDateTime.toUpperCase()}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary-premium" 
            onClick={() => showToast("Initializing New Admission Sequence", "info")}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: 'row',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={18} /> <span>NEW ADMISSION</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }} className="grid-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Main Content Area - Appointment Queue */}
          <div className="card-premium" style={{ padding: '0', minHeight: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 2rem', background: 'linear-gradient(135deg, var(--bg-side), var(--bg-side-dark))', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={20} />
                  <h3 style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '2px', margin: 0 }}>LIVE APPOINTMENT QUEUE</h3>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ position: 'relative' }}>
                   <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
                   <input type="text" placeholder="Search appointments..." style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px 6px 30px', borderRadius: '20px', color: '#fff', fontSize: '0.75rem', outline: 'none' }} />
                 </div>
                 <button style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                   <Filter size={14} /> FILTER
                 </button>
                 <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.9, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '12px' }}>{appointmentQueue.length} PENDING REQUESTS</span>
               </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }} className="custom-scrollbar">
              <table className="data-table-premium" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1.25rem 1.5rem' }}>S.NO</th>
                    <th style={{ padding: '1.25rem 1.5rem' }}>PATIENT IDENTITY</th>
                    <th style={{ padding: '1.25rem 1.5rem' }}>CLINICAL EXPERT</th>
                    <th style={{ padding: '1.25rem 1.5rem' }}>SCHEDULED TIME</th>
                    <th style={{ padding: '1.25rem 1.5rem' }}>REASON / NOTES</th>
                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', opacity: 0.3, fontWeight: 900, fontSize: '0.8rem' }}>
                        SYSTEM STANDBY: NO PENDING APPOINTMENTS IN QUEUE
                      </td>
                    </tr>
                  ) : appointmentQueue.map((appt, idx) => (
                    <tr key={appt.id} className="hover-row">
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 900 }}>{(idx + 1).toString().padStart(2, '0')}</td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                         <p style={{ fontWeight: 800, fontSize: '0.85rem', margin: 0 }}>{appt.patient_name?.toUpperCase()}</p>
                         <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>ID: {appt.patient_id || 'N/A'}</p>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>DR. {appt.doctor_name?.toUpperCase()}</td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                           <Clock size={14} className="text-teal-premium" /> {appt.preferred_time}
                         </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>{appt.reason || 'GENERAL CONSULTATION'}</td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleApproveAppointment(appt.id)}
                          className="btn-primary-premium"
                          style={{ padding: '6px 14px', fontSize: '0.7rem' }}
                        >
                          APPROVE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
               <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.6, letterSpacing: '1px', margin: 0 }}>SCROLL FOR MORE APPOINTMENTS • AUTO-SYNC ACTIVE</p>
            </div>
          </div>


        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* CRITICAL ALERTS */}
          <div className="card-premium">
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <AlertTriangle size={20} className="text-rose-500" />
                <h3 style={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px', margin: 0 }}>CRITICAL ALERTS</h3>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {alerts.length === 0 ? (
                     <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.3, margin: 0 }}>NO ACTIVE SYSTEM ALERTS</p>
                  ) : alerts.map((alert: any) => (
                    <div key={alert.id} style={{ borderLeft: '4px solid #dc2626', padding: '10px 15px', background: '#fef2f2', borderRadius: '4px' }}>
                       <p style={{ fontWeight: 800, fontSize: '0.75rem', margin: '0 0 2px 0', color: '#991b1b' }}>{alert.msg}</p>
                       <p style={{ fontSize: '0.6rem', fontWeight: 900, color: '#dc2626', margin: 0 }}>{alert.priority}</p>
                    </div>
                  ))}
             </div>
           </div>

          {/* AI RISK MONITOR */}
          <div className="card-premium" style={{ background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <Zap size={20} style={{ color: '#0ea5e9' }} />
                <h3 style={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px', margin: 0 }}>AI RISK MONITOR</h3>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {riskScores.length === 0 ? (
                     <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.3, margin: 0 }}>CALCULATING RISK VECTORS...</p>
                  ) : riskScores.map((risk: any, i) => (
                    <div key={i} style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', background: risk.risk_level === 'CRITICAL' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(255,255,255,0.02)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem' }}>{risk.patient_name?.toUpperCase() || "PATIENT"}</span>
                          <span style={{ 
                             fontSize: '0.65rem', 
                             fontWeight: 900, 
                             color: risk.risk_level === 'CRITICAL' ? '#fca5a5' : risk.risk_level === 'HIGH' ? '#fcd34d' : '#38bdf8'
                          }}>{risk.risk_level}</span>
                       </div>
                       <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${risk.score_value * 10}%`, height: '100%', background: risk.risk_level === 'CRITICAL' ? '#dc2626' : '#0ea5e9' }}></div>
                       </div>
                    </div>
                  ))}
             </div>
             <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.4, marginTop: '1.25rem', textAlign: 'center', margin: '1.25rem 0 0 0' }}>
                REAL-TIME PREDICTIVE ANALYTICS • AES-256 SYNC
             </p>
           </div>

          {/* REVENUE FLOW */}
          <div className="card-premium" style={{ background: 'linear-gradient(135deg, var(--bg-side), var(--bg-side-dark))', color: '#fff' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <TrendingUp size={20} />
                <h3 style={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px', margin: 0 }}>REVENUE FLOW</h3>
             </div>
             <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                {[30, 80, 45, 90, 60, 40, 85, 70].map((h, i) => (
                   <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', height: `${h}%`, borderRadius: '3px', transition: 'background 0.2s' }} />
                ))}
             </div>
             <p style={{ fontSize: '0.6rem', fontWeight: 800, textAlign: 'center', marginTop: '14px', opacity: 0.7, margin: 0 }}>SYNCHRONIZING FINANCIAL NODE...</p>
          </div>

          {/* RECENT ADMISSIONS */}
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, var(--bg-side), var(--bg-side-dark))', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px', margin: 0 }}>RECENT ADMISSIONS</h3>
               <Bed size={14} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
              {admissions.filter(a => a.status === 'admitted').length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4, fontWeight: 800, fontSize: '0.7rem' }}>NO ACTIVE ADMISSIONS</div>
              ) : admissions.filter(a => a.status === 'admitted').map((adm: any, idx: number) => (
                <div key={adm.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.3 }}>{(idx + 1).toString().padStart(2, '0')}</span>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.8rem', margin: 0 }}>{adm.patient?.name?.toUpperCase()}</p>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>BED {adm.room_number}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Allot Room Modal */}
      {selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedRoom(null)} />
          <div className="card-premium" style={{ width: '500px', background: '#fff', position: 'relative', borderTop: '6px solid var(--bg-side)', padding: '2.5rem', zIndex: 1010 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>ALLOT BED {selectedRoom}</h2>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>SELECT A PENDING ADMISSION REQUEST TO ASSIGN TO THIS BED.</p>

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '10px', letterSpacing: '1px', color: 'var(--text-primary)' }}>PENDING ADMISSION QUEUE</label>
              <select 
                value={selectedPendingAdmission} 
                onChange={(e) => setSelectedPendingAdmission(e.target.value)}
                style={{ width: '100%', padding: '14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">-- SELECT PENDING REQUEST --</option>
                {admissions.filter(a => a.status === 'requested').map(a => (
                  <option key={a.id} value={a.id}>
                    {a.patient?.name?.toUpperCase()} (Requested by Dr. {a.doctor?.user?.name?.toUpperCase()})
                  </option>
                ))}
              </select>
              {admissions.filter(a => a.status === 'requested').length === 0 && (
                <p style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 800, marginTop: '10px' }}>NO PENDING ADMISSIONS IN QUEUE.</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setSelectedRoom(null)}
                className="btn-outline-premium"
                style={{ flex: 1, padding: '14px' }}
              >
                CANCEL
              </button>
              <button 
                onClick={handleFinalizeAdmission}
                disabled={!selectedPendingAdmission}
                className="btn-primary-premium"
                style={{ flex: 2, padding: '14px', opacity: selectedPendingAdmission ? 1 : 0.5, cursor: selectedPendingAdmission ? 'pointer' : 'not-allowed' }}
              >
                CONFIRM ALLOTMENT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bed Modal */}
      {isAddingBed && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setIsAddingBed(false)} />
          <div className="card-premium" style={{ width: '450px', background: '#fff', position: 'relative', borderTop: '6px solid var(--bg-side)', padding: '2.5rem', zIndex: 1010 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem', color: 'var(--text-primary)' }}>REGISTER NEW BED</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>TARGET FLOOR</label>
                  <select 
                    value={newBedData.floor} 
                    onChange={(e) => setNewBedData({...newBedData, floor: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }}
                  >
                    <option value={1}>FL 1 - GENERAL WARD</option>
                    <option value={2}>FL 2 - ICU</option>
                    <option value={3}>FL 3 - VIP SUITE</option>
                  </select>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                     <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>ROOM NUMBER</label>
                     <input 
                       type="text" 
                       placeholder="e.g. 105"
                       value={newBedData.room_number} 
                       onChange={(e) => setNewBedData({...newBedData, room_number: e.target.value})}
                       style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }}
                     />
                  </div>
                  <div>
                     <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>BED IDENTIFIER</label>
                     <input 
                       type="text" 
                       placeholder="e.g. A"
                       value={newBedData.bed_number} 
                       onChange={(e) => setNewBedData({...newBedData, bed_number: e.target.value})}
                       style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }}
                     />
                  </div>
               </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
              <button onClick={() => setIsAddingBed(false)} className="btn-outline-premium" style={{ flex: 1, padding: '14px' }}>CANCEL</button>
              <button onClick={handleAddBed} className="btn-primary-premium" style={{ flex: 1, padding: '14px' }}>ADD TO INVENTORY</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
