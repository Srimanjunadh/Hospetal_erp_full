"use client";
import { useState, useEffect } from "react";
import { Users, Search, Filter, Download, Activity, Plus, MessageSquare, Circle, ExternalLink, User } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";
import Link from "next/link";

export default function DoctorPatientsPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + " • " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState("");

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      if (session && session.doctor_id) {
        setSessionUser(session.name);
        const data = await apiService.getAssignedPatients(session.doctor_id);
        setPatients(data.map((p: any) => ({
          id: p.username || `P-${p.id}`,
          name: p.name.toUpperCase(),
          age: "N/A",
          condition: "STABLE MONITORING",
          lastVisit: "TODAY",
          status: "ACTIVE",
          risk: "STABLE"
        })));
      } else {
        setPatients([]);
      }
    } catch (error) {
      showToast("Clinical Database Link Failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchPatients();
  }, []);

  if (!mounted) return null;

  const getStatusStyles = (status: string) => {
    switch(status) {
      case 'CRITICAL': return { border: '#dc2626', bg: 'rgba(220, 38, 38, 0.05)', text: '#dc2626', badgeBg: '#dc2626', badgeText: '#fff' };
      case 'MODERATE': return { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', text: '#d97706', badgeBg: '#f59e0b', badgeText: '#fff' };
      case 'STABLE': return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', text: '#059669', badgeBg: '#10b981', badgeText: '#fff' };
      default: return { border: '#000', bg: 'transparent', text: '#000', badgeBg: '#f4f4f5', badgeText: '#000' };
    }
  };

  return (
    <DashboardLayout role="doctor" userName={sessionUser}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Patient Registry
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>
            STATION ID: <span style={{ color: 'var(--color-accent)', fontWeight: 800 }}>MED-ALPHA-09</span> • {currentDateTime.toUpperCase()}
          </p>
        </div>
        <button className="btn-primary-premium">
          <Plus size={18} /> <span>REGISTER PATIENT</span>
        </button>
      </div>

      <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              className="search-input-premium"
              placeholder="SEARCH CLINICAL DATABASE BY NAME, ID, OR CONDITION" 
              style={{ width: '100%', maxWidth: 'none', background: '#f8fafc' }}
            />
          </div>
          <button className="btn-outline-premium">
            <Filter size={18} /> <span>TRIAGE</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table-premium">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ width: '80px' }}>S.NO</th>
                <th style={{ minWidth: '250px' }}>PATIENT IDENTITY</th>
                <th style={{ width: '150px' }}>SYSTEM ID</th>
                <th style={{ width: '200px' }}>CLINICAL CONDITION</th>
                <th style={{ width: '150px' }}>LAST VISIT</th>
                <th style={{ width: '120px' }}>PRIORITY</th>
                <th style={{ width: '120px' }}>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((pt, i) => {
                const styles = getStatusStyles(pt.status);
                return (
                  <tr key={i} style={{ 
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.transform = 'scale(1.005)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                         <div style={{ 
                           width: '40px', height: '40px', 
                           background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', 
                           color: '#fff', 
                           display: 'flex', alignItems: 'center', justifyContent: 'center', 
                           fontWeight: 800, fontSize: '1rem',
                           borderRadius: '10px',
                           boxShadow: '0 4px 10px rgba(14, 168, 155, 0.2)'
                         }}>{pt.name.charAt(0)}</div>
                         <Link href={`/doctor/patients/${pt.id}`} style={{ textDecoration: 'none', color: '#000' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{pt.name}</span>
                         </Link>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pt.id}</td>
                    <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px' }}>{pt.condition}</span>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{pt.lastVisit}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: styles.text }}>{pt.risk}</span>
                    </td>
                    <td>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '6px 12px', 
                        background: styles.bg,
                        color: styles.text,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        borderRadius: '20px'
                      }}>
                        <Circle size={8} fill="currentColor" />
                        {pt.status}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', color: 'var(--text-secondary)' }}>
                        <Link href={`/doctor/patients/${pt.id}`} style={{ color: 'inherit', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'} title="View Detailed Profile">
                          <ExternalLink size={18} />
                        </Link>
                        <button 
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', transition: 'color 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-blue)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}
                          onClick={() => showToast(`Establishing encrypted link to ${pt.name}...`, "info")}
                          title="Message Patient"
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-orange)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'} onClick={() => showToast(`Synchronizing EHR: ${pt.id}`, "success")} title="Access Health Records"><Activity size={18} /></button>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'} onClick={() => showToast(`Exporting Clinical Data: ${pt.name}`, "info")} title="Download Records"><Download size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
