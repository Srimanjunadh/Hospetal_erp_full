"use client";
import { useState, useEffect } from "react";
import { FileText, Download, Eye, Search, Shield, Activity, FileCheck, Lock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

export default function MedicalRecordsPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [userName, setUserName] = useState("Patient");

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session?.id) {
      setUserName(session.name || "Patient");
      fetchRecords(session.id);
    } else {
      showToast("No active session found", "error");
    }
  }, []);

  const fetchRecords = async (patientId: number) => {
    try {
      const { apiService } = await import("@/services/api");
      const data = await apiService.getPatientHistory(patientId);
      console.log("Fetched records:", data);
      setRecords(data);
      if (data.length === 0) {
        showToast("No records found in clinical repository", "info");
      } else {
        showToast(`Synchronized ${data.length} records`, "success");
      }
    } catch (e) {
      showToast("Clinical repository sync error", "error");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="patient" userName={userName}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Electronic Health Records</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>SECURE CLINICAL REPOSITORY • AES-256 ENCRYPTED</p>
        </div>
        <button 
          className="btn-primary-premium" 
          onClick={() => showToast("Preparing full encrypted archive...", "info")}
          style={{ padding: '12px 20px', gap: '8px' }}
        >
          <Download size={18} /> <span>REQUEST COMPLETE EXPORT</span>
        </button>
      </div>

      <div className="card-premium" style={{ marginTop: '3rem', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ flex: 1, position: 'relative', maxWidth: '500px' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              placeholder="Filter by record type, date, or provider" 
              className="search-input-premium"
              style={{ width: '100%', padding: '12px 16px 12px 45px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table-premium" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>S.NO</th>
                <th>RECORD IDENTITY</th>
                <th>RECORD ID</th>
                <th>CATEGORY</th>
                <th>ISSUING PROVIDER</th>
                <th>DATE</th>
                <th>SIZE</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NO RECORDS IN REPOSITORY</td></tr>
              ) : records.map((rec, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '8px', color: 'var(--text-primary)' }}>
                        <FileCheck size={18} />
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{rec.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{rec.id}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rec.type}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{rec.provider}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{rec.date}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{rec.size}</td>
                  <td>
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#d1fae5', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.7rem' }}>
                       <Lock size={12} /> SECURE
                     </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button className="btn-outline-premium" style={{ padding: '8px' }} onClick={() => showToast(`Opening ${rec.id}...`, "info")} title="View Record"><Eye size={16} /></button>
                      <button className="btn-outline-premium" style={{ padding: '8px' }} onClick={() => showToast(`Downloading archive...`, "success")} title="Download"><Download size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
