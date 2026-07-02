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


class RAGEngine:
    def __init__(self):
        self.llm_client = Groq(api_key=settings.GROQ_API_KEY)

    def _chunk_text(self, raw_text: str, chunk_size: int = 400, overlap: int = 80) -> List[str]:
        """
        Sliding-window character chunker with overlap.
        Splits on sentence boundaries where possible for better semantic coherence.
        Avoids the broken period-split strategy that produces one-word micro-chunks.
        """
        # First clean up whitespace
        text = " ".join(raw_text.split())
        if not text:
            return []

        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + chunk_size, text_len)

          
            if end < text_len:
                snap_end = text.rfind(". ", start, end)
                if snap_end == -1:
                    snap_end = text.rfind("? ", start, end)
                if snap_end == -1:
                    snap_end = text.rfind("! ", start, end)
                if snap_end != -1 and snap_end > start + (chunk_size // 2):
                    end = snap_end + 1  # Include the period

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            start = end - overlap if end - overlap > start else end

        return chunks

    async def index_document_payload(
        self,
        collection_name: str,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
        raw_text: str,
        filename: str = ""
    ) -> bool:
        """
        Splits raw text into overlapping semantic chunks and upserts vector points
        to the user's Qdrant tenant collection.
        Stores filename in each payload point for later document listing.
        """
        try:
            chunks = self._chunk_text(raw_text, chunk_size=400, overlap=80)
            if not chunks:
                logger.error(f'{{"event": "chunking_produced_empty", "filename": "{filename}"}}')
                return False

            logger.info(
                f'{{"event": "chunking_complete", "filename": "{filename}", '
                f'"chunk_count": {len(chunks)}, "collection": "{collection_name}"}}'
            )

            # Batch embed all chunks in one call
            embeddings = await embedding_service.get_embeddings(chunks)

            from qdrant_client.models import PointStruct
            points = [
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embeddings[i],
                    payload={
                        "text": chunks[i],
                        "user_id": str(user_id),
                        "document_id": str(document_id),
                        "filename": filename,
                    }
                )
                for i in range(len(chunks))
            ]

            await asyncio.to_thread(vector_store.upsert_vectors, collection_name, points)

            logger.info(
                f'{{"event": "vectors_upserted", "filename": "{filename}", '
                f'"points": {len(points)}, "collection": "{collection_name}"}}'
            )
            return True

        except Exception as e:
            logger.error(f'{{"event": "ingestion_failed", "filename": "{filename}", "error": "{str(e)}"}}')
            return False

    async def stream_agent_handshake(
        self,
        collection_name: str,
        user_id: uuid.UUID,
        user_prompt: str,
        chat_history: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        """
        1. Embeds the user query.
        2. Retrieves top-k semantically similar chunks from the user's Qdrant namespace.
        3. Builds a RAG-augmented system prompt.
        4. Streams the LLM response token-by-token via Groq.
        """
        start_time = time.perf_counter()
        success = False

        try:
            # Step 1: Embed the query
            query_vector = await embedding_service.get_embeddings([user_prompt])

            # Step 2: Retrieve context from Qdrant
            payloads = await asyncio.to_thread(
                vector_store.search_tenant_vectors,
                collection_name,
                user_id,
                query_vector[0],
                5  # top_k
            )

            # Step 3: Build context string from retrieved payloads
            context_chunks = [
                p.get("text", "").strip()
                for p in payloads
                if isinstance(p, dict) and p.get("text", "").strip()
            ]
            context_str = "\n\n".join(context_chunks)

            logger.info(
                f'{{"event": "rag_retrieval", "collection": "{collection_name}", '
                f'"retrieved_chunks": {len(context_chunks)}, '
                f'"context_chars": {len(context_str)}}}'
            )

            # Step 4: Build system prompt
            if context_str:
                system_instruction = (
                    "You are InsightAgent, an enterprise AI assistant.\n"
                    "CRITICAL CONTEXT EVALUATION AND PROTOCOL RULES:\n"
                    "1. Evaluate ALL provided context chunks carefully and independently. Do NOT merge context logic unless they explicitly refer to the same document topic.\n"
                    "2. Map exact system protocols first. Pay strict attention to numeric sections, limit values, and constraints. Do NOT mix up rules or limits from one section (e.g., Section 2 limits) with examples, notes, or parameters from another section (e.g., Section 10 user examples).\n"
                    "3. Strictly prevent mixing raw system validation answers with troubleshooting FAQs. Validation logic takes precedence over troubleshooting exceptions.\n"
                    "4. Answer the user's question using ONLY the context provided below. Be concise, precise, and completely accurate. If the answer cannot be determined directly from the context, state that clearly.\n"
                    "5. Respond strictly in clean, professional English. Do NOT mix in any other language or dialect unless the user explicitly asks for a translation.\n\n"
                    f"--- CONTEXT ---\n{context_str}\n--- END CONTEXT ---"
                )
            else:
                # No documents uploaded or no match — be transparent, don't hallucinate
                system_instruction = (
                    "You are InsightAgent, an enterprise AI assistant.\n"
                    "No relevant documents were found in the knowledge base for this query. "
                    "Answer from your general knowledge if appropriate, or inform the user to upload relevant documents first.\n"
                    "Respond strictly in clean, professional English. Do NOT mix in any other language or dialect unless the user explicitly asks for a translation."
                )

            messages = [
                {"role": "system", "content": system_instruction},
                *chat_history,
                {"role": "user", "content": user_prompt}
            ]

            # Step 5: Stream from Groq
            completion = await asyncio.wait_for(
                asyncio.to_thread(
                    self.llm_client.chat.completions.create,
                    model=settings.LLM_MODEL_NAME,
                    messages=messages,
                    stream=True
                ),
                timeout=30.0  
            )

            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    yield token
                    await asyncio.sleep(0.001)

            success = True

        except asyncio.TimeoutError:
            logger.critical(f'{{"event": "groq_timeout", "user_id": "{str(user_id)}"}}')
            yield "\n[TIMEOUT]: The AI response timed out. Please try again."

        except Exception as e:
            logger.error(f'{{"event": "stream_failed", "error": "{str(e)}"}}')
            yield f"\n[ERROR]: {str(e)}"

        finally:
            latency = time.perf_counter() - start_time
            logger.info(
                f'{{"event": "stream_complete", "user_id": "{str(user_id)}", '
                f'"latency_sec": {latency:.4f}, "success": {success}}}'
            )


rag_engine = RAGEngine()