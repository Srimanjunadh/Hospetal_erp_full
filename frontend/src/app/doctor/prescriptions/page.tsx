"use client";
import { useState, useEffect } from "react";
import { Pill, Search, Filter, Download, Plus, CheckCircle, Clock, AlertCircle, RefreshCcw, FileText, Send } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

export default function DoctorPrescriptionsPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    // Initial RX feed load
    setPrescriptions([]);
  }, []);

  if (!mounted) return null;

  return (
    <DashboardLayout role="doctor" userName="Dr. Sarah Smith">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Pharmacy Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>STATION ID: <span style={{ color: "var(--color-accent)", fontWeight: 800 }}>MED-ALPHA-09</span> • CLINICAL PRESCRIPTION MANAGEMENT</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-outline-premium" onClick={() => showToast("Syncing with Pharmacy Node...", "info")}>
            <RefreshCcw size={18} /> Sync Pharmacy
          </button>
          <button className="btn-primary-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexDirection: 'row', whiteSpace: 'nowrap' }}><Plus size={18} /> <span>New Prescription
          </span></button>
        </div>
      </div>

      <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search RX registry by patient, ID, or medication..." 
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
                <th style={{ width: '120px' }}>RX IDENTITY</th>
                <th style={{ minWidth: '200px' }}>PATIENT</th>
                <th>MEDICATION & DOSAGE</th>
                <th>DURATION</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    <Pill size={48} style={{ margin: "0 auto 1.5rem", opacity: 0.3 }} />
                    <p>No prescriptions available at this time</p>
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx, i) => (
                  <tr key={i} style={{ 
                    borderBottom: '1px solid #f1f5f9',
                    background: rx.status === 'PENDING AUTH' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                  }}>
                    <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{rx.id}</td>
                    <td style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rx.patient}</td>
                    <td>
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{rx.medication}</p>
                      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>DOSAGE: {rx.dosage}</p>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rx.duration}</td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: rx.status === 'AUTHORIZED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
                        {rx.status === 'AUTHORIZED' ? <CheckCircle size={14} color="#10b981" /> : <Clock size={14} color="#f59e0b" />}
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: rx.status === 'AUTHORIZED' ? '#10b981' : '#d97706' }}>{rx.status}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        {rx.status === 'PENDING AUTH' ? (
                          <button className="btn-primary-premium" style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => showToast(`Authorizing Prescription: ${rx.id}`, "success")}>
                            <Send size={14} /> Authorize
                          </button>
                        ) : (
                          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => showToast(`Downloading Digital RX: ${rx.id}`, "info")} title="Download Prescription"><Download size={18} /></button>
                        )}
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-accent)' }} onClick={() => showToast(`Opening Prescription History: ${rx.patient}`, "info")} title="View History"><FileText size={18} /></button>
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
