import asyncio
import logging
import time
import uuid
from typing import AsyncGenerator, List, Dict, Any
from groq import Groq
from app.core.config import settings
from app.services.rag.embedding_service import embedding_service
from app.services.rag.vector_store import vector_store

logger = logging.getLogger(__name__)

CACHE_REGISTRY: Dict[str, Dict[str, Any]] = {}

class RAGEngine:
    def __init__(self):
        self.llm_client = Groq(api_key=settings.GROQ_API_KEY)

    async def index_document_payload(self, collection_name: str, user_id: uuid.UUID, document_id: uuid.UUID, raw_text: str) -> bool:
        try:
            chunks = [c.strip() for c in raw_text.split(".") if c.strip()]
            if not chunks: return False
            
            embeddings = await embedding_service.get_embeddings(chunks)
            
            from qdrant_client.models import PointStruct
            points = [
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embeddings[i],
                    payload={"text": chunks[i], "user_id": str(user_id), "document_id": str(document_id)}
                ) for i in range(len(chunks))
            ]
            
            await asyncio.to_thread(vector_store.upsert_vectors, collection_name, points)
            return True
        except Exception as e:
            logger.error(f'{{"event": "ingection_failed", "error": "{str(e)}"}}')
            return False

    async def stream_agent_handshake(
        self, collection_name: str, user_id: uuid.UUID, user_prompt: str, chat_history: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
       
        cache_key = f"{str(user_id)}:{user_prompt}"
        if cache_key in CACHE_REGISTRY and (time.time() - CACHE_REGISTRY[cache_key]["ts"] < 300):
            logger.info(f'{{"event": "cache_hit", "user_id": "{str(user_id)}"}}')
            yield CACHE_REGISTRY[cache_key]["response"]
            return

        start_time = time.perf_counter()
        success = False
        full_response_accumulator = []

        try:
            query_vector = await embedding_service.get_embeddings([user_prompt])
            
            payloads = await asyncio.to_thread(
                vector_store.search_tenant_vectors, collection_name, user_id, query_vector[0]
            )
            
            context_str = "\n\n".join([p["text"] for p in payloads])
            
            system_instruction = "Answer user based on given context strictly.\n\nContext:\n" + context_str
            messages = [{"role": "system", "content": system_instruction}, *chat_history, {"role": "user", "content": user_prompt}]

        
            completion = await asyncio.wait_for(
                asyncio.to_thread(
                    self.llm_client.chat.completions.create,
                    model=settings.LLM_MODEL_NAME,
                    messages=messages,
                    stream=True
                ),
                timeout=15.0 
            )

            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response_accumulator.append(token)
                    yield token
                    await asyncio.sleep(0.001)
            
            success = True
            CACHE_REGISTRY[cache_key] = {"response": "".join(full_response_accumulator), "ts": time.time()}

        except asyncio.TimeoutError:
            logger.critical(f'{{"event": "groq_timeout", "user_id": "{str(user_id)}"}}')
            yield "\n[TIMEOUT ERROR]: The AI processing cluster timed out. Please try again."
        except Exception as e:
            logger.error(f'{{"event": "stream_failed", "error": "{str(e)}"}}')
            yield f"\n[CRITICAL FAULT]: Subsystem down: {str(e)}"
        finally:
            latency = time.perf_counter() - start_time
            logger.info(f'{{"event": "stream_complete", "user_id": "{str(user_id)}", "latency_sec": {latency:.4f}, "success": {success}}}')

rag_engine = RAGEngine()