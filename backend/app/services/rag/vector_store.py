import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.core.config import settings

logger = logging.getLogger(__name__)

class VectorStoreService:
    def __init__(self):
        self.client = QdrantClient(url=settings.VECTOR_DB_URL)
        self.vector_dimension = 384 

    def _ensure_collection(self, collection_name: str):
        if not self.client.collection_exists(collection_name=collection_name):
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=self.vector_dimension, distance=Distance.COSINE),
            )

    def upsert_vectors(self, collection_name: str, points: List[PointStruct]):
        self._ensure_collection(collection_name)
        self.client.upsert(collection_name=collection_name, points=points)

    def delete_document_vectors(self, collection_name: str, user_id: uuid.UUID, document_id: uuid.UUID) -> None:
        """Purges specific isolated file vectors from the multi-user tenant schema instantly."""
        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(key="user_id", match=MatchValue(value=str(user_id))),
                        FieldCondition(key="document_id", match=MatchValue(value=str(document_id)))
                    ]
                )
            )
            logger.info(f'{{"event": "vectors_deleted", "document_id": "{str(document_id)}"}}')
        except Exception as e:
            logger.error(f'{{"event": "vector_deletion_failed", "document_id": "{str(document_id)}", "error": "{str(e)}"}}')

    def search_tenant_vectors(self, collection_name: str, user_id: uuid.UUID, query_vector: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.client.collection_exists(collection_name=collection_name):
            return []
            
        search_results = self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            query_filter=Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))]),
            limit=top_k
        )
        return [p.payload for p in search_results if p.payload]

vector_store = VectorStoreService()