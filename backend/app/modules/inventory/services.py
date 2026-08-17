"""
Pharmacy & Inventory Service Layer
Contains business logic for item registries, stock intakes, low stock warnings, transfers, and medicine request completions.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.database.models import (
    InventoryItem, PharmacyOrder, NurseMedicineRequest, SystemAlert, Warehouse, StockMovement, InventoryTransfer
)
from app.modules.inventory.repositories import InventoryRepository
from app.modules.inventory.schemas import (
    InventoryItemCreate, WarehouseCreate, StockMovementCreate, TransferCreate,
    InventoryItemUpdateDetails, NurseMedicineRequestCreate
)
from fastapi import HTTPException
from datetime import datetime
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

class InventoryService:
    @staticmethod
    async def get_all_inventory(db: AsyncSession, hospital_id: Optional[int] = None) -> List[InventoryItem]:
        """
        Retrieves all inventory items for a hospital.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: List of InventoryItem model objects
        """
        try:
            logger.info(f"Retrieving all inventory for hospital_id={hospital_id}")
            return await InventoryRepository.get_all_inventory(db, hospital_id)
        except Exception as e:
            logger.error(f"Error fetching inventory: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error retrieving inventory list")

    @staticmethod
    async def get_stock_alerts(db: AsyncSession, hospital_id: Optional[int] = None) -> List[InventoryItem]:
        """
        Retrieves items falling below minimum safety threshold.
        
        :param db: Async session
        :param hospital_id: Optional hospital filter
        :return: List of low-stock InventoryItems
        """
        try:
            logger.info(f"Retrieving stock alerts for hospital_id={hospital_id}")
            return await InventoryRepository.get_stock_alerts(db, hospital_id)
        except Exception as e:
            logger.error(f"Error retrieving stock alerts: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching low-stock items")

    @staticmethod
    async def get_pharmacy_orders(db: AsyncSession, hospital_id: int) -> List[PharmacyOrder]:
        """
        Retrieves all pending pharmacy prescription orders.
        
        :param db: Async database session
        :param hospital_id: Hospital ID
        :return: List of PharmacyOrder records
        """
        try:
            logger.info(f"Retrieving pharmacy orders for hospital_id={hospital_id}")
            return await InventoryRepository.get_pharmacy_orders(db, hospital_id)
        except Exception as e:
            logger.error(f"Error retrieving pharmacy orders: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error retrieving pharmacy order list")

    @staticmethod
    async def create_item(
        db: AsyncSession, 
        hospital_id: int, 
        name: str, 
        category: str, 
        quantity: int, 
        min_threshold: int
    ) -> InventoryItem:
        """
        Registers new inventory item. If item name exists, increments its quantity.
        
        :param db: Async database session
        :param hospital_id: Associated hospital ID
        :param name: Item name
        :param category: Item category
        :param quantity: Stock quantity
        :param min_threshold: Reorder threshold quantity
        :return: Created/updated InventoryItem record
        """
        try:
            logger.info(f"Creating inventory item: name='{name}' quantity={quantity} hospital={hospital_id}")
            existing = await InventoryRepository.get_item_by_name(db, hospital_id, name)
            if existing:
                logger.info(f"Item '{name}' already exists. Incrementing quantity by {quantity}")
                existing.quantity += quantity
                # Check low-stock warning threshold
                if existing.quantity <= existing.min_threshold:
                    logger.warning(f"Item '{existing.name}' is below safety threshold: {existing.quantity}/{existing.min_threshold}")
                await InventoryRepository.commit(db)
                InventoryService.trigger_inventory_updated(existing, "Intake incremented existing item")
                return existing

            item = InventoryItem(
                hospital_id=hospital_id,
                name=name,
                category=category,
                quantity=quantity,
                min_threshold=min_threshold,
                unit_price=0.0
            )
            if quantity <= min_threshold:
                logger.warning(f"Newly registered item '{name}' is below threshold: {quantity}/{min_threshold}")
            created_item = await InventoryRepository.create_item(db, item)
            InventoryService.trigger_inventory_updated(created_item, "Intake created new item")
            return created_item
        except Exception as e:
            logger.error(f"Error creating inventory item: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error creating new inventory item")

    @staticmethod
    async def add_stock(db: AsyncSession, item_id: int, quantity: int) -> bool:
        """
        Increments stock level, records movement log.
        
        :param db: Async session
        :param item_id: Database item ID
        :param quantity: Quantity increment (must be positive)
        :return: Success boolean
        """
        try:
            logger.info(f"Adding manually stock item_id={item_id} quantity={quantity}")
            if quantity <= 0:
                raise HTTPException(status_code=400, detail="Stock intake quantity must be positive")
                
            item = await InventoryRepository.get_item_by_id(db, item_id)
            if not item:
                return False
                
            item.quantity += quantity
            
            # Check low-stock warning threshold
            if item.quantity <= item.min_threshold:
                logger.warning(f"Item '{item.name}' is below threshold: {item.quantity}/{item.min_threshold}")

            # Log stock movement
            movement = StockMovement(
                item_id=item_id,
                warehouse_id=item.warehouse_id,
                movement_type="STOCK_IN",
                quantity=quantity,
                notes="Manual stock intake"
            )
            await InventoryRepository.create_stock_movement(db, movement)
            await InventoryRepository.commit(db)
            InventoryService.trigger_inventory_updated(item, "Manual stock intake added")
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error adding stock to item {item_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error processing stock addition")

    @staticmethod
    async def update_item(db: AsyncSession, item_id: int, data: InventoryItemUpdateDetails) -> bool:
        """
        Updates fields on an inventory item.
        
        :param db: Async session
        :param item_id: Database item ID
        :param data: Typed updates fields
        :return: Success boolean
        """
        try:
            logger.info(f"Updating inventory item_id={item_id}")
            item = await InventoryRepository.get_item_by_id(db, item_id)
            if not item:
                return False
                
            update_dict = data.model_dump(exclude_unset=True)
            for k, v in update_dict.items():
                if hasattr(item, k):
                    setattr(item, k, v)
                    
            if item.quantity <= item.min_threshold:
                logger.warning(f"Item '{item.name}' is below safety threshold: {item.quantity}/{item.min_threshold}")
                
            await InventoryRepository.commit(db)
            InventoryService.trigger_inventory_updated(item, "Item fields updated")
            return True
        except Exception as e:
            logger.error(f"Error updating item {item_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error updating inventory item")

    @staticmethod
    async def delete_item(db: AsyncSession, item_id: int) -> bool:
        """
        Deletes item from inventory database.
        
        :param db: Async session
        :param item_id: Database item ID
        :return: Success boolean
        """
        try:
            logger.info(f"Deleting item_id={item_id} from database")
            item = await InventoryRepository.get_item_by_id(db, item_id)
            if not item:
                return False
            await InventoryRepository.delete_item(db, item)
            return True
        except Exception as e:
            logger.error(f"Error deleting item {item_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error deleting inventory item")

    @staticmethod
    async def mark_pharmacy_order_done(db: AsyncSession, order_id: int) -> Dict[str, str]:
        """
        Marks prescription order queue status as completed.
        
        :param db: Async session
        :param order_id: PharmacyOrder ID
        :return: Status response confirmation
        :raises HTTPException: If order is not found
        """
        try:
            logger.info(f"Completing pharmacy order_id={order_id}")
            order = await InventoryRepository.get_pharmacy_order_by_id(db, order_id)
            if not order:
                logger.warning(f"Pharmacy order {order_id} not found")
                raise HTTPException(status_code=404, detail="Order not found")
            order.status = "completed"
            await InventoryRepository.commit(db)
            return {"status": "completed"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error completing pharmacy order {order_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error processing pharmacy order status update")

    @staticmethod
    async def create_nurse_medicine_request(db: AsyncSession, data: NurseMedicineRequestCreate) -> Dict[str, str]:
        """
        Saves a nurse medicine request line.
        
        :param db: Async session
        :param data: Typed request create parameters
        :return: Status response confirmation
        """
        try:
            logger.info(f"Creating nurse medicine request patient_id={data.patient_id} nurse_id={data.nurse_id}")
            req = NurseMedicineRequest(
                hospital_id=data.hospital_id,
                patient_id=data.patient_id,
                nurse_id=data.nurse_id,
                medicines=data.medicines,
                status="pending"
            )
            await InventoryRepository.create_nurse_medicine_request(db, req)
            await InventoryRepository.commit(db)
            return {"status": "request created"}
        except Exception as e:
            logger.error(f"Error creating nurse request: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error recording nurse medicine request")

    @staticmethod
    async def get_pharmacy_nurse_requests(db: AsyncSession, hospital_id: int) -> List[NurseMedicineRequest]:
        """
        Lists medicine requests logged by nurses.
        
        :param db: Async session
        :param hospital_id: Hospital ID
        :return: List of requests
        """
        try:
            return await InventoryRepository.get_nurse_medicine_requests(db, hospital_id)
        except Exception as e:
            logger.error(f"Error listing nurse requests: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error listing nurse medicine requests")

    @staticmethod
    async def mark_nurse_request_done(db: AsyncSession, request_id: int) -> Dict[str, str]:
        """
        Marks nurse medicine request queue status as completed.
        
        :param db: Async session
        :param request_id: Request ID
        :return: Status response confirmation
        :raises HTTPException: If request is not found
        """
        try:
            logger.info(f"Completing nurse medicine request_id={request_id}")
            req = await InventoryRepository.get_nurse_medicine_request_by_id(db, request_id)
            if not req:
                logger.warning(f"Nurse medicine request {request_id} not found")
                raise HTTPException(status_code=404, detail="Request not found")
            req.status = "done"
            await InventoryRepository.commit(db)
            return {"status": "request completed"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error marking nurse request complete: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error completing request")

    @staticmethod
    async def predict_reorder(db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Analyzes current stock counts against threshold levels to suggest safety orders.
        
        :param db: Async session
        :return: Suggestions list
        """
        try:
            items = await InventoryRepository.get_all_inventory(db)
            predictions = []
            for i in items:
                if i.quantity <= i.min_threshold * 1.5:
                    predictions.append({
                        "item_id": i.id,
                        "name": i.name,
                        "current_stock": i.quantity,
                        "suggested_reorder_qty": i.min_threshold * 2,
                        "priority": "HIGH" if i.quantity <= i.min_threshold else "MEDIUM"
                    })
            return predictions
        except Exception as e:
            logger.error(f"Error predicting inventory restocks: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error predicting restock requirements")

    @staticmethod
    async def create_warehouse(db: AsyncSession, data: WarehouseCreate) -> Warehouse:
        """
        Creates a new Warehouse profile.
        
        :param db: Async session
        :param data: Typed warehouse create details
        :return: Created warehouse model object
        """
        try:
            logger.info(f"Creating warehouse '{data.name}'")
            warehouse = Warehouse(
                hospital_id=data.hospital_id,
                name=data.name,
                location=data.location
            )
            await InventoryRepository.create_warehouse(db, warehouse)
            await InventoryRepository.commit(db)
            return warehouse
        except Exception as e:
            logger.error(f"Error creating warehouse: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error creating warehouse")

    @staticmethod
    async def get_warehouses(db: AsyncSession, hospital_id: int) -> List[Warehouse]:
        """
        Lists hospital warehouses.
        
        :param db: Async session
        :param hospital_id: Hospital ID
        :return: List of Warehouse records
        """
        try:
            return await InventoryRepository.list_warehouses(db, hospital_id)
        except Exception as e:
            logger.error(f"Error retrieving warehouses: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching warehouses list")

    @staticmethod
    async def record_movement(db: AsyncSession, data: StockMovementCreate) -> StockMovement:
        """
        Records a stock movement details log. Adjusts main inventory quantity.
        
        :param db: Async session
        :param data: Typed movement details
        :return: Logged StockMovement record
        :raises HTTPException: If item does not exist, or insufficient quantity for deduction
        """
        try:
            logger.info(f"Recording stock movement: item_id={data.item_id} type={data.movement_type} qty={data.quantity}")
            item = await InventoryRepository.get_item_by_id(db, data.item_id)
            if not item:
                logger.warning(f"Item ID {data.item_id} not found for stock movement logging")
                raise HTTPException(status_code=404, detail="Item not found")

            qty_change = data.quantity
            if data.movement_type in ["STOCK_OUT", "WASTE"]:
                if item.quantity < qty_change:
                    logger.warning(f"Insufficient stock for movement: available={item.quantity} requested={qty_change}")
                    raise HTTPException(status_code=400, detail="Insufficient stock quantity available")
                item.quantity -= qty_change
            elif data.movement_type == "STOCK_IN":
                item.quantity += qty_change

            movement = StockMovement(
                item_id=data.item_id,
                warehouse_id=data.warehouse_id or item.warehouse_id,
                movement_type=data.movement_type,
                quantity=qty_change,
                notes=data.notes
            )
            await InventoryRepository.create_stock_movement(db, movement)
            
            # Warn low stock threshold
            if item.quantity <= item.min_threshold:
                logger.warning(f"Item '{item.name}' fell below safety threshold: {item.quantity}/{item.min_threshold}")
                alert = SystemAlert(
                    hospital_id=item.hospital_id,
                    from_user_id=1, # Admin / System
                    to_role="hospital_admin",
                    message=f"Low Stock Alert: Item '{item.name}' quantity has fallen to {item.quantity}.",
                    type="notification"
                )
                await InventoryRepository.create_alert(db, alert)

            await InventoryRepository.commit(db)
            return movement
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error logging stock movement: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error logging stock movement transaction")

    @staticmethod
    async def get_movements(db: AsyncSession, item_id: int) -> List[StockMovement]:
        """
        Lists stock movements for an item.
        
        :param db: Async session
        :param item_id: Item ID
        :return: List of stock movements
        """
        try:
            return await InventoryRepository.list_stock_movements(db, item_id)
        except Exception as e:
            logger.error(f"Error retrieving stock movements for {item_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching movements history")

    @staticmethod
    async def execute_transfer(db: AsyncSession, data: TransferCreate) -> InventoryTransfer:
        """
        Executes stock transfer. Logs debit/credit warehouse movements.
        
        :param db: Async session
        :param data: Typed transfer details
        :return: Created Transfer record
        :raises HTTPException: If item/warehouses not found, or quantity is insufficient
        """
        try:
            logger.info(f"Transferring item_id={data.item_id} from warehouse={data.from_warehouse_id} to={data.to_warehouse_id} quantity={data.quantity}")
            item = await InventoryRepository.get_item_by_id(db, data.item_id)
            if not item:
                logger.warning(f"Item ID {data.item_id} not found for transfer")
                raise HTTPException(status_code=404, detail="Item not found")
            
            from_wh = await InventoryRepository.get_warehouse_by_id(db, data.from_warehouse_id)
            to_wh = await InventoryRepository.get_warehouse_by_id(db, data.to_warehouse_id)
            if not from_wh or not to_wh:
                logger.warning(f"Warehouses not found: from={data.from_warehouse_id} to={data.to_warehouse_id}")
                raise HTTPException(status_code=404, detail="One or both warehouses not found")

            if item.quantity < data.quantity:
                logger.warning(f"Insufficient stock for transfer: available={item.quantity} requested={data.quantity}")
                raise HTTPException(status_code=400, detail="Insufficient quantity for transfer")

            transfer = InventoryTransfer(
                item_id=data.item_id,
                from_warehouse_id=data.from_warehouse_id,
                to_warehouse_id=data.to_warehouse_id,
                quantity=data.quantity,
                status="COMPLETED"
            )
            await InventoryRepository.create_transfer(db, transfer)

            # Log source movement
            mv_out = StockMovement(
                item_id=data.item_id,
                warehouse_id=data.from_warehouse_id,
                movement_type="TRANSFER",
                quantity=-data.quantity,
                notes=f"Transferred out to Warehouse #{data.to_warehouse_id}"
            )
            await InventoryRepository.create_stock_movement(db, mv_out)

            # Log target movement
            mv_in = StockMovement(
                item_id=data.item_id,
                warehouse_id=data.to_warehouse_id,
                movement_type="TRANSFER",
                quantity=data.quantity,
                notes=f"Transferred in from Warehouse #{data.from_warehouse_id}"
            )
            await InventoryRepository.create_stock_movement(db, mv_in)

            # Update warehouse reference
            item.warehouse_id = data.to_warehouse_id

            await InventoryRepository.commit(db)
            return transfer
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error executing transfer: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error executing warehouse stock transfer")

    @staticmethod
    async def get_expired(db: AsyncSession, hospital_id: Optional[int] = None) -> List[InventoryItem]:
        """
        Lists expired stock items.
        
        :param db: Async session
        :param hospital_id: Optional hospital filter
        :return: List of expired items
        """
        try:
            return await InventoryRepository.list_expired_items(db, hospital_id)
        except Exception as e:
            logger.error(f"Error fetching expired items: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching expired stock list")

    @staticmethod
    def trigger_inventory_updated(item, reason: str = "Quantity modified") -> None:
        """
        Helper function to publish InventoryUpdated events.
        """
        try:
            from app.shared.events.event_bus import EventBus
            from app.shared.events.schemas import InventoryUpdatedEvent
            import asyncio
            event_data = InventoryUpdatedEvent(
                item_id=item.id,
                name=item.name,
                quantity=item.quantity,
                min_threshold=item.min_threshold,
                reason=reason
            )
            asyncio.create_task(EventBus.publish("domain.inventory.updated", event_data))
        except Exception:
            pass

    @staticmethod
    async def handle_purchase_approved(data: dict) -> None:
        """
        Subscribed event handler to receive approved procurement requests and increment inventory.
        """
        from app.db.session import AsyncSessionLocal
        from app.shared.database.models import InventoryItem, StockMovement
        from sqlalchemy.future import select
        
        hosp_id = data["hospital_id"]
        item_name = data["item_name"]
        qty = data["quantity"]
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(InventoryItem).filter(InventoryItem.hospital_id == hosp_id, InventoryItem.name == item_name)
            )
            item = result.scalars().first()
            
            if not item:
                item = InventoryItem(
                    hospital_id=hosp_id,
                    name=item_name,
                    category=data["category"],
                    quantity=qty,
                    min_threshold=10,
                    unit_price=data["cost"] / qty if qty > 0 else 0.0
                )
                db.add(item)
            else:
                item.quantity += qty
                
            await db.flush()
            
            movement = StockMovement(
                item_id=item.id,
                movement_type="STOCK_IN",
                quantity=qty,
                notes=f"Auto-stock from Purchase Order #{data['purchase_order_id']}"
            )
            db.add(movement)
            await db.commit()
            logger.info(f"Asynchronously added procurement stock '{item_name}' (qty={qty}) to inventory")
            
            # Fire inventory updated event
            InventoryService.trigger_inventory_updated(item, f"Auto-received PO #{data['purchase_order_id']}")

