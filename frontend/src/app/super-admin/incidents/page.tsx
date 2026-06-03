"use client";
import { useState, useEffect } from "react";
import { Search, Filter, Plus, Hospital, BarChart3, RefreshCcw, AlertTriangle, Clock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

export default function IncidentHubPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [incidents, setIncidents] = useState<any[]>([
    { id: "INC-9912", facility: "METRO CORE", admin: "ALICE ADMIN", issue: "Database synchronization delay on Patient Vitals", priority: "CRITICAL", status: "PENDING" },
    { id: "INC-8804", facility: "SUBURBAN WING", admin: "KIMS ADMIN", issue: "Backup power sentinel warning node-3", priority: "FACILITY", status: "PENDING" },
    { id: "INC-7761", facility: "TRAUMA UNIT", admin: "ALICE ADMIN", issue: "API Gateway rate-limiting threshold reached", priority: "SECURITY", status: "RESOLVED" }
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getPriorityStyle = (p: string) => {
    switch(p) {
      case 'CRITICAL': return { color: '#dc2626', bg: '#fef2f2', border: '1px solid #fca5a5' };
      case 'SECURITY': return { color: '#0ea5e9', bg: '#e0f2fe', border: '1px solid #7dd3fc' };
      case 'FACILITY': return { color: '#b25e00', bg: '#fff7ed', border: '1px solid #fdba74' };
      default: return { color: '#64748b', bg: '#f8fafc', border: '1px solid #cbd5e1' };
    }
  };

  const filteredIncidents = incidents.filter(inc => 
    inc.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inc.facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.priority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="super_admin" userName="Master Admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>GLOBAL INCIDENT HUB</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>ROOT RESOLUTION TERMINAL • NETWORK-WIDE ADMINISTRATIVE ISSUES</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-outline-premium" 
            onClick={() => {
              showToast("Auditing Incident Archives...", "info");
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: 'row',
              whiteSpace: 'nowrap'
            }}
          >
             <RefreshCcw size={18} /> <span>REFRESH FEED</span>
          </button>
          <button 
            className="btn-primary-premium"
            onClick={() => showToast("Incident Logger accessible via root node shell", "info")}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: 'row',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={18} /> <span>LOG MANUAL INCIDENT</span>
          </button>
        </div>
      </div>

      {/* Global Metrics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: "OPEN CRITICAL TICKETS", value: incidents.filter(i => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length, icon: <AlertTriangle size={18} />, trend: incidents.filter(i => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length > 0 ? "ACTION REQUIRED" : "ALL SYSTEMS STABLE", color: incidents.filter(i => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length > 0 ? '#dc2626' : '#10b981', bg: incidents.filter(i => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length > 0 ? '#fce8e6' : '#e6f4ea' },
          { label: "AVG RESOLUTION TIME", value: "1.4H", icon: <Clock size={18} />, trend: "OPTIMAL SPEED", color: '#067D71', bg: '#eef7f6' },
          { label: "MOST ACTIVE NODE", value: incidents.length > 0 ? incidents[0].facility : "NONE", icon: <Hospital size={18} />, trend: "MONITORED", color: '#0ea5e9', bg: '#e0f2fe' }
        ].map((stat, i) => (
          <div key={i} className="card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color === '#dc2626' ? '#dc2626' : 'var(--text-primary)' }}>{stat.value}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: stat.color }}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Incident Analytics Graph */}
      <div className="card-premium" style={{ padding: '2rem', marginBottom: '3rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '2px', color: 'var(--text-primary)' }}>NETWORK INCIDENT TREND (24H)</h3>
            <BarChart3 size={18} style={{ color: 'var(--bg-side)' }} />
         </div>
         <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            {[10, 20, 5, 40, 60, 30, 80, 45, 90, 25, 10, 15, 35, 70, 50, 40, 20, 65, 85, 45, 30, 60, 95, 40].map((h, i) => (
              <div key={i} style={{ 
                flex: 1, 
                background: h > 70 ? '#dc2626' : 'var(--bg-side)', 
                height: `${h}%`, 
                borderRadius: '4px 4px 0 0',
                opacity: (i / 24) * 0.7 + 0.3 
              }}></div>
            ))}
         </div>
      </div>

      <div className="card-premium" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              placeholder="FILTER INCIDENTS BY NODE ID, ADMIN NAME, OR PRIORITY" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '15px 16px 15px 50px', background: '#f4f4f5', border: 'none', borderRadius: '30px', fontWeight: '700', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <button className="btn-outline-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexDirection: 'row', whiteSpace: 'nowrap' }}>
            <Filter size={18} /> <span>PRIORITY</span>
          </button>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
          <table className="data-table-premium">
            <thead>
              <tr>
                <th style={{ padding: '16px 20px' }}>INCIDENT IDENTITY</th>
                <th style={{ padding: '16px 20px' }}>SOURCE NODE</th>
                <th style={{ padding: '16px 20px' }}>RAISED BY</th>
                <th style={{ padding: '16px 20px' }}>ISSUE DESCRIPTION</th>
                <th style={{ padding: '16px 20px' }}>PRIORITY</th>
                <th style={{ padding: '16px 20px' }}>STATUS</th>
                <th style={{ padding: '16px 20px' }}>RESOLVE</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, fontWeight: 900 }}>NO OPEN INCIDENTS DETECTED</td>
                </tr>
              ) : (
                filteredIncidents.map((inc, i) => {
                  const pStyles = getPriorityStyle(inc.priority);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px 20px', fontWeight: 900, color: 'var(--text-primary)' }}>{inc.id}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <Hospital size={14} style={{ color: 'var(--bg-side)' }} /> {inc.facility}
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px', fontWeight: 800, fontSize: '0.75rem', opacity: 0.7 }}>{inc.admin}</td>
                      <td style={{ padding: '15px 20px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{inc.issue}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          borderRadius: '12px',
                          background: pStyles.bg,
                          color: pStyles.color,
                          border: pStyles.border
                        }}>
                          {inc.priority}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', background: inc.status === 'RESOLVED' ? '#10b981' : '#f59e0b', borderRadius: '50%' }}></div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: inc.status === 'RESOLVED' ? '#10b981' : '#f59e0b' }}>{inc.status}</span>
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        {inc.status !== 'RESOLVED' ? (
                          <button 
                            className="btn-primary-premium" 
                            style={{ padding: '6px 14px', fontSize: '0.65rem' }}
                            onClick={() => {
                              showToast(`Executing Global Fix for ${inc.id}`, "success");
                              setIncidents(prev => prev.map(item => item.id === inc.id ? { ...item, status: 'RESOLVED' } : item));
                            }}
                          >
                            RESOLVE
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 900 }}>FIXED</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
