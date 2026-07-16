import os
import logging
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.user import User
from app.core.config import settings
from app.api.v1.endpoints.analytics.metrics import get_user_document_texts, client_default, invoke_with_retry

router = APIRouter()
logger = logging.getLogger("predictive_router")

class SimulationPayload(BaseModel):
    priceAdjuster: float
    marketingBoost: float
    productInnovation: float
    opEfficiency: float
    supportCapacity: float
    competitionThreat: float

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

    # ── 2. DRAFT PROMPT FOR OPENAI INFERENCE ──
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured on server.")

    source_label = "dynamic business document analysis context" if raw_corpus.strip() else "general industry benchmark models"

    reasoning_prompt = f"""
    You are an elite corporate strategist and predictive business analyst. 
    Analyze the following What-If cockpit simulation sliders set by the user:
    - Price Adjuster: {payload.priceAdjuster}%
    - Marketing Boost: {payload.marketingBoost}%
    - Product Innovation: {payload.productInnovation}%
    - Operational Efficiency: {payload.opEfficiency}%
    - Support Capacity: {payload.supportCapacity}%
    - Competition Threat: {payload.competitionThreat}%

    Data Source context: Reference base {source_label}.
    Document Text Sample: "{raw_corpus}"

    Based on these metrics, output a highly detailed, premium, and clean Markdown report detailing:
    1. **Expected Revenue & Margin Impact**: Synthesize how price changes, marketing boost, and innovation offset competition threats.
    2. **Operational Vulnerabilities & Churn Risks**: Identify risk vectors if support capacity lags behind price increases or marketing scale-up.
    3. **Executive Tactical Recommendations**: Offer 3 clear, actionable next steps for the leadership team.

    Return ONLY the markdown report. Use bold headings and concise bullet points to maximize readability. Do not include raw double asterisks unformatted, but write valid, formatted Markdown.
    """

    sys_prompt = f"""
You are the Senior Executive Strategy AI Concierge for InsightAgent.
The user has executed a live corporate predictive simulation with the following REAL metrics:
- Price Adjuster: {payload.priceAdjuster}%
- Marketing Boost: {payload.marketingBoost}%
- Product Innovation: {payload.productInnovation}%
- Operational Efficiency: {payload.opEfficiency}%
- Customer Support Capacity: {payload.supportCapacity}%
- Market Competition Threat: {payload.competitionThreat}%

Analyze how these specific 6 variables interact together based on the parsed financial/SaaS document data. 
Write a highly structured Corporate Financial Advisory Report with professional Markdown headers, clean line breaks between paragraphs, bold metrics, and actionable bullet points. 
Do not use generic dummy summaries. Address the specific numerical values directly in your tactical analysis text.
"""

    ai_report = ""
    if client_default:
        try:
            completion = await invoke_with_retry(
                client_default,
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": f"Document Context Source data:\n{raw_corpus}\n\nGenerate the financial analysis report."}
                ],
                max_tokens=1000,
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
