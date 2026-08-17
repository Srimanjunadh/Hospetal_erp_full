import asyncio
import os
import sys
sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.identity.services import IdentityService
from app.modules.identity.schemas import LoginRequest

async def verify_identity_platform():
    print("Verifying Enterprise Identity Platform...")
    db = AsyncSessionLocal()
    
    try:
        # Test Login on SQLite/PostgreSQL
        req = LoginRequest(
            username="Manju",
            password="1122",
            role="super_admin"
        )
        print("Executing master admin login simulation...")
        res = await IdentityService.login(req, db, ip_address="127.0.0.1", user_agent="VerifyScript")
        
        assert "access_token" in res, "Missing access token"
        assert "refresh_token" in res, "Missing refresh token"
        assert "permissions" in res["user"], "Missing user permissions"
        
        print("Master Admin Login: SUCCESS")
        print("Generated Access Token (first 30 chars):", res["access_token"][:30])
        print("Generated Refresh Token (first 15 chars):", res["refresh_token"][:15])
        print("User Permissions List:", res["user"]["permissions"])
        print("\nAll Identity Platform checks PASSED successfully.")
    except Exception as e:
        print("Verification FAILED:", e)
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(verify_identity_platform())
