import logging
import time
from typing import List
import asyncio
from transformers import AutoTokenizer
from sentence_transformers import SentenceTransformer
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)

    def count_tokens(self, text: str) -> int:
        """Accurately calculates real cryptographic sub-word tokens instead of naive split metrics."""
        return len(self.tokenizer.encode(text))

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """ Offloads compute-bound operations cleanly onto async-safe thread contexts."""
        start_time = time.perf_counter()
        try:
            embeddings = await asyncio.to_thread(self.model.encode, texts)
            latency = time.perf_counter() - start_time
            logger.info(f'{{"event": "embedding_generated", "chunks_count": {len(texts)}, "latency_sec": {latency:.4f}}}')
            return embeddings.tolist()
        except Exception as e:
            logger.error(f'{{"event": "embedding_failed", "error": "{str(e)}"}}')
            raise e

embedding_service = EmbeddingService()