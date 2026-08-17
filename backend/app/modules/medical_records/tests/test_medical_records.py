"""
Unit Tests for Medical Records & Laboratory Module Services
Verifies the correct execution of MedicalRecordsService logic using mocks.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.modules.medical_records.services import MedicalRecordsService
from app.modules.medical_records.schemas import (
    VitalsUpdate, TestRequest, PrescribeRequest, AdmitRequest, AdmissionFinalizeRequest
)

@pytest.mark.asyncio
async def test_medical_records_get_latest_vitals_success():
    """Test retrieving latest vitals successfully."""
    db = AsyncMock()
    
    # Mock patient lookup
    mock_patient = MagicMock()
    mock_patient.id = 10
    
    # Mock vitals lookup
    mock_vitals = MagicMock()
    mock_vitals.id = 2
    mock_vitals.blood_pressure = "120/80"
    mock_vitals.heart_rate = 72
    mock_vitals.temperature = 36.8
    mock_vitals.spo2 = 99
    mock_vitals.glucose = 90.0
    mock_vitals.nursing_notes = "Normal"
    mock_vitals.created_at = None
    
    mock_res_pt = MagicMock()
    mock_res_pt.scalars.return_value.first.return_value = mock_patient
    
    mock_res_vit = MagicMock()
    mock_res_vit.scalars.return_value.first.return_value = mock_vitals
    
    db.execute.side_effect = [mock_res_pt, mock_res_vit]
    
    vitals = await MedicalRecordsService.get_latest_vitals(db, "patient10")
    assert vitals["blood_pressure"] == "120/80"
    assert vitals["heart_rate"] == 72
    assert vitals["temperature"] == 36.8

@pytest.mark.asyncio
async def test_get_latest_vitals_patient_not_found():
    """Test retrieving latest vitals for a patient that doesn't exist."""
    db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    db.execute.return_value = mock_res
    
    with pytest.raises(HTTPException) as exc_info:
        await MedicalRecordsService.get_latest_vitals(db, "unknown_patient")
    assert exc_info.value.status_code == 404

@pytest.mark.asyncio
async def test_update_patient_vitals_success():
    """Test updating vitals checks existence of patient and nurse."""
    db = AsyncMock()
    vitals_data = VitalsUpdate(
        patient_id=1,
        nurse_id=2,
        blood_pressure="120/80",
        heart_rate=80,
        temperature=37.0,
        spo2=98,
        glucose=100.0,
        nursing_notes="Vitals look stable"
    )
    
    # Mock patient lookup
    mock_patient = MagicMock()
    mock_patient.name = "John Doe"
    mock_patient.hospital_id = 1
    mock_patient.assigned_doctor_id = 3
    
    # Mock nurse lookup
    mock_nurse = MagicMock()
    
    # Mock database functions
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    
    async def mock_execute(query, *args, **kwargs):
        res = MagicMock()
        query_str = str(query)
        # Distinguish query for patient vs nurse
        if "assigned_nurse" in query_str:
            res.scalars.return_value.first.return_value = mock_patient
        else:
            res.scalars.return_value.first.return_value = mock_nurse
        return res
        
    db.execute.side_effect = mock_execute
    
    res = await MedicalRecordsService.update_patient_vitals(db, vitals_data)
    assert res["status"] == "Vitals Updated & Doctor Notified"

@pytest.mark.asyncio
async def test_update_patient_vitals_patient_not_found():
    """Test updating vitals when patient doesn't exist raises 404."""
    db = AsyncMock()
    vitals_data = VitalsUpdate(
        patient_id=999,
        nurse_id=2,
        blood_pressure="120/80",
        heart_rate=80,
        temperature=37.0,
        spo2=98,
        glucose=100.0
    )
    
    # Mock patient lookup returns None
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    db.execute.return_value = mock_res
    
    with pytest.raises(HTTPException) as exc_info:
        await MedicalRecordsService.update_patient_vitals(db, vitals_data)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Patient record not found"

@pytest.mark.asyncio
async def test_finalize_admission_success():
    """Test finalizing room assignment for an admission request."""
    db = AsyncMock()
    finalize_data = AdmissionFinalizeRequest(
        admission_id=1,
        room_number="Ward 5B"
    )
    
    mock_admission = MagicMock()
    mock_admission.patient_id = 2
    mock_admission.hospital_id = 1
    
    mock_patient = MagicMock()
    mock_patient.name = "Patient Two"
    mock_patient.assigned_nurse_id = 4
    
    db.commit = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    
    async def mock_execute(query, *args, **kwargs):
        res = MagicMock()
        query_str = str(query)
        if "admission" in query_str:
            res.scalars.return_value.first.return_value = mock_admission
        else:
            res.scalars.return_value.first.return_value = mock_patient
        return res
        
    db.execute.side_effect = mock_execute
    
    res = await MedicalRecordsService.finalize_admission(db, finalize_data)
    assert res["status"] == "Patient Admitted & Nurse Notified"
    assert mock_admission.room_number == "Ward 5B"
    assert mock_admission.status == "admitted"
