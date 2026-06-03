"use client";
import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  ArrowRightLeft, 
  RefreshCcw, 
  ShoppingCart, 
  Hospital, 
  Zap,
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

export default function InventoryPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const globalInventory = [
    { id: "INV-8821", name: "AMOXICILLIN 500MG", facility: "METRO CORE", stock: 1240, status: "OPTIMAL" },
    { id: "INV-4402", name: "SURGICAL GLOVES (L)", facility: "SUBURBAN WING", stock: 150, status: "LOW STOCK" },
    { id: "INV-9012", name: "VENTILATOR FILTERS", facility: "RESEARCH HUB", stock: 12, status: "CRITICAL" },
    { id: "INV-3311", name: "PARACETAMOL IV", facility: "METRO CORE", stock: 0, status: "OUT OF STOCK" },
    { id: "INV-1155", name: "SYRINGES (5ML)", facility: "TRAUMA UNIT", stock: 5000, status: "OPTIMAL" },
    { id: "INV-6677", name: "MRI CONTRAST AGENT", facility: "RESEARCH HUB", stock: 45, status: "LOW STOCK" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getStatusRowStyle = (status: string) => {
    switch (status) {
      case 'OPTIMAL': return { borderLeft: '4px solid #10b981' };
      case 'LOW STOCK': return { borderLeft: '4px solid #f59e0b' };
      case 'CRITICAL': 
      case 'OUT OF STOCK': return { borderLeft: '4px solid #dc2626' };
      default: return {};
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPTIMAL': return '#137333';
      case 'LOW STOCK': return '#b25e00';
      case 'CRITICAL':
      case 'OUT OF STOCK': return '#c5221f';
      default: return '#64748b';
    }
  };

  const filteredInventory = globalInventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.facility.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="super_admin" userName="Master Admin">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>GLOBAL STOCK CTRL</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '1px' }}>ROOT LOGISTICS • NETWORK SUPPLY CHAIN MONITOR</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-outline-premium" onClick={() => showToast("Stock reallocator panel initialized", "info")} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <ArrowRightLeft size={18} /> REALLOCATE
          </button>
          <button className="btn-primary-premium" onClick={() => showToast("Bulk procurement order created", "success")} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} /> BULK PROCUREMENT
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: "GLOBAL ASSET VALUE", value: "$1.82M", icon: <TrendingUp size={18} />, trend: "+4.2% NETWORK GROWTH", color: '#067D71', bg: '#eef7f6' },
          { label: "SHORTAGE NODES", value: "06", icon: <AlertTriangle size={18} />, trend: "ACROSS 4 FACILITIES", color: '#dc2626', bg: '#fce8e6' },
          { label: "EXPIRY SENTINEL", value: "24", icon: <Clock size={18} />, trend: "ITEMS EXPIRE < 30D", color: '#f59e0b', bg: '#fef3c7' }
        ].map((stat, i) => (
          <div key={i} className="card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color === '#dc2626' ? '#dc2626' : 'var(--text-primary)' }}>{stat.value}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: stat.color }}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Inventory Control */}
      <div className="card-premium" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
            <input 
              type="text" 
              placeholder="SEARCH ACROSS ALL FACILITY INVENTORIES BY ASSET NAME, NODE ID, OR CATEGORY" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '15px 16px 15px 50px', background: '#f4f4f5', border: 'none', borderRadius: '30px', fontWeight: '700', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <button className="btn-outline-premium" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <Filter size={18} /> <span>FILTER</span>
          </button>
          <button className="btn-outline-premium" onClick={() => showToast("Exporting compliance report...", "info")} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> EXPORT
          </button>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
          <table className="data-table-premium">
            <thead>
              <tr>
                <th style={{ padding: '16px 20px' }}>ASSET IDENTITY</th>
                <th style={{ padding: '16px 20px' }}>FACILITY NODE</th>
                <th style={{ padding: '16px 20px' }}>STOCK LEVEL</th>
                <th style={{ padding: '16px 20px' }}>STATUS</th>
                <th style={{ padding: '16px 20px' }}>ROOT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item, i) => (
                <tr key={item.id} style={{ 
                  borderBottom: '1px solid #eee',
                  ...getStatusRowStyle(item.status)
                }}>
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ 
                         width: '36px', 
                         height: '36px', 
                         borderRadius: '50%',
                         background: '#eef7f6', 
                         color: '#067D71', 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center', 
                         fontWeight: 900, 
                         fontSize: '0.85rem' 
                       }}>
                         {item.name.charAt(0)}
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontWeight: '900', fontSize: '0.85rem' }}>{item.name}</span>
                         <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5 }}>{item.id}</span>
                       </div>
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px', fontWeight: 900, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Hospital size={14} style={{ color: 'var(--bg-side)' }} /> {item.facility}
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {item.stock.toLocaleString()}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      borderRadius: '12px',
                      background: item.status === 'OPTIMAL' ? '#e6f4ea' : item.status === 'LOW STOCK' ? '#fff7ed' : '#fce8e6',
                      color: getStatusColor(item.status)
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }} 
                        onClick={() => showToast(`Initiating Bulk Reorder for ${item.name}`, "info")}
                        title="Bulk Procurement"
                      >
                        <ShoppingCart size={18} />
                      </button>
                      <button 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }}
                        onClick={() => showToast(`Triggering Quick Restock for ${item.name}`, "success")}
                        title="Quick Restock"
                      >
                        <Zap size={18} />
                      </button>
                      <button 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }}
                        onClick={() => showToast(`Refreshing sync for ${item.id}`, "info")}
                        title="Sync Data"
                      >
                        <RefreshCcw size={18} />
                      </button>
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
