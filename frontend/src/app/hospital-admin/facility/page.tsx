"use client";
import { useState, useEffect } from "react";
import { Truck, Bed, Zap, Wind, Plus, Activity, MapPin, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";

interface Ambulance {
  dbId: number;
  id: string;
  crew: string;
  phone: string;
  size: string;
  location: string;
  status: string;
}

interface RoomControlItem {
  dbId: number;
  id: string;
  dept: string;
  o2: string;
  status: string;
}

export default function FacilityControlPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [roomControl, setRoomControl] = useState<RoomControlItem[]>([]);
  const [utilityStatus, setUtilityStatus] = useState({
    power: "OPTIMAL",
    oxygen: "OPTIMAL",
    hvac: "SERVICE REQ."
  });
  const [showAddAmbulance, setShowAddAmbulance] = useState(false);
  const [newAmbulance, setNewAmbulance] = useState({
    vehicle_number: "",
    driver_name: "",
    driver_phone: "",
    vehicle_size: "MEDIUM",
    status: "READY",
    location: "BASE 1 - MAIN WING"
  });

  const fetchFacilityData = async (hospitalId: number) => {
    try {
      const { apiService } = await import("@/services/api");
      const ambData = await apiService.getAmbulances(hospitalId);
      setAmbulances(ambData.map((a: { id: number; vehicle_number: string; driver_name: string; driver_phone?: string; vehicle_size?: string; location: string; status: string; }) => ({
        dbId: a.id,
        id: a.vehicle_number,
        crew: a.driver_name,
        phone: a.driver_phone || "N/A",
        size: a.vehicle_size || "MEDIUM",
        location: a.location,
        status: a.status.toUpperCase()
      })));

      const bedData = await apiService.getBeds(hospitalId);
      setRoomControl(bedData.map((b: { id: number; room_number: string; bed_number: string; dept?: string; o2_lvl?: string; status: string; }) => ({
        dbId: b.id,
        id: `${b.room_number}-${b.bed_number}`,
        dept: b.dept || "GENERAL",
        o2: b.o2_lvl || (Math.floor(Math.random() * 5) + 94) + "%",
        status: b.status.toUpperCase()
      })));

      // Simulate slight fluctuations in utility health
      setUtilityStatus({
        power: Math.random() > 0.95 ? "FLUCTUATING" : "OPTIMAL",
        oxygen: Math.random() > 0.9 ? "STABLE" : "OPTIMAL",
        hvac: utilityStatus.hvac
      });
    } catch {
      showToast("Facility sync error", "error");
    }
  };

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session?.hospital_id) {
      fetchFacilityData(session.hospital_id);
      const interval = setInterval(() => fetchFacilityData(session.hospital_id), 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleDispatch = async (amb: Ambulance) => {
    try {
      const { apiService } = await import("@/services/api");
      await apiService.updateAmbulanceStatus(amb.dbId, "ENGAGED");
      showToast(`Dispatching ${amb.id} to Emergency Node`, "success");
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      fetchFacilityData(session.hospital_id);
    } catch { showToast("Dispatch failed", "error"); }
  };

  const handleService = async (room: RoomControlItem) => {
    try {
      const { apiService } = await import("@/services/api");
      await apiService.updateBedStatus(room.dbId, "maintenance");
      showToast(`Room ${room.id} marked for maintenance`, "info");
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      fetchFacilityData(session.hospital_id);
    } catch { showToast("Service update failed", "error"); }
  };

  const handleAddAmbulanceSubmit = async () => {
    if (!newAmbulance.vehicle_number || !newAmbulance.driver_name || !newAmbulance.driver_phone) {
      showToast("Please enter Vehicle Number, Crew Name, and Mobile Number", "error");
      return;
    }
    try {
      const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
      if (!session?.hospital_id) {
        showToast("Session expired. Please login again.", "error");
        return;
      }
      const { apiService } = await import("@/services/api");
      await apiService.addAmbulance({
        hospital_id: session.hospital_id,
        vehicle_number: newAmbulance.vehicle_number,
        driver_name: newAmbulance.driver_name,
        driver_phone: newAmbulance.driver_phone,
        vehicle_size: newAmbulance.vehicle_size,
        status: newAmbulance.status,
        location: newAmbulance.location || "BASE 1"
      });
      showToast("Ambulance unit successfully deployed", "success");
      setShowAddAmbulance(false);
      setNewAmbulance({
        vehicle_number: "",
        driver_name: "",
        driver_phone: "",
        vehicle_size: "MEDIUM",
        status: "READY",
        location: "BASE 1 - MAIN WING"
      });
      fetchFacilityData(session.hospital_id);
    } catch (e) {
      showToast((e as Error).message || "Failed to add ambulance", "error");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="hospital_admin" userName="Admin Manju">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Facility Control Terminal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Infrastructure Monitoring & Ambulance Dispatch Control</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-outline-premium" 
            onClick={() => setShowAddAmbulance(true)}
            style={{ height: '42px', padding: '0 1.25rem' }}
          >
            <Plus size={16} /> <span>Add Ambulance Unit</span>
          </button>
          <button 
            className="btn-primary-premium" 
            onClick={() => showToast("Deploying Global Emergency Fleet", "success")}
            style={{ height: '42px', padding: '0 1.25rem' }}
          >
            <Truck size={16} /> <span>Dispatch Emergency</span>
          </button>
        </div>
      </div>

      {showAddAmbulance && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card-premium" style={{ width: '100%', maxWidth: '480px', background: '#fff', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={20} style={{ color: 'var(--bg-side)' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add Ambulance Unit</h2>
              </div>
              <button style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowAddAmbulance(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Vehicle Registration Number *</label>
                <input 
                  type="text" 
                  placeholder="e.g. KA-04-EM-2026" 
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  value={newAmbulance.vehicle_number}
                  onChange={(e) => setNewAmbulance({...newAmbulance, vehicle_number: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Assigned Crew / EMT Lead *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Kumar (EMT-P)" 
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  value={newAmbulance.driver_name}
                  onChange={(e) => setNewAmbulance({...newAmbulance, driver_name: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Crew Mobile Number *</label>
                <input 
                  type="text" 
                  placeholder="e.g. +91 98765 43210" 
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  value={newAmbulance.driver_phone}
                  onChange={(e) => setNewAmbulance({...newAmbulance, driver_phone: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Vehicle Size</label>
                <select 
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                  value={newAmbulance.vehicle_size}
                  onChange={(e) => setNewAmbulance({...newAmbulance, vehicle_size: e.target.value})}
                  title="Vehicle Size"
                >
                  <option value="SMALL">SMALL (BASIC LIFE SUPPORT)</option>
                  <option value="MEDIUM">MEDIUM (ADVANCED LIFE SUPPORT)</option>
                  <option value="LARGE">LARGE (MOBILE ICU / SPECIALIZED)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Operational Status</label>
                <select 
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                  value={newAmbulance.status}
                  onChange={(e) => setNewAmbulance({...newAmbulance, status: e.target.value})}
                  title="Operational Status"
                >
                  <option value="READY">READY (STANDBY)</option>
                  <option value="ENGAGED">ENGAGED (DISPATCHED)</option>
                  <option value="MAINTENANCE">MAINTENANCE (SERVICE REQ.)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Station / Base Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. BASE 1 - MAIN WING" 
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }}
                  value={newAmbulance.location}
                  onChange={(e) => setNewAmbulance({...newAmbulance, location: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                <button 
                  className="btn-outline-premium"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowAddAmbulance(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary-premium"
                  style={{ flex: 2, justifyContent: 'center' }}
                  onClick={handleAddAmbulanceSubmit}
                >
                  Deploy Unit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Ambulance Fleet Monitor */}
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', background: 'rgba(14, 165, 233, 0.06)', borderBottom: '1px solid rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={18} style={{ color: '#0ea5e9' }} />
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0ea5e9', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Ambulance Fleet Registry</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="text" placeholder="Search fleet..." style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px 6px 30px', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                </div>
                <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Filter size={14} /> FILTER
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>
                  GPS Sync Active
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto' }} className="custom-scrollbar">
              {ambulances.map((amb, i) => {
                let statusBg = '#ecfdf5';
                let statusColor = '#059669';
                if (amb.status === 'ENGAGED') {
                  statusBg = '#e0f2fe';
                  statusColor = '#0284c7';
                } else if (amb.status === 'MAINTENANCE') {
                  statusBg = '#fffbeb';
                  statusColor = '#d97706';
                }
                                return (
                  <div key={i} style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.4 }}>{(i + 1).toString().padStart(2, '0')}</span>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                          <Truck size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{amb.id}</h4>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#f1f5f9', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>{amb.size}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{amb.crew} • <span style={{ fontWeight: 600 }}>{amb.phone}</span></p>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          <MapPin size={14} /> <span>{amb.location}</span>
                        </div>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          padding: '2px 8px', 
                          borderRadius: '10px',
                          background: statusBg,
                          color: statusColor
                        }}>{amb.status}</span>
                      </div>
                      {amb.status === 'READY' && (
                        <button 
                          className="btn-primary-premium"
                          style={{ padding: '6px 14px', fontSize: '0.75rem', height: '32px' }}
                          onClick={() => handleDispatch(amb)}
                        >
                          Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Control Terminal */}
          <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', background: 'rgba(6, 125, 113, 0.05)', borderBottom: '1px solid rgba(6, 125, 113, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <Bed size={18} style={{ color: 'var(--bg-side)' }} />
                 <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--bg-side)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Room Inventory Database</h3>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ position: 'relative' }}>
                   <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                   <input type="text" placeholder="Search rooms..." style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px 6px 30px', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                 </div>
                 <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                   <Filter size={14} /> FILTER
                 </button>
               </div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="custom-scrollbar">
              <table className="data-table-premium" style={{ border: 'none' }}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Room ID</th>
                    <th>Dept</th>
                    <th>O2 Level</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roomControl.map((room, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{room.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{room.dept}</td>
                      <td style={{ fontWeight: 700 }}>{room.o2}</td>
                      <td>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          padding: '4px 8px', 
                          borderRadius: '12px',
                          background: room.status === 'AVAILABLE' ? '#ecfdf5' : '#fef2f2',
                          color: room.status === 'AVAILABLE' ? '#059669' : '#dc2626'
                        }}>{room.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                         <button 
                          className="btn-outline-premium"
                          style={{ padding: '4px 10px', fontSize: '0.7rem', height: '28px' }}
                          onClick={() => handleService(room)}
                         >
                            Service
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Infrastructure Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card-premium">
             <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Utility Heartbeat</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderLeft: '4px solid #0284c7', borderRadius: '0 8px 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Zap size={18} style={{ color: '#0284c7' }} />
                     <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Power Grid</span>
                   </div>
                   <button 
                    style={{ background: 'transparent', border: 'none', color: utilityStatus.power === 'OPTIMAL' ? '#059669' : '#d97706', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    onClick={() => showToast(`Power Grid Audit: ${utilityStatus.power}`, "info")}
                   >
                     {utilityStatus.power}
                   </button>
                </div>
                
                <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderLeft: '4px solid #059669', borderRadius: '0 8px 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Wind size={18} style={{ color: '#059669' }} />
                     <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Oxygen Node</span>
                   </div>
                   <button 
                    style={{ background: 'transparent', border: 'none', color: utilityStatus.oxygen === 'OPTIMAL' ? '#059669' : '#0284c7', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    onClick={() => showToast(`Oxygen Node Audit: ${utilityStatus.oxygen}`, "info")}
                   >
                     {utilityStatus.oxygen}
                   </button>
                </div>
                
                <div style={{ padding: '1rem 1.25rem', background: '#fef2f2', borderLeft: '4px solid #dc2626', borderRadius: '0 8px 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Activity size={18} style={{ color: '#dc2626' }} />
                     <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#991b1b' }}>HVAC System</span>
                   </div>
                   <button 
                    style={{ background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                    onClick={() => showToast("HVAC Service Team Status: " + utilityStatus.hvac, "error")}
                   >
                     {utilityStatus.hvac}
                   </button>
                </div>
             </div>
          </div>

          <div className="card-premium" style={{ background: 'linear-gradient(135deg, var(--bg-side) 0%, var(--bg-side-dark) 100%)', border: 'none', color: '#fff' }}>
             <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>Facility Notes</h3>
             <textarea 
               placeholder="Enter administrative facility observations or handover logs..." 
               style={{ width: '100%', height: '140px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', padding: '1rem', fontSize: '0.85rem', outline: 'none', resize: 'none' }}
             ></textarea>
             <button className="btn-primary-premium" style={{ background: '#fff', color: 'var(--bg-side)', width: '100%', marginTop: '1.25rem', height: '42px', justifyContent: 'center' }} onClick={() => showToast("Facility Log Synchronized", "success")}>Save Handover Log</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
