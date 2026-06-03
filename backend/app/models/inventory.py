from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base

class InventoryItem(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String) # medicine, equipment, etc.
    quantity = Column(Integer)
    min_threshold = Column(Integer) # For alerts
    unit_price = Column(Float)
    expiry_date = Column(DateTime)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class PharmacyOrder(Base):
    __tablename__ = "pharmacy_orders"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float)
    status = Column(String) # pending, completed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
