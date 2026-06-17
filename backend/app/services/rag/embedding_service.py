import logging
import time
import threading
from typing import List, Optional
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._lock = threading.Lock()

    def _load_model_if_needed(self):
        """Thread-safe lazy loader. Only runs once on first embedding request."""
        if self._model is None:
            with self._lock:
                if self._model is None:
                    logger.info('{"event": "embedding_model_loading", "model": "' + settings.EMBEDDING_MODEL_NAME + '"}')
                    from transformers import AutoTokenizer
                    from sentence_transformers import SentenceTransformer
                    self._tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
                    self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
                    logger.info('{"event": "embedding_model_ready"}')

    def count_tokens(self, text: str) -> int:
        """Accurately calculates real cryptographic sub-word tokens instead of naive split metrics."""
        self._load_model_if_needed()
        return len(self._tokenizer.encode(text))

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Offloads compute-bound operations cleanly onto async-safe thread contexts."""
        start_time = time.perf_counter()
        try:
            # Lazy load runs inside the thread so it doesn't block the event loop either
            embeddings = await asyncio.to_thread(self._encode, texts)
            latency = time.perf_counter() - start_time
            logger.info(f'{{"event": "embedding_generated", "chunks_count": {len(texts)}, "latency_sec": {latency:.4f}}}')
            return embeddings.tolist()
        except Exception as e:
            logger.error(f'{{"event": "embedding_failed", "error": "{str(e)}"}}')
            raise e

    def _encode(self, texts: List[str]) -> any:
        """Sync wrapper that ensures model is loaded before encoding."""
        self._load_model_if_needed()
        return self._model.encode(texts)

embedding_service = EmbeddingService()
