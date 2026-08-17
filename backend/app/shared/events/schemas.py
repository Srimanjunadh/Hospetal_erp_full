"""
Pydantic Event Schemas for Asynchronous Communication
Defines event structures for Identity, HR, Appointment, Billing, Inventory, and Procurement.
"""
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List, Dict, Any

class PatientRegisteredEvent(BaseModel):
    patient_id: int = Field(..., description="User ID of the patient")
    name: str = Field(..., description="Name of the patient")
    email: str = Field(..., description="Email of the patient")
    phone: str = Field(..., description="Phone number")
    created_at: str = Field(..., description="ISO formatted creation timestamp")

class AppointmentBookedEvent(BaseModel):
    appointment_id: int = Field(..., description="Appointment ID")
    patient_id: int = Field(..., description="Patient User ID")
    doctor_id: int = Field(..., description="Doctor ID")
    hospital_id: int = Field(..., description="Hospital ID")
    scheduled_at: str = Field(..., description="ISO formatted scheduled datetime")
    token_number: int = Field(..., description="Queue token number")

class InvoiceGeneratedEvent(BaseModel):
    invoice_id: int = Field(..., description="Invoice ID")
    hospital_id: int = Field(..., description="Hospital ID")
    patient_id: int = Field(..., description="Patient User ID")
    amount: float = Field(..., description="Invoice total amount")
    due_date: str = Field(..., description="ISO formatted due date")

class InventoryUpdatedEvent(BaseModel):
    item_id: int = Field(..., description="Inventory item ID")
    name: str = Field(..., description="Name of the item")
    quantity: int = Field(..., description="New stock level quantity")
    min_threshold: int = Field(..., description="Safety threshold level")
    reason: str = Field(..., description="Reason for quantity update (e.g. intake, waste, dispatch)")

class PurchaseApprovedEvent(BaseModel):
    purchase_order_id: int = Field(..., description="Procurement request database ID")
    hospital_id: int = Field(..., description="Hospital database ID")
    item_name: str = Field(..., description="Name of the items requested")
    category: str = Field(..., description="Category (e.g., medicine, equipment)")
    quantity: int = Field(..., description="Quantity to purchase")
    cost: float = Field(..., description="Total expenditure cost of purchase")

class EmployeeCreatedEvent(BaseModel):
    employee_id: int = Field(..., description="Staff/Employee User ID")
    hospital_id: int = Field(..., description="Hospital database ID")
    name: str = Field(..., description="Employee full name")
    email: str = Field(..., description="Employee login email")
    role: str = Field(..., description="Role category (e.g., doctor, nurse, test_staff)")
    specialization: Optional[str] = Field(None, description="Specialization (only if doctor)")
    experience: Optional[int] = Field(None, description="Years of experience (only if doctor)")
