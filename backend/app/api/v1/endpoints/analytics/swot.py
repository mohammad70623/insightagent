import logging
import asyncio
import os
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from app.api import deps
from app.models.user import User
from app.services.rag.vector_store import vector_store
from app.services.rag.embedding_service import embedding_service
from app.core.config import settings
from app.api.v1.endpoints.analytics.metrics import client_default, invoke_with_retry

router = APIRouter()
logger = logging.getLogger(__name__)



class SWOTAnalysisResponse(BaseModel):
    user_id: str
    swot_markdown: str


@router.get("/swot", response_model=SWOTAnalysisResponse)
async def generate_floating_swot_matrix(
    document_id: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Retrieves real document chunks from the user's Qdrant vector store via
    semantic search, then asks the LLM to produce a detailed SWOT analysis.
    Zero dummy data — if no documents are uploaded, falls back to AI default framework.
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
                    f"**To start Qdrant locally, run this command in your terminal:**\n\n"
                    "```\ndocker run -p 6333:6333 qdrant/qdrant\n```\n\n"
                    "Once Qdrant is running, upload your documents and click SWOT again."
                )
            }

        # ── Step 2: Check the collection even exists ──────────────────────────
        if not vector_store.client.collection_exists(collection_name=tenant_collection):
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
        swot_query = (
            "business strengths weaknesses opportunities threats revenue growth "
            "market competition risk strategy performance financial"
        )
        
        context_chunks = []
        try:
            query_vector = await embedding_service.get_embeddings([swot_query])

            payloads = await asyncio.to_thread(
                vector_store.search_tenant_vectors,
                tenant_collection,
                current_user.id,
                query_vector[0],
                10,  # pull up to 10 most relevant chunks for richer context
                document_id
            )

            context_chunks = [
                p.get("text", "").strip()
                for p in payloads
                if isinstance(p, dict) and p.get("text", "").strip()
            ]
        except Exception as qdrant_err:
            logger.error(f"SWOT document semantic search failed: {qdrant_err}", exc_info=True)
            return {
                "user_id": str(current_user.id),
                "swot_markdown": (
                    "## SWOT Search Error\n\n"
                    "An error occurred while retrieving document chunks from the vector database.\n\n"
                    f"**Details:** {qdrant_err}"
                )
            }

        # ── Step 4: System & User Messages Setup (Dynamic Prompt Optimization) ──
        system_prompt = (
            "You are an elite Fortune-500 corporate strategy analyst and management consultant AI.\n"
            "You will be given raw business document excerpts retrieved from a company's knowledge base.\n"
            "Your job is to produce an EXHAUSTIVE, deeply granular SWOT analysis in clean Markdown format.\n\n"
            "CRITICAL OUTPUT RULES — DO NOT COMPRESS OR SUMMARIZE:\n"
            "- Under EACH of the four SWOT quadrants, provide a MINIMUM of 5 specific, evidence-based bullet points.\n"
            "- Each bullet point MUST be 2-3 sentences long, not single-phrase summaries.\n"
            "- For Strengths: identify competitive advantages, proprietary assets, team expertise, technology moats, operational efficiencies, and brand equity.\n"
            "- For Weaknesses: expose internal gaps, resource constraints, technical debt, process bottlenecks, talent shortages, and dependency risks.\n"
            "- For Opportunities: detail market expansion paths, partnership potential, technology adoption curves, regulatory tailwinds, and untapped customer segments.\n"
            "- For Threats: assess competitive pressures, regulatory headwinds, macroeconomic risks, supply chain vulnerabilities, and disruptive technology threats.\n"
            "- Ground every point strictly in the provided context (or general enterprise benchmarks if initialized without document context).\n"
            "- Use proper Markdown: ## headings, **bold** for key terms, bullet points.\n"
            "- Structure: ## Strengths, ## Weaknesses, ## Opportunities, ## Threats.\n"
            "- End with a ## Strategic Summary of at least 3 paragraphs synthesising the four quadrants with actionable executive recommendations.\n"
            "- Do not add preamble like 'Here is the analysis'. Start directly with ## Strengths."
        )

        
        if not context_chunks:
            logger.warning(f"⚠️ Qdrant empty for user {current_user.id}, engaging LLaMA baseline fallback strategy.")
            user_message = (
                "No specific document context could be extracted in time. Generate a comprehensive, "
                "highly professional, and strategic enterprise SWOT analysis framework based on default "
                "tech SaaS business benchmarks, general financial metrics, and standard software engineering industry parameters."
            )
            context_str = "Default Enterprise Baseline"
        else:
            context_str = "\n\n---\n\n".join(context_chunks)
            user_message = (
                f"Analyse the following business document excerpts and produce a full SWOT matrix:\n\n"
                f"{context_str}"
            )

        logger.info(
            f'{{"event": "swot_context_processed", "user_id": "{str(current_user.id)}", '
            f'"chunks": {len(context_chunks)}, "chars": {len(context_str)}}}'
        )

        # ── Step 5: Call Groq LLM with the generated context/fallback ─────────────
        completion = await invoke_with_retry(
            client_default,
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.3, 
            max_tokens=2048,
            route="swot_analysis"
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