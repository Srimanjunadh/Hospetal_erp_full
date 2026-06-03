"use client";
import { useState, useEffect } from "react";
import { FlaskConical, Search, Filter, Download, ExternalLink, CheckCircle, Clock, AlertCircle, RefreshCcw, Plus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

export default function DoctorLabsPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [labResults, setLabResults] = useState<any[]>([]);

  useEffect(() => {
    // Initial lab feed load
    setLabResults([]);
  }, []);

  if (!mounted) return null;

  return (
    <DashboardLayout role="doctor" userName="Dr. Sarah Smith">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Laboratory Workstation</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>STATION ID: <span style={{ color: "var(--color-accent)", fontWeight: 800 }}>MED-ALPHA-09</span> • DIAGNOSTIC TELEMETRY HUB</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-outline-premium" onClick={() => showToast("Synchronizing with Lab Node...", "info")}>
            <RefreshCcw size={18} /> Sync Feed
          </button>
          <button className="btn-primary-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexDirection: 'row', whiteSpace: 'nowrap' }}><Plus size={18} /> <span>New Test
          </span></button>
        </div>
      </div>

      <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search diagnostic database by patient, ID, or test type..." 
              style={{ width: '100%', padding: '12px 16px 12px 48px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>
          <button className="btn-outline-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexDirection: 'row', whiteSpace: 'nowrap' }}><Filter size={18} /> <span>Filter
          </span></button>
        </div>

        <div className="table-responsive">
          <table className="data-table-premium">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>S.NO</th>
                <th style={{ width: '120px' }}>IDENTITY</th>
                <th style={{ minWidth: '200px' }}>PATIENT</th>
                <th>DIAGNOSTIC TEST</th>
                <th>TIMESTAMP</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {labResults.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    <FlaskConical size={48} style={{ margin: "0 auto 1.5rem", opacity: 0.3 }} />
                    <p>No lab records available at this time</p>
                  </td>
                </tr>
              ) : (
                labResults.map((lab, i) => (
                  <tr key={i} style={{ 
                    borderBottom: '1px solid #f1f5f9',
                    background: lab.status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                  }}>
                    <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{lab.id}</td>
                    <td style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{lab.patient}</td>
                    <td style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}><span style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>{lab.test}</span></td>
                    <td style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lab.date}</td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: lab.status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : lab.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)' }}>
                        {lab.status === 'CRITICAL' ? <AlertCircle size={14} color="#ef4444" /> : lab.status === 'COMPLETED' ? <CheckCircle size={14} color="#10b981" /> : <Clock size={14} color="#94a3b8" />}
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: lab.status === 'CRITICAL' ? '#ef4444' : lab.status === 'COMPLETED' ? '#10b981' : '#94a3b8' }}>{lab.status}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-accent)' }} onClick={() => showToast(`Accessing Diagnostic Feed: ${lab.id}`, "info")} title="View Results"><ExternalLink size={18} /></button>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => showToast(`Downloading Laboratory Report: ${lab.patient}`, "success")} title="Download Report"><Download size={18} /></button>
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
