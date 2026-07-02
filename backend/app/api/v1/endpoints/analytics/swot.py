import logging
import asyncio
import os
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
from app.api import deps
from app.models.user import User
from app.services.rag.vector_store import vector_store
from app.services.rag.embedding_service import embedding_service
from app.core.config import settings
from groq import Groq

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
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Retrieves real document chunks from the user's Qdrant vector store via
    semantic search, then asks the LLM to produce a detailed SWOT analysis.
    Zero dummy data — if no documents are uploaded, returns a clear message.
    """
    # User successfully triggered SWOT insights, mark onboarding step complete
    if not current_user.has_explored_insights:
        current_user.has_explored_insights = True
        db.add(current_user)
        await db.commit()

    tenant_collection = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"

    try:
        # ── Step 1: Qdrant health-gate ────────────────────────────────────────
        ok, err_msg = vector_store.is_available()
        if not ok:
            return {
                "user_id": str(current_user.id),
                "swot_markdown": (
                    "## ⚠️ Vector Database Offline\n\n"
                    f"{err_msg}\n\n"
                    "**To start Qdrant locally, run this command in your terminal:**\n\n"
                    "```\ndocker run -p 6333:6333 qdrant/qdrant\n```\n\n"
                    "Once Qdrant is running, upload your documents and click SWOT again."
                )
            }

        # ── Step 2: Check the collection even exists ──────────────────────────
        from qdrant_client import QdrantClient
        client = QdrantClient(url=settings.VECTOR_DB_URL)
        if not client.collection_exists(collection_name=tenant_collection):
            return {
                "user_id": str(current_user.id),
                "swot_markdown": (
                    "## No Documents Found\n\n"
                    "No files have been uploaded to your vector base yet.\n\n"
                    "Please upload at least one business document (PDF, CSV, TXT, or JSON) "
                    "using the **Active Vector Base** panel below, then click **SWOT** again."
                )
            }


        # ── Step 3: Semantic search — retrieve the most relevant chunks ───────
        # Use a rich SWOT-oriented query so the retriever pulls the most
        # business-critical text from the tenant's documents.
        swot_query = (
            "business strengths weaknesses opportunities threats revenue growth "
            "market competition risk strategy performance financial"
        )
        query_vector = await embedding_service.get_embeddings([swot_query])

        payloads = await asyncio.to_thread(
            vector_store.search_tenant_vectors,
            tenant_collection,
            current_user.id,
            query_vector[0],
            10  # pull up to 10 most relevant chunks for richer context
        )

        context_chunks = [
            p.get("text", "").strip()
            for p in payloads
            if isinstance(p, dict) and p.get("text", "").strip()
        ]

        if not context_chunks:
            return {
                "user_id": str(current_user.id),
                "swot_markdown": (
                    "## No Relevant Content Found\n\n"
                    "Your documents were indexed but no business-relevant content "
                    "could be retrieved. Please ensure your uploaded files contain "
                    "readable business data and try again."
                )
            }

        context_str = "\n\n---\n\n".join(context_chunks)

        logger.info(
            f'{{"event": "swot_context_retrieved", "user_id": "{str(current_user.id)}", '
            f'"chunks": {len(context_chunks)}, "chars": {len(context_str)}}}'
        )

        # ── Step 3: Call Groq LLM with the real retrieved context ─────────────
        llm_client = Groq(api_key=settings.GROQ_API_KEY)

        system_prompt = (
            "You are an elite corporate strategy analyst AI.\n"
            "You will be given raw business document excerpts retrieved from a company's knowledge base.\n"
            "Your job is to produce a thorough, detailed SWOT analysis in clean Markdown format.\n\n"
            "Rules:\n"
            "- Ground every point STRICTLY in the provided document context.\n"
            "- Do NOT hallucinate or add generic business advice not supported by the text.\n"
            "- Use proper Markdown: ## headings, **bold** for key terms, bullet points.\n"
            "- Structure: ## Strengths, ## Weaknesses, ## Opportunities, ## Threats.\n"
            "- Under each section list at least 3 specific, evidence-based bullet points.\n"
            "- End with a ## Strategic Summary paragraph synthesising the four quadrants.\n"
            "- Do not add preamble like 'Here is the analysis'. Start directly with ## Strengths."
        )

        user_message = (
            f"Analyse the following business document excerpts and produce a full SWOT matrix:\n\n"
            f"{context_str}"
        )

        completion = await asyncio.to_thread(
            llm_client.chat.completions.create,
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.2,
            max_tokens=2048,
        )

        report_markdown = completion.choices[0].message.content
        if not report_markdown or not report_markdown.strip():
            raise HTTPException(status_code=502, detail="LLM returned an empty SWOT response.")

        logger.info(f'{{"event": "swot_generated", "user_id": "{str(current_user.id)}", "chars": {len(report_markdown)}}}')
        return {"user_id": str(current_user.id), "swot_markdown": report_markdown}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SWOT engine execution failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"SWOT generation failed: {str(e)}")
