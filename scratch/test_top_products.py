import asyncio
import uuid
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.user import User
from app.api.v1.endpoints.analytics.metrics import get_top_products

async def test():
    async with SessionLocal() as db:
        # Get first user in DB
        result = await db.execute(text("SELECT id, email FROM \"user\" LIMIT 1"))
        user_row = result.fetchone()
        if not user_row:
            print("No users found in database.")
            return
        
        user_id, email = user_row
        print(f"Found user: {email} (ID: {user_id})")
        
        # Instantiate user model
        user = User(id=uuid.UUID(str(user_id)), email=email)
        
        try:
            print("Calling get_top_products...")
            response = await get_top_products(current_user=user)
            print("Response:", response.dict())
        except Exception as e:
            print("Error calling get_top_products:", e)

if __name__ == "__main__":
    asyncio.run(test())
