"use client";
import { useState, useEffect, useCallback } from "react";
import { Bed, RefreshCcw, Activity, Clock, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { apiService } from "@/services/api";

interface BedType {
  id: number;
  room_number: string;
  bed_number: string;
  status: string;
  dept?: string;
}

interface Patient {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  user?: {
    name: string;
  };
}

interface Admission {
  id: number;
  hospital_id: number;
  patient_id: number;
  doctor_id: number;
  room_number?: string;
  reason?: string;
  status: string;
  admitted_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export default function AdmissionsManagementPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Admission[]>([]);
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [beds, setBeds] = useState<BedType[]>([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Admission | null>(null);
  const [roomNumber, setRoomNumber] = useState("");

  const fetchData = useCallback(async (hId: number) => {
    setIsLoading(true);
    try {
      const [pending, active, allBeds] = await Promise.all([
        apiService.getPendingAdmissions(hId),
        apiService.getAdmissions(),
        apiService.getBeds(hId)
      ]);
      setPendingRequests(Array.isArray(pending) ? pending : []);
      setActiveAdmissions(Array.isArray(active) ? active.filter((a: Admission) => a.hospital_id === hId && a.status === 'admitted') : []);
      setBeds(Array.isArray(allBeds) ? allBeds.filter((b: BedType) => b.status === 'available') : []);
    } catch {
      showToast("Failed to sync admission data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setMounted(true);
    const session = JSON.parse(localStorage.getItem("medclues_session") || "null");
    if (session && session.hospital_id) {
      setHospitalId(session.hospital_id);
      fetchData(session.hospital_id);
    }
  }, [fetchData]);

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !roomNumber) return;

    try {
      await apiService.finalizeAdmission({
        admission_id: selectedRequest.id,
        room_number: roomNumber
      });
      showToast(`PATIENT ${selectedRequest.patient?.name} ASSIGNED TO ROOM ${roomNumber}`, "success");
      setShowAssignModal(false);
      setRoomNumber("");
      if (hospitalId) fetchData(hospitalId);
    } catch {
      showToast("Finalization failed", "error");
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout role="hospital_admin" userName="Admin Manju">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Admission Control</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Ward Management & Room Assignment Hub</p>
        </div>
        <button 
          onClick={() => hospitalId && fetchData(hospitalId)} 
          className="btn-outline-premium"
          style={{ height: '42px', padding: '0 1.25rem' }}
        >
           <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
           <span>Refresh Status</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Pending Requests */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
           <div style={{ padding: '1.25rem 2rem', background: 'rgba(14, 165, 233, 0.06)', borderBottom: '1px solid rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} style={{ color: '#0ea5e9' }} />
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.5px', color: '#0ea5e9', textTransform: 'uppercase' }}>Pending Admission Requests</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="text" placeholder="Search requests..." style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px 6px 30px', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                </div>
                <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Filter size={14} /> FILTER
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>
                  {pendingRequests.length} Requests
                </span>
              </div>
           </div>
           <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="custom-scrollbar">
             {pendingRequests.length === 0 ? (
               <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                 <Activity size={36} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                 <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No pending admission requests at this node</p>
               </div>
             ) : pendingRequests.map((req, i) => (
               <div key={i} style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.4, marginTop: '2px' }}>{(i + 1).toString().padStart(2, '0')}</span>
                    <div>
                       <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{req.patient?.name}</h4>
                       <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Req. by: <strong style={{ color: 'var(--text-primary)' }}>Dr. {req.doctor?.user?.name}</strong></span>
                          <span style={{ width: '4px', height: '4px', background: '#cbd5e1', borderRadius: '50%' }}></span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                             <Clock size={12} /> {req.admitted_at ? new Date(req.admitted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                          </span>
                       </div>
                       <div style={{ marginTop: '8px' }}>
                         <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '4px 8px', background: '#f1f5f9', color: 'var(--text-primary)', borderRadius: '6px' }}>
                           Reason: {req.reason}
                         </span>
                       </div>
                    </div>
                  </div>
                  <button className="btn-primary-premium" onClick={() => { setSelectedRequest(req); setShowAssignModal(true); }} style={{ padding: '8px 16px', borderRadius: '30px', fontSize: '0.8rem' }}>
                     Assign Room & Admit
                  </button>
               </div>
             ))}
           </div>
        </div>

        {/* Active Admissions */}
        <div className="card-premium" style={{ padding: '0', overflow: 'hidden' }}>
           <div style={{ padding: '1.25rem 2rem', background: 'rgba(6, 125, 113, 0.05)', borderBottom: '1px solid rgba(6, 125, 113, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bed size={18} style={{ color: 'var(--bg-side)' }} />
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.5px', color: 'var(--bg-side)', textTransform: 'uppercase' }}>Active Ward Occupancy</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="text" placeholder="Search ward..." style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px 6px 30px', borderRadius: '20px', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }} />
                </div>
                <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Filter size={14} /> FILTER
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px' }}>
                  {activeAdmissions.length} Admitted
                </span>
              </div>
           </div>
           <div style={{ overflowX: 'auto' }}>
             <table className="data-table-premium">
               <thead>
                 <tr>
                   <th style={{ width: '80px' }}>S.No</th>
                   <th>Room / Bed</th>
                   <th>Patient Details</th>
                   <th>Attending Physician</th>
                   <th>Admitted At</th>
                   <th style={{ textAlign: 'right' }}>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {activeAdmissions.length === 0 ? (
                   <tr>
                     <td colSpan={6} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                         <Bed size={36} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                         <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ward is currently empty</p>
                       </div>
                     </td>
                   </tr>
                 ) : activeAdmissions.map((adm, i) => (
                   <tr key={i}>
                     <td style={{ fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6 }}>{(i + 1).toString().padStart(2, '0')}</td>
                     <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                       <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                         Room {adm.room_number || "TBD"}
                       </span>
                     </td>
                     <td style={{ fontWeight: 700 }}>{adm.patient?.name}</td>
                     <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Dr. {adm.doctor?.user?.name}</td>
                     <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                       {new Date(adm.admitted_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                     </td>
                     <td style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          color: '#059669', 
                          background: '#ecfdf5',
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>
                          ADMITTED
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        `}</style>

      </div>

      {/* Assign Room Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card-premium" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
             <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Assign Ward Bed</h2>
             <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2rem' }}>Finalizing admission node for <strong style={{ color: 'var(--text-primary)' }}>{selectedRequest?.patient?.name}</strong></p>
             
             <form onSubmit={handleFinalize} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                   <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Available Beds by Section</label>
                   <select 
                     required 
                     value={roomNumber} 
                     onChange={e => setRoomNumber(e.target.value)} 
                     style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', outline: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                   >
                     <option value="">-- Select Room / Bed --</option>
                     {Object.entries(
                       beds.reduce((acc: Record<string, BedType[]>, bed: BedType) => {
                         const dept = bed.dept || 'GENERAL';
                         if (!acc[dept]) acc[dept] = [];
                         acc[dept].push(bed);
                         return acc;
                       }, {})
                     ).map(([dept, deptBeds]: [string, BedType[]]) => (
                       <optgroup key={dept} label={`${dept.toUpperCase()} SECTION`}>
                         {deptBeds.map((bed: BedType) => (
                           <option key={bed.id} value={bed.room_number}>
                             Room {bed.room_number} - Bed {bed.bed_number}
                           </option>
                         ))}
                       </optgroup>
                     ))}
                   </select>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                  <button type="button" className="btn-outline-premium" onClick={() => setShowAssignModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-premium" style={{ flex: 2, justifyContent: 'center' }}>
                    Admit Patient
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
