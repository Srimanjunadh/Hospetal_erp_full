"""
Unit Tests for Pharmacy & Inventory Module Services
Verifies the correct execution of InventoryService business logic using mocks.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.modules.inventory.services import InventoryService
from app.modules.inventory.schemas import (
    InventoryItemUpdateDetails, NurseMedicineRequestCreate, StockMovementCreate
)

@pytest.mark.asyncio
async def test_inventory_get_stock_alerts():
    """Test retrieving low-stock alert items and verifying properties access."""
    db = AsyncMock()
    mock_item = MagicMock()
    mock_item.id = 1
    mock_item.name = "Medicine X"
    mock_item.category = "medicine"
    mock_item.quantity = 5
    mock_item.min_threshold = 10
    mock_item.unit_price = 10.0
    mock_item.expiry_date = None
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [mock_item]
    db.execute.return_value = mock_res
    
    alerts = await InventoryService.get_stock_alerts(db, 1)
    assert len(alerts) == 1
    assert alerts[0].name == "Medicine X"
    assert alerts[0].quantity == 5

@pytest.mark.asyncio
async def test_create_item_new_success():
    """Test registering a brand new inventory item."""
    db = AsyncMock()
    
    # Mock lookup returns None (doesn't exist yet)
    mock_res_lookup = MagicMock()
    mock_res_lookup.scalars.return_value.first.return_value = None
    db.execute.return_value = mock_res_lookup
    
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    
    item = await InventoryService.create_item(db, 1, "Paracetamol", "Medicine", 100, 20)
    assert item.name == "Paracetamol"
    assert item.quantity == 100

@pytest.mark.asyncio
async def test_create_item_existing_increments():
    """Test that creating an item with an existing name increments the quantity."""
    db = AsyncMock()
    
    mock_item = MagicMock()
    mock_item.name = "Paracetamol"
    mock_item.quantity = 100
    mock_item.min_threshold = 20
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = mock_item
    db.execute.return_value = mock_res
    
    db.commit = AsyncMock()
    
    item = await InventoryService.create_item(db, 1, "Paracetamol", "Medicine", 50, 20)
    assert item.quantity == 150

@pytest.mark.asyncio
async def test_add_stock_success():
    """Test manually adding stock to an existing item."""
    db = AsyncMock()
    mock_item = MagicMock()
    mock_item.id = 1
    mock_item.name = "Aspirin"
    mock_item.quantity = 10
    mock_item.min_threshold = 5
    mock_item.warehouse_id = 2
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = mock_item
    db.execute.return_value = mock_res
    
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    
    success = await InventoryService.add_stock(db, 1, 15)
    assert success is True
    assert mock_item.quantity == 25

@pytest.mark.asyncio
async def test_mark_pharmacy_order_done_not_found():
    """Test mark_pharmacy_order_done raises 404 when order does not exist."""
    db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    db.execute.return_value = mock_res
    
    with pytest.raises(HTTPException) as exc_info:
        await InventoryService.mark_pharmacy_order_done(db, 999)
    assert exc_info.value.status_code == 404

@pytest.mark.asyncio
async def test_create_nurse_medicine_request_success():
    """Test creating a nurse medicine request line successfully."""
    db = AsyncMock()
    req_data = NurseMedicineRequestCreate(
        hospital_id=1,
        patient_id=2,
        nurse_id=3,
        medicines=[{"name": "Ibuprofen", "quantity": 3}]
    )
    
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    
    res = await InventoryService.create_nurse_medicine_request(db, req_data)
    assert res["status"] == "request created"

@pytest.mark.asyncio
async def test_record_movement_insufficient_stock():
    """Test that recording a stock outflow movement checks availability bounds."""
    db = AsyncMock()
    move_data = StockMovementCreate(
        item_id=1,
        warehouse_id=2,
        movement_type="STOCK_OUT",
        quantity=50
    )
    
    mock_item = MagicMock()
    mock_item.quantity = 30
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = mock_item
    db.execute.return_value = mock_res
    
    with pytest.raises(HTTPException) as exc_info:
        await InventoryService.record_movement(db, move_data)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Insufficient stock quantity available"
