const API_BASE_URL = 'http://localhost:8000/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown Error' }));
    const errorMsg = typeof error.detail === 'object' ? JSON.stringify(error.detail) : (error.detail || `Request failed with status ${response.status}`);
    throw new Error(errorMsg);
  }
  return response.json();
};

export const apiService = {
  getHospitals: async () => {
    const response = await fetch(`${API_BASE_URL}/hospitals/`);
    return handleResponse(response);
  },
  
  getGlobalStats: async () => {
    const response = await fetch(`${API_BASE_URL}/hospitals/global/stats`);
    return handleResponse(response);
  },

  getAdmins: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/admins`);
    return handleResponse(response);
  },

  registerHospital: async (hospitalData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hospitalData),
    });
    return handleResponse(response);
  },

  registerDoctor: async (doctorData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData),
    });
    return handleResponse(response);
  },

  register: async (userData: any) => {
    const payload = {
      ...userData,
      username: userData.username || userData.email
    };
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  login: async (credentials: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  getPatients: async (hospitalId?: number) => {
    const url = hospitalId ? `${API_BASE_URL}/patients/?hospital_id=${hospitalId}` : `${API_BASE_URL}/patients/`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getPatientAppointments: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/appointments/patient/${id}`);
    return handleResponse(response);
  },

  getPrescriptions: async (username: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${username}/prescriptions`);
    return handleResponse(response);
  },

  createAppointment: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/appointments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getDoctorAppointments: async (doctorId: number) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/appointments`);
    return handleResponse(response);
  },

  updateAppointment: async (appointmentId: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/doctors/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getHospitalAppointments: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/appointments/hospital/${hospitalId}`);
    return handleResponse(response);
  },

  approveAppointment: async (appointmentId: number) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/approve`, {
      method: 'POST'
    });
    return handleResponse(response);
  },

  patchAppointment: async (appointmentId: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getDoctors: async (hospitalId?: number) => {
    const url = hospitalId ? `${API_BASE_URL}/doctors/?hospital_id=${hospitalId}` : `${API_BASE_URL}/doctors/`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getAssignedPatients: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${id}/patients`);
    return handleResponse(response);
  },

  getDoctorSchedule: async (doctorId: number) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/schedule`);
    return handleResponse(response);
  },

  createDoctorSchedule: async (scheduleData: any) => {
    const response = await fetch(`${API_BASE_URL}/doctors/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData),
    });
    return handleResponse(response);
  },

  getHospitalInventory: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${hospitalId}`);
    return handleResponse(response);
  },

  getInventoryAlerts: async () => {
    const response = await fetch(`${API_BASE_URL}/hospital/inventory/alerts`);
    return handleResponse(response);
  },

  addStock: async (itemId: number, quantity: number) => {
    const response = await fetch(`${API_BASE_URL}/hospital/inventory/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, quantity })
    });
    return handleResponse(response);
  },

  createInventoryItem: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/hospital/inventory/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateInventoryItem: async (itemId: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/hospital/inventory/update/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteInventoryItem: async (itemId: number) => {
    const response = await fetch(`${API_BASE_URL}/hospital/inventory/delete/${itemId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  getBeds: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/hospital/beds?hospital_id=${hospitalId}`);
    return handleResponse(response);
  },

  addBed: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/hospital/beds/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getSystemAlerts: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/alerts/${userId}`);
    return handleResponse(response);
  },

  getUsers: async (role?: string, hospitalId?: number) => {
    let url = `${API_BASE_URL}/users/`;
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (hospitalId) params.append('hospital_id', hospitalId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  updateVitals: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/nurse/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getLatestVitals: async (username: string) => {
    const response = await fetch(`${API_BASE_URL}/vitals/${username}`);
    return handleResponse(response);
  },

  updateUser: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  createStaffSchedule: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/users/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // --- CLINICAL WORKFLOWS ---
  getNursePatients: async (nurseId: number) => {
    const res = await fetch(`${API_BASE_URL}/clinical/nurse/${nurseId}/patients`);
    return handleResponse(res);
  },

  requestLabTest: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/doctor/test-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  prescribeMeds: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/doctor/prescribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  requestAdmission: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/doctor/admit-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getPendingAdmissions: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/admissions/pending?hospital_id=${hospitalId}`);
    return handleResponse(response);
  },

  finalizeAdmission: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/admissions/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getPatientPrescriptions: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/doctor/prescriptions/${patientId}`);
    return handleResponse(response);
  },

  createNurseMedicineRequest: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/nurse/medicine-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  markDoctorOrderDone: async (orderId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/pharmacy/order/${orderId}/done`, {
      method: 'PATCH'
    });
    return handleResponse(response);
  },

  getPharmacyNurseRequests: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/pharmacy/nurse-requests/${hospitalId}`);
    return handleResponse(response);
  },

  markNurseRequestDone: async (requestId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/pharmacy/nurse-request/${requestId}/done`, {
      method: 'PATCH'
    });
    return handleResponse(response);
  },

  getAdmissions: async () => {
    const response = await fetch(`${API_BASE_URL}/clinical/admissions`);
    return handleResponse(response);
  },

  getPharmacyOrders: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/pharmacy/orders?hospital_id=${hospitalId}`);
    return handleResponse(response);
  },

  sendEmergencyAlert: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  requestAmbulance: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/ambulance-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getPendingTests: async () => {
    const response = await fetch(`${API_BASE_URL}/clinical/lab/pending`);
    return handleResponse(response);
  },

  uploadTestResult: async (testId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/clinical/lab/upload/${testId}`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  getPatientTests: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/patient/${patientId}/tests`);
    return handleResponse(response);
  },

  getPatientExpenditure: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/patient/${patientId}/billing`);
    return handleResponse(response);
  },

  getPatientBills: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/patient/${patientId}/billing`);
    const data = await handleResponse(response);
    return data.history || [];
  },

  getPatientHistory: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/patient/${patientId}/history`);
    return handleResponse(response);
  },

  getAmbulances: async (hospitalId?: number) => {
    const url = hospitalId ? `${API_BASE_URL}/ambulance/?hospital_id=${hospitalId}` : `${API_BASE_URL}/ambulance/`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  addAmbulance: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/ambulance/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },


  updateAmbulanceStatus: async (id: number, status: string) => {
    const response = await fetch(`${API_BASE_URL}/ambulance/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  updateBedStatus: async (id: number, status: string) => {
    const response = await fetch(`${API_BASE_URL}/hospital/beds/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  getClinicalPrescriptions: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/clinical/patient/${patientId}/prescriptions`);
    return handleResponse(response);
  },

  // --- SPECIALIZED CLINICAL MODULES ---
  getBloodStock: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/specialized/blood-stock/${hospitalId}`);
    return handleResponse(response);
  },

  updateBloodStock: async (hospitalId: number, data: { blood_group: string; units: number }) => {
    const response = await fetch(`${API_BASE_URL}/specialized/blood-stock/${hospitalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getBloodRequests: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/specialized/blood-requests/${hospitalId}`);
    return handleResponse(response);
  },

  createBloodRequest: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/specialized/blood-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getSurgicalSchedules: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/specialized/surgical-schedules/${hospitalId}`);
    return handleResponse(response);
  },

  updateSurgicalChecklist: async (id: number, checklist: any) => {
    const response = await fetch(`${API_BASE_URL}/specialized/surgical-schedule/${id}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checklist),
    });
    return handleResponse(response);
  },

  scheduleSurgery: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/specialized/surgical-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  approveSurgery: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/specialized/surgical-schedule/${id}/approve`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  deleteSurgery: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/specialized/surgical-schedule/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getPatientRiskScore: async (patientId: number) => {
    const response = await fetch(`${API_BASE_URL}/specialized/patient/${patientId}/risk-score`);
    return handleResponse(response);
  },
  getHospitalRiskScores: async (hospitalId: number) => {
    const response = await fetch(`${API_BASE_URL}/specialized/hospital/${hospitalId}/risk-scores`);
    return handleResponse(response);
  },
  
  createAlert: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/clinical/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },


  uploadHealthRecord: async (patientId: number, title: string, type: string, file: File) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('record_type', type);
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/clinical/patient/${patientId}/health-records`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },
};
