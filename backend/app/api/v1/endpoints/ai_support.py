import os
import logging
import asyncio
import traceback
import hashlib
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import pdfplumber
import pypdf
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.services.rag.embedding_service import embedding_service
from app.services.rag.vector_store import vector_store

router = APIRouter()
logger = logging.getLogger("ai_support_router")

# --- DYNAMIC PRODUCTION-READY ABSOLUTE PATH RESOLUTION ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "..", "assets", "insightAgent support document.pdf"))
# ---------------------------------------------------------
COLLECTION_NAME = "system_support"
SUPPORT_MANUAL_TEXT = ""

def load_support_pdf_to_memory():
    """Reads PDF manual into memory cache variable for zero-lag keyword fallback checks."""
    global SUPPORT_MANUAL_TEXT
    if not SUPPORT_MANUAL_TEXT:
        if os.path.exists(PDF_PATH):
            try:
                reader = pypdf.PdfReader(PDF_PATH)
                pages_text = [page.extract_text() for page in reader.pages if page.extract_text()]
                SUPPORT_MANUAL_TEXT = "\n".join(pages_text)
                logger.info(f"Successfully loaded support PDF into memory: {len(SUPPORT_MANUAL_TEXT)} characters.")
            except Exception as e:
                logger.error(f"Failed to load support PDF to memory: {str(e)}")
        else:
            logger.error(f"Support PDF path does not exist for memory loading: {PDF_PATH}")

def extract_relevant_slices(query: str, manual_text: str, max_chars: int = 4000) -> str:
    """Filters paragraphs containing keywords related to the user inquiry to supply to Groq."""
    if not manual_text:
        return ""
    
    keywords = ["free tier", "pro tier", "quota", "timeout", "stripe", "csv", "swot", "billing", "upload", "limit", "price", "pricing", "error", "failed"]
    query_lower = query.lower()
    
    active_keywords = [kw for kw in keywords if kw in query_lower]
    if not active_keywords:
        active_keywords = ["quota", "limit", "upload", "document"]
        
    paragraphs = [p.strip() for p in manual_text.split("\n\n") if p.strip()]
    matched_paragraphs = []
    
    for p in paragraphs:
        p_lower = p.lower()
        if any(kw in p_lower for kw in active_keywords):
            matched_paragraphs.append(p)
            
    result = ""
    for mp in matched_paragraphs:
        if len(result) + len(mp) < max_chars:
            result += mp + "\n\n"
        else:
            break
            
    if not result:
        result = manual_text[:max_chars]
        
    return result.strip()

def get_file_hash(filepath: str) -> str:
    """Generate SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

async def ensure_support_indexed():
    """
    Checks if system_support collection exists and has matching PDF hash metadata.
    Indexes/Re-indexes ONLY when collection is missing or PDF has changed.
    """
    if not os.path.exists(PDF_PATH):
        return

    try:
        current_hash = get_file_hash(PDF_PATH)
        exists = vector_store.client.collection_exists(collection_name=COLLECTION_NAME)
        
        hash_matches = False
        if exists:
            try:
                search_res = vector_store.client.scroll(
                    collection_name=COLLECTION_NAME,
                    scroll_filter=Filter(
                        must=[
                            FieldCondition(
                                key="type",
                                match=MatchValue(value="indexing_metadata")
                            )
                        ]
                    ),
                    limit=1
                )
                points = search_res[0]
                if points:
                    stored_hash = points[0].payload.get("pdf_hash")
                    if stored_hash == current_hash:
                        hash_matches = True
            except Exception as e:
                logger.warning(f"Error checking stored indexing metadata hash: {str(e)}")

        if not exists or not hash_matches:
            logger.info(f"Re-indexing system support vector space...")
            if exists:
                vector_store.client.delete_collection(collection_name=COLLECTION_NAME)
            
            vector_store.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
            )

            with pdfplumber.open(PDF_PATH) as pdf:
                pages_text = [p.extract_text(layout=True) for p in pdf.pages if p.extract_text(layout=True)]
                text_content = "\n".join(pages_text)

            splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=350)
            chunks = splitter.split_text(text_content)

            batch_size = 32
            points = []
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i : i + batch_size]
                batch_vectors = await embedding_service.get_embeddings(batch_chunks)
                
                for j, chunk_text in enumerate(batch_chunks):
                    point_id = str(uuid.uuid4())
                    points.append(PointStruct(
                        id=point_id,
                        vector=batch_vectors[j],
                        payload={
                            "text": chunk_text,
                            "source": "insightAgent support document",
                            "type": "platform_diagnostics",
                            "is_static_faq": True
                        }
                    ))

            metadata_id = str(uuid.uuid4())
            points.append(PointStruct(
                id=metadata_id,
                vector=[0.0] * 384,
                payload={
                    "type": "indexing_metadata",
                    "pdf_hash": current_hash,
                    "is_static_faq": False
                }
            ))

            vector_store.client.upsert(collection_name=COLLECTION_NAME, points=points)

    except Exception as err:
        logger.error(f"Support RAG startup indexing error: {str(err)}", exc_info=True)

class ChatRequest(BaseModel):
    message: str

def check_conversational_greeting(message: str) -> str:
    msg = message.strip().lower()
    clean_msg = "".join(c for c in msg if c.isalnum() or c.isspace()).strip()
    
    greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "greetings"]
    closings = ["thanks", "thank you", "bye", "goodbye", "cheers"]
    
    if clean_msg in greetings:
        return "Hello! Welcome to InsightAgent Support. How can I assist you with your platform workspace, quotas, or billing setups today?"
    
    if clean_msg in closings:
        return "You're very welcome! I'm glad I could help resolve your inquiry. Let us know if you need anything else. Have a fantastic day!"
        
    return None

@router.post("/chat")
async def chat_support(payload: ChatRequest):
    user_query = payload.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
    
    # Step 1: Greetings/Closing Checks
    conversational_reply = check_conversational_greeting(user_query)
    if conversational_reply:
        return {"reply": conversational_reply}

    # Step 2: Ensure DB is synced and load manual text to memory cache
    await ensure_support_indexed()
    load_support_pdf_to_memory()

    fallback_response = (
        "I'm sorry, I couldn't find a direct resolution for this issue in our system documentation. "
        "Please use the form on the left to submit an official Support Request to our operations team so we can look into this immediately."
    )

    context_str = ""

    # Attempt Vector DB similarity extraction
    try:
        try:
            query_vectors = await asyncio.to_thread(embedding_service._encode, [user_query])
            query_vector = query_vectors[0].tolist()
        except Exception:
            query_vectors = await embedding_service.get_embeddings([user_query])
            query_vector = query_vectors[0]

        search_results = await asyncio.to_thread(
            vector_store.client.query_points,
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=Filter(
                must=[
                    FieldCondition(
                        key="is_static_faq",
                        match=MatchValue(value=True)
                    )
                ]
            ),
            limit=3
        )
        
        # Verify vector confidence score matches threshold
        if search_results.points and search_results.points[0].score >= 0.40:
            context_chunks = []
            for point in search_results.points:
                payload_data = getattr(point, "payload", {}) or {}
                text = payload_data.get("text", "").strip()
                if text:
                    context_chunks.append(text)
            context_str = "\n\n".join(context_chunks)
    except Exception as vector_err:
        logger.warning(f"Non-blocking Vector DB extraction error: {str(vector_err)}")

    # Fallback to In-Memory PDF Parser context segment matching
    if not context_str.strip():
        logger.info("Vector retrieval empty or confidence below 0.85. Falling back to direct in-memory PDF context parse.")
        context_str = extract_relevant_slices(user_query, SUPPORT_MANUAL_TEXT)

    # Step 3: Groq LLM prompt template re-binding
    system_instruction = (
        "You are the official Customer Success AI for InsightAgent. Your only knowledge base is the provided system documentation.\n"
        "Answer user queries politely based ONLY on the documentation context. Keep jargon friendly for non-technical clients.\n"
        "If the answer is NOT present in the provided context, or if the user describes a systemic/fatal failure (e.g., 'server crash', 'database down', 'payment failed'), do NOT hallucinate or guess. "
        f"You MUST reply with EXACTLY this string: '{fallback_response}'"
    )

    user_content = (
        f"Context from official support document:\n{context_str}\n\n"
        f"User Question: {user_query}\n\n"
        f"Task: Answer the user question accurately based ONLY on the context parameters above. If the context is completely empty and doesn't mention the topic at all, return exactly: '{fallback_response}'"
    )

    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        return {"reply": fallback_response}

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=openai_key)
    target_model = os.getenv("LLM_MODEL_NAME", "gpt-4o-mini")
    
    try:
        completion = await client.chat.completions.create(
            model=target_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_content}
            ],
            temperature=0.0
        )
        answer = completion.choices[0].message.content.strip()
    except Exception as retry_exc:
        if "429" in str(retry_exc) or "rate_limit" in str(retry_exc).lower():
            logger.warning(f"Rate limit hit in support LLM, backing off: {retry_exc}")
            await asyncio.sleep(8)
            completion = await client.chat.completions.create(
                model=target_model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.0
            )
            answer = completion.choices[0].message.content.strip()
        else:
            raise retry_exc
        
    return {"reply": answer}
