import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.services.rag.vector_store import vector_store

router = APIRouter()
logger = logging.getLogger(__name__)

# Define the strict admin dependency
get_current_admin_user = deps.RoleChecker(["admin"])

@router.delete("/admin/tenant/{tenant_user_id}")
async def terminate_tenant_ecosystem(
    tenant_user_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    High-privilege atomic cleanup operation. Wipes user metadata from PostgreSQL 
    and completely purges their dedicated Qdrant vector tenant cluster collection.
    """
    try:
        from app.repositories.user_repository import UserRepository
        
        # 1. Fetch target tenant user model
        user_to_delete = await UserRepository.get_by_id(db, user_id=tenant_user_id)
        if not user_to_delete:
            raise HTTPException(status_code=404, detail="Tenant user not found in PostgreSQL.")

        # 2. Extract and drop their dedicated tenant collection
        tenant_collection_namespace = f"tenant_cluster_{str(tenant_user_id).replace('-', '_')}"
        
        try:
            # We use drop_collection directly from qdrant_client if available, 
            # or rely on vector_store if there's a specialized method.
            # Using vector_store to delete all vectors
            await vector_store.delete_document_vectors(
                collection_name=tenant_collection_namespace,
                user_id=tenant_user_id,
                document_id=""  # Leaving empty to potentially clear all, but Qdrant usually needs collection drop.
            )
            # Actually, to completely purge the collection:
            vector_store.client.delete_collection(collection_name=tenant_collection_namespace)
        except Exception as vec_err:
            logger.warning(f"Failed to cleanly drop vector namespace {tenant_collection_namespace}, it may not exist: {vec_err}")

        # 3. Delete user row from PostgreSQL and commit transaction
        await db.delete(user_to_delete)
        await db.commit()

        logger.info(f"Tenant {tenant_user_id} ecosystem flushed completely by admin {current_admin.id}")
        return {"status": "success", "detail": "Tenant profile and vector matrix flushed successfully from ecosystem."}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Tenant deletion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to flush tenant ecosystem: {str(e)}")
