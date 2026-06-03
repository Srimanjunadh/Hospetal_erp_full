"use client";
import { useState, useEffect } from "react";
import { Pill, Search, ShoppingCart, Clock, Circle, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function PharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [sessionUser, setSessionUser] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session?.username) {
      setSessionUser(session.name);
      fetchPrescriptions(session.username);
    }
  }, []);

  const fetchPrescriptions = async (username: string) => {
    try {
      const { apiService } = await import("@/services/api");
      const data = await apiService.getPrescriptions(username);
      if (Array.isArray(data)) {
        // Flatten the medicines from prescriptions
        const meds = [];
        for (const p of data) {
          if (Array.isArray(p.medicines)) {
            for (const m of p.medicines) {
              meds.push({
                name: m.medicine || m.name || "UNKNOWN",
                dosage: m.dosage || m.power || "N/A",
                refilled: new Date(p.created_at || Date.now()).toLocaleDateString(),
                remaining: m.amount || m.quantity || 12, // fallback count
                status: "IN STOCK"
              });
            }
          }
        }
        setPrescriptions(meds);
      }
    } catch (e) {
      console.error("Failed to fetch prescriptions", e);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="patient" userName={sessionUser}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>E-Pharmacy</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>SECURE DISPENSARY • LINE-WISE REGISTRY</p>
        </div>
        <button 
          className="btn-primary-premium"
          style={{ padding: '12px 20px', gap: '8px' }}
        >
          <ShoppingCart size={18} /> <span>CART (0)</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem', marginTop: '3rem' }}>
        <div>
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
               <h3 style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>PRESCRIPTION INVENTORY</h3>
            </div>
            
            <div className="table-responsive">
              <table className="data-table-premium" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>S.NO</th>
                    <th>MEDICATION IDENTITY</th>
                    <th>LAST REFILL</th>
                    <th>UNITS</th>
                    <th style={{ textAlign: 'right' }}>AVAILABILITY</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>INVENTORY EMPTY</td></tr>
                  ) : prescriptions.map((med, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Pill size={16} color="var(--color-accent)" />
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{med.name.toUpperCase()}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{med.dosage}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{med.refilled}</td>
                      <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{med.remaining} U</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '4px 10px', 
                          borderRadius: '12px',
                          background: med.status === 'IN STOCK' ? '#d1fae5' : med.status === 'CRITICAL' ? '#fee2e2' : '#ffedd5',
                          color: med.status === 'IN STOCK' ? '#059669' : med.status === 'CRITICAL' ? '#dc2626' : '#ea580c',
                          fontSize: '0.7rem',
                          fontWeight: 800
                        }}>
                          <Circle size={8} fill="currentColor" />
                          {med.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-premium" style={{ marginTop: '2.5rem', padding: '2rem' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>OTC SUPPLY CATALOG</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {['VITAMIN C', 'PARACETAMOL', 'OMEGA-3', 'INSULIN SYRINGE', 'GAUZE PADS', 'ANTISEPTIC'].map((item) => (
                <div key={item} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}>
                   <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-primary)' }}>{item}</span>
                   <button className="btn-outline-premium" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>ADD</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-premium" style={{ padding: '2rem' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '2rem', fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-primary)' }}>ORDER ARCHIVE</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                 <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                   <Clock size={16} />
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                   <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>REF-ORD-{9020 + i}</p>
                   <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DELIVERED • APR {20 - i}</p>
                 </div>
              </div>
            ))}
          </div>
          <button className="btn-outline-premium" style={{ width: '100%', marginTop: '2.5rem', padding: '12px' }}>
             LOAD FULL HISTORY
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
