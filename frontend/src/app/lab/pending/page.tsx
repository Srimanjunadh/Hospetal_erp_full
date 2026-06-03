"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Upload, Clock, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

export default function LabPendingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredTests = tests.filter(t => 
    t.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.test_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <DashboardLayout role="lab" userName={session?.name || "Lab Tech"}>
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Pending Diagnostic Queue</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>ACTIVE REQUISITIONS AWAITING TRANSMISSION</p>
        </div>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="search-input-premium"
            placeholder="SEARCH QUEUE..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table-premium">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>S.NO</th>
                <th>REFERENCE</th>
                <th>PATIENT</th>
                <th>DIAGNOSTIC TYPE</th>
                <th>ORDERING PHYSICIAN</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>QUEUE EMPTY</td></tr>
              ) : filteredTests.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>#{t.test_id}</td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{t.patient?.name.toUpperCase()}</td>
                  <td>
                    <span style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.test_name.toUpperCase()}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DR. {t.doctor?.user?.name.toUpperCase()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <label className="btn-primary-premium" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <Upload size={14} /> Upload Results
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
    </DashboardLayout>
  );
}
