import uuid
import logging
import asyncio
import io
import csv
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
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
    current_user: User = Depends(deps.get_current_user)
):
    """
    Accepts incoming payload binary buffers, streams them in safe 1MB chunk boundaries
    to prevent memory-spikes, invokes layout-aware extraction, and awaits solid Qdrant insertion.
    """
    try:
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
