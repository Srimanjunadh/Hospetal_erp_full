"""
Unit Tests for Appointment Module Services
Verifies the correct execution of AppointmentService business logic using mocks.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.modules.appointment.services import AppointmentService
from app.modules.appointment.schemas import (
    AppointmentCreate, AppointmentUpdateDetails, AppointmentSyncPMS
)
from datetime import datetime

@pytest.mark.asyncio
async def test_appointment_get_patient_appointments():
    """Test retrieving appointments for a specific patient."""
    db = AsyncMock()
    mock_appt = MagicMock()
    mock_appt.id = 15
    mock_appt.patient_id = 99
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [mock_appt]
    db.execute.return_value = mock_res
    
    appts = await AppointmentService.get_patient_appointments(db, 99)
    assert len(appts) == 1
    assert appts[0].id == 15

@pytest.mark.asyncio
async def test_book_appointment_success():
    """Test successful booking of an appointment."""
    db = AsyncMock()
    create_data = AppointmentCreate(
        patient_id=1,
        doctor_id=2,
        hospital_id=1,
        scheduled_at=datetime(2026, 7, 20, 14, 0),
        preferred_time="2:00 PM",
        reason="Checkup",
        type="offline"
    )
    
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    
    appt = await AppointmentService.book_appointment(db, create_data)
    assert appt.patient_id == 1
    assert appt.preferred_time == "2:00 PM"
    assert appt.status == "pending"

@pytest.mark.asyncio
async def test_update_appointment_details_success():
    """Test updating details like preferred time and status."""
    db = AsyncMock()
    mock_appt = MagicMock()
    mock_appt.id = 10
    mock_appt.doctor_id = 2
    mock_appt.scheduled_at = None
    mock_appt.preferred_time = "10:00 AM"
    mock_appt.status = "pending"
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = mock_appt
    db.execute.return_value = mock_res
    
    update_data = AppointmentUpdateDetails(
        doctor_id=3,
        scheduled_at="2026-07-20T10:00:00",
        preferred_time="10:00 AM",
        status="scheduled"
    )
    
    res = await AppointmentService.update_appointment_details(db, 10, update_data)
    assert res["message"] == "Appointment updated successfully"
    assert mock_appt.doctor_id == 3
    assert mock_appt.status == "scheduled"

@pytest.mark.asyncio
async def test_update_appointment_details_invalid_date():
    """Test update details with invalid date string raises HTTPException."""
    db = AsyncMock()
    mock_appt = MagicMock()
    mock_appt.id = 10
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = mock_appt
    db.execute.return_value = mock_res
    
    update_data = AppointmentUpdateDetails(
        scheduled_at="invalid-date-string"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await AppointmentService.update_appointment_details(db, 10, update_data)
    assert exc_info.value.status_code == 400

@pytest.mark.asyncio
async def test_sync_pms_appointment_success():
    """Test synchronizing external PMS scheduling entries into the database."""
    db = AsyncMock()
    sync_data = AppointmentSyncPMS(
        hospital_id=1,
        preferred_time="09:30 AM",
        reason="Headache",
        doctor_name="Dr. Smith",
        patient_name="Alex Patient",
        pms_hospital_id=5,
        patient_id=4,
        doctor_id=2,
        status="scheduled",
        type="offline",
        token_number=12,
        queue_position=2,
        scheduled_at="2026-07-22 09:30:00"
    )
    
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    
    res = await AppointmentService.sync_pms_appointment(db, sync_data)
    assert res["success"] is True
    assert res["erp_hospital_id"] == 1
