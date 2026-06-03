from typing import Optional, List, Dict, Any, Union
import json
import time

# Mocking the db and model imports for now, will link to ERP models soon
# from app.models import appointment_model, doctor_model
# from app.config.db import db

def _normalize_doc_id_for_db(doc_id: Union[str, int]) -> Union[str, int]:
    if isinstance(doc_id, str):
        if doc_id.startswith('emb_'):
            try:
                return int(doc_id.replace('emb_', ''))
            except ValueError:
                return doc_id
        try:
            return int(doc_id)
        except ValueError:
            return doc_id
    return doc_id

async def calculate_queue_position(doc_id: Union[str, int], slot_date: str, db=None, appointment_model=None, doctor_model=None):
    try:
        db_doc_id = _normalize_doc_id_for_db(doc_id)
        # Get pending appointments for the doctor on that date
        appointments = await appointment_model.get_appointments_by_filters({
            "docId": db_doc_id,
            "slotDate": slot_date,
            "cancelled": False,
            "isCompleted": False,
            "status": ["pending", "in-queue", "in-consult"]
        })
        
        # Sort by token number
        appointments.sort(key=lambda x: x.get('token_number', 0))
        
        doctor = await doctor_model.get_doctor_by_id(doc_id)
        avg_consult_time = doctor.get('average_consultation_time', 15) if doctor else 15
        
        total_in_queue = len(appointments)
        
        # The position for the NEXT appointment would be total + 1
        queue_position = total_in_queue + 1
        estimated_wait_time = total_in_queue * avg_consult_time
        
        return {
            "queuePosition": queue_position,
            "estimated_wait_time": estimated_wait_time,
            "totalInQueue": total_in_queue
        }
    except Exception as e:
        print(f"[ERROR] Error calculating queue position: {e}")
        return {"queuePosition": 1, "estimated_wait_time": 0, "totalInQueue": 0}

async def assign_token_number(doc_id: Union[str, int], slot_date: str, appointment_model=None):
    try:
        db_doc_id = _normalize_doc_id_for_db(doc_id)
        appointments = await appointment_model.get_appointments_by_filters({
            "docId": db_doc_id,
            "slotDate": slot_date,
            "cancelled": False
        })
        
        if not appointments:
            return 1
            
        max_token = max([apt.get('token_number', 0) for apt in appointments])
        return max_token + 1
    except Exception as e:
        print(f"[ERROR] Error assigning token number: {e}")
        return 1

async def get_doctor_queue_status(doc_id: Union[str, int], slot_date: str, appointment_model=None, doctor_model=None):
    try:
        db_doc_id = _normalize_doc_id_for_db(doc_id)
        appointments = await appointment_model.get_appointments_by_filters({
            "docId": db_doc_id,
            "slotDate": slot_date,
            "cancelled": False,
            "isCompleted": False,
            "status": ["pending", "in-queue", "in-consult"]
        })
        
        # Sort by token number
        appointments.sort(key=lambda x: x.get('token_number', 0))
        
        doctor = await doctor_model.get_doctor_by_id(doc_id)
        current_status = doctor.get('status', 'in-clinic') if doctor else 'in-clinic'
        current_appointment_id = doctor.get('current_appointment_id') if doctor else None
        
        formatted_appointments = []
        for index, apt in enumerate(appointments):
            user_data = apt.get('user_data', {})
            if isinstance(user_data, str):
                try: user_data = json.loads(user_data)
                except: user_data = {}
            
            patient_name = user_data.get('name', 'Unknown Patient')
            if apt.get('actual_patient_name') and not apt.get('actual_patient_is_self'):
                patient_name = apt.get('actual_patient_name')
                
            formatted_appointments.append({
                "_id": apt['id'],
                "id": apt['id'],
                "tokenNumber": apt.get('token_number', index + 1),
                "patientName": patient_name,
                "slotTime": apt.get('slot_time'),
                "status": apt.get('status', 'pending'),
                "queuePosition": index + 1
            })
            
        return {
            "status": current_status,
            "currentAppointmentId": current_appointment_id,
            "queueLength": len(appointments),
            "appointments": formatted_appointments
        }
    except Exception as e:
        print(f"[ERROR] Error getting queue status: {e}")
        return None
