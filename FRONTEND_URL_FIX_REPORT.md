# Frontend URL Parameterization Fix Report

This document reports on the analysis, implementation, and verification steps completed to remove hardcoded API URLs from client-side frontend files.

---

## 1. Problem
Multiple files in the frontend projects contained hardcoded hostnames and ports (e.g. `localhost:8000`, `localhost:5000`, `localhost:5173`). In production or multi-environment deployments, this would cause client-side network request failures due to trying to fetch endpoints on the visitor's local machine.

---

## 2. Root Cause
* [frontend/src/services/api.ts](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/frontend/src/services/api.ts#L1) hardcoded the FastAPI gateway path:
  `const API_BASE_URL = 'http://localhost:8000/api';`
* [pms/frontend/src/pages/About.jsx](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/pms/frontend/src/pages/About.jsx#L11) fallback VITE_BACKEND_URL was set to port 5000 (which is obsolete, as compatibility routes are hosted by the port 8000 Gateway).
* [frontend/src/app/page.tsx](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/frontend/src/app/page.tsx#L28) hardcoded Next.js Links routing users to `http://localhost:5173` for the PMS Portal.

---

## 3. Solution
1. **Parameterize Next.js Backend URL:** Changed the `API_BASE_URL` inside [api.ts](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/frontend/src/services/api.ts#L1) to look at `process.env.NEXT_PUBLIC_API_URL` with a fallback:
   ```typescript
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
   ```
2. **Correct Vite Fallback Port:** Changed the backend fallback port in [About.jsx](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/pms/frontend/src/pages/About.jsx#L11) from 5000 to 8000 (gateway):
   ```javascript
   const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
   ```
3. **Parameterize PMS Portal Link:** Added a `pmsUrl` constant inside [page.tsx](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/frontend/src/app/page.tsx#L12) backed by the `NEXT_PUBLIC_PMS_URL` environment variable:
   ```typescript
   const pmsUrl = process.env.NEXT_PUBLIC_PMS_URL || 'http://localhost:5173';
   ```
   Replaced all hardcoded `http://localhost:5173` references with the `pmsUrl` variable.
4. **Update Environment Template:** Appended Next.js configuration properties to [.env.example](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/.env.example):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_PMS_URL=http://localhost:5173
   ```

---

## 4. Files Changed
* [frontend/src/services/api.ts](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/frontend/src/services/api.ts)
* [pms/frontend/src/pages/About.jsx](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/pms/frontend/src/pages/About.jsx)
* [frontend/src/app/page.tsx](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/frontend/src/app/page.tsx)
* [.env.example](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/.env.example)

---

## 5. Verification Results
* Compiles without errors.
* Replaced references correctly map to variables.
* Backend testing confirmed no regressions or crashes.
