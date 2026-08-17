"""
Pharmacy & Inventory Repository Layer
Implements direct database CRUD operations for InventoryItems, Warehouses, StockMovements, and InventoryTransfers.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.shared.database.models import (
    InventoryItem, PharmacyOrder, NurseMedicineRequest, SystemAlert, Warehouse, StockMovement, InventoryTransfer
)
from datetime import datetime
from typing import List, Optional

class InventoryRepository:
    @staticmethod
    async def get_all_inventory(db: AsyncSession, hospital_id: Optional[int] = None) -> List[InventoryItem]:
        """
        Retrieves all registered inventory items, optionally filtered by hospital.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: List of InventoryItem records
        """
        query = select(InventoryItem)
        if hospital_id:
            query = query.filter(InventoryItem.hospital_id == hospital_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_stock_alerts(db: AsyncSession, hospital_id: Optional[int] = None) -> List[InventoryItem]:
        """
        Retrieves all inventory items currently below their reorder safety thresholds.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: List of InventoryItem records triggering low-stock alerts
        """
        query = select(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.min_threshold)
        if hospital_id:
            query = query.filter(InventoryItem.hospital_id == hospital_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_item_by_id(db: AsyncSession, item_id: int) -> Optional[InventoryItem]:
        """
        Retrieves a single inventory item by database ID.
        
        :param db: Async database session
        :param item_id: Unique database ID of the item
        :return: InventoryItem record model object or None
        """
        result = await db.execute(select(InventoryItem).filter(InventoryItem.id == item_id))
        return result.scalars().first()

    @staticmethod
    async def get_item_by_name(db: AsyncSession, hospital_id: int, name: str) -> Optional[InventoryItem]:
        """
        Retrieves an inventory item by name within a specific hospital.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :param name: String item name to search
        :return: InventoryItem record model object or None
        """
        result = await db.execute(select(InventoryItem).filter(InventoryItem.hospital_id == hospital_id, InventoryItem.name == name))
        return result.scalars().first()

    @staticmethod
    async def create_item(db: AsyncSession, item: InventoryItem) -> InventoryItem:
        """
        Saves a new InventoryItem record into the database.
        
        :param db: Async database session
        :param item: InventoryItem model instance
        :return: Persisted InventoryItem record
        """
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    @staticmethod
    async def delete_item(db: AsyncSession, item: InventoryItem) -> None:
        """
        Removes an inventory item from the database.
        
        :param db: Async database session
        :param item: InventoryItem model instance to delete
        """
        await db.delete(item)
        await db.commit()

    @staticmethod
    async def get_pharmacy_orders(db: AsyncSession, hospital_id: int) -> List[PharmacyOrder]:
        """
        Retrieves pending pharmacy prescription orders for a hospital.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :return: List of PharmacyOrder records
        """
        result = await db.execute(
            select(PharmacyOrder)
            .filter(PharmacyOrder.hospital_id == hospital_id, PharmacyOrder.status == "pending")
            .options(joinedload(PharmacyOrder.patient))
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_pharmacy_order_by_id(db: AsyncSession, order_id: int) -> Optional[PharmacyOrder]:
        """
        Retrieves a pharmacy order by ID.
        
        :param db: Async database session
        :param order_id: PharmacyOrder database ID
        :return: PharmacyOrder record or None
        """
        result = await db.execute(select(PharmacyOrder).filter(PharmacyOrder.id == order_id))
        return result.scalars().first()

    @staticmethod
    async def get_nurse_medicine_requests(db: AsyncSession, hospital_id: int) -> List[NurseMedicineRequest]:
        """
        Retrieves pending medicine requests sent by nurses.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :return: List of NurseMedicineRequest records
        """
        result = await db.execute(
            select(NurseMedicineRequest)
            .options(joinedload(NurseMedicineRequest.patient), joinedload(NurseMedicineRequest.nurse))
            .filter(NurseMedicineRequest.hospital_id == hospital_id, NurseMedicineRequest.status != "done")
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_nurse_medicine_request_by_id(db: AsyncSession, request_id: int) -> Optional[NurseMedicineRequest]:
        """
        Retrieves a nurse medicine request by ID.
        
        :param db: Async database session
        :param request_id: Request database ID
        :return: NurseMedicineRequest record or None
        """
        result = await db.execute(select(NurseMedicineRequest).filter(NurseMedicineRequest.id == request_id))
        return result.scalars().first()

    @staticmethod
    async def create_nurse_medicine_request(db: AsyncSession, req: NurseMedicineRequest) -> NurseMedicineRequest:
        """
        Saves a nurse medicine request.
        
        :param db: Async database session
        :param req: NurseMedicineRequest model instance
        :return: Persisted request
        """
        db.add(req)
        await db.flush()
        return req

    @staticmethod
    async def create_alert(db: AsyncSession, alert: SystemAlert) -> None:
        """
        Registers a low-stock system alert notification.
        
        :param db: Async database session
        :param alert: SystemAlert model instance
        """
        db.add(alert)
        await db.flush()

    @staticmethod
    async def create_warehouse(db: AsyncSession, warehouse: Warehouse) -> Warehouse:
        """
        Registers a new Warehouse storage record.
        
        :param db: Async database session
        :param warehouse: Warehouse model instance
        :return: Persisted Warehouse record
        """
        db.add(warehouse)
        await db.flush()
        return warehouse

    @staticmethod
    async def list_warehouses(db: AsyncSession, hospital_id: int) -> List[Warehouse]:
        """
        Lists warehouses for a hospital.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :return: List of Warehouse records
        """
        result = await db.execute(select(Warehouse).filter(Warehouse.hospital_id == hospital_id))
        return list(result.scalars().all())

    @staticmethod
    async def get_warehouse_by_id(db: AsyncSession, warehouse_id: int) -> Optional[Warehouse]:
        """
        Retrieves warehouse details by ID.
        
        :param db: Async database session
        :param warehouse_id: Warehouse database ID
        :return: Warehouse record or None
        """
        result = await db.execute(select(Warehouse).filter(Warehouse.id == warehouse_id))
        return result.scalars().first()

    @staticmethod
    async def create_stock_movement(db: AsyncSession, movement: StockMovement) -> StockMovement:
        """
        Registers a stock movement.
        
        :param db: Async database session
        :param movement: StockMovement model instance
        :return: Persisted StockMovement record
        """
        db.add(movement)
        await db.flush()
        return movement

    @staticmethod
    async def list_stock_movements(db: AsyncSession, item_id: int) -> List[StockMovement]:
        """
        Retrieves all logged movements for an item.
        
        :param db: Async database session
        :param item_id: Item database ID
        :return: List of StockMovement records
        """
        result = await db.execute(select(StockMovement).filter(StockMovement.item_id == item_id))
        return list(result.scalars().all())

    @staticmethod
    async def create_transfer(db: AsyncSession, transfer: InventoryTransfer) -> InventoryTransfer:
        """
        Saves a warehouse transfer details record.
        
        :param db: Async database session
        :param transfer: InventoryTransfer model instance
        :return: Persisted InventoryTransfer record
        """
        db.add(transfer)
        await db.flush()
        return transfer

    @staticmethod
    async def get_transfer_by_id(db: AsyncSession, transfer_id: int) -> Optional[InventoryTransfer]:
        """
        Retrieves transfer details by ID.
        
        :param db: Async database session
        :param transfer_id: Transfer database ID
        :return: InventoryTransfer record or None
        """
        result = await db.execute(select(InventoryTransfer).filter(InventoryTransfer.id == transfer_id))
        return result.scalars().first()

    @staticmethod
    async def list_expired_items(db: AsyncSession, hospital_id: Optional[int] = None) -> List[InventoryItem]:
        """
        Retrieves inventory items whose expiration date is in the past.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: List of expired InventoryItem records
        """
        query = select(InventoryItem).filter(InventoryItem.expiry_date < datetime.utcnow())
        if hospital_id:
            query = query.filter(InventoryItem.hospital_id == hospital_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def commit(db: AsyncSession) -> None:
        """
        Commits active transaction session.
        
        :param db: Async database session
        """
        await db.commit()
