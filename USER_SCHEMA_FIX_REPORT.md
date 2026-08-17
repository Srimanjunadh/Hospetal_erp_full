# User Schema Fix Report

This document reports on the analysis, implementation, and verification steps completed to resolve the SQLAlchemy model inconsistency for the `User` class.

---

## 1. Problem
The database table `users` in the PostgreSQL instance includes four active columns:
* `image` (text)
* `gender` (varchar)
* `dob` (varchar)
* `blood_group` (varchar)

These columns are queried and updated by the PMS Compatibility Router layer (using raw SQL execution). However, they were not declared on the core SQLAlchemy `User` class inside the application models. 

This schema model discrepancy resulted in:
* SQLAlchemy ORM queries not being able to fetch or write to these user fields.
* Silent mismatch bugs when retrieving `User` structures in other microservices or standard endpoints.
* Future database auto-generation tools (`Base.metadata.create_all`) failing to declare these columns, causing runtime crashes on fresh deployments.

---

## 2. Root Cause
The `User` class in [models.py](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/backend/app/shared/database/models.py#L6) lacked mappings for `image`, `gender`, `dob`, and `blood_group`, despite the live database schema and compatibility router utilizing them.

---

## 3. Solution
Added the missing columns directly to the `User` class definition in [models.py](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/backend/app/shared/database/models.py#L20-L23):
```python
    image = Column(Text, nullable=True)
    gender = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
```
This aligns the ORM entity mappings perfectly with the live database columns, matching the nullable types and constraints.

---

## 4. Files Changed
* [backend/app/shared/database/models.py](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/backend/app/shared/database/models.py)

---

## 5. Verification & Testing
1. **Compilation Check:** Verified that Python parses and imports the updated model correctly (retrieved `User.gender` successfully).
2. **Unit Test Runs:** Executed both the appointment and identity test suites. All 6 tests passed successfully.
