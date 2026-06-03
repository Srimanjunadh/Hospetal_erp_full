"use client";
import { useEffect, useState, useRef } from "react";
import { 
  Shield, Globe, Users, Hospital, TrendingUp, ShieldCheck, Zap, 
  Activity, Plus, AlertCircle, Server, Terminal, BarChart3, 
  LineChart, Lock, Unlock, Database, Cpu, Eye, EyeOff, Folder, CheckSquare,
  FileText, MessageSquare, ChevronLeft, ChevronRight, Gift
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/api";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startingDay = firstDay === 0 ? 6 : firstDay - 1;
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ val: prevMonthDays - i, current: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
      days.push({ val: i, current: true, active: isToday });
    }
    
    const neededSlots = days.length > 35 ? 42 : 35;
    const remaining = neededSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ val: i, current: false });
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };
  
  const [globalStats, setGlobalStats] = useState<any>({
    total_hospitals: 0,
    total_doctors: 0,
    total_staff: 0,
    total_patients: 0,
    total_revenue: 0
  });

  const [networkNodes, setNetworkNodes] = useState<any[]>([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [regData, setRegData] = useState({
    name: "",
    location: "",
    node_code: "",
    admin_name: "",
    admin_username: "",
    admin_password: ""
  });

  const fetchGlobalData = async () => {
    try {
      const [stats, nodes] = await Promise.all([
        apiService.getGlobalStats(),
        apiService.getHospitals()
      ]);
      setGlobalStats(stats);
      setNetworkNodes(nodes);
    } catch (e) {
      console.error("Global Sync Failed:", e);
    }
  };
  
  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session && session.role === "super_admin") {
      fetchGlobalData();
    }

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + " • " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    // Listen to "open-provision-modal" event from layout
    const handleOpenModal = () => {
      setShowRegModal(true);
    };
    window.addEventListener("open-provision-modal", handleOpenModal);

    return () => {
      clearInterval(timer);
      window.removeEventListener("open-provision-modal", handleOpenModal);
    };
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!networkNodes || networkNodes.length === 0) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth, children } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const cardWidth = children[0]?.clientWidth || 200;
          scrollRef.current.scrollBy({ left: cardWidth + 20, behavior: 'smooth' });
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [networkNodes]);

  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiService.registerHospital(regData);
      showToast(`HOSPITAL ${regData.name.toUpperCase()} PROVISIONED`, "success");
      setShowRegModal(false);
      setRegData({ name: "", location: "", node_code: "", admin_name: "", admin_username: "", admin_password: "" });
      fetchGlobalData();
    } catch (error) {
      showToast("Provisioning Failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  // Gracefully ensure we display exactly 3 card items under "My Projects" like the design image
  const displayNodes = [...networkNodes];
  const sampleHospitals = [
    { name: "Apollo Med Center", location: "New Delhi", node_code: "1012", doctor_count: 14, staff_count: 32, patient_count: 240, subscription_status: "ACTIVE" },
    { name: "City Care General", location: "Mumbai", node_code: "2088", doctor_count: 8, staff_count: 19, patient_count: 145, subscription_status: "ACTIVE" },
    { name: "St. Jude Clinic", location: "Bangalore", node_code: "3051", doctor_count: 12, staff_count: 24, patient_count: 189, subscription_status: "ACTIVE" }
  ];
  while (displayNodes.length < 3) {
    displayNodes.push(sampleHospitals[displayNodes.length]);
  }

  // Sample tasks list matching the checklists in the design image
  const systemChecklist = [
    { name: "Daily Hospital sync check", time: "30 mins left", comments: 3, progress: 65, status: "urgent" },
    { name: "Weekly Audit (Node #1012)", time: "3 Days left", comments: 5, progress: 50, status: "normal" },
    { name: "Daily Hospital sync check", time: "3 mins left", comments: 3, progress: 65, status: "urgent" },
    { name: "Weekly Audit (Node #2088)", time: "3 Days left", comments: 5, progress: 50, status: "normal" }
  ];

  return (
    <DashboardLayout role="super_admin" userName="Master Admin">
      
      {/* TOP: Greeting & Stats */}
      <div style={{ padding: '2.5rem 2.5rem 0 2.5rem', minWidth: 0, fontFamily: 'var(--font-primary)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Greeting Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>👋</span>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Hi Admin, Welcome back</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{currentDateTime}</p>
          </div>
        </div>

        {/* Stats Widgets matching the cards at top */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
          <div className="card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Hospital register</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{String(globalStats.total_hospitals).padStart(2, '0')}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eef7f6', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#067D71' }}>
              <Folder size={18} />
            </div>
          </div>

          <div className="card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Active users</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{globalStats.total_patients}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
              <CheckSquare size={18} />
            </div>
          </div>

          <div className="card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Terminated/Stopped Credentials</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{globalStats.total_doctors}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Users size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: Active Nodes */}
      <div style={{ padding: '2rem 2.5rem 2rem 2.5rem', minWidth: 0, fontFamily: 'var(--font-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Active Nodes <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{displayNodes.length}</span></h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>See all</span>
        </div>

        <div ref={scrollRef} className="custom-scrollbar" style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '12px', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
          {displayNodes.map((node, index) => (
            <div key={index} className="card-premium hover-row" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem 1.5rem', flex: '0 0 calc((100% - (4 * 1.25rem)) / 5)', scrollSnapAlign: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '20px', fontWeight: 700 }}>
                  3 Days left
                </span>
                <span style={{ color: '#cbd5e1', cursor: 'pointer', fontWeight: '900' }}>•••</span>
              </div>

              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.name}
                </h5>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Node: {node.node_code}</p>
              </div>

              {/* Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', background: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Doctors</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{node.doctor_count || 0}</p>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Staff</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{node.staff_count || 0}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Patients</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{node.patient_count || 0}</p>
                </div>
              </div>

              {/* Bottom avatars & Progress indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                {/* Tiny admin avatars */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#067D71', border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.55rem', fontWeight: 700 }}>A</div>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0ea5e9', border: '1.5px solid #fff', marginLeft: '-6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.55rem', fontWeight: 700 }}>D</div>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', border: '1.5px solid #fff', marginLeft: '-6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.55rem', fontWeight: 700 }}>+</div>
                </div>

                {/* Circle chart */}
                <div className="circle-progress-container">
                  <svg width="40" height="40" viewBox="0 0 36 36">
                    <path className="circle-progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle-progress-bar" strokeDasharray="65, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>65%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 3-Column Super Admin Layout Dashboard */}
      <div className="grid-super-admin" style={{ fontFamily: 'var(--font-primary)', gridTemplateColumns: '1.2fr 2.4fr 1.1fr' }}>
        
        {/* LEFT COLUMN: Greetings, Project Cards, Task Checklists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
          




          {/* Checklist list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>My Tasks <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{systemChecklist.length}</span></h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>See all</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {systemChecklist.map((task, idx) => (
                <div key={idx} className="card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="checkbox" defaultChecked={task.progress === 100} style={{ width: '16px', height: '16px', accentColor: '#067D71', cursor: 'pointer' }} />
                    <div>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{task.name}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ 
                          fontSize: '0.6rem', 
                          fontWeight: 700, 
                          padding: '2px 8px', 
                          borderRadius: '10px',
                          background: task.status === 'urgent' ? '#fee2e2' : '#f0f9ff',
                          color: task.status === 'urgent' ? '#ef4444' : '#0ea5e9'
                        }}>
                          {task.time}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          💬 {task.comments}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="circle-progress-container" style={{ width: '36px', height: '36px' }}>
                    <svg width="36" height="36" viewBox="0 0 36 36">
                      <path className="circle-progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="circle-progress-bar" strokeDasharray={`${task.progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{task.progress}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents Card (Learning Files style) */}
          <div className="card-premium" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>System Documents <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>18</span></h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>See all</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { name: "Onboarding_Protocol.pdf", time: "Jan 28th, 2026 at 14:34", size: "3.4MB", type: "pdf", color: "#ef4444" },
                { name: "Security_Standards.docx", time: "Jan 28th, 2026 at 14:34", size: "3.4MB", type: "docx", color: "#0ea5e9" },
                { name: "Billing_Matrix.xlsx", time: "Jan 28th, 2026 at 14:34", size: "3.4MB", type: "xlsx", color: "#10b981" },
                { name: "Incident_Demo.mpeg", time: "Jan 28th, 2026 at 14:34", size: "3.4MB", type: "video", color: "#8b5cf6" },
                { name: "Onboarding_Protocol.pdf", time: "Jan 28th, 2026 at 14:34", size: "3.4MB", type: "pdf", color: "#ef4444" }
              ].map((doc, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '8px', 
                      background: `${doc.color}15`, 
                      color: doc.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.65rem'
                    }}>
                      {doc.type.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', width: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                      <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{doc.time} • {doc.size}</p>
                    </div>
                  </div>
                  <span style={{ color: '#cbd5e1', cursor: 'pointer', fontWeight: '900' }}>•••</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: Notice Board, Revenue chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
          
          {/* Notice Board */}
          <div className="card-premium" style={{ padding: '1.25rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Notice board</h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <ChevronLeft size={16} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tomorrow is a Holiday!</h5>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4', fontWeight: 500 }}>
                Let us make a promise that we would not let the hard sacrifices of our brave freedom fighters go in vain. We would word hard to make our country the best in the world. Happy Republic Day 2021!
              </p>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '0.5rem', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#067D71', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>HR</div>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>HR Team</p>
                  <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Jan 14th, 2021 • 10:30 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart Box */}
          <div className="card-premium" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Revenue Tracking</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>See all</span>
              </div>
              <select style={{ padding: '4px 12px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', outline: 'none' }}>
                <option>Week</option>
                <option>Month</option>
                <option>Year</option>
              </select>
            </div>

            {/* Sub Header info */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eef7f6', color: '#067D71', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>$</div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Revenue</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 500 }}>System-wide aggregation</p>
              </div>
            </div>

            {/* Horizontal Counts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <div>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>$4.2k</h5>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500 }}>This Week</p>
              </div>
              <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '8px' }}>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#067D71' }}>$18.5k</h5>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500 }}>This Month</p>
              </div>
              <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '8px' }}>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>$210k</h5>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500 }}>This Year</p>
              </div>
            </div>

            {/* Bezier Line Chart matching the exact visual style in the image */}
            <div style={{ position: 'relative', marginTop: 'auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <svg viewBox="0 0 300 120" style={{ width: '100%', height: 'auto', minHeight: '110px', maxHeight: '100%' }}>
                {/* Horizontal dotted grid line */}
                <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeDasharray="3,3" />

                {/* Curved Path 1 (Teal) */}
                <path 
                  d="M10,100 C50,110 80,60 120,70 C160,80 200,30 240,40 C270,45 290,10 300,5" 
                  fill="none" 
                  stroke="#067D71" 
                  strokeWidth="2.5" 
                />

                {/* Curved Path 2 (Light Teal/Green) */}
                <path 
                  d="M10,80 C50,90 80,100 120,95 C160,90 200,60 240,85 C270,95 290,40 300,30" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2" 
                />

                {/* Highlight Point */}
                <circle cx="160" cy="80" r="4" fill="#067D71" />
                <circle cx="160" cy="80" r="8" stroke="rgba(6,125,113,0.15)" strokeWidth="3" fill="none" />

                {/* X Axis Labels */}
                <text x="10" y="115" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">Su</text>
                <text x="58" y="115" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">Mo</text>
                <text x="106" y="115" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">Tu</text>
                <text x="154" y="115" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">We</text>
                <text x="202" y="115" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">Th</text>
                <text x="250" y="115" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">Fr</text>
                <text x="290" y="115" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">Sa</text>
              </svg>

              {/* Floating Tooltip Box matching image */}
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '110px',
                background: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span>This Week <strong style={{ color: '#0ea5e9' }}>$4.2k</strong></span>
                  <span>This Month <strong style={{ color: '#067D71' }}>$18.5k</strong></span>
                  <span>This Year <strong style={{ color: '#10b981' }}>$210k</strong></span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* THIRD COLUMN: Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Calendar Card */}
          <div className="card-premium" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {calendarDate.toLocaleString('default', { month: 'long' })} {calendarDate.getFullYear()}
              </h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <ChevronLeft size={16} onClick={handlePrevMonth} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
                <ChevronRight size={16} onClick={handleNextMonth} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
              </div>
            </div>

            {/* Days grid headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                <span key={day} style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{day}</span>
              ))}
            </div>

            {/* Days cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
              {getCalendarDays().map((day, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: day.active ? '#ffffff' : day.current ? 'var(--text-primary)' : '#cbd5e1',
                    background: day.active ? '#067D71' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    margin: 'auto',
                    cursor: 'pointer'
                  }}
                >
                  {day.val}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>



      {/* BELOW THE FOLD: Global Commands and SQLite Node Registry database tables */}
      <div style={{ padding: '0 2.5rem 4rem 2.5rem', fontFamily: 'var(--font-primary)' }}>
        


        {/* Database table for hospitals registry */}
        <div className="card-premium" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Network Node Registry</h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Live SQLite Database Sync Bridge</p>
            </div>

            <button 
              className="btn-primary-premium" 
              onClick={() => setShowRegModal(true)}
            >
              <Plus size={16} />
              <span>Provision Node</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table-premium">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Facility Identity</th>
                  <th>Location</th>
                  <th>Staff (D/N)</th>
                  <th>Subscription</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {networkNodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, fontWeight: 800 }}>NO ACTIVE NODES DETECTED IN THE NETWORK</td>
                  </tr>
                ) : (
                  networkNodes.map((node: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.5 }}>{String(idx + 1).padStart(2, '0')}</td>
                      <td style={{ fontWeight: 800 }}>
                        {node.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>({node.node_code})</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{node.location}</td>
                      <td style={{ fontWeight: 600 }}>{node.doctor_count} / {node.staff_count}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          borderRadius: '12px',
                          background: node.subscription_status === 'ACTIVE' ? '#e6f4ea' : '#fce8e6',
                          color: node.subscription_status === 'ACTIVE' ? '#137333' : '#c5221f'
                        }}>
                          {node.subscription_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>ONLINE</span>
                        </div>
                      </td>
                      <td>
                        <button className="btn-outline-premium" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>MANAGE</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Provision New Node Modal */}
      {showRegModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-premium" style={{ width: '480px', padding: '2.5rem', background: '#fff', transform: 'scale(1)', transition: 'all 0.3s ease' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Provision New Node</h2>
               <span onClick={() => setShowRegModal(false)} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 800 }}>✕</span>
             </div>
             
             <form onSubmit={handleRegisterHospital} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>HOSPITAL NAME</label>
                    <input type="text" required placeholder="General Hospital" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>LOCATION</label>
                    <input type="text" required placeholder="New York" value={regData.location} onChange={e => setRegData({...regData, location: e.target.value})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600 }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>UNIQUE 4-DIGIT NODE CODE</label>
                  <input type="text" required maxLength={4} placeholder="1024" value={regData.node_code} onChange={e => setRegData({...regData, node_code: e.target.value.replace(/\D/g, '')})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '2px' }} />
                </div>
                
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                   <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#067D71', marginBottom: '1rem', letterSpacing: '0.5px' }}>ADMINISTRATIVE CREDENTIALS</p>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ADMIN FULL NAME</label>
                       <input type="text" required placeholder="John Doe" value={regData.admin_name} onChange={e => setRegData({...regData, admin_name: e.target.value})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600 }} />
                     </div>
                     
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>USERNAME</label>
                         <input type="text" required placeholder="admin_city" value={regData.admin_username} onChange={e => setRegData({...regData, admin_username: e.target.value})} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600 }} />
                       </div>
                       
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                         <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PASSWORD</label>
                         <div style={{ position: 'relative' }}>
                           <input 
                             type={showRegPassword ? "text" : "password"} 
                             required 
                             placeholder="••••••••" 
                             value={regData.admin_password} 
                             onChange={e => setRegData({...regData, admin_password: e.target.value})} 
                             style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600 }} 
                           />
                           <button 
                             type="button"
                             onClick={() => setShowRegPassword(!showRegPassword)}
                             style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                           >
                              {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-outline-premium" onClick={() => setShowRegModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary-premium" style={{ flex: 1, justifyContent: 'center' }}>
                     {isSubmitting ? "Provisioning..." : "Activate Node"}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
