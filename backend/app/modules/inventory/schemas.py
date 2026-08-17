"""
Pharmacy & Inventory Module Validation Schemas
Defines request and response schemas for warehouses, stock movements, stock transfers, and nurse request lines.
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List, Dict, Any

class InventoryItemBase(BaseModel):
    hospital_id: int = Field(..., description="Hospital database ID")
    name: str = Field(..., description="Name of the medicine or inventory item")
    category: str = Field(..., description="Item category (e.g. Medicine, Consumable)")
    quantity: int = Field(..., ge=0, description="Available stock quantity")
    min_threshold: int = Field(..., ge=0, description="Minimum safety stock threshold")
    unit_price: Optional[float] = Field(0.0, ge=0.0, description="Price per unit of the item")
    expiry_date: Optional[datetime] = Field(None, description="Expiration date of the item")
    warehouse_id: Optional[int] = Field(None, description="Assigned warehouse ID")

    @field_validator("quantity", "min_threshold")
    @classmethod
    def validate_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Value cannot be negative")
        return v

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemResponse(InventoryItemBase):
    id: int = Field(..., description="Unique inventory item ID")
    updated_at: Optional[datetime] = Field(None, description="Last stock movement timestamp")

    class Config:
        from_attributes = True

# Warehouse
class WarehouseCreate(BaseModel):
    hospital_id: int = Field(..., description="Hospital ID")
    name: str = Field(..., description="Warehouse name (e.g. Main Pharmacy)")
    location: Optional[str] = Field(None, description="Physical room/location details")

class WarehouseResponse(BaseModel):
    id: int = Field(..., description="Warehouse database ID")
    hospital_id: int = Field(..., description="Hospital ID")
    name: str = Field(..., description="Warehouse name")
    location: Optional[str] = Field(None, description="Physical location")
    created_at: datetime = Field(..., description="Creation date timestamp")

    class Config:
        from_attributes = True

# Stock Movements
class StockMovementCreate(BaseModel):
    item_id: int = Field(..., description="Inventory item ID")
    warehouse_id: Optional[int] = Field(None, description="Warehouse ID")
    movement_type: str = Field(..., description="Type of movement: STOCK_IN, STOCK_OUT, TRANSFER, WASTE")
    quantity: int = Field(..., ge=1, description="Quantity moved")
    notes: Optional[str] = Field(None, description="Movement notes")

    @field_validator("quantity")
    @classmethod
    def validate_positive_qty(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Movement quantity must be positive")
        return v

class StockMovementResponse(BaseModel):
    id: int = Field(..., description="Stock movement ID")
    item_id: int = Field(..., description="Item ID")
    warehouse_id: Optional[int] = Field(None, description="Warehouse ID")
    movement_type: str = Field(..., description="Movement type")
    quantity: int = Field(..., description="Quantity moved")
    notes: Optional[str] = Field(None, description="Movement notes")
    created_at: datetime = Field(..., description="Recorded timestamp")

    class Config:
        from_attributes = True

# Transfers
class TransferCreate(BaseModel):
    item_id: int = Field(..., description="Item ID to transfer")
    from_warehouse_id: int = Field(..., description="Source warehouse ID")
    to_warehouse_id: int = Field(..., description="Destination warehouse ID")
    quantity: int = Field(..., ge=1, description="Quantity to transfer")

class TransferResponse(BaseModel):
    id: int = Field(..., description="Transfer transaction ID")
    item_id: int = Field(..., description="Item ID")
    from_warehouse_id: int = Field(..., description="Source warehouse ID")
    to_warehouse_id: int = Field(..., description="Destination warehouse ID")
    quantity: int = Field(..., description="Quantity transferred")
    status: str = Field(..., description="Transfer status (e.g. COMPLETED)")
    created_at: datetime = Field(..., description="Timestamp")

    class Config:
        from_attributes = True

# Ad-Hoc Request/Updates Schemas
class InventoryStockAdd(BaseModel):
    item_id: int = Field(..., description="Item ID to add stock for")
    quantity: int = Field(..., ge=1, description="Quantity to add (must be positive)")

    @field_validator("quantity")
    @classmethod
    def validate_positive_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v

class InventoryItemUpdateDetails(BaseModel):
    name: Optional[str] = Field(None, description="Name of the item")
    category: Optional[str] = Field(None, description="Category string")
    quantity: Optional[int] = Field(None, ge=0, description="Stock count")
    min_threshold: Optional[int] = Field(None, ge=0, description="Min safety threshold")
    unit_price: Optional[float] = Field(None, ge=0.0, description="Unit cost")
    expiry_date: Optional[datetime] = Field(None, description="Expiration date")
    warehouse_id: Optional[int] = Field(None, description="Warehouse ID")

class NurseMedicineRequestCreate(BaseModel):
    hospital_id: int = Field(..., description="Hospital ID")
    patient_id: int = Field(..., description="Patient ID")
    nurse_id: int = Field(..., description="Nurse requesting medicines")
    medicines: List[Dict[str, Any]] = Field(..., description="List of medicines requested")
