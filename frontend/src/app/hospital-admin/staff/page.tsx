"use client"; // Re-sync
import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  Plus, 
  RefreshCcw, 
  Edit3, 
  Calendar, 
  X, 
  User, 
  Mail, 
  Phone, 
  Lock,
  Briefcase,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  Save,
  Trash2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

export default function StaffManagementPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [clinicians, setClinicians] = useState<any[]>([]);
  const [support, setSupport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState<string[]>([]);
  
  // Modals
  const [showRegModal, setShowRegModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSchedModal, setShowSchedModal] = useState(false);
  const [detailsModalStaff, setDetailsModalStaff] = useState<any>(null);
  
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  const [regType, setRegType] = useState<"doctor" | "nurse" | "lab" | "support">("doctor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data States
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [regData, setRegData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    room_number: ""
  });
  
  const [editData, setEditData] = useState({
    name: "",
    username: "",
    password: "",
    assigned_nurse_id: ""
  });

  const [schedData, setSchedData] = useState({
    task_name: "",
    start_time: "",
    end_time: "",
    notes: ""
  });

  const togglePassword = (id: string) => {
    setRevealedPasswords(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const fetchPersonnel = async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const hId = session?.hospital_id;
      const [data, docs] = await Promise.all([
        apiService.getUsers(undefined, hId),
        apiService.getDoctors(hId)
      ]);
      if (Array.isArray(data)) {
        const clns = data.filter((u: any) => u.role === 'hospital_admin' || u.role === 'doctor');
        const nurses = data.filter((u: any) => u.role === 'nurse');
        const supportNodes = data.filter((u: any) => u.role === 'support' || u.role === 'lab');
        const patients = data.filter((u: any) => u.role === 'patient');
        
        const mappedClinicians = clns.map((u: any) => {
          let docId = u.id;
          if (u.role === 'doctor') {
            const docRec = (Array.isArray(docs) ? docs : []).find((d: any) => d.user?.id === u.id);
            if (docRec) docId = docRec.id;
          }
          const assignedPts = patients.filter((p: any) => p.assigned_doctor_id === docId);
          return {
            dbId: u.id,
            id: u.username || `ST-${u.id}`,
            name: (u.name || "UNNAMED").toUpperCase(),
            role: (u.role || "UNKNOWN").replace('_', ' ').toUpperCase(),
            dept: u.role === 'doctor' ? "CLINICAL" : "ADMINISTRATION",
            status: "ACTIVE",
            password: u.cleartext_password || "••••••••",
            assignedPatients: assignedPts.map(p => ({
              id: p.username || `PT-${p.id}`,
              name: p.name.toUpperCase(),
              email: p.email || "N/A",
              phone: p.phone || "N/A"
            }))
          };
        });

        const mappedSupport = [
          ...nurses.map((u: any) => {
            // Find patients assigned to this nurse
            const assignedPts = patients.filter((p: any) => p.assigned_nurse_id === u.id);
            return {
              dbId: u.id,
              id: u.username || `ST-${u.id}`,
              name: (u.name || "UNNAMED").toUpperCase(),
              role: "NURSE",
              dept: "NURSING",
              status: "ACTIVE",
              password: u.cleartext_password || "••••••••",
              assignedPatients: assignedPts.length > 0 
                ? assignedPts.map(p => ({
                    id: p.username || `PT-${p.id}`,
                    name: p.name.toUpperCase(),
                    email: p.email || "N/A",
                    phone: p.phone || "N/A",
                    doctor: p.assigned_doctor?.user?.name?.toUpperCase() || "NO DOCTOR"
                  }))
                : []
            };
          }),
          ...supportNodes.map((u: any) => ({
            dbId: u.id,
            id: u.username || `ST-${u.id}`,
            name: (u.name || "UNNAMED").toUpperCase(),
            role: u.role.toUpperCase(),
            dept: "SUPPORT",
            status: "ACTIVE",
            password: u.cleartext_password || "••••••••",
            assignedPatients: []
          }))
        ];

        setClinicians(mappedClinicians);
        setSupport(mappedSupport);
      }
    } catch (error) {
      showToast("Personnel Registry Sync Failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchPersonnel();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const node_code = session?.node_code;

      let response;
      if (regType === "doctor") {
        const payload = {
          name: regData.name,
          username: regData.username,
          password: regData.password,
          specialization: regData.specialization,
          phone: regData.phone,
          room_number: regData.room_number,
          node_code: node_code
        };
        response = await apiService.registerDoctor(payload);
      } else {
        const payload = {
          name: regData.name,
          username: regData.username,
          password: regData.password,
          role: regType,
          phone: regData.phone,
          node_code: node_code
        };
        response = await apiService.register(payload);
      }

      if (response.access_token) {
        showToast(`${regType.toUpperCase()} REGISTERED`, "success");
        setShowRegModal(false);
        setRegData({
          name: "",
          username: "",
          email: "",
          password: "",
          phone: "",
          specialization: "",
          room_number: ""
        });
        fetchPersonnel();
      }
    } catch (error) {
      showToast("Registration Failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await apiService.updateUser(selectedStaff.dbId, {
        name: editData.name,
        username: editData.username,
        password: editData.password || undefined
      });
      showToast("STAFF PROFILE UPDATED", "success");
      setShowEditModal(false);
      fetchPersonnel();
    } catch (error) {
      showToast("Update Failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      if (selectedStaff.role === "DOCTOR") {
        const doctors = await apiService.getDoctors();
        const docRecord = doctors.find((d: any) => d.user.id === selectedStaff.dbId);
        await apiService.createDoctorSchedule({
          doctor_id: docRecord.id,
          ...schedData,
          status: "pending"
        });
      } else {
        await apiService.createStaffSchedule({
          staff_id: selectedStaff.dbId,
          ...schedData,
          status: "pending"
        });
      }
      showToast("WORK ASSIGNMENT SYNCHRONIZED", "success");
      setShowSchedModal(false);
      setSchedData({ task_name: "", start_time: "", end_time: "", notes: "" });
    } catch (error) {
      showToast("Scheduling Failed", "error");
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="hospital_admin" userName="Admin Manju">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>PERSONNEL COMMAND</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>FACILITY WORKFORCE MANAGEMENT HUB</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary-premium" 
            onClick={() => { setRegType("doctor"); setShowRegModal(true); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: 'row',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={18} /> <span>REGISTER CLINICIAN</span>
          </button>
          <button 
            className="btn-outline-premium" 
            onClick={() => { setRegType("nurse"); setShowRegModal(true); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: 'row',
              whiteSpace: 'nowrap'
            }}
          >
            <UserPlus size={18} /> <span>REGISTER NURSE</span>
          </button>
          <button 
            className="btn-outline-premium" 
            onClick={() => { setRegType("lab"); setShowRegModal(true); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: 'row',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={18} /> <span>REGISTER LAB STAFF</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* Clinicians Table */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 2rem', background: 'linear-gradient(135deg, var(--bg-side), var(--color-accent))', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} />
              <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px', margin: 0 }}>CLINICAL COMMAND</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
                <input type="text" placeholder="Search clinicians..." style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px 6px 30px', borderRadius: '20px', color: '#fff', fontSize: '0.75rem', outline: 'none' }} />
              </div>
              <button style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                <Filter size={14} /> FILTER
              </button>
              <button onClick={fetchPersonnel} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="custom-scrollbar">
            <table className="data-table-premium" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '15px 20px' }}>S.NO</th>
                  <th style={{ padding: '15px 20px' }}>IDENTITY</th>
                  <th style={{ padding: '15px 20px' }}>SYSTEM ID</th>
                  <th style={{ padding: '15px 20px' }}>PASSWORD</th>
                  <th style={{ padding: '15px 20px' }}>ASSIGNED PATIENTS</th>
                  <th style={{ padding: '15px 20px' }}>ROLE</th>
                  <th style={{ padding: '15px 20px' }}>STATUS</th>
                  <th style={{ padding: '15px 20px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {clinicians.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', opacity: 0.3, fontWeight: 900 }}>NO CLINICIANS DETECTED</td></tr>
                ) : clinicians.map((p, i) => (
                  <tr key={i} className="hover-row">
                    <td style={{ padding: '12px 20px', fontWeight: 900, fontSize: '0.75rem', opacity: 0.3 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ padding: '12px 20px', fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td style={{ padding: '12px 20px', opacity: 0.7, fontSize: '0.75rem', fontWeight: 700 }}>{p.id}</td>
                    <td style={{ padding: '12px 20px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: 800 }}>
                            {revealedPasswords.includes(p.id) ? p.password : "••••••••"}
                          </code>
                          <button onClick={() => togglePassword(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            {revealedPasswords.includes(p.id) ? <EyeOff size={14} className="text-secondary" /> : <Eye size={14} className="text-secondary" />}
                          </button>
                        </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {p.role === "DOCTOR" && p.assignedPatients && p.assignedPatients.length > 0 ? (
                        <button 
                          onClick={() => setDetailsModalStaff(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          className="hover-row"
                        >
                          <span>{p.assignedPatients.length}</span>
                          <Eye size={14} style={{ color: 'var(--color-accent)' }} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.3 }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{p.role}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981' }}>{p.status}</span>
                       </div>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        {p.role === "DOCTOR" && (
                          <button 
                            className="btn-primary-premium" 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexDirection: 'row',
                              whiteSpace: 'nowrap',
                              padding: '6px 10px', 
                              fontSize: '0.65rem' 
                            }} 
                            onClick={() => { setSelectedStaff(p); setShowSchedModal(true); }}
                          >
                            <Calendar size={14} /> <span>SHIFT</span>
                          </button>
                        )}
                        <button disabled style={{ opacity: 0.3, background: 'transparent', border: 'none' }}><Edit3 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
             <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.6, margin: 0 }}>SCROLL FOR COMPLETE CLINICAL ROSTER</p>
          </div>
        </div>

        {/* Support Table */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 2rem', background: 'linear-gradient(135deg, var(--bg-side), var(--color-accent))', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} />
              <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px', margin: 0 }}>SUPPORT & NURSING FORCE</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />
                <input type="text" placeholder="Search staff..." style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px 6px 30px', borderRadius: '20px', color: '#fff', fontSize: '0.75rem', outline: 'none' }} />
              </div>
              <button style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                <Filter size={14} /> FILTER
              </button>
            </div>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="custom-scrollbar">
            <table className="data-table-premium" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '15px 20px' }}>S.NO</th>
                  <th style={{ padding: '15px 20px' }}>IDENTITY</th>
                  <th style={{ padding: '15px 20px' }}>SYSTEM ID</th>
                  <th style={{ padding: '15px 20px' }}>PASSWORD</th>
                  <th style={{ padding: '15px 20px' }}>ASSIGNED UNITS</th>
                  <th style={{ padding: '15px 20px' }}>ROLE</th>
                  <th style={{ padding: '15px 20px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {support.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', opacity: 0.3, fontWeight: 900 }}>NO SUPPORT STAFF DETECTED</td></tr>
                ) : support.map((p, i) => (
                  <tr key={i} className="hover-row">
                    <td style={{ padding: '12px 20px', fontWeight: 900, fontSize: '0.75rem', opacity: 0.3 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ padding: '12px 20px', fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td style={{ padding: '12px 20px', opacity: 0.7, fontSize: '0.75rem', fontWeight: 700 }}>{p.id}</td>
                    <td style={{ padding: '12px 20px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: 800 }}>
                            {revealedPasswords.includes(p.id) ? p.password : "••••••••"}
                          </code>
                          <button onClick={() => togglePassword(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            {revealedPasswords.includes(p.id) ? <EyeOff size={14} className="text-secondary" /> : <Eye size={14} className="text-secondary" />}
                          </button>
                        </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {p.assignedPatients && p.assignedPatients.length > 0 ? (
                        <button 
                          onClick={() => setDetailsModalStaff(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          className="hover-row"
                        >
                          <span>{p.assignedPatients.length}</span>
                          <Eye size={14} style={{ color: 'var(--color-accent)' }} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.3 }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{p.role}</span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-primary-premium" 
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexDirection: 'row',
                            whiteSpace: 'nowrap',
                            padding: '6px 10px', 
                            fontSize: '0.65rem'
                          }} 
                          onClick={() => { 
                            setSelectedStaff(p); 
                            setEditData({ name: p.name, username: p.id, password: "", assigned_nurse_id: "" });
                            setShowEditModal(true); 
                          }}
                        >
                          <Edit3 size={14} /> <span>EDIT</span>
                        </button>
                        <button 
                          className="btn-outline-premium" 
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexDirection: 'row',
                            whiteSpace: 'nowrap',
                            padding: '6px 10px', 
                            fontSize: '0.65rem' 
                          }} 
                          onClick={() => { setSelectedStaff(p); setShowSchedModal(true); }}
                        >
                          <Calendar size={14} /> <span>WORK</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
             <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.6, margin: 0 }}>SCROLL FOR COMPLETE SUPPORT FORCE</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-premium" style={{ width: '450px', background: '#fff', borderTop: '6px solid var(--bg-side)', padding: '2.5rem', zIndex: 1010 }}>
             <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>EDIT STAFF IDENTITY</h2>
             <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                   <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>LEGAL NAME</label>
                   <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                </div>
                <div>
                   <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>SYSTEM ID (USERNAME)</label>
                   <input type="text" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                </div>
                <div style={{ position: 'relative' }}>
                   <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>NEW PASSWORD (OPTIONAL)</label>
                   <input 
                    type={showEditPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={editData.password} 
                    onChange={e => setEditData({...editData, password: e.target.value})} 
                    style={{ width: '100%', padding: '12px 40px 12px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} 
                   />
                   <button 
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      style={{ position: 'absolute', right: '12px', bottom: '10px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                    >
                       {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                   <button type="submit" className="btn-primary-premium" style={{ flex: 1, padding: '14px' }}>SAVE CHANGES</button>
                   <button type="button" className="btn-outline-premium" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '14px' }}>CANCEL</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Scheduling Modal */}
      {showSchedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-premium" style={{ width: '500px', background: '#fff', borderTop: '6px solid var(--bg-side)', padding: '2.5rem', zIndex: 1010 }}>
             <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>ASSIGN WORK: {selectedStaff?.name}</h2>
             <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                   <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>TASK NAME</label>
                   <input type="text" required value={schedData.task_name} onChange={e => setSchedData({...schedData, task_name: e.target.value})} placeholder="E.G. WARD ROUNDS" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div style={{ minWidth: 0 }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>START</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={schedData.start_time} 
                        onChange={e => setSchedData({...schedData, start_time: e.target.value})} 
                        style={{ width: '100%', padding: '12px 8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem' }} 
                      />
                   </div>
                   <div style={{ minWidth: 0 }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>END</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={schedData.end_time} 
                        onChange={e => setSchedData({...schedData, end_time: e.target.value})} 
                        style={{ width: '100%', padding: '12px 8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem' }} 
                      />
                   </div>
                </div>
                <button type="submit" className="btn-primary-premium" style={{ marginTop: '1.5rem', padding: '14px' }}>FINALIZE ASSIGNMENT</button>
                <button type="button" className="btn-outline-premium" onClick={() => setShowSchedModal(false)} style={{ padding: '14px' }}>CANCEL</button>
             </form>
          </div>
        </div>
      )}

      {/* Registration Modal Placeholder */}
      {showRegModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-premium" style={{ width: '500px', background: '#fff', borderTop: '6px solid var(--bg-side)', padding: '2.5rem', zIndex: 1010 }}>
             <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>REGISTER {regType.toUpperCase()}</h2>
             <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>LEGAL NAME</label>
                  <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>USER ID (SYSTEM ID)</label>
                    <input type="text" required value={regData.username} onChange={e => setRegData({...regData, username: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>PASSWORD</label>
                    <input 
                      type={showRegPassword ? "text" : "password"} 
                      required 
                      value={regData.password} 
                      onChange={e => setRegData({...regData, password: e.target.value})} 
                      style={{ width: '100%', padding: '12px 40px 12px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} 
                    />
                    <button 
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{ position: 'absolute', right: '12px', bottom: '10px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                      >
                         {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                  </div>
                </div>

                {regType === 'doctor' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>SPECIALIZATION</label>
                      <input type="text" required value={regData.specialization} onChange={e => setRegData({...regData, specialization: e.target.value})} placeholder="E.G. CARDIOLOGY" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>CONTACT NO.</label>
                        <input type="text" required value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>ROOM NO.</label>
                        <input type="text" required value={regData.room_number} onChange={e => setRegData({...regData, room_number: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                      </div>
                    </div>
                  </>
                )}

                {regType !== 'doctor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>CONTACT NO.</label>
                    <input type="text" required value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700 }} />
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="btn-primary-premium" style={{ marginTop: '1.5rem', padding: '16px' }}>
                   {isSubmitting ? "PROCESSING..." : "ACTIVATE ACCESS"}
                </button>
                <button type="button" className="btn-outline-premium" onClick={() => setShowRegModal(false)} style={{ padding: '12px' }}>CANCEL</button>
             </form>
          </div>
        </div>
      )}

      {/* Assigned Patients Details Modal */}
      {detailsModalStaff && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setDetailsModalStaff(null)} />
          <div className="card-premium" style={{ width: '650px', background: '#fff', position: 'relative', borderTop: '6px solid var(--bg-side)', padding: '2.5rem', zIndex: 1010 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>ASSIGNED PATIENTS</h2>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>ROSTER FOR {detailsModalStaff.name} ({detailsModalStaff.role})</p>
              </div>
              <button 
                onClick={() => setDetailsModalStaff(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '2rem' }} className="custom-scrollbar">
              <table className="data-table-premium" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 15px', fontSize: '0.7rem' }}>PATIENT ID</th>
                    <th style={{ padding: '12px 15px', fontSize: '0.7rem' }}>NAME</th>
                    <th style={{ padding: '12px 15px', fontSize: '0.7rem' }}>CONTACT DETAILS</th>
                    {detailsModalStaff.role === "NURSE" && (
                      <th style={{ padding: '12px 15px', fontSize: '0.7rem' }}>ASSIGNED DOCTOR</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {detailsModalStaff.assignedPatients.map((pat: any, index: number) => (
                    <tr key={index} className="hover-row">
                      <td style={{ padding: '12px 15px', fontSize: '0.75rem', fontWeight: 700 }}>{pat.id}</td>
                      <td style={{ padding: '12px 15px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{pat.name}</td>
                      <td style={{ padding: '12px 15px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <div><strong>Phone:</strong> {pat.phone}</div>
                        <div><strong>Email:</strong> {pat.email}</div>
                      </td>
                      {detailsModalStaff.role === "NURSE" && (
                        <td style={{ padding: '12px 15px', fontSize: '0.75rem', fontWeight: 700 }}>{pat.doctor}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setDetailsModalStaff(null)}
                className="btn-primary-premium"
                style={{ padding: '10px 24px' }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
