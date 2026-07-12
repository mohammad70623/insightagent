import os
import logging
import time
from typing import List
import httpx
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv()

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
        
        self.headers = {}
        hf_token = getattr(settings, "HF_TOKEN", None) or os.getenv("HF_TOKEN")
        
        if hf_token:
            hf_token = hf_token.strip().replace('"', '').replace("'", "")
            self.headers["Authorization"] = f"Bearer {hf_token}"
            logger.info(" HF_TOKEN successfully loaded into Cloud Embedding Service!")
        else:
            logger.warning(" HF_TOKEN not found in settings or environment! API might hit rate limits.")

    def count_tokens(self, text: str) -> int:
        """Lightweight character-based sub-word estimation to prevent heavy local imports."""
        return len(text.split()) * 4 // 3

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Sends texts to Hugging Face Cloud Inference API asynchronously with zero server overhead."""
        start_time = time.perf_counter()
        
        if not texts:
            return []

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"inputs": texts, "options": {"wait_for_model": True}}
                )
                
                if response.status_code != 200:
                    raise Exception(f"HuggingFace API error {response.status_code}: {response.text}")
                
                embeddings = response.json()
                
                if not isinstance(embeddings, list) or not embeddings:
                    raise Exception("Invalid embedding response format received from HuggingFace.")
                
                if isinstance(embeddings[0], dict):
                    embeddings = [item if isinstance(item, list) else [] for item in embeddings]

                latency = time.perf_counter() - start_time
                logger.info(f'{{"event": "embedding_generated_cloud", "chunks_count": {len(texts)}, "latency_sec": {latency:.4f}}}')
                return embeddings

        except Exception as e:
            logger.error(f'{{"event": "embedding_failed_cloud", "error": "{str(e)}"}}')
            return [[0.0] * 384 for _ in texts]

    def _encode(self, texts: List[str]) -> List[List[float]]:
        """Sync wrapper fallback compatibility check."""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(self.get_embeddings(texts))

embedding_service = EmbeddingService()