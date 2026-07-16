import os
import logging
import asyncio
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.user import User
from app.core.config import settings
from app.api.v1.endpoints.analytics.metrics import get_user_document_texts, client_default, invoke_with_retry
from tavily import TavilyClient

router = APIRouter()
logger = logging.getLogger("predictive_router")

class SimulationPayload(BaseModel):
    priceAdjuster: float
    marketingBoost: float
    productInnovation: float
    opEfficiency: float
    supportCapacity: float
    competitionThreat: float
    baseCapital: float
    activeProjection: float

class SimulationResponse(BaseModel):
    aiMarkdownReport: str

@router.post("/simulate", response_model=SimulationResponse)
async def simulate_scenario(
    payload: SimulationPayload,
    current_user: User = Depends(deps.get_current_user)
):
    tenant_collection = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"
    
    # ── 1. RETRIEVE DOCUMENT CONTEXT ──
    document_texts = await get_user_document_texts(tenant_collection, current_user.id)
    raw_corpus = " ".join(document_texts.values())[:4000] if document_texts else ""

    # ── 2. CLASSIFY DOMAIN AND RUN TAVILY SEARCH ──
    detected_domain = "Enterprise SaaS Software"
    if raw_corpus.strip():
        try:
            domain_prompt = f"""
            Analyze the following text and return ONLY the name of the industry sector/vertical:
            "{raw_corpus[:2000]}"
            """
            completion = await invoke_with_retry(
                client_default,
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "user", "content": domain_prompt}
                ],
                max_tokens=50,
                temperature=0.1,
                route="predictive_classification"
            )
            detected_domain = completion.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Failed to classify business domain: {e}")

    search_context = "No live market benchmarks found."
    tavily_key = settings.TAVILY_API_KEY
    if tavily_key:
        try:
            tavily_client = TavilyClient(api_key=tavily_key)
            query = f"current 2026 market benchmarks and trends in {detected_domain}"
            search_response = await asyncio.to_thread(
                tavily_client.search,
                query=query,
                max_results=3,
                search_depth="advanced"
            )
            search_context = " ".join([res.get("content", "") for res in search_response.get("results", [])])
        except Exception as e:
            logger.error(f"Tavily search failed in predictive router: {e}")

    # ── 3. DRAFT PROMPT FOR OPENAI INFERENCE ──
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured on server.")

    baseline_q = payload.baseCapital / 6

    sys_prompt = f"""
You are the Senior Executive Strategy AI Concierge for InsightAgent.
The user has executed a live corporate predictive simulation with the following metrics:
- User Entered Base Capital: ${payload.baseCapital:,.2f}
- Target Baseline Period Metric: ${payload.activeProjection:,.2f}
- Price Adjuster: {payload.priceAdjuster}%
- Marketing Boost: {payload.marketingBoost}%
- Product Innovation: {payload.productInnovation}%
- Operational Efficiency: {payload.opEfficiency}%
- Customer Support Capacity: {payload.supportCapacity}%
- Market Competition Threat: {payload.competitionThreat}%

Write a comprehensive, enterprise-grade, highly strategic business forecasting report.
Ensure the report tone is highly professional, human-crafted, authoritative, and direct. Avoid generic AI filler words.

Follow these strict writing guidelines:
1. Never use the word "Month" or "Monthly" when dividing by 6. Refer to it strictly as "Per Period" or "Per Quarter".
2. Avoid robotic fluff phrases like "pivotal in determining", "critical benchmark", and "financial velocity". Write cleanly, directly, and strategically.
3. For the mathematical formula representation in Section 1, DO NOT output any HTML tags (no <div>, no <br>, no &divide;). Instead, wrap the equation inside a standard markdown code block using a clean, human-readable ASCII layout. Return exactly this structural template:

```text
==================================================
Target Per Period = Ingested Base Capital ÷ 6
Calculation       = $[Insert Base Capital] ÷ 6
Base Metric       = $[Insert Calculated Target] / Period
==================================================
```
"""

    user_prompt = f"""
Generate a comprehensive, multi-section advisory report based on the following context.

Input metrics:
- Base Capital: ${payload.baseCapital:,.2f}
- Target Baseline Period Metric (activeProjection): ${payload.activeProjection:,.2f}
- Price Adjuster: {payload.priceAdjuster}%
- Marketing Boost: {payload.marketingBoost}%
- Product Innovation: {payload.productInnovation}%
- Operational Efficiency: {payload.opEfficiency}%
- Support Capacity: {payload.supportCapacity}%
- Competition Threat: {payload.competitionThreat}%

Market Context (Tavily search response regarding the {detected_domain} domain):
"{search_context[:3000]}"

Document/RAG Ingested Text Context:
"{raw_corpus[:3000]}"

You MUST structure the report exactly into these 4 distinct markdown sections:

### 📊 1. Capital Allocation & Timeline Projections (Q1 - Q6)
- Provide a rigorous, direct mathematical analysis of why the baseline period projection settled at ${payload.activeProjection:,.2f} given a total capital base of ${payload.baseCapital:,.2f}.
- Never use the word "Month" or "Monthly". Refer to periods as "Per Period" or "Per Quarter".
- Do not use robotic filler/fluff phrases like "pivotal in determining", "critical benchmark", or "financial velocity". Keep the text natural, clean, and strategic.
- Wrap the mathematical formula inside a clean standard markdown code block using a clean, human-readable ASCII layout, matching exactly this structure:
```text
==================================================
Target Per Period = Ingested Base Capital ÷ 6
Calculation       = ${payload.baseCapital:,.2f} ÷ 6
Base Metric       = ${baseline_q:,.2f} / Period
==================================================
```
- Explain the dynamic interplay between the positive drivers (e.g., Marketing Boost at {payload.marketingBoost}%) versus negative macro factors (e.g., Competition Threat at {payload.competitionThreat}%) and how they compound over the 6 sequential periods.

### 🔍 2. Live Market Calibration (Tavily Search Insights)
- Cross-reference the user's simulation numbers with the real-time market data fetched via Tavily. 
- State explicitly how current market realities affect their configuration. (e.g., "Given the current competitive saturation index found in market queries, your specified Competition Threat of {payload.competitionThreat}% will directly compress margins unless offset by your {payload.opEfficiency}% operational efficiency drive.")

### 📂 3. Ingested Document Synchronization (RAG Alignment)
- Extract strict operational rules, guardrails, or past financial data from the user's uploaded documents.
- Contrast their theoretical simulation against their historical business architecture. Detail what gaps exist between their slider targets and their actual capabilities.

### 🔮 4. Strategic Execution Roadmap & Next Steps
- Deliver actionable, concrete, step-by-step advisory bullet points.
- Detail exactly what operational shifts must occur to maximize the positive impacts and completely mitigate the negative trends before Q6.
"""

    ai_report = ""
    if client_default:
        try:
            completion = await invoke_with_retry(
                client_default,
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=1500,
                temperature=0.3,
                route="predictive_simulation"
            )
            ai_report = completion.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Predictive simulation LLM call failed: {str(e)}")
            ai_report = "### Simulation Synopsis\n\nFailed to generate AI analysis. Please check your connectivity and API limits."
    else:
        ai_report = "### Simulation Synopsis\n\nAI inference client is offline. Sliders are operational locally."

    return {"aiMarkdownReport": ai_report}
