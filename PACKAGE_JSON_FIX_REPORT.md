# package.json NPM Scripts Fix Report

This document reports on the analysis, implementation, and verification steps completed to resolve the stale/broken commands inside the root npm configuration.

---

## 1. Problem
The root `package.json` file contained legacy scripts (`pms:admin` and `pms:backend`) that referenced directories `pms/admin` and `pms/fastapi_back`. These subfolders no longer exist in the repository since all PMS compatibility endpoints have been migrated to run directly inside the monolithic backend (port 8000). Trying to run these scripts failed with directory-not-found errors.

Additionally, the root configuration lacked standard commands to build or start production builds of the Next.js and Vite client applications.

---

## 2. Root Cause
The scripts in `package.json`:
* `"pms:admin": "npm run dev --prefix pms/admin"`
* `"pms:backend": "cd pms/fastapi_back && ..."`
were stale residues of older development stages.

---

## 3. Solution
1. **Removed Stale Commands:** Deleted the `"pms:admin"` and `"pms:backend"` script definitions from [package.json](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/package.json#L9-L10).
2. **Added Unified Build Command:** Added a new `"build"` script that builds both the Next.js frontend and Vite PMS frontend applications:
   ```json
   "build": "npm run build --prefix frontend && npm run build --prefix pms/frontend"
   ```
3. **Added Unified Production Start Command:** Added a new `"start"` script that triggers the Next.js server along with the python backend concurrently:
   ```json
   "start": "npx concurrently \"npm run start --prefix frontend\" \"npm run backend\""
   ```

---

## 4. Files Changed
* [package.json](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/package.json)

---

## 5. Verification Results
* Running `npm run dev` and `npm run dev:all` executes properly to run servers.
* Validated syntax correctness of JSON structure.
