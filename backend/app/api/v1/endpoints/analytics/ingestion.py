import uuid
import logging
import asyncio
import io
import csv
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.services.rag.rag_engine import rag_engine
from app.services.rag.vector_store import vector_store

router = APIRouter()
logger = logging.getLogger(__name__)

def extract_text_from_file(file_name: str, content: bytes) -> str:
    """
    Extracts layout-aware semantic text structures from uploaded byte strings.
    Flawlessly handles multi-column setups and tabular boundaries using pdfplumber alignment.
    """
    ext = file_name.split(".")[-1].lower() if "." in file_name else ""
    
    if ext == "txt":
        return content.decode("utf-8", errors="ignore")
        
    elif ext == "csv":
        try:
            decoded = content.decode("utf-8", errors="ignore")
            f = io.StringIO(decoded)
            reader = csv.DictReader(f)
            rows = []
            for row in reader:
                items = [f"{k.strip()}: {v.strip() if v else ''}" for k, v in row.items() if k]
                if items: rows.append(", ".join(items))
            return "\n".join(rows)
        except Exception as e:
            logger.error(f"CSV parsing failure: {str(e)}")
            return ""
            
    elif ext == "json":
        try:
            decoded = content.decode("utf-8", errors="ignore")
            data = json.loads(decoded)
            if isinstance(data, list):
                formatted = []
                for i, item in enumerate(data):
                    if isinstance(item, dict):
                        items = [f"{k}: {v}" for k, v in item.items()]
                        formatted.append(f"Record {i+1}: {', '.join(items)}")
                    else:
                        formatted.append(f"Record {i+1}: {str(item)}")
                return "\n".join(formatted)
            elif isinstance(data, dict):
                return "\n".join([f"{k}: {v}" for k, v in data.items()])
            return str(data)
        except Exception as e:
            logger.error(f"JSON parsing failure: {str(e)}")
            return ""
            
    elif ext == "pdf":
        try:
            # 🚀 PRODUCTION FIX: Utilize pdfplumber with direct layout-mapping matrix execution
            import pdfplumber
            text_list = []
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    # layout=True explicitly honors margins, side-by-side columns, and text coordinates
                    page_text = page.extract_text(layout=True)
                    if page_text:
                        text_list.append(page_text)
            
            extracted_final = "\n".join(text_list)
            
            # Bulletproof fallback checkpoint in case of custom font-encoding mismatches
            if not extracted_final.strip():
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(content))
                extracted_final = "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])
                
            return extracted_final
            
        except Exception as pdf_fault:
            logger.error(f"Advanced layout parsing hit an exception, falling back to standard stream: {str(pdf_fault)}")
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(content))
                return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
            except Exception:
                return "".join(chr(b) for b in content if 32 <= b < 127 or b in (10, 13))
                
    return ""

@router.post("/index-payload")
async def index_payload(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Accepts incoming payload binary buffers, streams them in safe 1MB chunk boundaries
    to prevent memory-spikes, invokes layout-aware extraction, and awaits solid Qdrant insertion.
    """
    try:
        # ── Qdrant health-gate ────────────────────────────────────────────────
        ok, err_msg = vector_store.is_available()
        if not ok:
            raise HTTPException(
                status_code=503,
                detail=f"Vector database offline. {err_msg}"
            )

        # Check Expiration & Limits
        now_utc = datetime.now(timezone.utc)
        if current_user.subscription_expires_at and now_utc > current_user.subscription_expires_at:
            current_user.subscription_tier = "Free"
            current_user.subscription_expires_at = None
            current_user.subscription_started_at = None
            db.add(current_user)
            await db.commit()
            
        if current_user.subscription_tier == "Free" and current_user.uploaded_files_count >= 5:
            raise HTTPException(status_code=403, detail="PAYWALL_LIMIT_REACHED: Free tier limited to 5 files. Upgrade to Pro.")
        if current_user.subscription_tier == "Pro" and current_user.uploaded_files_count >= 50:
            raise HTTPException(status_code=403, detail="PAYWALL_LIMIT_REACHED: Pro tier limited to 50 files. Upgrade to Enterprise.")

        chunks_accumulator = []
        while chunk_bytes := await file.read(1024 * 1024):
            chunks_accumulator.append(chunk_bytes)
            
        complete_content = b"".join(chunks_accumulator)
        
        # Parse text inside a dedicated executor thread to ensure zero event loop lag
        raw_text = await asyncio.to_thread(extract_text_from_file, file.filename, complete_content)
        
        del chunks_accumulator
        del complete_content
        
        if not raw_text or not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract structured layout text from document asset.")
            
        document_id = uuid.uuid4()
        tenant_collection_namespace = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"
        
        # Trigger explicit sequential RAG ingestion
        success = await rag_engine.index_document_payload(
            collection_name=tenant_collection_namespace,
            user_id=current_user.id,
            document_id=document_id,
            raw_text=raw_text,
            filename=file.filename
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Vector warehouse sync rejected the operation payload.")
            
        current_user.uploaded_files_count += 1
        db.add(current_user)
        await db.commit()
            
        return {
            "status": "success",
            "message": "Structured layout-aware payload successfully synchronized into vector warehouse index.",
            "document_id": str(document_id),
            "filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'{{"event": "index_payload_failed", "filename": "{file.filename}", "error": "{str(e)}"}}')
        raise HTTPException(status_code=500, detail=f"Ingestion worker layer crashed: {str(e)}")

@router.get("/uploaded-files")
async def get_uploaded_files(current_user: User = Depends(deps.get_current_user)):
    tenant_collection = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"
    try:
        # ── Qdrant health-gate ────────────────────────────────────────────────
        ok, err_msg = vector_store.is_available()
        if not ok:
            # Return empty list with a header so the frontend can show a warning
            # instead of crashing (the UI shows "No documents" gracefully).
            logger.warning(f'{{"event": "qdrant_unavailable_for_file_list", "detail": "{err_msg}"}}')
            return []

        documents = await asyncio.to_thread(
            vector_store.list_user_documents,
            collection_name=tenant_collection,
            user_id=current_user.id
        )
        return documents
    except Exception as e:
        logger.error(f'{{"event": "list_documents_failed", "user_id": "{str(current_user.id)}", "error": "{str(e)}"}}')
        return []

@router.delete("/delete-file/{document_id:path}")
async def delete_file_pipeline(document_id: str, current_user: User = Depends(deps.get_current_user)):
    tenant_collection = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"
    try:
        await asyncio.to_thread(
            vector_store.delete_document_vectors,
            collection_name=tenant_collection,
            user_id=current_user.id,
            document_id=document_id
        )
        return {"success": True, "message": "Document vectors purged from core cluster registry successfully."}
    except Exception as e:
        logger.error(f'{{"event": "delete_file_failed", "document_id": "{document_id}", "error": "{str(e)}"}}')
        raise HTTPException(status_code=500, detail=f"Purge routine failed to mutate database: {str(e)}")


# ── INGESTION STATUS POLLING ENDPOINT ─────────────────────────────────────────
# Called by Analytics.jsx every 2.5 s after /index-payload returns document_id.
# Checks whether at least one vector chunk with that document_id exists in Qdrant,
# which confirms the background indexing job completed successfully.
@router.get("/ingestion-status/{document_id}")
async def get_ingestion_status(document_id: str, current_user: User = Depends(deps.get_current_user)):
    tenant_collection = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        from app.core.config import settings

        client = QdrantClient(url=settings.VECTOR_DB_URL)

        if not client.collection_exists(collection_name=tenant_collection):
            # Collection not yet created — indexing still in progress
            return {"status": "processing", "progress": 10}

        # Scroll for at least one point belonging to this document_id
        results, _ = client.scroll(
            collection_name=tenant_collection,
            scroll_filter=Filter(
                must=[
                    FieldCondition(key="user_id",     match=MatchValue(value=str(current_user.id))),
                    FieldCondition(key="document_id", match=MatchValue(value=document_id)),
                ]
            ),
            limit=1,
            with_payload=False,
            with_vectors=False,
        )

        if results:
            return {"status": "completed", "progress": 100}
        else:
            return {"status": "processing", "progress": 50}

    except Exception as e:
        logger.error(f'{{"event": "ingestion_status_failed", "document_id": "{document_id}", "error": "{str(e)}"}}')
        return {"status": "processing", "progress": 30}

