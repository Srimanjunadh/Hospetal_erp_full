# Docker Sync Communication Fix Report

This document reports on the analysis, implementation, and verification steps completed to resolve the Docker container-to-container synchronization communication issue.

---

## 1. Problem
In Docker microservices deployment, individual services run in separate isolated containers under their respective network aliases (e.g. `identity-service`, `doctor-service`, `gateway`, etc.).

The `broadcast_sync()` function (responsible for syncing database tables downstream) was unconditionally replacing these service hostnames with `"127.0.0.1"`.
Inside a containerized network, `127.0.0.1` represents the local loopback interface of the *calling* container. For example, when `doctor-service` tried to invoke a POST request on the gateway, it attempted to connect to `127.0.0.1:8000` (itself), which has no open port 8000, breaking container communication.

---

## 2. Root Cause
In [sync.py](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/backend/app/shared/database/sync.py), the `broadcast_sync` hostname resolution logic:
```python
url = base_url.replace("identity-service", "127.0.0.1") \
              ...
```
was running unconditionally, regardless of whether the system was running inside Docker containers or on the local host machine.

---

## 3. Solution
1. **Added Environment/Docker Check:** Gated the replacement logic to only perform string overrides when the system is NOT running in a container.
2. **Implementation:** Checks for the presence of the standard internal docker metadata file `/.dockerenv` or a `RUNNING_IN_DOCKER` environment variable:
   ```python
   if os.path.exists("/.dockerenv") or os.getenv("RUNNING_IN_DOCKER") == "true":
       url = base_url
   else:
       url = base_url.replace(...)
   ```
3. **Preserved Flow:** 
   * **Under Docker:** Uses the clean service URLs (e.g. `http://gateway:8000`, `http://identity-service:8001`), leveraging Docker Compose's built-in DNS service discovery.
   * **Under Local Debugging (Host Mode):** Automatically rewrites hostnames to `127.0.0.1` to access local port bindings on the dev machine.

---

## 4. Files Changed
* [backend/app/shared/database/sync.py](file:///c:/Users/shaik/OneDrive%20-%20Vignan%20University/Desktop/Hospetal_erp_full/backend/app/shared/database/sync.py)

---

## 5. Verification Results
1. **Compilation Check:** Verified that importing `sync.py` executes without errors.
2. **Unit Test Runs:** Ran pytest checks on appointments module. All 5 tests passed successfully with no regressions.
