"""
Unit Tests for Doctor Module Services
Verifies the correct execution of DoctorService business logic using mocks.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.modules.doctor.services import DoctorService
from app.modules.doctor.schemas import DoctorScheduleCreate, DoctorAppointmentUpdate
from datetime import datetime

@pytest.mark.asyncio
async def test_doctor_list_assigned_patients():
    """Test listing patients assigned to a specific doctor."""
    db = AsyncMock()
    mock_patient = MagicMock()
    mock_patient.id = 7
    mock_patient.name = "Patient John"
    mock_patient.username = "john7"
    mock_patient.role = "patient"
    mock_patient.email = "john@example.com"
    mock_patient.phone = "123456"
    mock_patient.assigned_doctor_id = 1
    mock_patient.assigned_nurse_id = 2
    mock_patient.created_at = None
    
    mock_res = MagicMock()
    mock_res.unique.return_value.scalars.return_value.all.return_value = [mock_patient]
    db.execute.return_value = mock_res
    
    patients = await DoctorService.list_assigned_patients(db, 1)
    assert len(patients) == 1
    assert patients[0]["name"] == "Patient John"
    assert patients[0]["id"] == 7

@pytest.mark.asyncio
async def test_list_doctors_success():
    """Test listing all doctors with optional hospital filter."""
    db = AsyncMock()
    mock_user = MagicMock()
    mock_user.id = 10
    mock_user.name = "Dr. House"
    mock_user.username = "house"
    mock_user.email = "house@example.com"
    mock_user.created_at = None
    
    mock_doc = MagicMock()
    mock_doc.id = 1
    mock_doc.specialization = "Diagnostic Medicine"
    mock_doc.experience = 20
    mock_doc.hospital_id = 1
    mock_doc.room_number = "101A"
    mock_doc.user = mock_user
    
    mock_res = MagicMock()
    mock_res.unique.return_value.scalars.return_value.all.return_value = [mock_doc]
    db.execute.return_value = mock_res
    
    doctors = await DoctorService.list_doctors(db, 1)
    assert len(doctors) == 1
    assert doctors[0]["user"]["name"] == "Dr. House"

@pytest.mark.asyncio
async def test_get_doctor_not_found():
    """Test get_doctor raises 404 when not found."""
    db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    db.execute.return_value = mock_res
    
    with pytest.raises(HTTPException) as exc_info:
        await DoctorService.get_doctor(db, 999)
    assert exc_info.value.status_code == 404

@pytest.mark.asyncio
async def test_create_schedule_success():
    """Test creating a schedule task for a doctor."""
    db = AsyncMock()
    schedule_data = DoctorScheduleCreate(
        doctor_id=1,
        task_name="Consultation Session",
        start_time=datetime(2026, 7, 14, 9, 0),
        end_time=datetime(2026, 7, 14, 17, 0),
        status="scheduled",
        notes="All slots open"
    )
    
    # Mock database save
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    
    schedule = await DoctorService.create_schedule(db, schedule_data)
    assert schedule.task_name == "Consultation Session"
    assert schedule.status == "scheduled"

@pytest.mark.asyncio
async def test_update_appointment_success():
    """Test updating appointment status and datetime details."""
    db = AsyncMock()
    
    mock_patient = MagicMock()
    mock_patient.name = "Jane Patient"
    
    mock_appt = MagicMock()
    mock_appt.id = 50
    mock_appt.doctor_id = 1
    mock_appt.patient = mock_patient
    mock_appt.preferred_time = "10:30 AM"
    mock_appt.scheduled_at = datetime(2026, 7, 15, 10, 30)
    mock_appt.status = "pending"
    
    # Mock repository retrieval
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = mock_appt
    db.execute.return_value = mock_res
    
    update_data = DoctorAppointmentUpdate(
        status="scheduled",
        scheduled_at="2026-07-15T10:30:00"
    )
    
    res = await DoctorService.update_appointment(db, 50, update_data)
    assert res["status"] == "updated"
    assert mock_appt.status == "scheduled"
