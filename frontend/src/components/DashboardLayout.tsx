"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Search, Bell, LogOut, Calendar, Package, X, Clock, Menu, Palette, Plus, Shield } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children, role, userName: initialUserName }: { children: React.ReactNode, role: string, userName: string }) {
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(initialUserName);
  const [theme, setTheme] = useState<"black" | "teal">("teal");
  const [sessionCode, setSessionCode] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("medclues_theme") as "black" | "teal" || "teal";
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      
      const customColor = localStorage.getItem("medclues_custom_color");
      if (customColor) {
        document.documentElement.style.setProperty('--bg-side', customColor);
      }
    }
  }, []);

  const PREDEFINED_COLORS = ['#1e3a8a', '#0f172a', '#067D71', '#4c1d95', '#9f1239', '#b45309', '#0284c7'];
  
  const cycleColor = () => {
    const currentColor = localStorage.getItem("medclues_custom_color") || '#1e3a8a';
    const currentIndex = PREDEFINED_COLORS.indexOf(currentColor);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PREDEFINED_COLORS.length;
    const newColor = PREDEFINED_COLORS[nextIndex];
    document.documentElement.style.setProperty('--bg-side', newColor);
    localStorage.setItem('medclues_custom_color', newColor);
  };

  // Immediate Session Sync: Before any rendering or effects, ensure the active session
  // matches the current portal role. This prevents multi-tab role conflicts.
  if (typeof window !== "undefined") {
    const roleSession = localStorage.getItem(`medclues_session_${role}`);
    if (roleSession) {
      localStorage.setItem("medclues_session", roleSession);
    }
  }

  useEffect(() => {
    const checkAuth = () => {
      const roleKey = `medclues_session_${role}`;
      const session = JSON.parse(localStorage.getItem(roleKey) || localStorage.getItem("medclues_session") || "null");
      
      if (session) {
        // Only redirect if the session we found absolutely doesn't match the role
        if (session.role !== role) {
          window.location.href = "/login";
          return;
        }
        
        // Sync back to generic key for legacy component support
        localStorage.setItem("medclues_session", JSON.stringify(session));
        localStorage.setItem(roleKey, JSON.stringify(session));

        setSessionUser(session.name || session.id || initialUserName);
        setSessionCode(session.username || session.id || "");
        setMounted(true);
      } else {
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, [role, initialUserName]);

  if (!mounted) return null;

  const notifications = [
    { id: 1, type: 'APPOINTMENT', text: "UPCOMING: DR. SARAH SMITH AT 10:30 AM", time: "15m left", icon: <Calendar size={14} /> },
    { id: 2, type: 'PHARMACY', text: "ORDER #REF-9021-3 PROCESSED", time: "1h ago", icon: <Package size={14} /> },
  ];

  return (
    <div className="app-container" suppressHydrationWarning>
      <Sidebar role={role} isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <div className="main-wrapper">
        <header className="main-header-premium">
          {/* Left search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-only" 
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
            >
              <Menu size={22} style={{ color: 'var(--bg-side)' }} />
            </button>
            <div className="desktop-only" style={{ position: 'relative' }}>
              <Search 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} 
                size={18} 
              />
              <input 
                type="text" 
                placeholder="Search..." 
                className="search-input-premium"
              />
            </div>
          </div>

          {/* Right actions matching the header items in the design image */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            
            {/* Context action matching Creator Mode button */}
            {role === "super_admin" && (
              <button 
                onClick={() => {
                  const event = new CustomEvent("open-provision-modal");
                  window.dispatchEvent(event);
                }}
                className="btn-primary-premium"
              >
                <Plus size={16} />
                <span>Creator Mode</span>
              </button>
            )}

            {/* Theme switcher */}
            <button 
              onClick={cycleColor} 
              title="Cycle Theme Color"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            >
              <Palette size={20} />
            </button>

            {/* Notification bell */}
            <button 
              onClick={() => setShowNotifications(true)} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', padding: '8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            >
              <Bell size={20} />
              <div style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#0ea5e9', borderRadius: '50%' }}></div>
            </button>

            {/* User Profile Info with active indicator dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
              <div className="desktop-only" style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{sessionUser}</p>
                <p style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{role.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#067D71', border: '2px solid #ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {sessionUser.charAt(0).toUpperCase()}
                <div style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', background: '#10b981', border: '2px solid #ffffff', borderRadius: '50%' }}></div>
              </div>
            </div>

            {/* Logout button */}
            <Link 
              href="/logout" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                border: '1px solid #e2e8f0', 
                color: 'var(--text-secondary)', 
                background: '#ffffff',
                transition: 'all 0.2s ease'
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </Link>
          </div>
        </header>

        <main className="main-content-premium" style={{ minHeight: 'calc(100vh - 80px)' }}>
          {children}
        </main>
      </div>

      {/* Notification Side Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 600 }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '350px', maxWidth: '85vw', background: '#fff', zIndex: 700, borderLeft: '4px solid var(--bg-side)', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-side)', color: '#fff' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '1px' }}>Notifications</h3>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '0.75rem' }}>
                    <div style={{ padding: '8px', background: '#f0f4f4', color: 'var(--bg-side)', height: 'fit-content', borderRadius: '8px' }}>{n.icon}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '2px' }}>{n.text}</p>
                      <p style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{n.time.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
