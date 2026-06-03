"use client";
import { useState, useEffect } from "react";
import { Activity, Droplets, PlusCircle, Edit2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";
import { motion } from "framer-motion";

export default function BloodBankPage() {
  const { showToast } = useToast();
  const [stock, setStock] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hospitalId, setHospitalId] = useState<number | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "add">("edit"); // edit total or add batch
  const [selectedGroup, setSelectedGroup] = useState("A+");
  const [unitsInput, setUnitsInput] = useState<number>(0);

  const fetchData = async () => {
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      if (session?.hospital_id) {
        setHospitalId(session.hospital_id);
        const stockData = await apiService.getBloodStock(session.hospital_id);
        setStock(Array.isArray(stockData) ? stockData : []);
        
        const reqData = await apiService.getBloodRequests(session.hospital_id);
        setRequests(Array.isArray(reqData) ? reqData : []);
      }
    } catch {
      setStock([]);
      setRequests([]);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const handleOpenEdit = (item: any) => {
    setModalMode("edit");
    setSelectedGroup(item.blood_group);
    setUnitsInput(item.units_available || 0);
    setIsModalOpen(true);
  };

  const handleOpenAddBatch = () => {
    setModalMode("add");
    setSelectedGroup("A+");
    setUnitsInput(5); // Default batch size
    setIsModalOpen(true);
  };

  const handleSaveStock = async () => {
    if (!hospitalId) return;
    try {
      let finalUnits = unitsInput;
      
      if (modalMode === "add") {
        // Find existing units and add
        const existing = stock.find(s => s.blood_group === selectedGroup);
        const currentUnits = existing ? existing.units_available : 0;
        finalUnits = currentUnits + unitsInput;
      }

      await apiService.updateBloodStock(hospitalId, {
        blood_group: selectedGroup,
        units: finalUnits
      });

      showToast(
        modalMode === "add"
          ? `Successfully registered donation batch of +${unitsInput} Units for ${selectedGroup}`
          : `Successfully updated ${selectedGroup} reserves to ${finalUnits} Units`,
        "success"
      );
      
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      showToast("Failed to update blood stock", "error");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="hospital_admin" userName="Admin Manju">
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Blood Inventory & Logistics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Real-Time Compatibility & Stock Monitoring</p>
        </div>
        <button className="btn-primary-premium" onClick={handleOpenAddBatch} style={{ height: '42px', padding: '0 1.25rem', borderRadius: '30px' }}>
          <PlusCircle size={16} />
          <span>Register Donation Batch</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Stock Grid */}
          <div className="card-premium">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
              <Droplets size={20} color="#e11d48" />
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Current Reserves</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
              {Array.isArray(stock) && stock.length > 0 ? stock.map((item) => {
                const isLow = (item.units_available || 0) < 5;
                return (
                  <div 
                    key={item.blood_group} 
                    style={{ 
                      borderRadius: '16px',
                      border: isLow ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(226, 232, 240, 0.8)', 
                      padding: '1.25rem', 
                      textAlign: 'center', 
                      background: isLow ? 'rgba(254, 242, 242, 0.5)' : '#fff', 
                      position: 'relative',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.01)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e11d48', marginBottom: '2px' }}>{item.blood_group}</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.units_available || 0} Units</p>
                    
                    <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '10px', marginTop: '12px', marginBottom: '16px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: isLow ? '#f43f5e' : '#10b981', width: `${Math.min(100, (item.units_available || 0) * 10)}%`, borderRadius: '10px', transition: 'width 0.4s ease' }}></div>
                    </div>
                    
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="btn-outline-premium"
                      style={{ 
                        padding: '4px 10px', 
                        fontSize: '0.7rem', 
                        height: '28px',
                        margin: '0 auto', 
                        borderRadius: '20px',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit2 size={10} />
                      <span>Adjust</span>
                    </button>
                  </div>
                );
              }) : (
                <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                  Initializing Inventory Node...
                </div>
              )}
            </div>
          </div>

          {/* Request History */}
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', background: 'rgba(6, 125, 113, 0.05)', borderBottom: '1px solid rgba(6, 125, 113, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} style={{ color: 'var(--bg-side)' }} />
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--bg-side)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Pending Requisitions</h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e2f1f0', color: 'var(--bg-side)', padding: '2px 8px', borderRadius: '12px' }}>
                {requests.length} Requests
              </span>
            </div>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="custom-scrollbar">
              {!Array.isArray(requests) || requests.length === 0 ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Droplets size={36} style={{ color: 'var(--text-secondary)', opacity: 0.3, margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No active blood requests</p>
                </div>
              ) : (
                requests.map((req, i) => (
                  <div key={i} style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.4 }}>{(i + 1).toString().padStart(2, '0')}</span>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          Type: <strong style={{ color: '#e11d48' }}>{req.blood_group}</strong> • {req.units_required} Units
                        </p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            color: req.urgency === 'CRITICAL' ? '#be123c' : '#b45309',
                            background: req.urgency === 'CRITICAL' ? '#ffe4e6' : '#fef3c7',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            {req.urgency}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status: {req.status}</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn-primary-premium" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px' }}>
                      Approve & Release
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Compatibility Matrix */}
          <div className="card-premium" style={{ background: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)', color: '#fff', border: 'none' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Compatibility Matrix</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: '1.5', fontWeight: 500 }}>
              <strong>O-</strong> is the Universal Donor.<br/>
              <strong>AB+</strong> is the Universal Recipient.
            </p>
            <div style={{ marginTop: '2rem', fontSize: '0.7rem', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></span>
              AUTO-MATCHING ROUTER ONLINE
            </div>
          </div>

          {/* Emergency Broadcast */}
          <div className="card-premium">
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Emergency Broadcast</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Broadcast real-time push alert to connected donor network database for rare blood group matches.
            </p>
            <button className="btn-primary-premium" style={{ width: '100%', background: '#be123c', boxShadow: '0 4px 12px rgba(190, 18, 60, 0.25)', height: '42px', justifyContent: 'center' }}>
              Signal Donor Network
            </button>
          </div>
        </div>
      </div>

      {/* Manage Blood Stock Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', width: '100%', maxWidth: '420px', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                   {modalMode === "add" ? "Register Donation Batch" : "Adjust Reserves"}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Blood Group</label>
                    {modalMode === "add" ? (
                      <select 
                        value={selectedGroup} 
                        onChange={e => setSelectedGroup(e.target.value)} 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', outline: 'none' }}
                      >
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ padding: '12px', borderRadius: '10px', fontWeight: 800, fontSize: '1.4rem', color: '#e11d48', background: 'rgba(254, 242, 242, 0.7)', textAlign: 'center' }}>
                        {selectedGroup}
                      </div>
                    )}
                 </div>
                 
                 <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                      {modalMode === "add" ? "Units to add" : "Total Stock Level (Units)"}
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        value={unitsInput} 
                        onChange={e => setUnitsInput(Math.max(0, Number(e.target.value)))} 
                        style={{ flex: 1, padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontWeight: 700, fontSize: '1.1rem', outline: 'none' }} 
                      />
                    </div>
                    
                    {/* Quick Adjuster Chips */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {[1, 5, 10].map(val => (
                        <button
                          key={val}
                          onClick={() => setUnitsInput(prev => prev + val)}
                          className="btn-outline-premium"
                          style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '20px', height: '28px' }}
                        >
                          +{val} Units
                        </button>
                      ))}
                      {modalMode === "edit" && [1, 5].map(val => (
                        <button
                          key={`sub-${val}`}
                          onClick={() => setUnitsInput(prev => Math.max(0, prev - val))}
                          className="btn-outline-premium"
                          style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '20px', height: '28px' }}
                        >
                          -{val} Units
                        </button>
                      ))}
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="btn-outline-premium"
                      style={{ flex: 1, height: '45px', justifyContent: 'center' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveStock} 
                      className="btn-primary-premium"
                      style={{ flex: 2, height: '45px', background: '#e11d48', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)', justifyContent: 'center' }}
                    >
                      {modalMode === "add" ? "Add to Stock" : "Update Reserves"}
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
