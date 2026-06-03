"use client";
import { useEffect, useState } from "react";
import { Users, Search, Filter, Bed, Activity, User, ShieldCheck, Heart, MapPin, Calendar, Clock, X, Edit } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { motion } from "framer-motion";

export default function PatientRegistryPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalId, setHospitalId] = useState<number | null>(null);

  // Reschedule modal states
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [newDoctorId, setNewDoctorId] = useState<number | "">("");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session?.hospital_id) {
      setHospitalId(session.hospital_id);
      fetchPatientRegistry(session.hospital_id);
      fetchDoctors(session.hospital_id);
    }
  }, []);

  const fetchDoctors = async (hId: number) => {
    try {
      const { apiService } = await import("@/services/api");
      const docs = await apiService.getDoctors(hId);
      setDoctorsList(docs || []);
    } catch (e) {
      console.error("Failed to load doctors", e);
    }
  };

  const fetchPatientRegistry = async (hId: number) => {
    setLoading(true);
    try {
      const { apiService } = await import("@/services/api");
      
      // Fetch patients, admissions, and appointments in parallel
      const [patientData, admissionData, appointmentData] = await Promise.all([
        apiService.getPatients(hId),
        apiService.getAdmissions(), // This might need hospital_id filtering if API supports it
        apiService.getHospitalAppointments(hId)
      ]);

      // Map admissions to patients for room info
      const roomMapping = new Map();
      admissionData.forEach((adm: any) => {
        if (adm.status === "admitted" && adm.room_number) {
          roomMapping.set(adm.patient_id, adm.room_number);
        }
      });

      const mappedPatients = patientData.map((p: any) => ({
        ...p,
        room: roomMapping.get(p.id) || "OUTPATIENT",
        status: roomMapping.has(p.id) ? "IN-PATIENT" : "OUT-PATIENT",
        doctorName: p.assigned_doctor?.user?.name || "NOT ASSIGNED",
        nurseName: p.assigned_nurse?.name || "NOT ASSIGNED"
      }));

      setPatients(mappedPatients);
      setAppointments(appointmentData || []);
    } catch (error) {
      showToast("Identity sync failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppt = async (apptId: number) => {
    try {
      const { apiService } = await import("@/services/api");
      await apiService.approveAppointment(apptId);
      showToast("Appointment approved and sent to clinician", "success");
      if (hospitalId) fetchPatientRegistry(hospitalId);
    } catch (e) {
      showToast("Approval failed", "error");
    }
  };

  const handleSaveReschedule = async () => {
    if (!selectedAppt) return;
    try {
      const { apiService } = await import("@/services/api");
      await apiService.patchAppointment(selectedAppt.id, {
        doctor_id: newDoctorId || undefined,
        scheduled_at: newDate ? new Date(newDate).toISOString() : undefined
      });
      showToast("Clinician assignment & scheduled time synchronized", "success");
      setIsRescheduleModalOpen(false);
      if (hospitalId) fetchPatientRegistry(hospitalId);
    } catch (e) {
      showToast("Rescheduling failed", "error");
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.room.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <DashboardLayout role="hospital_admin" userName="Admin Manju">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>PATIENT PORTAL OPERATIONS</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>FACILITY AUDIT • INCOMING ONLINE APPLICATIONS & PATIENT REGISTRY</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button 
             className="btn-outline-premium" 
             onClick={() => hospitalId && fetchPatientRegistry(hospitalId)}
             style={{
               display: 'inline-flex',
               alignItems: 'center',
               gap: '8px',
               flexDirection: 'row',
               whiteSpace: 'nowrap'
             }}
           >
             <Activity size={18} /> <span>REFRESH SYSTEMS</span>
           </button>
        </div>
      </div>

      {/* Online Applications Section */}
      <div className="card-premium" style={{ padding: '0', marginBottom: '3rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>ONLINE APPLICATIONS</h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem' }}>INCOMING APPOINTMENTS FROM PMS PORTAL</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" placeholder="Search applications..." style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px 6px 30px', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
            </div>
            <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
              <Filter size={14} /> FILTER
            </button>
            <div style={{ padding: '8px 16px', background: '#e0f2fe', color: '#0369a1', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              PENDING: {appointments.filter(a => a.status === 'pending').length}
            </div>
          </div>
        </div>

        <div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="custom-scrollbar">
            <table className="data-table-premium">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>PATIENT NAME</th>
                  <th>PROBLEM / REASON</th>
                  <th>DOCTOR NAME</th>
                  <th>STATUS</th>
                  <th>DATE & TIME</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', fontWeight: 900 }}>SYNCHRONIZING APPOINTMENTS FEED...</td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', fontWeight: 900 }}>NO ONLINE APPLICATIONS IN QUEUE</td>
                  </tr>
                ) : appointments.map((appt, i) => {
                  let statusBg = 'rgba(59, 130, 246, 0.1)';
                  let statusColor = '#3b82f6';
                  let statusText = appt.status.toUpperCase();
                  if (appt.status === 'pending') {
                    statusBg = 'rgba(245, 158, 11, 0.1)';
                    statusColor = '#d97706';
                    statusText = 'PENDING APPROVAL';
                  } else if (appt.status === 'admin_approved' || appt.status === 'approved') {
                    statusBg = 'rgba(16, 185, 129, 0.1)';
                    statusColor = '#059669';
                    statusText = 'APPROVED';
                  }

                  return (
                    <tr key={appt.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px 20px', fontWeight: 900, fontSize: '0.75rem', opacity: 0.3 }}>{(i + 1).toString().padStart(2, '0')}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem' }}>
                            {appt.patient_name ? appt.patient_name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <p style={{ fontWeight: '900', fontSize: '0.8rem' }}>{appt.patient_name ? appt.patient_name.toUpperCase() : 'UNKNOWN PATIENT'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px', fontWeight: 800, fontSize: '0.75rem' }}>
                        {appt.reason ? appt.reason.toUpperCase() : 'GENERAL CONSULTATION'}
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }}></div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>DR. {appt.doctor_name ? appt.doctor_name.toUpperCase() : 'NOT ASSIGNED'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.6rem', 
                          fontWeight: 900, 
                          background: statusBg,
                          color: statusColor,
                          border: `1px solid ${statusColor}`
                        }}>{statusText}</span>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                            <Calendar size={12} /> {appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'NOT SET'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700, opacity: 0.5 }}>
                            <Clock size={12} /> {appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : appt.preferred_time || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {appt.status === 'pending' && (
                            <button 
                              onClick={() => handleApproveAppt(appt.id)}
                              className="btn-primary-premium"
                              style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                            >
                              APPROVE
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedAppt(appt);
                              setNewDoctorId(appt.doctor_id || "");
                              setNewDate(appt.scheduled_at ? new Date(appt.scheduled_at).toISOString().slice(0, 16) : "");
                              setIsRescheduleModalOpen(true);
                            }}
                            className="btn-outline-premium" 
                            style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                          >
                            <Edit size={12} /> CHANGE DOCTOR/DATE
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Patient Registry Section */}
      <div className="card-premium" style={{ padding: '0', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>PATIENT REGISTRY</h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem' }}>GLOBAL FACILITY PATIENT AUDIT</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search patients..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px 6px 30px', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} 
              />
            </div>
            <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
              <Filter size={14} /> FILTER
            </button>
            <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              TOTAL REGISTERED: {patients.length}
            </div>
          </div>
        </div>

        <div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }} className="custom-scrollbar">
            <table className="data-table-premium">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>PATIENT IDENTITY</th>
                  <th>LOCATION / AGE</th>
                  <th>CARE TEAM</th>
                  <th>FACILITY STATUS</th>
                  <th>ROOM/BED</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', fontWeight: 900 }}>SYNCHRONIZING SECURE NODE DATA...</td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', fontWeight: 900 }}>NO PATIENT RECORDS FOUND</td>
                  </tr>
                ) : filteredPatients.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px 20px', fontWeight: 900, fontSize: '0.75rem', opacity: 0.3 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ width: '35px', height: '35px', background: '#f4f4f5', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '1px solid #000' }}>
                           <User size={18} />
                         </div>
                         <div>
                           <p style={{ fontWeight: '900', fontSize: '0.85rem' }}>{p.name.toUpperCase()}</p>
                           <p style={{ fontSize: '0.65rem', color: '#999', fontWeight: 700 }}>ID: {p.username}</p>
                         </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                            <MapPin size={12} /> {p.location || "N/A"}
                         </div>
                         <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.5 }}>AGE: {p.age || "N/A"}</div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>DR. {p.doctorName === "NOT ASSIGNED" ? "NOT ASSIGNED" : p.doctorName.replace(/^Dr\.\s*/i, '').toUpperCase()}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>NRS. {p.nurseName === "NOT ASSIGNED" ? "NOT ASSIGNED" : p.nurseName.replace(/^(Nurse|Nrs\.)\s*/i, '').toUpperCase()}</span>
                         </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        fontSize: '0.6rem', 
                        fontWeight: 900, 
                        background: p.status === 'IN-PATIENT' ? '#000' : '#f4f4f5',
                        color: p.status === 'IN-PATIENT' ? '#fff' : '#000',
                        border: '1px solid #000'
                      }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, color: p.room === 'OUTPATIENT' ? '#999' : '#000' }}>
                         <Bed size={16} />
                         <span style={{ fontSize: '0.85rem' }}>{p.room}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reschedule & Clinician Assignment Modal */}
      {isRescheduleModalOpen && selectedAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', width: '450px', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Change Clinician & Date</h3>
                 <X size={20} onClick={() => setIsRescheduleModalOpen(false)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Assign Clinician</label>
                    <select 
                      value={newDoctorId} 
                      onChange={e => setNewDoctorId(e.target.value ? Number(e.target.value) : "")} 
                      style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none' }}
                    >
                      <option value="">CURRENT: {selectedAppt.doctor_name?.toUpperCase()}</option>
                      {doctorsList.map((doc: any) => (
                        <option key={doc.id} value={doc.id}>DR. {doc.user?.name?.toUpperCase() || doc.specialization?.toUpperCase()}</option>
                      ))}
                    </select>
                 </div>
                 
                 <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>New Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={newDate} 
                      onChange={e => setNewDate(e.target.value)} 
                      style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none' }} 
                    />
                 </div>

                 <button 
                   onClick={handleSaveReschedule} 
                   className="btn-primary-premium"
                   style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', height: '46px' }}
                 >
                   Save Changes & Sync
                 </button>
              </div>
           </motion.div>
        </div>
      )}
      
      <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '2rem' }}>
         <p style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '2px' }}>MEDCLUES+ SECURE OPERATIONS PROTOCOL • GLOBAL HUB</p>
      </div>
    </DashboardLayout>
  );
}
