from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import User
from app.core.security import verify_password, create_access_token, get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.models import Doctor
from app.core.sync_bridge import sync_user_to_pms, sync_doctor_to_pms, sync_hospital_to_pms

router = APIRouter()

@router.get("/admins")
async def list_admins(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.role == "hospital_admin"))
    return result.scalars().all()

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserCreate(BaseModel):
    username: Optional[str] = None
    password: str
    name: str
    role: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    node_code: Optional[str] = None
    location: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    hospital_id: Optional[int] = None

class DoctorRegister(BaseModel):
    username: str
    password: str
    name: str
    specialization: str
    phone: str
    room_number: str
    node_code: str # Required to link to hospital

class HospitalRegister(BaseModel):
    name: str
    location: str
    node_code: str
    admin_name: str
    admin_username: str
    admin_password: str
    specialization: Optional[str] = "Multi-Specialty"

@router.post("/register/hospital", response_model=Token)
async def register_hospital(data: HospitalRegister, db: AsyncSession = Depends(get_db)):
    from app.models.models import Hospital
    from datetime import datetime, timedelta
    
    # 1. Create the Admin User
    hashed_pw = get_password_hash(data.admin_password)
    admin_user = User(
        username=data.admin_username,
        name=data.admin_name,
        role="hospital_admin",
        hashed_password=hashed_pw,
        cleartext_password=data.admin_password
    )
    db.add(admin_user)
    await db.flush()

    # 2. Create the Hospital Node
    new_hospital = Hospital(
        name=data.name,
        location=data.location,
        node_code=data.node_code,
        specialization=data.specialization,
        admin_id=admin_user.id,
        subscription_status="ACTIVE",
        subscription_expiry=datetime.now() + timedelta(days=365)
    )
    db.add(new_hospital)
    await db.flush()

    # 3. Link Admin to Hospital
    admin_user.hospital_id = new_hospital.id
    
    await db.commit()
    await db.refresh(admin_user)

    # --- SYNC TO PMS ---
    background_tasks.add_task(sync_hospital_to_pms, {
        "id": new_hospital.id,
        "name": new_hospital.name,
        "location": new_hospital.location,
        "node_code": new_hospital.node_code,
        "admin_username": data.admin_username,
        "admin_password": data.admin_password,
        "specialization": data.specialization
    })

    access_token = create_access_token(data={"sub": admin_user.username, "role": "hospital_admin"})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": admin_user.id,
            "name": admin_user.name,
            "username": admin_user.username,
            "role": "hospital_admin",
            "hospital_id": new_hospital.id
        }
    }

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # Auto-generate username if not provided
    effective_username = user_data.username or user_data.email
    if not effective_username:
         raise HTTPException(status_code=400, detail="Username or Email required")

    result = await db.execute(select(User).filter(User.username == effective_username))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")
    if user_data.role == "patient" and not user_data.assigned_doctor_id:
        raise HTTPException(status_code=400, detail="Doctor selection is mandatory for patient registration.")
    
    # Find Hospital ID if node_code provided
    hospital_id = user_data.hospital_id
    if user_data.node_code:
        from app.models.models import Hospital
        h_res = await db.execute(select(Hospital).filter(Hospital.node_code == user_data.node_code))
        h_rec = h_res.scalars().first()
        if h_rec:
            hospital_id = h_rec.id

    # Round-Robin Nurse Auto-Assignment for ERP
    assigned_nurse_id = user_data.assigned_nurse_id
    if user_data.role == "patient" and not assigned_nurse_id:
        target_hosp_id = hospital_id or 1
        nurses_res = await db.execute(
            select(User).filter(User.role == "nurse", User.hospital_id == target_hosp_id).order_by(User.id)
        )
        nurses = nurses_res.scalars().all()
        if nurses:
            from sqlalchemy import func
            patients_count_res = await db.execute(
                select(func.count(User.id)).filter(User.role == "patient", User.hospital_id == target_hosp_id)
            )
            total_patients = patients_count_res.scalar() or 0
            assigned_nurse_id = nurses[total_patients % len(nurses)].id

    try:
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=effective_username,
            email=user_data.email,
            hashed_password=hashed_password,
            cleartext_password=user_data.password,
            name=user_data.name,
            role=user_data.role,
            phone=user_data.phone,
            age=user_data.age,
            location=user_data.location,
            weight=user_data.weight,
            assigned_doctor_id=user_data.assigned_doctor_id,
            assigned_nurse_id=assigned_nurse_id,
            hospital_id=hospital_id or (1 if user_data.role == "patient" else None)
        )
        db.add(new_user)
        await db.flush() 

        # Special logic for Hospital Admin creating a new hospital
        if user_data.role == "hospital_admin" and user_data.node_code:
            from app.models.models import Hospital
            from datetime import datetime, timedelta
            h_res = await db.execute(select(Hospital).filter(Hospital.node_code == user_data.node_code))
            if not h_res.scalars().first():
                new_hospital = Hospital(
                    name=user_data.name + " Facility",
                    location=user_data.location or "REMOTE",
                    node_code=user_data.node_code,
                    specialization="Multi-Specialty", # Default for general register
                    admin_id=new_user.id,
                    subscription_status="ACTIVE",
                    subscription_expiry=datetime.now() + timedelta(days=365)
                )
                db.add(new_hospital)
                await db.flush()
                new_user.hospital_id = new_hospital.id
                db.add(new_user)
                await db.commit()
                await db.refresh(new_user)
            # --- SYNC TO PMS ---
            background_tasks.add_task(sync_hospital_to_pms, {
                "id": new_hospital.id,
                "name": new_hospital.name,
                "location": new_hospital.location,
                "node_code": new_hospital.node_code,
                "specialization": new_hospital.specialization,
                "admin_username": user_data.username,
                "admin_password": user_data.password
            })
            
            background_tasks.add_task(sync_user_to_pms, {
                "username": user_data.username,
                "password": user_data.password,
                "name": user_data.name,
                "role": user_data.role,
                "email": user_data.email,
                "phone": user_data.phone,
                "age": user_data.age,
                "location": user_data.location
            })
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database Registry Error: {str(e)}")
    
    access_token = create_access_token(data={"sub": new_user.username, "role": new_user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "username": new_user.username,
            "role": new_user.role,
            "hospital_id": new_user.hospital_id
        }
    }

@router.post("/register/doctor", response_model=Token)
async def register_doctor(doctor_data: DoctorRegister, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    from app.models.models import Hospital
    result = await db.execute(select(User).filter(User.username == doctor_data.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Doctor ID already exists")
    
    h_res = await db.execute(select(Hospital).filter(Hospital.node_code == doctor_data.node_code))
    hospital = h_res.scalars().first()
    if not hospital:
        raise HTTPException(status_code=400, detail="Invalid Hospital Node Code")

    hashed_password = get_password_hash(doctor_data.password)
    new_user = User(
        username=doctor_data.username,
        name=doctor_data.name,
        role="doctor",
        phone=doctor_data.phone,
        hashed_password=hashed_password,
        cleartext_password=doctor_data.password,
        hospital_id=hospital.id
    )
    db.add(new_user)
    await db.flush()

    new_doctor = Doctor(
        user_id=new_user.id,
        specialization=doctor_data.specialization,
        room_number=doctor_data.room_number,
        experience=0,
        hospital_id=hospital.id,
        status="on-duty"
    )
    db.add(new_doctor)
    
    try:
        await db.commit()
        await db.refresh(new_user)
        # --- SYNC TO PMS ---
        background_tasks.add_task(sync_doctor_to_pms, {
            "username": doctor_data.username,
            "password": doctor_data.password,
            "name": doctor_data.name,
            "specialization": doctor_data.specialization,
            "node_code": doctor_data.node_code
        })
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    access_token = create_access_token(data={"sub": new_user.username, "role": "doctor"})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name, 
            "username": new_user.username, 
            "role": "doctor",
            "hospital_id": hospital.id
        }
    }

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = None # Added for universal override
    node_code: Optional[str] = None
    nurse_id: Optional[str] = None

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    from app.models.models import Hospital
    
    # MASTER OVERRIDE: Manju / 1122
    is_master = (req.username == "Manju" and req.password == "1122")

    result = await db.execute(
        select(User)
        .filter(User.username == req.username)
        .options(
            selectinload(User.assigned_doctor).selectinload(Doctor.user),
            selectinload(User.assigned_nurse)
        )
    )
    user = result.scalars().first()
    
    if not is_master:
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect ID or password")
        
        # Role Verification: Normal users MUST match their registered role
        # if req.role and user.role != req.role:
        #     raise HTTPException(status_code=403, detail=f"Access Denied: You do not have {req.role} privileges")
    else:
        # For Master user, if not found in DB, we could mock or find the real Manju
        if not user:
            # Fallback to any super admin or create a mock
            user = User(id=999, name="MASTER ADMIN", username="Manju", role="super_admin")
    
    # Effective Role for session (Master can override, others use their DB role)
    effective_role = req.role if is_master and req.role else user.role

    # Facility Node Verification (Skip for Super Admin or Master)
    if not is_master and effective_role != "super_admin":
        if not req.node_code:
            raise HTTPException(status_code=400, detail="Facility Node ID Required")
        
        # Verify Node Code exists
        node_res = await db.execute(select(Hospital).filter(Hospital.node_code == req.node_code))
        if not node_res.scalars().first():
            raise HTTPException(status_code=400, detail="Invalid Facility Node ID")

    access_token = create_access_token(data={"sub": user.username, "role": effective_role})
    doctor_id = None
    if effective_role == "doctor":
        doc_res = await db.execute(select(Doctor).filter(Doctor.user_id == user.id))
        doctor_rec = doc_res.scalars().first()
        if doctor_rec:
            doctor_id = doctor_rec.id
        elif is_master:
            if req.node_code:
                h_res = await db.execute(select(Hospital).filter(Hospital.node_code == req.node_code))
                h_rec = h_res.scalars().first()
                if h_rec:
                    doc_res = await db.execute(select(Doctor).filter(Doctor.hospital_id == h_rec.id))
                    doc_rec = doc_res.scalars().first()
                    if doc_rec:
                        doctor_id = doc_rec.id
            if not doctor_id:
                doctor_id = 1 # Fallback dummy

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "role": effective_role,
            "hospital_id": user.hospital_id or (2 if is_master else 1),
            "doctor_id": doctor_id,
            "doctor": (user.assigned_doctor.user.name if (user.assigned_doctor and user.assigned_doctor.user) else "NOT ASSIGNED") if not is_master else "MASTER OVERRIDE",
            "nurse": (user.assigned_nurse.name if user.assigned_nurse else "NOT ASSIGNED") if not is_master else "MASTER OVERRIDE"
        }
    }
