# MediClues+ Healthcare Platform

MediClues+ is a modern, high-performance healthcare management system designed to bridge the gap between patients, healthcare providers, and administrative staff. It offers seamless appointment booking, medical record management, and real-time queue tracking.

## 🏗️ System Architecture

The platform is built using a modern 3-tier architecture:

1.  **Frontend (Patient Portal)**: A responsive React 18 application for users to discover doctors, book appointments, and manage health records.
2.  **Admin & Doctor Portal**: A centralized dashboard for hospital staff and healthcare professionals to manage appointments and diagnostics.
3.  **FastAPI Backend**: A robust, high-speed Python/FastAPI server handling business logic, authentication, and database interactions.

---

## ✨ Core Features

### 👤 Patient Experience
-   **Advanced Discovery**: Search for doctors by specialization, location, or hospital affiliation.
-   **Intelligent Booking**: Select morning/evening slot types with real-time availability tracking.
-   **Appointment Pass**: Landscape-oriented digital confirmation with QR code for seamless reception check-in.
-   **Medical Records**: Securely upload and store lab reports, X-rays, and prescriptions using Cloudinary.
-   **Real-time Queue tracking**: Live tracking of token numbers and estimated wait times.
-   **Diagnostic Services**: Book lab tests and manage diagnostic reports through the dedicated "Labs" module.

### 👨‍⚕️ Doctor & Admin Features
-   **Dashboard Analytics**: Visual insights into patient volume, revenue, and appointment trends.
-   **Live Queue Management**: Real-time status updates (In-consult, On-break, Online) with patient handover controls.
-   **Hospital Partnerships**: Manage collaborated hospitals and their dedicated medical staff.
-   **Secure Authentication**: Role-based access control using production-grade JWT and encrypted sessions.

---

## 🛠️ Technology Stack

### **Frontend & Admin Tools**
-   **React 18** (Vite-powered)
-   **Tailwind CSS** (Premium UI/UX)
-   **Framer Motion** (Subtle micro-animations)
-   **Lucide React** (Modern Iconography)
-   **Axios** (Robust API communication)

### **Backend & Infrastructure**
-   **FastAPI (Python)** (Async performance)
-   **PostgreSQL** (Neon.tech Hosted)
-   **Cloudinary** (Secure Document Storage)
-   **Brevo (SMTP)** (OTP & Confirmation Emails)
-   **Razorpay** (Reliable Payment Gateway)

---

## 📂 Project Structure

```bash
MediClues-Healthcare/
├── frontend/             # Patient-facing React application
│   ├── src/pages/        # Main application views (Home, Appointments, Profile)
│   ├── src/components/   # Reusable UI elements (Navbar, Modals, Loaders)
│   └── src/context/      # Shared state management
├── admin/                # Unified Admin & Doctor Dashboard
│   ├── src/pages/        # Specialized dashboards for Admin/Doctors
│   └── src/components/   # Dashboard widgets and forms
├── fastapi_back/          # Python/FastAPI REST Server
│   ├── app/controllers/  # High-level business logic
│   ├── app/routes/       # API endpoint definitions
│   ├── app/models/       # Database schemas (SQLAlchemy/SQLModel)
│   └── app/services/     # Third-party integrations (Cloudinary, Brevo, SMS)
└── .env                  # Project-wide secrets (keep this secure!)
```

---

## 🚀 Getting Started

### 1. Prerequisites
-   **Python 3.10+** (Backend)
-   **Node.js 16+** (Frontend/Admin)
-   **PostgreSQL Instance** (Local or Cloud)

### 2. Backend Setup
```bash
cd fastapi_back
pip install -r requirements.txt
# Configure your .env file in this directory
python -m uvicorn main:app --port 5000 --reload
```

### 3. Frontend & Admin Setup
```bash
# In separate terminals:
cd frontend && npm install && npm run dev
cd admin && npm install && npm run dev
```

---

## 🔐 Portal Login Credentials

To access the different management portals, use the following credentials:

### **1. Super Admin Portal** (Full System Control)
*   **Email:** `medclues123@gmail.com`
*   **Password:** `VHARSHITH121427$$`
*   **Action:** Full hospital, DEAN, and system-wide management.

### **2. DEAN Portal** (Hospital Controller)

The following table contains the unique login credentials for every hospital. **Each DEAN can only see doctors and data belonging to their own hospital.**

| Hospital Name | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Andhra Hospitals** | `dean.andhra.hospitals@medclues.com` | `mc.andhra.hospitals.123` | Hospital Controller |
| **Aster Ramesh Hospital** | `dean.aster.ramesh.hospital@medclues.com` | `mc.aster.ramesh.hospital.123` | Hospital Controller |
| **Apollo Hospitals** | `dean.apollo.hospitals@medclues.com` | `mc.apollo.hospitals.123` | Hospital Controller |
| **Capital Hospitals** | `dean.capital.hospitals@medclues.com` | `mc.capital.hospitals.123` | Hospital Controller |
| **SAI HOSPITALS** | `dean.sai.hospitals@medclues.com` | `mc.sai.hospitals.123` | Hospital Controller |
| **CARE Hospitals** | `dean.care.hospitals@medclues.com` | `mc.care.hospitals.123` | Hospital Controller |
| **Manipal Hospitals** | `dean.manipal.hospitals@medclues.com` | `mc.manipal.hospitals.123` | Hospital Controller |
| **NRI General Hospital** | `dean.nri.general.hospital@medclues.com` | `mc.nri.general.hospital.123` | Hospital Controller |
| **Heart Care Hospital** | `dean.heart.care.hospital@medclues.com` | `mc.heart.care.hospital.123` | Hospital Controller |
| **Bone & Joint Center** | `dean.bone.&.joint.center@medclues.com` | `mc.bone.&.joint.center.123` | Hospital Controller |
| **Mind Clinic** | `dean.mind.clinic@medclues.com` | `mc.mind.clinic.123` | Hospital Controller |
| **Vision Eye Institute** | `dean.vision.eye.institute@medclues.com` | `mc.vision.eye.institute.123` | Hospital Controller |
| **Ear Nose Throat Hospital** | `dean.ear.nose.throat.hospital@medclues.com` | `mc.ear.nose.throat.hospital.123` | Hospital Controller |
| **Smile Dental Clinic** | `dean.smile.dental.clinic@medclues.com` | `mc.smile.dental.clinic.123` | Hospital Controller |
| **City General Hospital** | `dean.city.general.hospital@medclues.com` | `mc.city.general.hospital.123` | Hospital Controller |
| **Women Health Clinic** | `dean.women.health.clinic@medclues.com` | `mc.women.health.clinic.123` | Hospital Controller |
| **Skin Care Center** | `dean.skin.care.center@medclues.com` | `mc.skin.care.center.123` | Hospital Controller |
| **Kids Care Hospital** | `dean.kids.care.hospital@medclues.com` | `mc.kids.care.hospital.123` | Hospital Controller |
| **Brain & Spine Institute** | `dean.brain.&.spine.institute@medclues.com` | `mc.brain.&.spine.institute.123` | Hospital Controller |
| **Digestive Health Center** | `dean.digestive.health.center@medclues.com` | `mc.digestive.health.center.123` | Hospital Controller |

---

### **3. Doctor Portal** (Healthcare Professional)
*   **Email:** `shaikjavedali19@gmail.com`
*   **Password:** `Javali786`
*   **Action:** Handle appointments and patient check-ins.

---

## 🔐 Environment Configuration

Ensure your `.env` contains the following keys for full functionality:
-   `DATABASE_URL`: Your PostgreSQL connection string.
-   `CLOUDINARY_URL`: Credentials for medical record storage.
-   `BREVO_API_KEY`: For OTP and appointment confirmations.
-   `RAZORPAY_KEY_ID / SECRET`: For processing online consultations.

---

## 📄 License & Standards
Developed with **MediClues Protocol** standards for healthcare data security and patient privacy.



Terminal 1: FastAPI Backend

cd "c:\Users\ASUS\OneDrive\Desktop\PMS FNL\fastapi_back"
python -m uvicorn main:app --port 5000 --reload



Terminal 2: Frontend (Patient App)

cd "c:\Users\ASUS\OneDrive\Desktop\PMS FNL\frontend"
npm run dev -- --port 5173


Terminal 3: Admin Portal

cd "c:\Users\ASUS\OneDrive\Desktop\PMS FNL\admin"
npm run dev -- --port 5174
