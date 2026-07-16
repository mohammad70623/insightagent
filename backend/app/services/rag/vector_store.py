import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue, FilterSelector
import os
from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    def __init__(self):
        self.client = QdrantClient(
            url=settings.VECTOR_DB_URL,
            api_key=getattr(settings, "QDRANT_API_KEY", None) 
        )
        self.vector_dimension = 1536

    # ─────────────────────────────────────────────────────────────────────────
    # HEALTH CHECK — call this before any Qdrant operation.
    # Returns (True, None) when Qdrant is reachable.
    # Returns (False, error_message) when it is not.
    # ─────────────────────────────────────────────────────────────────────────
    def is_available(self) -> tuple[bool, Optional[str]]:
        """
        Pings Qdrant with a lightweight collections list.
        Catches WinError 10061 (connection refused) and any other network error.
        """
        try:
            self.client.get_collections()
            return True, None
        except Exception as e:
            err = str(e)
            if "10061" in err or "Connection refused" in err or "actively refused" in err:
                msg = (
                    "Qdrant vector database is not running. "
                    "Start it with: docker run -p 6333:6333 qdrant/qdrant"
                )
            else:
                msg = f"Qdrant is unreachable: {err}"
            logger.error(f'{{"event": "qdrant_unavailable", "error": "{err}"}}')
            return False, msg

    def is_collection_exists(self, collection_name: str) -> bool:
        """
        Thin sync wrapper around client.collection_exists.
        Called via asyncio.to_thread from the ingestion-status endpoint so it
        reuses the same shared QdrantClient that performed the upsert, avoiding
        the race condition where a freshly-created collection appeared missing
        to a brand-new QdrantClient spawned per poll.
        """
        return self.client.collection_exists(collection_name=collection_name)

    def _ensure_collection(self, collection_name: str):
        exists = self.client.collection_exists(collection_name=collection_name)
        if exists:
            try:
                collection_info = self.client.get_collection(collection_name=collection_name)
                vector_params = collection_info.config.params.vectors
                if hasattr(vector_params, "size"):
                    existing_size = vector_params.size
                elif isinstance(vector_params, dict) and "size" in vector_params:
                    existing_size = vector_params["size"]
                else:
                    existing_size = None
                
                if existing_size is not None and existing_size != self.vector_dimension:
                    logger.warning(
                        f"Dimension mismatch for collection '{collection_name}' (expected {self.vector_dimension}, found {existing_size}). "
                        f"Recreating collection to resolve mismatch."
                    )
                    self.client.delete_collection(collection_name=collection_name)
                    exists = False
            except Exception as e:
                logger.warning(f"Error inspecting collection {collection_name} dimension: {e}")

        if not exists:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=self.vector_dimension, distance=Distance.COSINE),
            )
        try:
            # Create a payload index on user_id to enable filtering/sorting by user
            self.client.create_payload_index(
                collection_name=collection_name,
                field_name="user_id",
                field_schema="keyword"
            )
            # Create a payload index on document_id to enable deleting/filtering by document
            self.client.create_payload_index(
                collection_name=collection_name,
                field_name="document_id",
                field_schema="keyword"
            )
        except Exception as e:
            logger.warning(f"Failed to ensure payload indexes on {collection_name}: {e}")

    def upsert_vectors(self, collection_name: str, points: List[PointStruct], force_reset: bool = False):
        if force_reset:
            if self.client.collection_exists(collection_name=collection_name):
                self.client.delete_collection(collection_name=collection_name)
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=self.vector_dimension, distance=Distance.COSINE),
            )
            try:
                self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name="user_id",
                    field_schema="keyword"
                )
                self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name="document_id",
                    field_schema="keyword"
                )
            except Exception as e:
                logger.warning(f"Failed to ensure payload indexes on reset {collection_name}: {e}")
        else:
            self._ensure_collection(collection_name)
        self.client.upsert(collection_name=collection_name, points=points)

    def delete_document_vectors(self, collection_name: str, user_id: uuid.UUID, document_id: str) -> None:
        """Purges specific isolated file vectors from the multi-user tenant schema instantly."""
        try:
            self._ensure_collection(collection_name)
            self.client.delete(
                collection_name=collection_name,
                points_selector=FilterSelector(
                    filter=Filter(
                        must=[
                            FieldCondition(key="user_id",     match=MatchValue(value=str(user_id))),
                            FieldCondition(key="document_id", match=MatchValue(value=str(document_id)))
                        ]
                    )
                )
            )
            logger.info(f'{{"event": "vectors_deleted", "document_id": "{str(document_id)}"}}')
        except Exception as e:
            logger.error(f'{{"event": "vector_deletion_failed", "document_id": "{str(document_id)}", "error": "{str(e)}"}}')

    def search_tenant_vectors(
        self,
        collection_name: str,
        user_id: uuid.UUID,
        query_vector: List[float],
        top_k: int = 10,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if not self.client.collection_exists(collection_name=collection_name):
            return []

        must_filters = [FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))]
        if document_id:
            must_filters.append(FieldCondition(key="document_id", match=MatchValue(value=str(document_id))))

        search_results = self.client.query_points(
            collection_name=collection_name,
            query=query_vector,
            query_filter=Filter(must=must_filters),
            limit=top_k
        ).points
        return [getattr(p, 'payload', {}) or {} for p in search_results if p is not None]

    def list_user_documents(self, collection_name: str, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        """
        Scrolls through the Qdrant collection and returns de-duplicated document metadata
        (document_id + filename) for a specific tenant user.
        """
        if not self.client.collection_exists(collection_name=collection_name):
            return []

        seen_document_ids = set()
        documents = []

        try:
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
                    doc_id   = payload.get("document_id")
                    filename = payload.get("filename", "Unknown File")

                    if doc_id and doc_id not in seen_document_ids:
                        seen_document_ids.add(doc_id)
                        documents.append({
                            "document_id": doc_id,
                            "filename":    filename,
                        })

                if next_offset is None:
                    break
                offset = next_offset

        except Exception as e:
            logger.error(
                f'{{"event": "list_user_documents_failed", '
                f'"user_id": "{str(user_id)}", "error": "{str(e)}"}}'
            )

        return documents


vector_store = VectorStoreService()