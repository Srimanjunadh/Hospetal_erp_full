"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, Shield, Key, ArrowRight, User, Lock, Mail, Heart, Stethoscope, Building2, Zap, Fingerprint, Command, ChevronLeft, Globe } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

type Role = "super_admin" | "hospital_admin" | "doctor" | "nurse" | "lab" | "patient";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url(/custom_login_bg.jpg) center/cover no-repeat fixed' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  // Initialize role from query param if available
  const initialRole = (searchParams.get("role") as Role) || "hospital_admin";
  const [role, setRole] = useState<Role>(initialRole);
  const [formData, setFormData] = useState({ identifier: "", password: "", nodeId: "", nurseId: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTheme = () => {
    switch (role) {
      case "super_admin":
        return { 
          label: "Enterprise Root", 
          icon: <Zap size={18} />,
          badge: "SECURE NODE • 01"
        };
      case "doctor":
        return { 
          label: "Clinical Terminal", 
          icon: <Stethoscope size={18} />,
          badge: "CLINICAL ACCESS"
        };
      case "nurse":
        return { 
          label: "Nursing Terminal", 
          icon: <Activity size={18} />,
          badge: "PATIENT CARE"
        };
      case "lab":
        return { 
          label: "Laboratory Hub", 
          icon: <Fingerprint size={18} />,
          badge: "DIAGNOSTIC NODE"
        };
      case "patient":
        return { 
          label: "Health Portal", 
          icon: <Heart size={18} />,
          badge: "USER IDENTITY"
        };
      default:
        return { 
          label: "Facility Admin", 
          icon: <Building2 size={18} />,
          badge: "FACILITY MGMT"
        };
    }
  };

  const theme = getTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiService.login({
        username: formData.identifier,
        password: formData.password,
        role: role, // Explicitly send the selected role
        node_code: formData.nodeId,
        nurse_id: formData.nurseId
      });

      if (data.access_token) {
        const sessionData = {
          token: data.access_token,
          id: data.user.id,
          name: data.user.name,
          username: data.user.username,
          role: data.user.role, // This will be the requested role for master
          hospital_id: data.user.hospital_id,
          node_code: formData.nodeId,
          doctor_id: data.user.doctor_id,
          doctor: data.user.doctor,
          nurse: data.user.nurse
        };
        localStorage.setItem("medclues_session", JSON.stringify(sessionData));
        localStorage.setItem(`medclues_session_${data.user.role}`, JSON.stringify(sessionData));
        showToast(`Authorized: ${data.user.name}`, "success");

        setTimeout(() => {
          if (data.user.role === "super_admin") router.push("/super-admin");
          else if (data.user.role === "hospital_admin") router.push("/hospital-admin");
          else if (data.user.role === "doctor") router.push("/doctor");
          else if (data.user.role === "nurse") router.push("/nurse");
          else if (data.user.role === "lab") router.push("/lab");
          else router.push("/patient");
        }, 500);
      } else {
        showToast(data.detail || "Access Denied", "error");
      }
    } catch (error) {
      showToast("Network Failure", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url(/custom_login_bg.jpg) center/cover no-repeat fixed' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'url(/custom_login_bg.jpg) center/cover no-repeat fixed',
        fontFamily: 'var(--font-primary)',
        color: 'var(--text-primary)',
        padding: '2rem'
      }}
    >
      
      {/* System Navigation Hub */}
      <div style={{ 
        position: 'fixed',
        top: '2rem',
        left: '2rem',
        zIndex: 100
      }}>
        <Link href="/" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          textDecoration: 'none', 
          color: 'var(--bg-side)', 
          fontSize: '0.8rem', 
          fontWeight: 700,
          background: '#ffffff',
          padding: '10px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease'
        }}>
          <ChevronLeft size={16} /> Ecosystem Hub
        </Link>
      </div>

      {/* Role Selection Terminal */}
      <div style={{ 
        marginBottom: '2.5rem',
        textAlign: 'center',
        zIndex: 10
      }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)', marginBottom: '1rem', textTransform: 'uppercase' }}>Select Access Terminal</p>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px', 
          background: 'rgba(255, 255, 255, 0.7)', 
          padding: '8px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.8)'
        }}>
          {(["super_admin", "hospital_admin", "doctor", "nurse", "lab", "patient"] as Role[]).map((r) => (
              <button 
              key={r}
              onClick={() => setRole(r)}
              style={{ 
                padding: '10px 20px', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                border: 'none', 
                cursor: 'pointer',
                borderRadius: '12px',
                background: role === r ? 'var(--bg-side)' : 'transparent',
                color: role === r ? '#fff' : '#ffffff',
                textShadow: role === r ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
                boxShadow: role === r ? '0 4px 12px rgba(6, 125, 113, 0.3)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                textTransform: 'capitalize'
              }}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <motion.div 
        key={role}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
        style={{ 
          width: '100%',
          maxWidth: '420px', 
          background: '#ffffff', 
          padding: '3rem 2.5rem', 
          borderRadius: '24px',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          zIndex: 10
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
           <div style={{ 
             display: 'inline-flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             gap: '8px', 
             marginBottom: '1rem',
             background: '#f0fdfa',
             padding: '8px 16px',
             borderRadius: '20px',
             color: 'var(--color-accent)'
           }}>
             {theme.icon}
             <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px' }}>{theme.badge}</span>
           </div>
           <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{theme.label}</h1>
           <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sign in to MediClues+</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {role !== 'super_admin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Facility Node ID (4-Digit)</label>
              <div style={{ position: 'relative' }}>
                <Building2 style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} size={18} />
                <input 
                  type="text" 
                  required
                  maxLength={4}
                  value={formData.nodeId}
                  onChange={(e) => setFormData({...formData, nodeId: e.target.value.replace(/\D/g, '')})}
                  placeholder="0000" 
                  style={{ 
                    width: '100%', padding: '14px 16px 14px 44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                    fontWeight: 700, outline: 'none', color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '4px', transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 168, 155, 0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID Identifier</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} size={18} />
              <input 
                type="text" 
                required
                value={formData.identifier}
                onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                placeholder={role === 'patient' ? "Patient Identity" : "Network ID"} 
                style={{ 
                  width: '100%', padding: '14px 16px 14px 44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                  fontWeight: 600, outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', transition: 'all 0.3s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 168, 155, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Token</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} size={18} />
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••" 
                style={{ 
                  width: '100%', padding: '14px 16px 14px 44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                  fontWeight: 600, outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', transition: 'all 0.3s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 168, 155, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              padding: '16px', 
              marginTop: '1rem', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center', 
              gap: '12px',
              background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 20px rgba(14, 168, 155, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => { if(!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(14, 168, 155, 0.3)' }}
            onMouseOut={(e) => { if(!isLoading) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(14, 168, 155, 0.2)' }}
          >
            {isLoading ? "AUTHORIZING..." : "SECURE SIGN IN"}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '100%', height: '1px', background: '#f1f5f9' }}></div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
             <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
               © 2026 MEDCLUES+
             </p>
             <Link href="/pms" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
               <Globe size={14} /> PMS PORTAL
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}





