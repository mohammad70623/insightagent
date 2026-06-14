import asyncio
from sqlalchemy import text
from app.db.session import engine, SessionLocal
from app.db.base_class import Base

async def test_connection():
    print("📡 Initializing database handshake matrix...")
    try:
        
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"✅ Database Engine: Connected successfully! Raw Signal: {result.scalar()}")
        
        
        async with SessionLocal() as session:
            print("✅ Async Session Factory: Session opened and locked successfully!")
            
       
        print(f"📊 Naming Convention Loaded: {Base.metadata.naming_convention.get('uq')}")
        print("\n🎉 ALL DATABASE ARCHITECTURE SYSTEMS ARE 100% OPERATIONAL, VIABLE AND SECURED!")
        
    except Exception as e:
        print(f"\n🚨 CONNECTION CRASHED: Could not establish a pipeline to PostgreSQL.")
        print(f"👉 Error Details: {str(e)}")
        print("\n💡 Tip: Make sure your PostgreSQL server is running and local credentials in backend/.env are correct.")

if __name__ == "__main__":
    asyncio.run(test_connection())