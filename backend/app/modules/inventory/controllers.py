"""
Pharmacy & Inventory Controllers
Exposes HTTP endpoints for listing inventory, tracking Alerts, predicting restock patterns, updating item configurations, and managing nurse medicine orders.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.inventory.schemas import (
    InventoryItemCreate, InventoryItemResponse,
    WarehouseCreate, WarehouseResponse, StockMovementCreate, StockMovementResponse,
    TransferCreate, TransferResponse, InventoryStockAdd, InventoryItemUpdateDetails,
    NurseMedicineRequestCreate
)
from app.modules.inventory.services import InventoryService
from typing import Optional, List

router = APIRouter()

@router.get("/inventory", response_model=List[InventoryItemResponse], summary="List all inventory items", description="Retrieves list of all inventory items, optionally filtered by hospital.")
async def get_inventory(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """
    List inventory items.
    
    :param hospital_id: Optional hospital ID filter
    :param db: Database session
    :return: List of inventory items
    """
    return await InventoryService.get_all_inventory(db, hospital_id)

@router.get("/inventory/alerts", response_model=List[InventoryItemResponse], summary="List stock alert items", description="Retrieves list of items whose stock levels are below safety thresholds.")
async def get_inventory_alerts(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """
    List items triggering low-stock alerts.
    
    :param hospital_id: Optional hospital filter
    :param db: Database session
    :return: List of low-stock alert items
    """
    return await InventoryService.get_stock_alerts(db, hospital_id)

@router.get("/inventory/predictive", summary="Predict medicine restock points", description="Exposes predictive reorder recommendation logs for restock suggestions.")
async def predict_reorder(db: AsyncSession = Depends(get_db)):
    """
    Generate predictive restock points.
    
    :param db: Database session
    :return: List of reorder recommendations
    """
    return await InventoryService.predict_reorder(db)

@router.post("/inventory/add", summary="Add stock quantity", description="Manually adds stock quantity to an inventory item and logs a stock-in movement.")
async def add_stock(data: InventoryStockAdd, db: AsyncSession = Depends(get_db)):
    """
    Manually add stock to an item.
    
    :param data: Stock addition details
    :param db: Database session
    :return: Status response confirmation
    """
    success = await InventoryService.add_stock(db, data.item_id, data.quantity)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "Stock added"}

@router.post("/inventory/new", response_model=InventoryItemResponse, summary="Create new inventory item", description="Registers a new inventory item in the system database.")
async def create_item(data: InventoryItemCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new inventory item.
    
    :param data: Item details
    :param db: Database session
    :return: Created item response details
    """
    return await InventoryService.create_item(db, data.hospital_id, data.name, data.category, data.quantity, data.min_threshold)

@router.put("/inventory/update/{item_id}", summary="Update item details", description="Updates the properties of an inventory item.")
async def update_item(
    item_id: int, 
    data: InventoryItemUpdateDetails, 
    db: AsyncSession = Depends(get_db)
):
    """
    Update details of an item.
    
    :param item_id: Target item ID
    :param data: Update fields payload
    :param db: Database session
    :return: Status confirmation details
    """
    success = await InventoryService.update_item(db, item_id, data)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "Item updated"}

@router.delete("/inventory/delete/{item_id}", summary="Delete inventory item", description="Deletes an inventory item from the system.")
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete an inventory item.
    
    :param item_id: Target item ID
    :param db: Database session
    :return: Status confirmation details
    """
    success = await InventoryService.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "Item deleted"}

@router.get("/pharmacy/orders", summary="Get pharmacy orders", description="Retrieves list of pending pharmacy orders dispatched from prescriptions.")
async def get_pharmacy_orders(hospital_id: int, db: AsyncSession = Depends(get_db)):
    """
    List pharmacy orders.
    
    :param hospital_id: Hospital ID
    :param db: Database session
    :return: List of pharmacy orders
    """
    return await InventoryService.get_pharmacy_orders(db, hospital_id)

@router.patch("/pharmacy/order/{order_id}/done", summary="Mark order completed", description="Marks a pending pharmacy order queue status as completed.")
async def mark_pharmacy_order_done(order_id: int, db: AsyncSession = Depends(get_db)):
    """
    Mark a pharmacy order completed.
    
    :param order_id: Order database ID
    :param db: Database session
    :return: Status confirmation details
    """
    return await InventoryService.mark_pharmacy_order_done(db, order_id)

@router.post("/nurse/medicine-request", summary="Request medicines", description="Nurses request medicine stock updates for patient clinical tracking.")
async def create_nurse_medicine_request(data: NurseMedicineRequestCreate, db: AsyncSession = Depends(get_db)):
    """
    Request medicine stock.
    
    :param data: Nurse request details
    :param db: Database session
    :return: Created request details confirmation
    """
    return await InventoryService.create_nurse_medicine_request(db, data)

@router.get("/pharmacy/nurse-requests/{hospital_id}", summary="Get nurse medicine requests", description="Retrieves list of medicine requests sent by nurses.")
async def get_pharmacy_nurse_requests(hospital_id: int, db: AsyncSession = Depends(get_db)):
    """
    List nurse medicine requests.
    
    :param hospital_id: Hospital ID
    :param db: Database session
    :return: List of nurse medicine requests
    """
    return await InventoryService.get_pharmacy_nurse_requests(db, hospital_id)

@router.patch("/pharmacy/nurse-request/{request_id}/done", summary="Mark nurse request done", description="Marks a nurse medicine request status as completed.")
async def mark_nurse_request_done(request_id: int, db: AsyncSession = Depends(get_db)):
    """
    Mark nurse request completed.
    
    :param request_id: Request database ID
    :param db: Database session
    :return: Status confirmation details
    """
    return await InventoryService.mark_nurse_request_done(db, request_id)

# --- INVENTORY LEDGER ENDPOINTS ---

@router.post("/inventory/warehouse", response_model=WarehouseResponse, summary="Create warehouse", description="Registers a new warehouse storage point.")
async def create_warehouse(data: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new warehouse.
    
    :param data: Warehouse details
    :param db: Database session
    :return: Created warehouse response details
    """
    return await InventoryService.create_warehouse(db, data)

@router.get("/inventory/warehouses/{hospital_id}", response_model=List[WarehouseResponse], summary="List hospital warehouses", description="Retrieves list of all warehouses mapped to a hospital.")
async def get_warehouses(hospital_id: int, db: AsyncSession = Depends(get_db)):
    """
    List hospital warehouses.
    
    :param hospital_id: Hospital ID
    :param db: Database session
    :return: List of warehouses
    """
    return await InventoryService.get_warehouses(db, hospital_id)

@router.post("/inventory/movement", response_model=StockMovementResponse, summary="Record stock movement", description="Logs a stock movement (intake, waste, outflow) for inventory accounting.")
async def record_movement(data: StockMovementCreate, db: AsyncSession = Depends(get_db)):
    """
    Record stock movement.
    
    :param data: Stock movement details
    :param db: Database session
    :return: Logged stock movement response
    """
    return await InventoryService.record_movement(db, data)

@router.get("/inventory/movements/{item_id}", response_model=List[StockMovementResponse], summary="List item movements", description="Retrieves historical stock movements list for an item.")
async def get_movements(item_id: int, db: AsyncSession = Depends(get_db)):
    """
    List stock movements for an item.
    
    :param item_id: Item ID
    :param db: Database session
    :return: List of stock movements
    """
    return await InventoryService.get_movements(db, item_id)

@router.post("/inventory/transfer", response_model=TransferResponse, summary="Execute stock transfer", description="Executes a stock transfer between warehouses, updating item quantities.")
async def execute_transfer(data: TransferCreate, db: AsyncSession = Depends(get_db)):
    """
    Execute warehouse stock transfer.
    
    :param data: Transfer details
    :param db: Database session
    :return: Created transfer response details
    """
    return await InventoryService.execute_transfer(db, data)

@router.get("/inventory/expired", response_model=List[InventoryItemResponse], summary="List expired stock items", description="Retrieves list of inventory items that have exceeded their expiry dates.")
async def get_expired(
    hospital_id: Optional[int] = Query(None, description="Optional hospital ID to filter expired stock items"), 
    db: AsyncSession = Depends(get_db)
):
    """
    List expired items.
    
    :param hospital_id: Optional hospital filter
    :param db: Database session
    :return: List of expired items
    """
    return await InventoryService.get_expired(db, hospital_id)
