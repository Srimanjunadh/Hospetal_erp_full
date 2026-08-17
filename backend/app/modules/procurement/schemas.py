from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Vendor
class VendorCreate(BaseModel):
    name: str
    contact_email: str
    phone: str
    address: Optional[str] = None

class VendorResponse(BaseModel):
    id: int
    name: str
    contact_email: str
    phone: str
    address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Purchase Request
class PurchaseRequestCreate(BaseModel):
    hospital_id: int
    requester_id: int
    item_name: str
    category: str # MEDICINE, EQUIPMENT, CONSUMABLE
    quantity: int
    estimated_cost: float

class PurchaseRequestResponse(BaseModel):
    id: int
    hospital_id: int
    requester_id: int
    item_name: str
    category: str
    quantity: int
    estimated_cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Purchase Order
class PurchaseOrderCreate(BaseModel):
    purchase_request_id: Optional[int] = None
    vendor_id: int
    hospital_id: int
    total_amount: float

class PurchaseOrderResponse(BaseModel):
    id: int
    purchase_request_id: Optional[int]
    vendor_id: int
    hospital_id: int
    po_number: str
    total_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Supplier Invoice
class SupplierInvoiceCreate(BaseModel):
    purchase_order_id: int
    amount: float

class SupplierInvoiceResponse(BaseModel):
    id: int
    purchase_order_id: int
    invoice_number: str
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
