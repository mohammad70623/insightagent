import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.api.v1.endpoints.analytics.swot import generate_floating_swot_matrix
from app.db.session import SessionLocal
from app.models.user import User
from sqlalchemy.future import select

async def main():
    async with SessionLocal() as db:
        result = await db.execute(select(User).limit(1))
        user = result.scalars().first()
        if not user:
            print("No users found in database!")
            # Fallback mock user with some ID
            user = User(email="test@example.com")
            user.id = "db563a7e-4773-4e33-929c-f2bfbb7458fb"
            
        print(f"Testing SWOT for user: {user.email} (ID: {user.id})")
        try:
            res = await generate_floating_swot_matrix(current_user=user)
            print("\n--- RESULTS ---")
            print(res)
        except Exception as e:
            import traceback
            print("\n--- EXCEPTION ---")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
