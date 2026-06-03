"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Upload, FileText, CheckCircle, Clock, Search, ExternalLink, Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";
import { motion } from "framer-motion";

export default function LabDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const s = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (s && s.role === "lab") {
      setSession(s);
      fetchTests();
    }
  }, []);

  const fetchTests = async () => {
    try {
      const data = await apiService.getPendingTests();
      setTests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Test sync failed:", e);
    }
  };

  const handleFileUpload = async (testId: string, file: File) => {
    try {
      await apiService.uploadTestResult(testId, file);
      showToast("DIAGNOSTIC RESULT TRANSMITTED", "success");
      fetchTests();
    } catch (e) {
      showToast("Upload Failed", "error");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="lab" userName={session?.name || "Lab Tech"}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Laboratory Diagnostic Hub</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>SECURE PATHOLOGY & SCANNING NODE</p>
      </div>

      <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-side)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FlaskConical size={20} />
              <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px' }}>PENDING DIAGNOSTIC REQUESTS</h3>
           </div>
           <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>PRIORITY: HIGH</span>
        </div>
        <div className="table-responsive">
          <table className="data-table-premium">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>S.NO</th>
                <th>TEST REFERENCE</th>
                <th>PATIENT NAME</th>
                <th>TEST TYPE</th>
                <th>ORDERED BY</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NO PENDING TESTS IN QUEUE</td></tr>
              ) : tests.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{t.test_id}</td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{t.patient?.name.toUpperCase()}</td>
                  <td>
                    <span style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.test_name.toUpperCase()}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DR. {t.doctor?.user?.name.toUpperCase()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <label className="btn-primary-premium" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <Upload size={14} /> Upload PDF
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        style={{ display: 'none' }} 
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(t.test_id, e.target.files[0])}
                      />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card-premium" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
           <h4 style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>UPLOAD PROTOCOL</h4>
           <p style={{ fontSize: '0.8rem', lineHeight: '1.6', fontWeight: 600, color: 'var(--text-secondary)' }}>
             All diagnostic reports must be uploaded in PDF format. Results are automatically encrypted and transmitted to the referring physician's dashboard.
           </p>
        </div>
        <div className="card-premium" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
           <h4 style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>SECURITY CLEARANCE</h4>
           <p style={{ fontSize: '0.8rem', lineHeight: '1.6', fontWeight: 600, color: 'var(--text-secondary)' }}>
             Laboratory nodes are audited in real-time. Ensure patient identity matches the reference ID before finalizing result transmission.
           </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
