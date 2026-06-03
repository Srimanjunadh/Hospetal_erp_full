"use client";
import { useState, useEffect } from "react";
import { Users, UserPlus, Search, Filter, ShieldCheck, Activity, Key, SwitchCamera, Trash2, Globe, Hospital, Star } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

export default function GlobalStaffPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [globalStaff, setGlobalStaff] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStaff = async () => {
    try {
      const users = await apiService.getUsers();
      setGlobalStaff(users.map((u: any) => ({
        id: `USR-${u.id}`,
        name: u.name || u.username.toUpperCase(),
        facility: u.hospital_name || (u.hospital_id ? `NODE-${u.hospital_id}` : "GLOBAL ROOT"),
        role: u.role.replace('_', ' ').toUpperCase(),
        rating: u.rating || 5.0,
        status: u.is_active !== false ? 'ACTIVE' : 'SUSPENDED'
      })));
    } catch (e) {
      console.error(e);
      showToast("Failed to sync global personnel hub", "error");
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStaff();
  }, []);

  const filteredStaff = globalStaff.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.facility.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <DashboardLayout role="super_admin" userName="Master Admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>GLOBAL PERSONNEL HUB</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>ROOT DIRECTORY • CROSS-FACILITY WORKFORCE MANAGEMENT</p>
        </div>
        <button 
          className="btn-primary-premium"
          onClick={() => showToast("Provisioning form accessible via Onboarding portal", "info")}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            flexDirection: 'row',
            whiteSpace: 'nowrap'
          }}
        >
          <UserPlus size={18} /> <span>REGISTER GLOBAL STAFF</span>
        </button>
      </div>

      {/* Global Metrics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: "GLOBAL FORCE", value: globalStaff.length, icon: <Users size={18} />, trend: globalStaff.length > 0 ? `+${globalStaff.length} ACTIVE` : 'NO PERSONNEL', color: '#067D71', bg: '#eef7f6' },
          { label: "NETWORK UTILIZATION", value: "85%", icon: <Activity size={18} />, trend: "OPTIMAL", color: '#0ea5e9', bg: '#e0f2fe' },
          { label: "SECURITY CLEARANCE", value: "ROOT", icon: <ShieldCheck size={18} />, trend: "MAXIMUM AUTHORITY", color: '#10b981', bg: '#e6f4ea' }
        ].map((stat, i) => (
          <div key={i} className="card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card-premium" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              placeholder="SEARCH ACROSS ALL FACILITIES BY IDENTITY, ROLE, OR NODE ID" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '15px 16px 15px 50px', background: '#f4f4f5', border: 'none', borderRadius: '30px', fontWeight: '700', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <button className="btn-outline-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexDirection: 'row', whiteSpace: 'nowrap' }}><Filter size={18} /> <span>NODE FILTER
          </span></button>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
          <table className="data-table-premium">
            <thead>
              <tr>
                <th style={{ padding: '16px 20px' }}>S.NO</th>
                <th style={{ padding: '16px 20px' }}>IDENTITY</th>
                <th style={{ padding: '16px 20px' }}>FACILITY</th>
                <th style={{ padding: '16px 20px' }}>SYSTEM ROLE</th>
                <th style={{ padding: '16px 20px' }}>RANK</th>
                <th style={{ padding: '16px 20px' }}>STATUS</th>
                <th style={{ padding: '16px 20px' }}>ROOT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, fontWeight: 800 }}>NO STAFF DETECTED IN THE NETWORK</td>
                </tr>
              ) : (
                filteredStaff.map((p, i) => (
                  <tr key={i} style={{ 
                    borderBottom: '1px solid #eee',
                    background: p.status === 'SUSPENDED' ? 'rgba(220, 38, 38, 0.05)' : 'transparent',
                    borderLeft: p.status === 'SUSPENDED' ? '6px solid #dc2626' : 'none'
                  }}>
                    <td style={{ padding: '15px 20px', fontWeight: 900, fontSize: '0.75rem', opacity: 0.3 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: p.status === 'SUSPENDED' ? '#fce8e6' : '#eef7f6', color: p.status === 'SUSPENDED' ? '#dc2626' : '#067D71', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}>{p.name.charAt(0)}</div>
                         <div>
                           <p style={{ fontWeight: '900', fontSize: '0.85rem' }}>{p.name}</p>
                           <p style={{ fontSize: '0.65rem', color: '#999', fontWeight: 700 }}>{p.id}</p>
                         </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px', fontWeight: 900, fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Hospital size={14} style={{ color: 'var(--bg-side)' }} /> {p.facility}
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px', fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-primary)' }}>{p.role}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 900, fontSize: '0.8rem' }}>
                        <Star size={12} fill="#e2e8f0" style={{ color: 'var(--bg-side)' }} /> {p.rating}
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: p.status === 'ACTIVE' ? '#10b981' : p.status === 'SUSPENDED' ? '#dc2626' : '#999' }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => showToast(`Resetting Credentials for ${p.id}`, "info")} title="Reset Token"><Key size={16} /></button>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => showToast(`Initiating Node Transfer for ${p.name}`, "info")} title="Transfer Node"><SwitchCamera size={16} /></button>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626' }} onClick={() => showToast(`GLOBAL ACCESS REVOKED: ${p.id}`, "error")} title="Revoke Access"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
