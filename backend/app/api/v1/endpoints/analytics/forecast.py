import logging
import asyncio
import json
import os
import re
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User
from app.services.rag.vector_store import vector_store
from app.api.v1.endpoints.analytics.metrics import (
    get_user_document_texts,
    client_default,
    invoke_with_retry,
)
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# ── HARDCODED CORPORATE BASELINE FALLBACK ──────────────────────────────
# Used ONLY when the user has zero uploaded documents in their vector store.
# Keeps the What-If sliders and charts fully interactive and online.
FALLBACK_BASELINE = {
    "revenue": 50000.0,
    "margin": 65.0,
    "churn_rate": 4.5,
    "operational_costs": 32500.0,
}


class ForecastPayload(BaseModel):
    price_adjuster: float
    op_efficiency: float


class ForecastResponse(BaseModel):
    status: str
    projected_revenue: float
    base_revenue: float
    ai_insight: str


@router.post("/forecast", response_model=ForecastResponse)
async def get_predictive_forecasting(
    payload: ForecastPayload,
    current_user: User = Depends(deps.get_current_user)
):
    tenant_collection = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"

    # ── PRIORITY 1: Attempt to pull RAG context from uploaded documents ──
    document_texts = await get_user_document_texts(tenant_collection, current_user.id)

    raw_corpus = ""
    if document_texts:
        raw_corpus = " ".join(document_texts.values())[:4000]

    has_rag_context = bool(raw_corpus.strip())
    using_fallback = not has_rag_context

    # ── EXTRACT BASELINE WEIGHTS ────────────────────────────────────────
    base_revenue = FALLBACK_BASELINE["revenue"]
    margin = FALLBACK_BASELINE["margin"]
    churn_rate = FALLBACK_BASELINE["churn_rate"]
    operational_costs = FALLBACK_BASELINE["operational_costs"]

    if has_rag_context and client_default:
        # Dynamically extract financial weights from the uploaded document
        extraction_prompt = f"""
        You are an expert financial data extraction engine. Analyze the following corporate document text:
        "{raw_corpus}"

        Extract the following baseline metrics as accurately as possible from the document:
        - revenue: The base quarterly or annual revenue figure as a float (e.g. 125000.0). If multiple revenue figures exist, use the most recent or primary one.
        - margin: The operational cost margin or profit margin as a percentage float between 0 and 100 (e.g. 35.0).
        - churn_rate: Customer churn rate as a percentage float (e.g. 4.5). If not explicitly stated, estimate from retention data or return 0.0.
        - operational_costs: Total operational costs as a float (e.g. 45000.0). If not stated, estimate from margin and revenue or return 0.0.

        IMPORTANT: If you cannot find ANY real financial metrics in the text (no revenue, no profit, no sales), return:
        {{
          "revenue": 0.0,
          "margin": 0.0,
          "churn_rate": 0.0,
          "operational_costs": 0.0
        }}

        Your output MUST be ONLY valid JSON matching this schema, with no markdown or conversational text.
        """

        try:
            completion = await invoke_with_retry(
                client_default,
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a financial data extraction engine. Return only valid JSON."},
                    {"role": "user", "content": extraction_prompt}
                ],
                max_tokens=300,
                temperature=0.0,
                response_format={"type": "json_object"},
                route="forecast_extraction"
            )
            content = completion.choices[0].message.content.strip()

            # Clean markdown wrappers if returned
            if content.startswith("```"):
                content = re.sub(r'^```[a-zA-Z]*\n', '', content)
                content = re.sub(r'\n```$', '', content)

            parsed_baseline = json.loads(content)
            extracted_revenue = float(parsed_baseline.get("revenue", 0.0))

            if extracted_revenue > 0:
                # Real financial data found — use extracted weights
                base_revenue = extracted_revenue
                margin = float(parsed_baseline.get("margin", 0.0)) or margin
                churn_rate = float(parsed_baseline.get("churn_rate", 0.0)) or churn_rate
                operational_costs = float(parsed_baseline.get("operational_costs", 0.0)) or operational_costs
                using_fallback = False
            else:
                # Document exists but no financial data found — use fallback
                using_fallback = True
                logger.info(f"Document uploaded but no financial data extracted for user {current_user.id}. Using fallback baseline.")

        except Exception as e:
            logger.error(f"Baseline extraction failed: {str(e)}. Using fallback baseline.")
            using_fallback = True

    # ── MATHEMATICAL SIMULATION ON BASELINE WEIGHTS ─────────────────────
    price_effect = 1.0 + (payload.price_adjuster / 100.0)
    efficiency_effect = 1.0 + (payload.op_efficiency / 100.0)

    projected_revenue = base_revenue * price_effect * efficiency_effect

    # ── GENERATE STRATEGIC AI INSIGHT VIA DEDICATED client_default ───────
    ai_insight = ""

    if client_default:
        source_label = "extracted from uploaded corporate documents" if not using_fallback else "estimated from industry baseline defaults (no document uploaded)"

        reasoning_prompt = f"""
        Analyze the calculated revenue projections under the current What-If slider configurations. Provide a broad, multi-paragraph financial advisory report detailing:
        1. Macro-economic opportunities and risks associated with the simulated price adjustment.
        2. Potential customer churn thresholds and retention impact based on the price adjuster delta.
        3. Long-term organizational value added through the operational efficiency metric over the next two quarters.
        4. Specific tactical recommendations for the executive leadership team.

        Data source: Metrics {source_label}.

        Simulated metrics for this corporation:
        - Historical base quarterly revenue: ${base_revenue:,.2f}
        - Historical margin: {margin}%
        - Customer churn rate: {churn_rate}%
        - Operational costs: ${operational_costs:,.2f}
        - User-simulated price adjustment: {payload.price_adjuster}%
        - User-simulated operational efficiency change: {payload.op_efficiency}%
        - Simulated projected revenue: ${projected_revenue:,.2f}

        Write at minimum 3 detailed paragraphs. Do NOT compress or summarize into bullet points.
        """

        try:
            reasoning_completion = await invoke_with_retry(
                client_default,
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are an elite corporate financial strategist and management consultant. Provide deeply detailed, multi-paragraph advisory reports."},
                    {"role": "user", "content": reasoning_prompt}
                ],
                max_tokens=1000,
                temperature=0.3,
                route="forecast_reasoning"
            )
            ai_insight = reasoning_completion.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Forecast reasoning generation failed: {str(e)}")
            ai_insight = "Strategic insight generation temporarily unavailable. Please retry."

    status = "success" if not using_fallback else "fallback"

    return {
        "status": status,
        "projected_revenue": round(projected_revenue, 2),
        "base_revenue": round(base_revenue, 2),
        "ai_insight": ai_insight
    }
