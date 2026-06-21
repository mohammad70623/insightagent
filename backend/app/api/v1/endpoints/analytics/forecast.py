import logging
import asyncio
import json
import os
import httpx
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User
from app.services.rag.vector_store import vector_store

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================
# PREDICTIVE INSIGHTS FORECASTING ENDPOINT (100% REAL RAG)
# ============================================================

class ForecastMetric(BaseModel):
    period: str
    predicted_revenue: float
    confidence_bound_low: float
    confidence_bound_high: float
    growth_rate: float

class ForecastResponse(BaseModel):
    target_vector: str
    horizon_quarters: int
    forecast_data: list[ForecastMetric]

@router.get("/forecast", response_model=ForecastResponse)
async def get_predictive_forecasting(
    current_user: User = Depends(deps.get_current_user)
):
    tenant_collection = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"
    groq_key = os.getenv("GROQ_API_KEY")
    
    fallback_response = {
        "target_vector": "Enterprise Core Predictive Scale",
        "horizon_quarters": 0,
        "forecast_data": []
    }
    
    try:
        documents = await asyncio.to_thread(
            vector_store.list_user_documents,
            collection_name=tenant_collection,
            user_id=current_user.id
        )
        if not documents:
            return fallback_response

        raw_context = ""
        for doc in documents[:5]:
            raw_context += f"\nHistorical Ledger: {doc.get('filename', '')}\nMetrics: {doc.get('text_preview', '')}"

        llama_prompt = f"""
        Apply a zero-shot statistical inference matrix over the corporate business growth velocity logs. Generate predictive numerical trends for the next two quarters.
        
        Retrieved Historical Data:
        {raw_context}
        
        Format the projection precisely into a valid JSON object matching the schema below:
        {{
            "target_vector": "Enterprise SaaS Revenue Model",
            "horizon_quarters": 2,
            "forecast_data": [
                {{"period": "2026-Q3", "predicted_revenue": 450000.0, "confidence_bound_low": 420000.0, "confidence_bound_high": 480000.0, "growth_rate": 8.5}},
                {{"period": "2026-Q4", "predicted_revenue": 490000.0, "confidence_bound_low": 450000.0, "confidence_bound_high": 520000.0, "growth_rate": 9.1}}
            ]
        }}
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama3-70b-8192",
                    "messages": [{"role": "user", "content": llama_prompt}],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"}
                },
                timeout=20.0
            )
            if response.status_code == 200:
                return json.loads(response.json()["choices"][0]["message"]["content"])
        return fallback_response
        
    except Exception as e:
        logger.error(f"Forecasting calculation failure: {str(e)}")
        return fallback_response
