from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import User, StaffSchedule, Doctor
from app.schemas.schemas import User as UserSchema, UserUpdate, StaffScheduleCreate, StaffSchedule as StaffScheduleSchema
from app.core.security import get_password_hash
from typing import List, Optional
from sqlalchemy.orm import joinedload

router = APIRouter()

@router.get("/", response_model=List[UserSchema])
async def list_users(
    role: Optional[str] = Query(None),
    hospital_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(User).options(
            joinedload(User.assigned_doctor).joinedload(Doctor.user),
            joinedload(User.assigned_nurse)
        )
        if role:
            query = query.filter(User.role == role)
        if hospital_id:
            query = query.filter(User.hospital_id == hospital_id)
        
        print(f"DEBUG: Executing user query for role={role}")
        result = await db.execute(query)
        users = result.unique().scalars().all()
        print(f"DEBUG: Found {len(users)} users")
        
        # Convert to dict to avoid serialization issues
        output = []
        for u in users:
            try:
                # Safely extract assigned doctor info
                assigned_doctor_data = None
                if u.assigned_doctor:
                    try:
                        assigned_doctor_data = {
                            "id": u.assigned_doctor.id,
                            "specialization": u.assigned_doctor.specialization,
                            "user": {
                                "name": u.assigned_doctor.user.name if u.assigned_doctor.user else "Unknown"
                            } if u.assigned_doctor.user else None
                        }
                    except Exception as e:
                        print(f"DEBUG: Error serializing doctor for user {u.id}: {str(e)}")

                # Safely extract assigned nurse info
                assigned_nurse_data = None
                if u.assigned_nurse:
                    assigned_nurse_data = {
                        "id": u.assigned_nurse.id,
                        "name": u.assigned_nurse.name
                    }

                u_dict = {
                    "id": u.id,
                    "username": u.username,
                    "name": u.name,
                    "role": u.role,
                    "email": u.email,
                    "phone": u.phone,
                    "cleartext_password": u.cleartext_password,
                    "assigned_doctor_id": u.assigned_doctor_id,
                    "assigned_nurse_id": u.assigned_nurse_id,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                    "assigned_doctor": assigned_doctor_data,
                    "assigned_nurse": assigned_nurse_data
                }
                output.append(u_dict)
            except Exception as e:
                print(f"ERROR: Failed to process user {u.id}: {str(e)}")
                # Minimal fallback
                output.append({
                    "id": u.id,
                    "username": u.username,
                    "name": u.name,
                    "role": u.role,
                    "created_at": u.created_at.isoformat() if u.created_at else None
                })
        
        return output
    except Exception as e:
        import traceback
        print(f"FATAL ERROR IN list_users: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def serialize_user(u: User) -> dict:
    assigned_doctor_data = None
    if u.assigned_doctor:
        try:
            assigned_doctor_data = {
                "id": u.assigned_doctor.id,
                "specialization": u.assigned_doctor.specialization,
                "user": {
                    "name": u.assigned_doctor.user.name if u.assigned_doctor.user else "Unknown"
                } if u.assigned_doctor.user else None
            }
        except Exception:
            pass

    assigned_nurse_data = None
    if u.assigned_nurse:
        assigned_nurse_data = {
            "id": u.assigned_nurse.id,
            "name": u.assigned_nurse.name
        }

    return {
        "id": u.id,
        "username": u.username,
        "name": u.name,
        "role": u.role,
        "email": u.email,
        "phone": u.phone,
        "cleartext_password": u.cleartext_password,
        "assigned_doctor_id": u.assigned_doctor_id,
        "assigned_nurse_id": u.assigned_nurse_id,
        "age": u.age,
        "location": u.location,
        "weight": u.weight,
        "hospital_id": u.hospital_id,
        "created_at": u.created_at,
        "assigned_doctor": assigned_doctor_data,
        "assigned_nurse": assigned_nurse_data
    }

@router.get("/{user_id}", response_model=UserSchema)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(
            joinedload(User.assigned_doctor).joinedload(Doctor.user),
            joinedload(User.assigned_nurse)
        )
        .filter(User.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user)

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}
@router.put("/{user_id}", response_model=UserSchema)
async def update_user(user_id: int, user_data: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(
            joinedload(User.assigned_doctor).joinedload(Doctor.user),
            joinedload(User.assigned_nurse)
        )
        .filter(User.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_data.dict(exclude_unset=True)
    if "password" in update_data:
        user.hashed_password = get_password_hash(update_data["password"])
        user.cleartext_password = update_data["password"]
        del update_data["password"]
    
    for key, value in update_data.items():
        setattr(user, key, value)
    
    await db.commit()
    
    # Reload with options after commit to avoid MissingGreenlet
    result = await db.execute(
        select(User)
        .options(
            joinedload(User.assigned_doctor).joinedload(Doctor.user),
            joinedload(User.assigned_nurse)
        )
        .filter(User.id == user_id)
    )
    user = result.scalars().first()
    return serialize_user(user)

@router.post("/schedule", response_model=StaffScheduleSchema)
async def create_staff_schedule(sched: StaffScheduleCreate, db: AsyncSession = Depends(get_db)):
    new_sched = StaffSchedule(**sched.dict())
    db.add(new_sched)
    await db.commit()
    await db.refresh(new_sched)
    return new_sched

@router.get("/{user_id}/schedule", response_model=List[StaffScheduleSchema])
async def get_staff_schedule(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StaffSchedule).filter(StaffSchedule.staff_id == user_id))
    return result.scalars().all()
