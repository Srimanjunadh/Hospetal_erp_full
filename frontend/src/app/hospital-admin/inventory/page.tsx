"use client";
import { useState, useEffect } from "react";
import { Search, Plus, RefreshCcw, Download, Edit3, ShoppingCart, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

export default function InventoryPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      const hId = session?.hospital_id;
      if (!hId) return;

      const data = await apiService.getHospitalInventory(hId);
      if (Array.isArray(data)) {
        // Map backend model to UI format
        const formatted = data.map(item => ({
          id: `INV-${item.id}`,
          name: item.name.toUpperCase(),
          category: (item.category || "UNSPECIFIED").toUpperCase(),
          stock: item.quantity,
          minStock: item.min_threshold,
          expiry: item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "N/A",
          status: item.quantity <= 0 ? "OUT OF STOCK" : item.quantity <= item.min_threshold ? "LOW STOCK" : "IN STOCK"
        }));
        setInventoryItems(formatted);
      }
    } catch {
      showToast("Failed to fetch inventory data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchInventory();
  }, []);

  if (!mounted) return null;

  return (
    <DashboardLayout role="hospital_admin" userName="Admin Manju">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Logistics Command</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Global Supply & Hospital Asset Registry</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-outline-premium" 
            onClick={() => showToast("Downloading Manifest...", "info")}
            style={{ height: '42px', padding: '0 1.25rem' }}
          >
             <Download size={16} /> <span>Export Manifest</span>
          </button>
          <button 
            className="btn-primary-premium"
            style={{ height: '42px', padding: '0 1.25rem' }}
            onClick={() => showToast("Feature locked for this role", "info")}
          >
            <Plus size={16} /> <span>Add New Asset</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="card-premium">
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>TOTAL ASSET VALUE</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>$284.5K</h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', color: '#059669' }}>+2.4% vs prev. month</p>
        </div>
        <div className="card-premium" style={{ borderLeft: '4px solid #dc2626', borderRadius: '0 12px 12px 0' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>CRITICAL DEPLETIONS</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626' }}>
            {inventoryItems.filter(i => i.status === 'LOW STOCK' || i.status === 'OUT OF STOCK').length}
          </h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', color: '#dc2626' }}>Reorder required immediately</p>
        </div>
        <div className="card-premium">
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>SUPPLY CHAIN NODES</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>12</h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-secondary)' }}>Active vendors</p>
        </div>
      </div>

      <div className="card-premium" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} size={16} />
              <input 
                type="text" 
                placeholder="Search assets by identity, category, or vendor..." 
                style={{ width: '100%', padding: '12px 16px 12px 46px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
              />
            </div>
            <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '0 1.25rem', height: '42px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
              <Filter size={16} /> Filter
            </button>
            <button 
              className="btn-outline-premium" 
              onClick={fetchInventory}
              style={{ height: '42px', padding: '0 1.25rem' }}
            >
              <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} /> <span>Refresh</span>
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="custom-scrollbar">
            <table className="data-table-premium">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Asset Identity</th>
                  <th>System ID</th>
                  <th>Category</th>
                  <th>Stock Level</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Synchronizing supply registry...</td></tr>
                ) : inventoryItems.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', fontWeight: 700, color: 'var(--text-secondary)' }}>No assets registered in local node</td></tr>
                ) : inventoryItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ width: '32px', height: '32px', background: 'rgba(6, 125, 113, 0.1)', color: 'var(--bg-side)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>{item.name.charAt(0)}</div>
                         <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{item.category}</td>
                    <td style={{ fontWeight: 700 }}>{item.stock} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ {item.minStock}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.expiry}</td>
                    <td>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        background: item.status === 'IN STOCK' ? '#ecfdf5' : item.status === 'LOW STOCK' ? '#fffbeb' : '#fef2f2',
                        color: item.status === 'IN STOCK' ? '#059669' : item.status === 'LOW STOCK' ? '#d97706' : '#dc2626'
                      }}>
                         {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => showToast(`Initiating Reorder: ${item.id}`, "info")} title="Request Restock"><ShoppingCart size={16} /></button>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => showToast(`Opening Asset Editor: ${item.id}`, "info")} title="Edit Asset"><Edit3 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

