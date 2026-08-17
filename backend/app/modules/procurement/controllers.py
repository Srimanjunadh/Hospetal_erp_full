from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.procurement.schemas import (
    VendorCreate, VendorResponse, PurchaseRequestCreate, PurchaseRequestResponse,
    PurchaseOrderCreate, PurchaseOrderResponse, SupplierInvoiceCreate, SupplierInvoiceResponse
)
from app.modules.procurement.services import ProcurementService
from typing import List

router = APIRouter()

@router.post("/vendor", response_model=VendorResponse)
async def create_vendor(data: VendorCreate, db: AsyncSession = Depends(get_db)):
    return await ProcurementService.create_vendor(db, data)

@router.get("/vendors", response_model=List[VendorResponse])
async def list_vendors(db: AsyncSession = Depends(get_db)):
    return await ProcurementService.list_vendors(db)

@router.post("/request", response_model=PurchaseRequestResponse)
async def create_purchase_request(data: PurchaseRequestCreate, db: AsyncSession = Depends(get_db)):
    return await ProcurementService.create_purchase_request(db, data)

@router.patch("/request/{req_id}/approve", response_model=PurchaseRequestResponse)
async def approve_purchase_request(req_id: int, status: str = Query("APPROVED"), db: AsyncSession = Depends(get_db)):
    return await ProcurementService.approve_purchase_request(db, req_id, status)

@router.post("/po", response_model=PurchaseOrderResponse)
async def create_purchase_order(data: PurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    return await ProcurementService.create_purchase_order(db, data)

@router.patch("/po/{po_id}/receive", response_model=PurchaseOrderResponse)
async def receive_goods(po_id: int, db: AsyncSession = Depends(get_db)):
    return await ProcurementService.receive_goods(db, po_id)

@router.post("/invoice", response_model=SupplierInvoiceResponse)
async def receive_supplier_invoice(data: SupplierInvoiceCreate, db: AsyncSession = Depends(get_db)):
    return await ProcurementService.receive_supplier_invoice(db, data)

@router.post("/invoice/{invoice_id}/pay", response_model=SupplierInvoiceResponse)
async def pay_supplier_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    return await ProcurementService.pay_supplier_invoice(db, invoice_id)
