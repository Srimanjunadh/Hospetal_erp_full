"use client";
import { useState, useEffect } from "react";
import { 
  Activity, Users, Clock, MessageSquare, Hospital, Shield, 
  LayoutDashboard, LogOut, Package, ShieldAlert, X, ShieldCheck, 
  Plus, Key, Pill, Clipboard, Edit3, Bed, FlaskConical, CreditCard,
  HelpCircle, Home, Menu, FileText, Monitor, HelpCircle as HelpIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ role, isOpen, setIsOpen }: { role: string, isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // We map specific ERP paths to matching aesthetic icons from the design image for Super Admin
  const getIconForSuperAdmin = (path: string, defaultIcon: React.ReactNode) => {
    if (role !== "super_admin") return defaultIcon;
    switch (path) {
      case "/super-admin":
        return <Home size={22} />;
      case "/super-admin/hospitals":
        return <Menu size={22} />;
      case "/super-admin/staff":
        return <FileText size={22} />;
      case "/super-admin/incidents":
        return <MessageSquare size={22} />;
      case "/super-admin/inventory":
        return <Monitor size={22} />;
      case "/super-admin/onboarding":
        return <Plus size={22} />;
      default:
        return defaultIcon;
    }
  };

  const menuItems: any = {
    patient: [
      { name: "DASHBOARD", icon: <Home size={22} />, path: "/patient" },
      { name: "APPOINTMENTS", icon: <Clock size={22} />, path: "/patient/appointments" },
      { name: "RECORDS", icon: <FileText size={22} />, path: "/patient/records" },
      { name: "PHARMACY", icon: <Package size={22} />, path: "/patient/pharmacy" },
      { name: "BILLING", icon: <CreditCard size={22} />, path: "/patient/billing" },
    ],
    doctor: [
      { name: "OVERVIEW", icon: <Home size={22} />, path: "/doctor" },
      { name: "PATIENTS", icon: <Users size={22} />, path: "/doctor/patients" },
      { name: "SURGICAL OT", icon: <Activity size={22} />, path: "/doctor/ot-schedule" },
      { name: "SCHEDULE", icon: <Clock size={22} />, path: "/doctor/schedule" },
      { name: "CONSULT", icon: <MessageSquare size={22} />, path: "/doctor/consultations" },
      { name: "SETTINGS", icon: <Edit3 size={22} />, path: "/doctor/settings" },
    ],
    hospital_admin: [
      { name: "PMS STATUS", icon: <Home size={22} />, path: "/hospital-admin" },
      { name: "STAFFING", icon: <Users size={22} />, path: "/hospital-admin/staff" },
      { name: "ADMISSIONS", icon: <Bed size={22} />, path: "/hospital-admin/admissions" },
      { name: "BLOOD BANK", icon: <Activity size={22} />, path: "/hospital-admin/blood-bank" },
      { name: "SURGICAL OT", icon: <Clipboard size={22} />, path: "/hospital-admin/ot-schedule" },
      { name: "INVENTORY", icon: <Package size={22} />, path: "/hospital-admin/inventory" },
      { name: "FACILITY CTRL", icon: <ShieldCheck size={22} />, path: "/hospital-admin/facility" },
      { name: "PATIENTS", icon: <Users size={22} />, path: "/hospital-admin/patients" },
      { name: "DOCTOR AUTH", icon: <Key size={22} />, path: "/hospital-admin/doctor-auth" },
      { name: "PATIENT AUTH", icon: <Users size={22} />, path: "/hospital-admin/patient-auth" },
      { name: "PHARMACY", icon: <Pill size={22} />, path: "/hospital-admin/pharmacy" },
    ],
    nurse: [
      { name: "COMMAND", icon: <Home size={22} />, path: "/nurse" },
      { name: "PATIENTS", icon: <Users size={22} />, path: "/nurse-select-patient" },
      { name: "REQUISITIONS", icon: <Clipboard size={22} />, path: "/nurse/requisitions" },
    ],
    lab: [
      { name: "DIAGNOSTICS", icon: <FlaskConical size={22} />, path: "/lab" },
      { name: "PENDING", icon: <Clock size={22} />, path: "/lab/pending" },
    ],
    super_admin: [
      { name: "GLOBAL HUB", icon: <Shield size={22} />, path: "/super-admin" },
      { name: "HOSPITALS", icon: <Hospital size={22} />, path: "/super-admin/hospitals" },
      { name: "PERSONNEL", icon: <Users size={22} />, path: "/super-admin/staff" },
      { name: "INVENTORY", icon: <Package size={22} />, path: "/super-admin/inventory" },
      { name: "INCIDENT HUB", icon: <ShieldAlert size={22} />, path: "/super-admin/incidents" },
      { name: "PROVISIONING", icon: <Plus size={22} />, path: "/super-admin/onboarding" },
    ]
  };

  const items = menuItems[role] || [];

  const sidebarContent = (
    <aside className="sidebar-element">
      {/* Aesthetic SL Logo container */}
      <div style={{ 
        width: '44px', 
        height: '44px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'transparent',
        marginBottom: '3rem',
        borderRadius: '8px'
      }}>
        <img src="/custom_icon.png" alt="Medical Icon" width={36} height={36} style={{ objectFit: 'contain' }} />
      </div>
      
      {/* Navigation items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
        {items.map((item: any) => {
          const isActive = pathname === item.path;
          const displayIcon = getIconForSuperAdmin(item.path, item.icon);
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              onClick={() => setIsOpen(false)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="sidebar-icon-wrapper">
                {displayIcon}
              </div>
              <span className="sidebar-text">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Support / Help Icon at the bottom */}
      <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <a 
          href="#help" 
          className="sidebar-nav-item"
          style={{ height: '44px', color: 'rgba(255, 255, 255, 0.4)' }}
        >
          <div className="sidebar-icon-wrapper">
            <HelpIcon size={20} />
          </div>
          <span className="sidebar-text">SUPPORT & HELP</span>
        </a>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="desktop-only" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 400 }}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 500 }}
            >
              <div style={{ display: 'flex' }}>
                {sidebarContent}
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ 
                    position: 'absolute', 
                    top: '20px', 
                    left: '100px', 
                    background: '#fff', 
                    border: 'none', 
                    borderRadius: '50%',
                    padding: '8px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    cursor: 'pointer' 
                  }}
                >
                  <X size={20} style={{ color: '#067D71' }} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
