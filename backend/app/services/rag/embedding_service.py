import os
import logging
import time
from typing import List
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings

load_dotenv()

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        openai_key = os.getenv("OPENAI_API_KEY")
        model_name = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
        
        self._model = OpenAIEmbeddings(
            model=model_name,
            openai_api_key=openai_key,
            timeout=30.0
        )
        logger.info(f"OpenAI Embeddings initialized with model: {model_name}")

    def count_tokens(self, text: str) -> int:
        """Lightweight character-based sub-word estimation to prevent heavy local imports."""
        return len(text.split()) * 4 // 3

    def _load_model_if_needed(self):
        """No-op wrapper for backward compatibility."""
        pass

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Sends texts to OpenAI Embeddings API asynchronously."""
        start_time = time.perf_counter()
        
        if not texts:
            return []

        try:
            embeddings = await self._model.aembed_documents(texts)
            latency = time.perf_counter() - start_time
            logger.info(f'{{"event": "embedding_generated_openai", "chunks_count": {len(texts)}, "latency_sec": {latency:.4f}}}')
            return embeddings

        except Exception as e:
            logger.error(f'{{"event": "embedding_failed_openai", "error": "{str(e)}"}}')
            model_name = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
            dim = 3072 if "3-large" in model_name else 1536
            return [[0.0] * dim for _ in texts]

    def _encode(self, texts: List[str]) -> List[List[float]]:
        """Sync wrapper fallback compatibility check using OpenAIEmbeddings sync method."""
        try:
            return self._model.embed_documents(texts)
        except Exception as e:
            logger.error(f"Sync embedding generation failed: {str(e)}")
            model_name = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
            dim = 3072 if "3-large" in model_name else 1536
            return [[0.0] * dim for _ in texts]

embedding_service = EmbeddingService()