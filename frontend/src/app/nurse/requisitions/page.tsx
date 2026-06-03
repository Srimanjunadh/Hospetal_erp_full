"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clipboard, Clock, CheckCircle2, Package, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiService } from "@/services/api";

export default function NurseRequisitionsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const s = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (s && s.role === "nurse") {
      setSession(s);
      fetchRequisitions(s.hospital_id, s.id);
    }
  }, [router, mounted]);

  const fetchRequisitions = async (hospitalId: number, nurseId: number) => {
    try {
      setLoading(true);
      const data = await apiService.getPharmacyNurseRequests(hospitalId);
      // Filter for this specific nurse
      const filtered = Array.isArray(data) ? data.filter((r: any) => r.nurse_id === nurseId) : [];
      setRequisitions(filtered);
    } catch (e) {
      console.error("Failed to fetch requisitions", e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="nurse" userName={session?.name || "Nurse"}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Requisition Tracking</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem', marginTop: '4px' }}>Monitor Active Medicine & Resource Requests</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
        <div>
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', background: 'rgba(6, 125, 113, 0.05)', color: 'var(--bg-side)', borderBottom: '1px solid rgba(6, 125, 113, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Active Requisitions</h3>
               <Package size={18} />
            </div>
            
            <div style={{ maxHeight: '600px', overflowY: 'auto' }} className="custom-scrollbar">
              {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Synchronizing with Pharmacy...</div>
              ) : requisitions.length === 0 ? (
                <div style={{ padding: '5rem', textAlign: 'center' }}>
                  <Clipboard size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--text-secondary)', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No active requisitions found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {requisitions.map((req, i) => (
                    <div key={i} style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6, width: '30px' }}>{(i + 1).toString().padStart(2, '0')}</span>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                            <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{req.patient_name}</h4>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: 'var(--text-secondary)' }}>Req #{req.id}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {req.medicines.map((m: any, idx: number) => (
                              <span key={idx} style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(6, 125, 113, 0.05)', color: 'var(--bg-side)', border: '1px solid rgba(6, 125, 113, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                                {m.name || m.medicine} ({m.quantity || m.amount})
                              </span>
                            ))}
                          </div>
                          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '1rem' }}>
                            Initiated: {new Date(req.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: req.status === 'pending' ? '#f59e0b' : '#10b981', marginBottom: '1rem', justifyContent: 'flex-end' }}>
                            {req.status === 'pending' ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>{req.status}</span>
                          </div>
                          <button className="btn-outline-premium" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>View Details</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card-premium">
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Logistics Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending Dispatch</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{requisitions.filter(r => r.status === 'pending').length}</span>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed Today</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>0</span>
              </div>
            </div>
            <button className="btn-primary-premium" style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }} onClick={() => router.push('/nurse')}>New Requisition</button>
          </div>

          <div className="card-premium" style={{ background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', border: 'none' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase' }}>System Notice</h4>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.6', opacity: 0.9, fontWeight: 500 }}>
              All requisitions are audited for compliance. Ensure patient record synchronization before submitting new resource requests.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
