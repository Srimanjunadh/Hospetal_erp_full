from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from app.shared.database.models import User, Hospital, Doctor, RefreshToken, AuditLog
from typing import Optional, List
from datetime import datetime


class UserRepository:
    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
        result = await db.execute(
            select(User)
            .filter(User.username == username)
            .options(
                selectinload(User.assigned_doctor).selectinload(Doctor.user),
                selectinload(User.assigned_nurse)
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    @staticmethod
    async def list_admins(db: AsyncSession) -> List[User]:
        result = await db.execute(select(User).filter(User.role == "hospital_admin"))
        return result.scalars().all()

    @staticmethod
    async def get_hospital_by_node_code(db: AsyncSession, node_code: str) -> Optional[Hospital]:
        result = await db.execute(select(Hospital).filter(Hospital.node_code == node_code))
        return result.scalars().first()

    @staticmethod
    async def get_nurses_by_hospital(db: AsyncSession, hospital_id: int) -> List[User]:
        result = await db.execute(
            select(User).filter(User.role == "nurse", User.hospital_id == hospital_id).order_by(User.id)
        )
        return result.scalars().all()

    @staticmethod
    async def get_patients_count(db: AsyncSession, hospital_id: int) -> int:
        result = await db.execute(
            select(func.count(User.id)).filter(User.role == "patient", User.hospital_id == hospital_id)
        )
        return result.scalar() or 0

    @staticmethod
    async def create_user(db: AsyncSession, user: User) -> User:
        db.add(user)
        await db.flush()
        return user

    @staticmethod
    async def create_hospital(db: AsyncSession, hospital: Hospital) -> Hospital:
        db.add(hospital)
        await db.flush()
        return hospital

    @staticmethod
    async def create_doctor(db: AsyncSession, doctor: Doctor) -> Doctor:
        db.add(doctor)
        await db.flush()
        return doctor

    @staticmethod
    async def get_doctor_by_user_id(db: AsyncSession, user_id: int) -> Optional[Doctor]:
        result = await db.execute(select(Doctor).filter(Doctor.user_id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_first_doctor_by_hospital(db: AsyncSession, hospital_id: int) -> Optional[Doctor]:
        result = await db.execute(select(Doctor).filter(Doctor.hospital_id == hospital_id))
        return result.scalars().first()

    @staticmethod
    async def list_users(db: AsyncSession, role: Optional[str] = None, hospital_id: Optional[int] = None) -> List[User]:
        query = select(User).options(
            selectinload(User.assigned_doctor).selectinload(Doctor.user),
            selectinload(User.assigned_nurse)
        )
        if role:
            query = query.filter(User.role == role)
        if hospital_id:
            query = query.filter(User.hospital_id == hospital_id)
        result = await db.execute(query)
        return result.unique().scalars().all()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(
                selectinload(User.assigned_doctor).selectinload(Doctor.user),
                selectinload(User.assigned_nurse)
            )
            .filter(User.id == user_id)
        )
        return result.scalars().first()

    @staticmethod
    async def delete_user(db: AsyncSession, user: User) -> None:
        await db.delete(user)
        await db.commit()

    # --- IDENTITY PLATFORM REPOSITORY METHODS ---
    @staticmethod
    async def create_refresh_token(db: AsyncSession, user_id: int, token: str, expires_at: datetime) -> RefreshToken:
        from app.shared.database.models import RefreshToken
        db_token = RefreshToken(user_id=user_id, token=token, expires_at=expires_at)
        db.add(db_token)
        await db.flush()
        return db_token

    @staticmethod
    async def get_refresh_token(db: AsyncSession, token: str) -> Optional[RefreshToken]:
        from app.shared.database.models import RefreshToken
        result = await db.execute(select(RefreshToken).filter(RefreshToken.token == token))
        return result.scalars().first()

    @staticmethod
    async def revoke_refresh_token(db: AsyncSession, refresh_token_obj) -> None:
        from datetime import datetime
        refresh_token_obj.revoked_at = datetime.utcnow()
        await db.flush()

    @staticmethod
    async def revoke_all_user_refresh_tokens(db: AsyncSession, user_id: int) -> None:
        from app.shared.database.models import RefreshToken
        from datetime import datetime
        result = await db.execute(select(RefreshToken).filter(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)))
        for token_obj in result.scalars().all():
            token_obj.revoked_at = datetime.utcnow()
        await db.flush()

    @staticmethod
    async def list_active_sessions(db: AsyncSession, user_id: int) -> List[RefreshToken]:
        from app.shared.database.models import RefreshToken
        result = await db.execute(
            select(RefreshToken)
            .filter(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .order_by(RefreshToken.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_session_by_id(db: AsyncSession, session_id: int, user_id: int) -> Optional[RefreshToken]:
        from app.shared.database.models import RefreshToken
        result = await db.execute(select(RefreshToken).filter(RefreshToken.id == session_id, RefreshToken.user_id == user_id))
        return result.scalars().first()

    @staticmethod
    async def create_audit_log(db: AsyncSession, user_id: Optional[int], action: str, ip_address: Optional[str], user_agent: Optional[str], details: Optional[dict] = None) -> AuditLog:
        from app.shared.database.models import AuditLog
        log = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details
        )
        db.add(log)
        await db.flush()
        return log

    @staticmethod
    async def get_audit_logs(db: AsyncSession, limit: int = 50, offset: int = 0, user_id: Optional[int] = None, action: Optional[str] = None) -> List[AuditLog]:
        from app.shared.database.models import AuditLog
        query = select(AuditLog)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        query = query.order_by(AuditLog.timestamp.desc()).limit(limit).offset(offset)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_user_by_verification_token(db: AsyncSession, token: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.email_verification_token == token))
        return result.scalars().first()

    @staticmethod
    async def get_user_by_reset_token(db: AsyncSession, token: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.password_reset_token == token))
        return result.scalars().first()

    @staticmethod
    async def commit(db: AsyncSession) -> None:
        await db.commit()


