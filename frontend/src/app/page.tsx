"use client";
import { motion } from "framer-motion";
import { 
  CheckCircle2, ArrowRight, Activity, Users, Hospital, Fingerprint, 
  Globe, Shield, Layout, Settings, Sun, ChevronDown, Check,
  Building2, Users2, Calendar, FlaskConical, ShieldCheck,
  BarChart3, Lock, Zap, FileText, Menu, X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#fafcff', color: '#0f172a', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      
      {/* Navigation */}
      <nav style={{ padding: '1rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          <img src="/custom_icon.png" alt="Logo" width={28} height={28} style={{ objectFit: 'contain' }} />
          <span>MEDCLUES+</span>
        </div>

        {/* Center Links (Desktop) */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
          <Link href="http://localhost:5173" style={{ color: '#2563eb', borderBottom: '2px solid #2563eb', paddingBottom: '2px', textDecoration: 'none' }}>Home</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>Modules <ChevronDown size={14} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>Solutions <ChevronDown size={14} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>Resources <ChevronDown size={14} /></div>
          <Link href="http://localhost:5173" style={{ color: 'inherit', textDecoration: 'none' }}>PMS Portal</Link>
        </div>

        {/* Right Actions */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' }}>
            <Sun size={20} />
          </button>
          <Link href="/login" style={{ padding: '8px 24px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            Login
          </Link>
          <Link href="/register" style={{ padding: '8px 24px', background: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>
            Request Demo
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" style={{ display: 'none', background: 'none', border: 'none' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '4rem 4rem 2rem 4rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '4rem', alignItems: 'center' }}>
        {/* Left Content */}
        <div style={{ flex: '1.2' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '2rem' }}>
              <div style={{ width: '8px', height: '8px', background: '#2563eb', borderRadius: '50%' }}></div>
              All-in-One Healthcare Ecosystem
            </div>
            
            <h1 style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.1, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-1px' }}>
              The Operating System <br />
              for <span style={{ color: '#2563eb' }}>Modern Health.</span>
            </h1>
            
            <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '540px' }}>
              MedClues+ unifies hospitals, doctors, patients, labs and operations in a single intelligent platform.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} color="#2563eb" /> Real-time Intelligence</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} color="#2563eb" /> Unified Workflows</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} color="#2563eb" /> Secure & Compliant</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/login" style={{ padding: '14px 28px', background: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>
                Enter the Hub <ArrowRight size={18} />
              </Link>
              <Link href="http://localhost:5173" style={{ padding: '14px 28px', background: '#fff', border: '1px solid #cbd5e1', color: '#2563eb', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
                Login to PMS Portal
              </Link>
              <div style={{ padding: '14px 28px', background: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} /> v3.2.0 Stable
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Dashboard Mockup */}
        <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
           <motion.div 
             initial={{ opacity: 0, x: 20 }} 
             animate={{ opacity: 1, x: 0 }} 
             transition={{ duration: 0.6, delay: 0.2 }}
             style={{
               background: '#fff',
               borderRadius: '16px',
               boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
               width: '100%',
               maxWidth: '650px',
               overflow: 'hidden',
               border: '1px solid #f1f5f9'
             }}
           >
             {/* Mockup Header */}
             <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800 }}><Activity size={16} color="#2563eb" /> MEDCLUES+</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#f1f5f9', width: '200px', height: '28px', borderRadius: '14px' }}></div>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                </div>
             </div>
             {/* Mockup Body */}
             <div style={{ display: 'flex', height: '350px' }}>
               {/* Sidebar */}
               <div style={{ width: '140px', borderRight: '1px solid #f1f5f9', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, display: 'flex', gap: '6px' }}><Layout size={12}/> Global Hub</div>
                  {[Hospital, Users, Activity, Calendar, FlaskConical, FileText, Settings].map((Icon, i) => (
                    <div key={i} style={{ padding: '4px 8px', color: '#64748b', fontSize: '0.7rem', fontWeight: 500, display: 'flex', gap: '6px' }}><Icon size={12}/> Item {i+1}</div>
                  ))}
               </div>
               {/* Main Content */}
               <div style={{ flex: 1, padding: '20px', background: '#fafcff' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px' }}>GLOBAL COMMAND CENTER</h3>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '20px' }}>Root Terminal • Encrypted Session</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {["Total Patients", "Active Hospitals", "Today's Appointments"].map((t, i) => (
                      <div key={i} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '8px', display: 'flex', gap: '4px' }}><Users size={10} color="#2563eb" /> {t}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{i === 0 ? '18,583' : i === 1 ? '24' : '256'}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '140px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                     {/* Fake bar chart */}
                     {[40, 60, 30, 80, 50, 90, 45, 75, 100].map((h, i) => (
                       <div key={i} style={{ flex: 1, background: i === 8 ? '#2563eb' : '#e2e8f0', height: `${h}%`, borderRadius: '4px 4px 0 0' }}></div>
                     ))}
                  </div>
               </div>
             </div>
           </motion.div>
        </div>
      </section>

      {/* Portals Grid */}
      <section style={{ padding: '4rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: "Patient Portal", icon: <Users size={24} color="#2563eb" />, bg: '#eff6ff', desc: "Access medical records, appointments & reports", path: "/login?role=patient" },
            { title: "Doctor Terminal", icon: <Activity size={24} color="#16a34a" />, bg: '#dcfce7', desc: "Manage schedules, patients & consultations", path: "/login?role=doctor" },
            { title: "Nurse Terminal", icon: <Users2 size={24} color="#9333ea" />, bg: '#f3e8ff', desc: "Patient monitoring & care coordination", path: "/login?role=nurse" },
            { title: "Laboratory Hub", icon: <FlaskConical size={24} color="#ea580c" />, bg: '#ffedd5', desc: "Diagnostics workflow & lab management", path: "/login?role=lab" },
            { title: "Hospital ERP", icon: <Building2 size={24} color="#e11d48" />, bg: '#ffe4e6', desc: "Complete facility management suite", path: "/login?role=hospital_admin" },
            { title: "PMS Ecosystem", icon: <Globe size={24} color="#0284c7" />, bg: '#e0f2fe', desc: "Integrated practice management solution", path: "http://localhost:5173" },
          ].map((node, i) => (
            <Link key={i} href={node.path} style={{ textDecoration: 'none', color: 'inherit' }}>
              <motion.div
                whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                style={{ 
                  background: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '1.5rem', 
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: node.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  {node.icon}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>{node.title}</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>{node.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 4rem' }}>
        <div style={{ background: '#0f172a', borderRadius: '16px', padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', color: '#fff' }}>
          {[
            { value: "24+", label: "Active Hospitals", icon: <Building2 size={32} color="#3b82f6" /> },
            { value: "18K+", label: "Patients Managed", icon: <Users size={32} color="#22c55e" /> },
            { value: "256+", label: "Appointments Today", icon: <Calendar size={32} color="#a855f7" /> },
            { value: "12K+", label: "Lab Tests Processed", icon: <FlaskConical size={32} color="#f59e0b" /> },
            { value: "99.98%", label: "System Uptime", icon: <ShieldCheck size={32} color="#06b6d4" /> },
          ].map((stat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>{stat.icon}</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '6rem 4rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '4rem', alignItems: 'center' }}>
        {/* Left Features List */}
        <div style={{ flex: '1' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Built for Healthcare. Designed for Impact.
          </div>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, color: '#0f172a', marginBottom: '3rem', letterSpacing: '-1px' }}>
            Everything You Need. <br />
            <span style={{ color: '#2563eb' }}>One Unified Platform.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {[
              { title: "Unified Dashboard", desc: "Real-time overview of entire ecosystem", icon: <Layout size={20} color="#2563eb" /> },
              { title: "Workflow Automation", desc: "Automate recurring tasks & approvals", icon: <Activity size={20} color="#2563eb" /> },
              { title: "Role-Based Access", desc: "Secure access for every user type", icon: <Shield size={20} color="#2563eb" /> },
              { title: "Interoperability", desc: "Seamless integration across modules", icon: <Globe size={20} color="#2563eb" /> },
              { title: "Smart Analytics", desc: "Data-driven insights for better decisions", icon: <BarChart3 size={20} color="#2563eb" /> },
              { title: "Enterprise Security", desc: "HIPAA compliant & data encrypted", icon: <Lock size={20} color="#2563eb" /> },
            ].map((feat, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {feat.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{feat.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link href="/modules" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}>
            Explore All Modules <ArrowRight size={18} />
          </Link>
        </div>

        {/* Right Dashboard Mockup 2 */}
        <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
           <div style={{
               background: '#fff',
               borderRadius: '16px',
               boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
               width: '100%',
               maxWidth: '650px',
               overflow: 'hidden',
               border: '1px solid #f1f5f9',
               display: 'flex',
               height: '450px'
             }}>
               {/* Dark Sidebar */}
               <div style={{ width: '180px', background: '#0f172a', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem' }}><Activity size={18} color="#fff" /> MEDCLUES+</div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}><Layout size={14}/> Global Hub</div>
                  {[Hospital, Users, Activity, Calendar, FlaskConical, FileText, Settings].map((Icon, i) => (
                    <div key={i} style={{ padding: '8px 10px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, display: 'flex', gap: '8px', alignItems: 'center' }}><Icon size={14}/> {["Hospitals", "Patients", "Doctors", "Appointments", "Laboratory", "Pharmacy", "Settings"][i]}</div>
                  ))}
               </div>
               
               {/* Main Content */}
               <div style={{ flex: 1, padding: '24px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ background: '#f1f5f9', width: '200px', height: '32px', borderRadius: '16px' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Overview</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                    {[
                      { label: "Total Revenue", val: "$2.45M" },
                      { label: "OPD Visits", val: "4,892" },
                      { label: "IPD Admissions", val: "1,246" },
                      { label: "Discharges", val: "1,105" }
                    ].map((s, i) => (
                      <div key={i}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Charts mockup */}
                  <div style={{ display: 'flex', gap: '20px' }}>
                     <div style={{ flex: 2 }}>
                       <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>Monthly Revenue Overview</div>
                       <div style={{ height: '120px', borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,80 Q10,70 20,75 T40,50 T60,60 T80,30 T100,20" fill="none" stroke="#2563eb" strokeWidth="2" />
                            <circle cx="20" cy="75" r="2" fill="#2563eb" />
                            <circle cx="40" cy="50" r="2" fill="#2563eb" />
                            <circle cx="60" cy="60" r="2" fill="#2563eb" />
                            <circle cx="80" cy="30" r="2" fill="#2563eb" />
                            <circle cx="100" cy="20" r="2" fill="#2563eb" />
                          </svg>
                       </div>
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>Top Departments</div>
                       {[
                         { name: "Cardiology", w: "80%" },
                         { name: "Neurology", w: "65%" },
                         { name: "Orthopedics", w: "45%" },
                         { name: "General", w: "30%" }
                       ].map((d, i) => (
                         <div key={i} style={{ marginBottom: '8px' }}>
                           <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '4px' }}>{d.name}</div>
                           <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px' }}>
                             <div style={{ width: d.w, height: '100%', background: '#2563eb', borderRadius: '2px' }}></div>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>
               </div>
           </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
          section { flex-direction: column !important; padding: 2rem !important; }
          .desktop-only { display: none; }
        }
      `}} />
    </div>
  );
}
