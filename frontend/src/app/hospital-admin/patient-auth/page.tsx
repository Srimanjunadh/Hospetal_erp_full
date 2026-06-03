"use client";
import { useState, useEffect } from "react";
import { Users, User, ShieldCheck, Plus, Search, Filter, Activity, Lock, Phone, CreditCard, RefreshCcw, Tag, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

interface Doctor {
  id: number;
  user?: {
    name: string;
  };
  specialization?: string;
}

interface Nurse {
  id: number;
  name: string;
  role: string;
}

interface PatientAuth {
  id: string;
  name: string;
  phone: string;
  password: string;
  doctor: string;
  status: string;
}

export default function PatientAuthPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", 
    phone: "", 
    password: "", 
    customId: "", 
    assignedDoctor: "", 
    assignedNurse: "",
    age: "",
    location: "",
    weight: ""
  });
  const [patientAuths, setPatientAuths] = useState<PatientAuth[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const fetchClinicians = async () => {
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const hId = session?.hospital_id;
      const [docs, users] = await Promise.all([
        apiService.getDoctors(hId),
        apiService.getUsers(undefined, hId)
      ]);
      setDoctors(Array.isArray(docs) ? docs : []);
      setNurses(Array.isArray(users) ? users.filter((u: Nurse) => u.role === 'nurse') : []);
    } catch (error) {
      console.error("Staff fetch failed:", error);
      showToast("Identity Synchronization Interrupted", "error");
    }
  };

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const hId = session?.hospital_id;
      const data = await apiService.getPatients(hId);
      if (Array.isArray(data)) {
        interface RawPatient {
          id: number;
          username?: string;
          name: string;
          phone?: string;
          cleartext_password?: string;
          assigned_doctor?: {
            user?: {
              name?: string;
            };
          };
        }
        const formatted = (data as RawPatient[]).map((p: RawPatient) => ({
          id: p.username || `OP-${p.id}`,
          name: p.name.toUpperCase(),
          phone: p.phone || "N/A",
          password: p.cleartext_password || "••••••••",
          doctor: p.assigned_doctor?.user?.name || "UNASSIGNED",
          status: "ACTIVE"
        }));
        setPatientAuths(formatted);
      }
    } catch {
      showToast("Failed to fetch patient registry", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const generateOpId = () => {
    const nextNum = patientAuths.length + 1;
    return `OP-${new Date().getFullYear()}-${nextNum.toString().padStart(3, '0')}`;
  };

  useEffect(() => {
    setMounted(true);
    fetchPatients();
    fetchClinicians();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password) return;
    
    const assignedId = formData.customId || generateOpId();
    
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const node_code = session?.node_code;

      const data = await apiService.register({
        username: assignedId,
        name: formData.name,
        password: formData.password,
        role: "patient",
        phone: formData.phone,
        age: parseInt(formData.age) || undefined,
        location: formData.location,
        weight: parseFloat(formData.weight) || undefined,
        assigned_doctor_id: formData.assignedDoctor ? parseInt(formData.assignedDoctor) : undefined,
        node_code: node_code
      });

      if (data.access_token) {
        showToast(`OP IDENTITY ${assignedId} ASSIGNED TO ${formData.name}`, "success");
        setFormData({ 
          name: "", phone: "", password: "", customId: "", 
          assignedDoctor: "", assignedNurse: "",
          age: "", location: "", weight: ""
        });
        fetchPatients();
      } else {
        showToast(data.detail || "Registration Failed", "error");
      }
    } catch (error) {
      showToast("Network Error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="hospital_admin" userName="Hospital Admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>OP Registration Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Facility Access Management & Patient Onboarding</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem', marginBottom: '4rem', alignItems: 'start' }}>
        
        {/* Creation Form */}
        <div className="card-premium" style={{ padding: '2rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Register New Outpatient (OP)</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Patient Full Name</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. John Doe" 
                  style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Age</label>
                <input 
                  type="number" 
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="25" 
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Weight (kg)</label>
                <input 
                  type="number" 
                  required
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="70" 
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Location</label>
                <input 
                  type="text" 
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="New York" 
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Contact Number</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
                <input 
                  type="text" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 XXXXX XXXXX" 
                  style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Assigned Doctor</label>
              <select 
                value={formData.assignedDoctor}
                onChange={(e) => setFormData({...formData, assignedDoctor: e.target.value})}
                required
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                title="Assigned Doctor"
              >
                <option value="">SELECT CLINICIAN</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.user?.name?.toUpperCase()} ({d.specialization?.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Assign OP ID (Auto-gen if empty)</label>
                <div style={{ position: 'relative' }}>
                  <Tag style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
                  <input 
                    type="text" 
                    value={formData.customId}
                    onChange={(e) => setFormData({...formData, customId: e.target.value})}
                    placeholder={generateOpId()} 
                    style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Login Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••" 
                    style={{ width: '100%', padding: '12px 42px 12px 42px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', opacity: 0.7 }}
                    title="Toggle Reveal Password"
                  >
                     {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary-premium" style={{ width: '100%', height: '46px', marginTop: '1rem', gap: '10px', opacity: isSubmitting ? 0.7 : 1, justifyContent: 'center' }}>
              {isSubmitting ? <RefreshCcw className="animate-spin" size={16} /> : <Plus size={16} />} 
              {isSubmitting ? "Assigning..." : "Generate OP Credentials"}
            </button>
          </form>
        </div>

        {/* Access Registry */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>OP Identity Registry</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="text" placeholder="Search identities..." style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px 6px 30px', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
              </div>
              <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                <Filter size={14} /> FILTER
              </button>
              <button onClick={fetchPatients} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Refresh Patient Registry">
                <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="custom-scrollbar">
            <table className="data-table-premium">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>OP-Identity</th>
                  <th>Phone</th>
                  <th>Password</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Synchronizing registry...</td></tr>
                ) : patientAuths.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', fontWeight: 700, color: 'var(--text-secondary)' }}>No registered patients found</td></tr>
                ) : patientAuths.map((auth, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ fontWeight: 700 }}>
                      <p style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>{auth.name}</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 550, color: 'var(--text-secondary)' }}>{auth.id}</p>
                    </td>
                    <td style={{ fontWeight: 650, color: 'var(--text-secondary)' }}>{auth.phone}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-primary)', minWidth: '80px', textAlign: 'center' }}>
                          {revealedIds.includes(auth.id) ? auth.password : "••••••••"}
                        </code>
                        <button 
                          onClick={() => toggleReveal(auth.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                          title="Toggle Reveal Password"
                        >
                          {revealedIds.includes(auth.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        color: auth.status === 'ACTIVE' ? '#059669' : '#d97706',
                        background: auth.status === 'ACTIVE' ? '#ecfdf5' : '#fffbeb',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}>{auth.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

