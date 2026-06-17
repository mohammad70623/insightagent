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

    def delete_document_vectors(self, collection_name: str, user_id: uuid.UUID, document_id: str) -> None:
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
            
        search_results = self.client.query_points(
            collection_name=collection_name,
            query=query_vector,
            query_filter=Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))]),
            limit=top_k
        ).points
        #  Safe fallback pattern: extracts payload using getattr and default dict fallback
        return [getattr(p, 'payload', {}) or {} for p in search_results if p is not None]

    def list_user_documents(self, collection_name: str, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        """
        Scrolls through the Qdrant collection and returns de-duplicated document metadata
        (document_id + filename) for a specific tenant user.
        This is the source of truth since uploaded files are tracked only via vector payloads.
        """
        if not self.client.collection_exists(collection_name=collection_name):
            return []

        seen_document_ids = set()
        documents = []

        try:
            # Scroll through all points belonging to this user
            scroll_filter = Filter(
                must=[FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))]
            )
            
            offset = None
            while True:
                results, next_offset = self.client.scroll(
                    collection_name=collection_name,
                    scroll_filter=scroll_filter,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )
                
                for point in results:
                    payload = getattr(point, 'payload', {}) or {}
                    doc_id = payload.get("document_id")
                    filename = payload.get("filename", "Unknown File")
                    
                    if doc_id and doc_id not in seen_document_ids:
                        seen_document_ids.add(doc_id)
                        documents.append({
                            "document_id": doc_id,
                            "filename": filename,
                        })
                
                if next_offset is None:
                    break
                offset = next_offset

        except Exception as e:
            logger.error(f'{{"event": "list_user_documents_failed", "user_id": "{str(user_id)}", "error": "{str(e)}"}}')

        return documents

vector_store = VectorStoreService()