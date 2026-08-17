import asyncio
import os
import sys
sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.organization.services import OrganizationService
from app.modules.organization.schemas import OrganizationCreate, BranchCreate, DepartmentCreate

async def verify_organization_management():
    print("Verifying Organization Management module...")
    db = AsyncSessionLocal()
    
    try:
        # Create high-level organization
        org_data = OrganizationCreate(name="Unified Care Organization")
        org = await OrganizationService.create_organization(db, org_data)
        
        assert org.id is not None, "Organization ID was not generated"
        assert org.name == "Unified Care Organization", "Mismatch in Organization Name"
        print("Organization Creation: SUCCESS, ID:", org.id)

        # Retrieve default settings
        settings = await OrganizationService.get_settings(db, org.id)
        assert settings.theme_color == "#5f6fff", "Default theme color mismatch"
        print("Default Settings Verification: SUCCESS")

        # Create branch
        # First we need a hospital node. Hospital ID 1 is seeded. Let's create branch under it
        branch_data = BranchCreate(
            hospital_id=1,
            name="Main Branch",
            location="Building A, Medical Center"
        )
        branch = await OrganizationService.add_branch(db, branch_data)
        assert branch.id is not None, "Branch ID was not generated"
        assert branch.name == "Main Branch", "Mismatch in Branch Name"
        print("Branch Creation: SUCCESS, ID:", branch.id)

        # Create department
        dept_data = DepartmentCreate(
            hospital_id=1,
            branch_id=branch.id,
            name="Cardiology"
        )
        dept = await OrganizationService.add_department(db, dept_data)
        assert dept.id is not None, "Department ID was not generated"
        assert dept.name == "Cardiology", "Mismatch in Department Name"
        print("Department Creation: SUCCESS, ID:", dept.id)

        print("\nAll Organization Management checks PASSED successfully.")
    except Exception as e:
        print("Verification FAILED:", e)
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(verify_organization_management())
