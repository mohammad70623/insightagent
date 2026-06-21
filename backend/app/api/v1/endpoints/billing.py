from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy import desc

from app.api import deps
from app.models.user import User, Invoice

router = APIRouter()

@router.get("/invoices")
async def get_invoices(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    statement = select(Invoice).where(Invoice.user_id == current_user.id).order_by(desc(Invoice.billing_date))
    result = await db.execute(statement)
    invoices = result.scalars().all()
    
    formatted_invoices = [
        {
            "id": inv.transaction_id,
            "date": inv.billing_date.strftime("%b %d, %Y"),
            "amount": f"${inv.amount_paid:,.2f}",
            "status": "SUCCESS"
        }
        for inv in invoices
    ]
    
    return {"status": "success", "invoices": formatted_invoices}
