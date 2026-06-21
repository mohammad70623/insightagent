import logging
import asyncio
import os
import httpx
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.user import User
from app.services.rag.vector_store import vector_store

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================
# DRAGGABLE FLOATING SWOT ASSISTANT ENDPOINT (100% REAL RAG)
# ============================================================

class SWOTAnalysisResponse(BaseModel):
    user_id: str
    swot_markdown: str

@router.get("/swot", response_model=SWOTAnalysisResponse)
async def generate_floating_swot_matrix(
    current_user: User = Depends(deps.get_current_user)
):
    tenant_collection = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"
    groq_key = os.getenv("GROQ_API_KEY")
    
    try:
        documents = await asyncio.to_thread(
            vector_store.list_user_documents,
            collection_name=tenant_collection,
            user_id=current_user.id
        )
        if not documents:
            return {
                "user_id": str(current_user.id),
                "swot_markdown": "### Strategic Intelligence Report\n\nNo data metrics ingested yet. Please upload files."
            }

        raw_context = ""
        for doc in documents[:5]:
            raw_context += f"\nFile: {doc.get('filename', '')}\nText: {doc.get('text_preview', '')}"

        llama_prompt = f"""
        Perform a thorough corporate SWOT analysis based on the absolute data context retrieved from the tenant vector index.
        
        Retrieved Tenant Context:
        {raw_context}
        
        Generate a fully detailed, production-grade SWOT matrix in markdown format. 
        Focus strictly on actual corporate metrics, infrastructure gaps, revenue blockers, and opportunities found in the text. Do not return conversational wrappers.
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama3-70b-8192",
                    "messages": [{"role": "user", "content": llama_prompt}],
                    "temperature": 0.2
                },
                timeout=20.0
            )
            if response.status_code == 200:
                report_markdown = response.json()["choices"][0]["message"]["content"]
                return {"user_id": str(current_user.id), "swot_markdown": report_markdown}
                
        raise HTTPException(status_code=502, detail="SWOT extraction from LLaMA failed.")
        
    except Exception as e:
        logger.error(f"SWOT engine execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"SWOT generation collapsed: {str(e)}")
