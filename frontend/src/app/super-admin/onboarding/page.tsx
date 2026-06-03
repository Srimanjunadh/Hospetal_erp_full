"use client";
import { useState, useEffect } from "react";
import { Plus, Hospital, MapPin, ShieldCheck, Key, Server, Activity, CheckCircle, ArrowRight, Zap, Database, Mail, RefreshCcw, User, Phone } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { motion } from "framer-motion";
import { apiService } from "@/services/api";

export default function ProvisioningPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [formData, setFormData] = useState({ name: "", adminId: "", password: "", phone: "", location: "", nodeCode: "", specialization: "Multi-Specialty" });
  const [activeRegistry, setActiveRegistry] = useState<any[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoadingRegistry(true);
    try {
      const data = await apiService.getAdmins();
      if (Array.isArray(data)) {
        setActiveRegistry(data);
      }
    } catch (error) {
      showToast("Failed to fetch node registry", "error");
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  const generateUniqueCode = () => {
    let newCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 100) {
      newCode = Math.floor(1000 + Math.random() * 9000).toString();
      const exists = activeRegistry.some(node => node.node_code === newCode);
      if (!exists) isUnique = true;
      attempts++;
    }

    setFormData({ ...formData, nodeCode: newCode });
    showToast(`Unique Node ID Generated: ${newCode}`, "success");
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.adminId || !formData.password || !formData.nodeCode) {
      if (!formData.nodeCode) showToast("Please generate a Node ID first", "error");
      return;
    }
    
    setIsDeploying(true);
    try {
      const data = await apiService.register({
        name: formData.name,
        username: formData.adminId,
        password: formData.password,
        phone: formData.phone,
        role: "hospital_admin",
        node_code: formData.nodeCode,
        location: formData.location,
        specialization: formData.specialization
      });

      if (data.access_token) {
        showToast(`NODE ${formData.name.toUpperCase()} PROVISIONED SUCCESSFULLY`, "success");
        setFormData({ name: "", adminId: "", password: "", phone: "", location: "", nodeCode: "", specialization: "Multi-Specialty" });
        fetchAdmins();
      } else {
        showToast(data.detail || "Deployment Failed", "error");
      }
    } catch (error) {
      showToast("Network Protocol Error", "error");
    } finally {
      setIsDeploying(false);
    }
  };

  if (!mounted) return null;

  const inputStyle = {
    width: '100%',
    padding: '14px 16px 14px 48px',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontWeight: 650,
    fontSize: '0.85rem',
    outline: 'none',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    letterSpacing: '0.5px'
  };

  return (
    <DashboardLayout role="super_admin" userName="Master Admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>FACILITY PROVISIONING</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>ROOT NODE DEPLOYMENT • GLOBAL NETWORK EXPANSION</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div style={{ padding: '8px 16px', borderRadius: '30px', background: '#eef7f6', color: '#067D71', fontSize: '0.75rem', fontWeight: 900, border: '1px solid #cbd5e1' }}>
              NETWORK NODES: {activeRegistry.length} / 50
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
        
        {/* Onboarding Form */}
        <div className="card-premium" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '2.5rem', color: 'var(--text-primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>FACILITY IDENTITY & ACCESS</h3>
          
          <form onSubmit={handleProvision} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>FACILITY NAME</label>
              <div style={{ position: 'relative' }}>
                <Hospital style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="E.G. METRO CORE HOSPITAL" 
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>FACILITY LOCATION (CITY/STATE)</label>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input 
                  type="text" 
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="E.G. NEW YORK, NY" 
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>FACILITY SPECIALIZATION</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <select 
                  required
                  title="Facility Specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="Multi-Specialty">Multi-Specialty</option>
                  <option value="General Hospital">General Hospital</option>
                  <option value="Super Specialty">Super Specialty</option>
                  <option value="Teaching Hospital">Teaching Hospital</option>
                  <option value="Children's Hospital">Children's Hospital</option>
                  <option value="Women's Hospital">Women's Hospital</option>
                  <option value="Heart Center">Heart Center</option>
                  <option value="Eye Care Center">Eye Care Center</option>
                  <option value="ENT Center">ENT Center</option>
                </select>
                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
                  <Plus size={14} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>SECURE NODE IDENTITY (4-DIGIT)</label>
                <div style={{ position: 'relative' }}>
                  <Zap style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                  <input 
                    type="text" 
                    readOnly
                    value={formData.nodeCode}
                    placeholder="CLICK GENERATE --->" 
                    style={{ ...inputStyle, letterSpacing: '4px', border: '1px solid #cbd5e1', fontWeight: 800 }}
                  />
                </div>
              </div>
              <button 
                type="button"
                onClick={generateUniqueCode}
                className="btn-outline-premium" 
                style={{ height: '48px', padding: '0 20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                GENERATE UNIQUE CODE
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>ADMIN NETWORK ID (FOR LOGIN)</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input 
                  type="text" 
                  required
                  value={formData.adminId}
                  onChange={(e) => setFormData({...formData, adminId: e.target.value})}
                  placeholder="E.G. ADMIN_METRO_01" 
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>ADMIN MOBILE NUMBER</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="E.G. +91 98765 43210" 
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>ACCESS PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Key style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••" 
                  style={inputStyle}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isDeploying}
              className="btn-primary-premium" 
              style={{ padding: '16px', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '12px', opacity: isDeploying ? 0.7 : 1 }}
            >
              {isDeploying ? (
                <>
                  <Activity className="animate-spin" size={20} />
                  DEPLOYING NODE...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  PROVISION FACILITY NODE
                </>
              )}
            </button>
          </form>
        </div>

        {/* Deployment Metrics & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card-premium" style={{ background: 'var(--bg-side)', color: '#fff', padding: '2rem' }}>
             <h3 style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '1.5rem', color: '#fff' }}>DEPLOYMENT STATUS</h3>
             {isDeploying ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85rem', fontWeight: 600 }}>
                     <Database className="animate-pulse" size={18} style={{ color: '#00f2fe' }} /> <span>INITIALIZING DB NODE...</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85rem', fontWeight: 600 }}>
                     <Server className="animate-bounce" size={18} style={{ color: '#00f2fe' }} /> <span>CONFIGURING PMS INTERFACE...</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '100%' }}
                       transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                       style={{ height: '100%', background: '#00f2fe' }}
                     />
                  </div>
               </div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: 0.8 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={16} style={{ color: '#00f2fe' }} /> AWAITING NEXT NODE REQUEST...
                  </p>
               </div>
             )}
          </div>

          <div className="card-premium" style={{ padding: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '2px', color: 'var(--text-primary)' }}>LIVE IDENTITY REGISTRY</h3>
                <button onClick={fetchAdmins} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <RefreshCcw size={16} className={isLoadingRegistry ? "animate-spin" : ""} />
                </button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {isLoadingRegistry ? (
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textAlign: 'center', padding: '2rem' }}>SYNCHRONIZING WITH ROOT DB...</p>
                ) : activeRegistry.length > 0 ? activeRegistry.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderLeft: '4px solid #067D71', borderRadius: '4px' }}>
                     <div>
                        <p style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{(p.name || p.username || 'UNKNOWN').toUpperCase()}</p>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                           CONTACT: <span style={{ color: 'var(--text-primary)' }}>{p.phone || p.email || 'N/A'}</span>
                        </p>
                     </div>
                     <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10b981', padding: '4px 10px', background: '#e6f4ea', borderRadius: '12px' }}>ACTIVE NODE</span>
                  </div>
                )) : (
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textAlign: 'center', padding: '2rem' }}>NO IDENTITIES ANCHORED YET</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
