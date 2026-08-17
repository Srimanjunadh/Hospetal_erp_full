from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List, Dict

# Asset
class AssetCreate(BaseModel):
    hospital_id: int
    name: str
    category: str # MEDICAL_EQUIPMENT, COMPUTERS, BEDS, FURNITURE, VEHICLES
    serial_number: str
    purchase_date: date
    purchase_cost: float
    warranty_expiry: Optional[date] = None

class AssetResponse(BaseModel):
    id: int
    hospital_id: int
    name: str
    category: str
    serial_number: str
    status: str
    purchase_date: date
    purchase_cost: float
    warranty_expiry: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True

# Asset Maintenance
class MaintenanceCreate(BaseModel):
    asset_id: int
    maintenance_type: str # ROUTINE_SERVICE, EMERGENCY_REPAIR, CALIBRATION
    scheduled_date: date
    description: str

class MaintenanceResponse(BaseModel):
    id: int
    asset_id: int
    maintenance_type: str
    scheduled_date: date
    completed_date: Optional[date]
    cost: float
    description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Valuation
class AssetValuationReport(BaseModel):
    total_assets_count: int
    total_purchase_value: float
    category_breakdown: Dict[str, float]
