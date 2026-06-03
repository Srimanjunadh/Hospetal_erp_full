"use client";
import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

export default function DoctorSettingsPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [sessionUser, setSessionUser] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: ""
  });

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session) {
      setSessionUser(session.name);
      setFormData(prev => ({ ...prev, name: session.name }));
    }
  }, []);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Profile Update Request Sent for Approval", "success");
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="doctor" userName={sessionUser}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Identity Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>
          MANAGE CLINICAL CREDENTIALS & PROFILE DATA
        </p>
      </div>

      <div className="card-premium" style={{ maxWidth: '800px', padding: '3rem' }}>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>FULL LEGAL NAME</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="search-input-premium" style={{ paddingLeft: '45px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="search-input-premium" style={{ paddingLeft: '45px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CONTACT PHONE</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="search-input-premium" style={{ paddingLeft: '45px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>SECURITY LEVEL</label>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', fontWeight: 800, fontSize: '0.8rem', borderRadius: '30px' }}>
                 <Shield size={16} color="#a7f3d0" /> CLINICAL ACCESS LEVEL 4
               </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '1rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CURRENT PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input type="password" value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})} className="search-input-premium" style={{ paddingLeft: '45px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>NEW SECURE PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} className="search-input-premium" style={{ paddingLeft: '45px' }} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary-premium" style={{ marginTop: '1.5rem', justifyContent: 'center', height: '54px' }}>
            <Save size={20} /> COMMIT IDENTITY CHANGES
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
