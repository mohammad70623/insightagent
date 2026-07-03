import logging
import asyncio
import json
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from groq import Groq

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

class AnalyzeRequest(BaseModel):
    document_id: str

class RiskAlert(BaseModel):
    type: str
    description: str
    severity: str

class AnalyzeResponse(BaseModel):
    success: bool
    alerts: list[RiskAlert]

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_document(payload: AnalyzeRequest):
    """
    Real-world RAG Anomaly Detection:
    1. Scroll Qdrant to find document chunks matching document_id.
    2. Construct context from the text payloads.
    3. Pass text content to LLaMA 3 (via Groq) to predict risks.
    4. Return predicted risks matching the requested format.
    """
    document_id = payload.document_id
    if not document_id:
        raise HTTPException(status_code=400, detail="document_id is required")

    logger.info(f"RAG Anomaly Detection Core: Starting analysis for document_id: {document_id}")
    
    # 1. Search for chunks across Qdrant collections
    client = QdrantClient(url=settings.VECTOR_DB_URL)
    
    # Verify vector store availability
    try:
        collections_response = client.get_collections()
    except Exception as err:
        logger.error(f"Failed to fetch collections from Qdrant: {err}")
        return {"success": False, "alerts": []}
        
    text_chunks = []
    filename = "Unknown File"
    
    # Iterate collections to aggregate chunks belonging to the document_id
    for col in collections_response.collections:
        col_name = col.name
        offset = None
        while True:
            try:
                results, next_offset = client.scroll(
                    collection_name=col_name,
                    scroll_filter=Filter(
                        must=[
                            FieldCondition(key="document_id", match=MatchValue(value=document_id))
                        ]
                    ),
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )
                for point in results:
                    p_load = getattr(point, "payload", {}) or {}
                    if "text" in p_load:
                        text_chunks.append(p_load["text"])
                    if "filename" in p_load:
                        filename = p_load["filename"]
                
                if next_offset is None:
                    break
                offset = next_offset
            except Exception as e:
                logger.error(f"Error scrolling collection {col_name} for document {document_id}: {e}")
                break
                
        if text_chunks:
            # Found document chunks in this tenant collection
            break

    if not text_chunks:
        logger.warning(f"RAG Anomaly Detection Core: No chunks found for document_id: {document_id}")
        return {"success": True, "alerts": []}

    document_text = "\n\n".join(text_chunks)
    logger.info(f"Aggregated {len(text_chunks)} chunks for {filename} (Total chars: {len(document_text)})")

    # 2. Invoke Groq LLaMA 3 Model for Anomaly / Risk Prediction
    try:
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        
        system_prompt = (
            "You are an elite enterprise risk analysis agent running LLaMA 3.\n"
            "Your task is to analyze the document content below and identify compliance, operational, security, legal, or financial risks.\n"
            "You must return a valid JSON object matching the requested schema exactly, with NO other text before or after the JSON."
        )
        
        user_prompt = f"""
        Analyze the document content and identify all predicted risks.
        
        Document Filename: {filename}
        
        Document Content:
        ---
        {document_text}
        ---
        
        You must return a valid JSON object with the exact layout below. If no risks are found, return an empty array for "alerts".
        JSON Output Schema:
        {{
            "success": true,
            "alerts": [
                {{
                    "type": "GDPR Compliance",
                    "description": "Provide a descriptive, fact-based description of this risk. Cite specific details or metrics from the text if available.",
                    "severity": "CRITICAL"
                }}
            ]
        }}
        
        Rules:
        1. "type" should represent the category of risk (e.g., GDPR Compliance, Supply Chain, Cyber Security, Financial Fraud, Operations, Legal, etc.).
        2. "severity" MUST be one of: "CRITICAL", "WARNING", "INFO" (strictly uppercase).
        3. Do NOT wrap the JSON inside markdown code blocks (e.g. ```json). Output raw JSON.
        """

        completion = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        raw_content = completion.choices[0].message.content
        logger.info(f"AI response received: {raw_content}")
        
        parsed_data = json.loads(raw_content)
        return {
            "success": parsed_data.get("success", True),
            "alerts": parsed_data.get("alerts", [])
        }
        
    except Exception as parse_err:
        logger.error(f"Failed to generate/parse AI risks: {parse_err}")
        return {"success": False, "alerts": []}
