"""
Unit Tests for Patient Module Services
Verifies the correct execution of PatientService business logic using mocks.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.modules.patient.services import PatientService

@pytest.mark.asyncio
async def test_patient_get_patient_success():
    """Test getting a patient successfully."""
    db = AsyncMock()
    mock_patient = MagicMock()
    mock_patient.id = 5
    mock_patient.username = "patient5"
    mock_patient.name = "John Patient"
    mock_patient.role = "patient"
    mock_patient.phone = "123"
    mock_patient.email = "john@example.com"
    mock_patient.age = 30
    mock_patient.location = "Vignanhaven"
    mock_patient.weight = 75.0
    mock_patient.hospital_id = 1
    mock_patient.assigned_doctor_id = 2
    mock_patient.assigned_nurse_id = 3
    mock_patient.created_at = None
    
    mock_res = MagicMock()
    mock_res.unique.return_value.scalars.return_value.first.return_value = mock_patient
    db.execute.return_value = mock_res
    
    patient = await PatientService.get_patient(db, 5)
    assert patient["name"] == "John Patient"
    assert patient["age"] == 30
    assert patient["location"] == "Vignanhaven"
    assert patient["weight"] == 75.0

@pytest.mark.asyncio
async def test_patient_get_patient_not_found():
    """Test that retrieving a non-existent patient raises a 404 error."""
    db = AsyncMock()
    mock_res = MagicMock()
    mock_res.unique.return_value.scalars.return_value.first.return_value = None
    db.execute.return_value = mock_res
    
    with pytest.raises(HTTPException) as exc_info:
        await PatientService.get_patient(db, 999)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Patient not found"

@pytest.mark.asyncio
async def test_list_patients_success():
    """Test listing patients with optional hospital filtering."""
    db = AsyncMock()
    mock_patient1 = MagicMock()
    mock_patient1.id = 1
    mock_patient1.username = "p1"
    mock_patient1.name = "Patient One"
    mock_patient1.role = "patient"
    mock_patient1.phone = "111"
    mock_patient1.assigned_doctor = None
    mock_patient1.assigned_nurse = None
    mock_patient1.created_at = None

    mock_res = MagicMock()
    mock_res.unique.return_value.scalars.return_value.all.return_value = [mock_patient1]
    db.execute.return_value = mock_res

    patients = await PatientService.list_patients(db, hospital_id=1)
    assert len(patients) == 1
    assert patients[0]["name"] == "Patient One"

@pytest.mark.asyncio
async def test_get_patient_prescriptions_success():
    """Test fetching prescriptions for a patient."""
    db = AsyncMock()
    
    # Mock patient search
    mock_patient = MagicMock()
    mock_patient.id = 10
    mock_patient.username = "patient10"
    
    # Mock prescriptions result
    mock_pres = MagicMock()
    mock_pres.id = 101
    mock_pres.medicines = [{"name": "Aspirin", "dosage": "100mg"}]
    mock_pres.notes = "Take after meal"
    mock_pres.appointment_id = 45
    
    # Helper execution return sequence
    async def mock_execute(query, *args, **kwargs):
        res = MagicMock()
        # First query fetches the user profile by username
        # Second query fetches the prescriptions
        # We can distinguish based on the query SQL text
        query_str = str(query)
        if "users" in query_str or "user" in query_str:
            res.scalars.return_value.first.return_value = mock_patient
        else:
            res.scalars.return_value.all.return_value = [mock_pres]
        return res
        
    db.execute.side_effect = mock_execute
    
    prescriptions = await PatientService.get_patient_prescriptions(db, "patient10")
    assert len(prescriptions) == 1
    assert prescriptions[0]["id"] == 101
    assert prescriptions[0]["medicines"][0]["name"] == "Aspirin"

@pytest.mark.asyncio
async def test_get_patient_appointments_success():
    """Test fetching appointments for a patient ID."""
    db = AsyncMock()
    mock_appt = MagicMock()
    mock_appt.id = 202
    mock_appt.patient_id = 5
    mock_appt.doctor_id = 1
    mock_appt.hospital_id = 1
    mock_appt.status = "scheduled"
    mock_appt.preferred_time = "11:00 AM"
    mock_appt.reason = "Fever"
    mock_appt.type = "offline"
    mock_appt.scheduled_at = None

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [mock_appt]
    db.execute.return_value = mock_res

    appts = await PatientService.get_patient_appointments(db, 5)
    assert len(appts) == 1
    assert appts[0]["id"] == 202
    assert appts[0]["status"] == "scheduled"
