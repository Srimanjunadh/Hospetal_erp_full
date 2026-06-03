"use client";
import { useState, useEffect, useCallback } from "react";
import { Key, User, Star, Phone, Home, RefreshCcw, Eye, EyeOff, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

interface DoctorAuth {
  id: string;
  name: string;
  specialty: string;
  room: string;
  password: string;
  status: string;
}

export default function DoctorAuthPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", 
    specialization: "", 
    phone: "", 
    roomNumber: "", 
    docId: "", 
    password: "" 
  });
  const [doctorAuths, setDoctorAuths] = useState<DoctorAuth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const hId = session?.hospital_id;
      
      const data = await apiService.getDoctors(hId);
      if (Array.isArray(data)) {
        interface RawDoctorData {
          id: number;
          room_number?: string;
          specialization?: string;
          user?: {
            username: string;
            name: string;
            cleartext_password?: string;
          };
        }
        const formatted = (data as RawDoctorData[]).map((d: RawDoctorData) => ({
          id: d.user?.username || `DOC-${d.id}`,
          name: d.user?.name?.toUpperCase() || "UNNAMED",
          specialty: d.specialization?.toUpperCase() || "GENERAL",
          room: d.room_number || "N/A",
          password: d.user?.cleartext_password || "••••••••",
          status: "ACTIVE"
        }));
        setDoctorAuths(formatted);
      }
    } catch {
      showToast("Failed to fetch clinical registry", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setMounted(true);
    fetchDoctors();
  }, [fetchDoctors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.docId || !formData.password) return;
    
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "{}");
      const data = await apiService.registerDoctor({
        username: formData.docId.startsWith("DOC") ? formData.docId.toUpperCase() : `DOC-${formData.docId.toUpperCase()}`,
        password: formData.password,
        name: formData.name,
        specialization: formData.specialization,
        phone: formData.phone,
        room_number: formData.roomNumber,
        node_code: session.node_code || session.hospital_node_code || ""
      });

      if (data.access_token) {
        showToast(`CREDENTIALS FOR ${formData.name} ACTIVATED`, "success");
        setFormData({ name: "", specialization: "", phone: "", roomNumber: "", docId: "", password: "" });
        fetchDoctors();
      } else {
        showToast(data.detail || "Forge Failed", "error");
      }
    } catch {
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
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Doctor Auth Forge</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Facility Access Management & Clinical Credentialing</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem', marginBottom: '4rem', alignItems: 'start' }}>
        
        {/* Creation Form */}
        <div className="card-premium" style={{ padding: '2rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Forge New Credentials</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Doctor Full Name</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Dr. Alice Reed" 
                  style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Clinical Specialty</label>
                <div style={{ position: 'relative' }}>
                  <Star style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
                  <input 
                    type="text" 
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    placeholder="Neurosurgery" 
                    style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX" 
                    style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Ward / Room No.</label>
                <div style={{ position: 'relative' }}>
                  <Home style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
                  <input 
                    type="text" 
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    placeholder="e.g. Ward-B1" 
                    style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Doc-ID (For Login)</label>
                <input 
                  type="text" 
                  required
                  value={formData.docId}
                  onChange={(e) => setFormData({...formData, docId: e.target.value})}
                  placeholder="DOC-001" 
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Initial Access Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••" 
                    style={{ width: '100%', padding: '12px 42px 12px 14px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
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

            <button type="submit" disabled={isSubmitting} className="btn-primary-premium" style={{ width: '100%', height: '46px', marginTop: '1rem', gap: '10px', opacity: isSubmitting ? 0.7 : 1, justifyContent: 'center' }}>
              {isSubmitting ? <RefreshCcw className="animate-spin" size={16} /> : <Key size={16} />} 
              {isSubmitting ? "Forging Access..." : "Generate Clinical Credentials"}
            </button>
          </form>
        </div>

        {/* Credential Registry */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
           <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Clinical Access Registry</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="text" placeholder="Search identities..." style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px 6px 30px', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                </div>
                <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Filter size={14} /> FILTER
                </button>
                <button onClick={fetchDoctors} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Refresh Doctors List">
                  <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
                </button>
              </div>
           </div>
           <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="custom-scrollbar">
             <table className="data-table-premium">
               <thead>
                 <tr>
                   <th>S.No</th>
                   <th>Doc-Identity</th>
                   <th>Specialty</th>
                   <th>Room</th>
                   <th>Password</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {isLoading ? (
                   <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Fetching clinical nodes...</td></tr>
                 ) : doctorAuths.length === 0 ? (
                   <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', fontWeight: 700, color: 'var(--text-secondary)' }}>No registered clinicians found</td></tr>
                 ) : doctorAuths.map((auth, i) => (
                   <tr key={i}>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                     <td style={{ fontWeight: 700 }}>
                        <p style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>{auth.name}</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 550, color: 'var(--text-secondary)' }}>{auth.id}</p>
                     </td>
                     <td style={{ fontWeight: 650, color: 'var(--text-secondary)' }}>{auth.specialty}</td>
                     <td style={{ fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.8 }}>{auth.room}</td>
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
