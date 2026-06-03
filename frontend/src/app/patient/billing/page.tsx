"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CreditCard, Receipt, Download, AlertCircle, CheckCircle2, ArrowUpRight, Zap, ShieldCheck } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ToastProvider";
import { motion } from "framer-motion";

export default function PatientBillingPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const [userName, setUserName] = useState("Patient");

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
        if (session && session.role === 'patient') {
          setUserName(session.name);
          const data = await apiService.getPatientBills(session.id);
          setBills(data);
        }
      } catch (error) {
        showToast("Failed to sync financial node", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, []);

  const totalUnpaid = bills
    .filter(b => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <DashboardLayout role="patient" userName={userName}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Financial Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <Zap size={16} color="var(--color-accent)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-secondary)' }}>FINANCIAL TERMINAL</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Billing & Settlements</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
             <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>OUTSTANDING BALANCE</p>
             <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>₹{totalUnpaid.toLocaleString()}</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', alignItems: 'stretch' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Active Bills */}
            <div className="card-premium" style={{ background: '#fff', padding: '0', flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0, overflow: 'hidden' }}>
               <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                 <h3 style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                   <Receipt size={18} color="var(--color-accent)" /> INVOICE HISTORY
                 </h3>
               </div>

               {isLoading ? (
                 <div style={{ padding: '4rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>SYNCHRONIZING...</div>
               ) : bills.length === 0 ? (
                 <div style={{ padding: '4rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>NO BILLING RECORDS FOUND</div>
               ) : (
                 <div className="table-responsive" style={{ flex: 1 }}>
                   <table className="data-table-premium" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>S.NO</th>
                          <th>INVOICE IDENTITY</th>
                          <th>FISCAL AMOUNT</th>
                          <th style={{ textAlign: 'right' }}>STATUS / ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bills.map((bill, i) => (
                          <tr key={bill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                            <td>
                               <div>
                                 <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{bill.reason.toUpperCase()}</p>
                                 <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>INV-{bill.id.toString().padStart(6, '0')} • {new Date().toLocaleDateString()}</p>
                               </div>
                            </td>
                            <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{bill.amount.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-end' }}>
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    fontWeight: 800, 
                                    padding: '4px 10px', 
                                    borderRadius: '12px',
                                    background: bill.status === 'unpaid' ? '#fee2e2' : '#d1fae5',
                                    color: bill.status === 'unpaid' ? '#dc2626' : '#059669'
                                  }}>
                                    {bill.status.toUpperCase()}
                                  </span>
                                  <button 
                                    onClick={() => showToast(`Downloading INVOICE ${bill.id}...`, "success")}
                                    className="btn-outline-premium"
                                    style={{ padding: '8px' }}
                                    title="Download Invoice"
                                  >
                                    <Download size={16} />
                                  </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
               )}
            </div>
          </div>

          {/* Sidebar Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
             <div className="card-premium" style={{ background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--color-accent) 100%)', color: '#fff', border: 'none', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={24} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '1px' }}>QUICK SETTLE</h3>
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.9, lineHeight: 1.6 }}>
                  Settle your outstanding balance using secure digital assets or standard gateway nodes.
                </p>
                <button 
                  onClick={() => showToast("Payment Gateway Initializing...", "info")}
                  disabled={totalUnpaid === 0}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    background: '#fff', 
                    color: 'var(--color-accent)', 
                    border: 'none', 
                    fontWeight: 800, 
                    fontSize: '0.85rem', 
                    cursor: totalUnpaid === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    opacity: totalUnpaid === 0 ? 0.7 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  PAY NOW <ArrowUpRight size={18} />
                </button>
             </div>

             <div className="card-premium" style={{ padding: '2rem', marginBottom: 0 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>REPORTS</h4>
                <button className="btn-outline-premium" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Download size={16} /> EXPORT FISCAL REPORT
                </button>
             </div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem 0', color: 'var(--text-secondary)', marginTop: 'auto', justifyContent: 'center' }}>
                <ShieldCheck size={18} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>AES-256 ENCRYPTED TRANSACTION NODE</span>
             </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
