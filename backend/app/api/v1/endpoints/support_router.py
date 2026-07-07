import os
import logging
import asyncio
import uuid
import traceback
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.core.config import settings
from app.services.rag.embedding_service import embedding_service
from app.services.rag.vector_store import vector_store

router = APIRouter()
logger = logging.getLogger("support_router")


class SupportConnectionManager:
    """
    Connection manager handling live support connections for both Users and Admins.
    Manages active WebSockets and maintains session states in-memory.
    """
    def __init__(self):
        # Registry of active user WS connections: {session_id: WebSocket}
        self.user_connections: Dict[str, WebSocket] = {}
        # Registry of active admin WS connections: {admin_id: WebSocket}
        self.admin_connections: Dict[str, WebSocket] = {}
        # In-memory store for session statuses: {session_id: "bot_active" | "pending_human"}
        self.session_states: Dict[str, str] = {}

    async def connect_user(self, session_id: str, websocket: WebSocket):
        """Register a user WebSocket and initialize their support status."""
        await websocket.accept()
        self.user_connections[session_id] = websocket
        if session_id not in self.session_states:
            self.session_states[session_id] = "bot_active"
        logger.info(f"User support socket connected. Session: {session_id}")

    async def connect_admin(self, admin_id: str, websocket: WebSocket):
        """Register an admin WebSocket for monitoring and live takeover."""
        await websocket.accept()
        self.admin_connections[admin_id] = websocket
        logger.info(f"Admin support socket connected. Admin ID: {admin_id}")

    def disconnect_user(self, session_id: str):
        """Deregister a user socket."""
        if session_id in self.user_connections:
            del self.user_connections[session_id]
            logger.info(f"User support socket disconnected. Session: {session_id}")

    def disconnect_admin(self, admin_id: str):
        """Deregister an admin socket."""
        if admin_id in self.admin_connections:
            del self.admin_connections[admin_id]
            logger.info(f"Admin support socket disconnected. Admin ID: {admin_id}")

    async def broadcast_to_admins(self, message: dict):
        """Broadcasts a payload to all active admin sockets. Handles stale connections safely."""
        disconnected_admins = []
        for admin_id, connection in self.admin_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send broadcast to admin {admin_id}: {str(e)}")
                disconnected_admins.append(admin_id)
        
        for admin_id in disconnected_admins:
            self.disconnect_admin(admin_id)

    def get_session_state(self, session_id: str) -> str:
        """Get the communication state for a session. Defaults to 'bot_active'."""
        return self.session_states.get(session_id, "bot_active")

    def set_session_state(self, session_id: str, state: str):
        """Mutate the communication state for a session."""
        self.session_states[session_id] = state
        logger.info(f"Session {session_id} state mutated to: {state}")


manager = SupportConnectionManager()


async def query_support_rag(user_query: str) -> str:
    """
    Generates an embedding for the user query, searches only the isolated system_support
    Qdrant collection (filtering by is_static_faq = True), and uses an async LLM client to
    output either a tailored answer or the ROUTE_TO_HUMAN handover directive.
    """
    try:
        # ── 1. EMBEDDING GENERATION (THREADING ISOLATION) ──
        # Offload sync model loading/encoding to asyncio.to_thread to keep event loop clear
        try:
            # Offload the core synchronous _encode wrapper
            query_vectors = await asyncio.to_thread(embedding_service._encode, [user_query])
            query_vector = query_vectors[0].tolist()
        except Exception as e:
            logger.warning(f"Direct _encode offload failed: {str(e)}. Trying fallback get_embeddings...")
            try:
                query_vectors = await embedding_service.get_embeddings([user_query])
                query_vector = query_vectors[0]
            except Exception as e2:
                logger.warning(f"get_embeddings failed: {str(e2)}. Initializing model manually...")
                if getattr(embedding_service, "_model", None) is None:
                    await asyncio.to_thread(embedding_service._load_model_if_needed)
                embeddings = await asyncio.to_thread(embedding_service._model.encode, [user_query])
                query_vector = embeddings[0].tolist()

        # ── 2. QDRANT VECTOR SEARCH ──
        # Synchronous query_points offloaded to threadpool
        search_results = await asyncio.to_thread(
            vector_store.client.query_points,
            collection_name="system_support",
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
        
        context_chunks = []
        for point in search_results.points:
            payload = getattr(point, "payload", {}) or {}
            text = payload.get("text", "").strip()
            if text:
                context_chunks.append(text)
                
        context_str = "\n\n".join(context_chunks)
        
        # ── 3. ASYNC LLM EXECUTION ──
        system_instruction = (
            "You are the InsightAgent Platform Support Bot.\n"
            "CRITICAL CONTEXT EVALUATION AND PROTOCOL RULES:\n"
            "1. Evaluate ALL provided context chunks carefully and independently. Do NOT merge context logic unless they explicitly refer to the same document topic.\n"
            "2. Map exact system protocols first. Pay strict attention to numeric sections, limit values, and constraints. Do NOT mix up rules or limits from one section (e.g., Section 2 limits) with examples, notes, or parameters from another section (e.g., Section 10 user examples).\n"
            "3. Strictly prevent mixing raw system validation answers with troubleshooting FAQs. Validation logic takes precedence over troubleshooting exceptions.\n"
            "4. Answer strictly using the context provided. If the question is outside the platform scope, or requires human admin access, reply with exactly one keyword string: 'ROUTE_TO_HUMAN'.\n"
            "5. Respond strictly in clean, professional English. Do NOT mix in any other language or dialect unless the user explicitly asks for a translation."
        )
        
        user_content = (
            f"--- CONTEXT ---\n{context_str}\n--- END CONTEXT ---\n\n"
            f"User Question: {user_query}"
        )
        
        llm_provider = os.getenv("LLM_PROVIDER", "groq").lower()
        
        if llm_provider == "openai" or not settings.GROQ_API_KEY:
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key:
                logger.error("No valid API keys found for OpenAI (OPENAI_API_KEY).")
                return "ROUTE_TO_HUMAN"
            
            try:
                from langchain_openai import ChatOpenAI
                from langchain_core.messages import SystemMessage, HumanMessage
                chat_model = ChatOpenAI(
                    api_key=openai_key,
                    model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    temperature=0.0
                )
                messages = [
                    SystemMessage(content=system_instruction),
                    HumanMessage(content=user_content)
                ]
                response = await chat_model.ainvoke(messages)
                answer = response.content.strip()
            except Exception as e:
                logger.warning(f"LangChain ChatOpenAI failed: {str(e)}. Falling back to raw AsyncOpenAI...")
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=openai_key)
                completion = await client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.0
                )
                answer = completion.choices[0].message.content.strip()
        else:
            # Use ChatGroq with ainvoke
            chat_model = None
            try:
                from langchain_groq import ChatGroq
                chat_model = ChatGroq(
                    api_key=settings.GROQ_API_KEY,
                    model=settings.LLM_MODEL_NAME,
                    temperature=0.0,
                    max_retries=5
                )
            except ImportError:
                try:
                    from langchain_community.chat_models import ChatGroq
                    chat_model = ChatGroq(
                        api_key=settings.GROQ_API_KEY,
                        model=settings.LLM_MODEL_NAME,
                        temperature=0.0,
                        max_retries=5
                    )
                except ImportError:
                    pass

            if chat_model is not None:
                from langchain_core.messages import SystemMessage, HumanMessage
                messages = [
                    SystemMessage(content=system_instruction),
                    HumanMessage(content=user_content)
                ]
                response = await chat_model.ainvoke(messages)
                answer = response.content.strip()
            else:
                # Raw AsyncGroq fallback
                from groq import AsyncGroq
                client = AsyncGroq(api_key=settings.GROQ_API_KEY)
                completion = await client.chat.completions.create(
                    model=settings.LLM_MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.0
                )
                answer = completion.choices[0].message.content.strip()
            
        return answer

    except Exception as e:
        logger.error(f"RAG PIPELINE CRASHED: {str(e)}")
        logger.error(traceback.format_exc())
        return "ROUTE_TO_HUMAN"


@router.websocket("/ws/support/{session_id}")
async def support_websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    role: str = Query("user")
):
    """
    WebSocket endpoint handling active RAG queries and real-time takeover interactions.
    """
    role = role.lower()
    if role not in ["user", "admin"]:
        await websocket.close(code=4000, reason="Invalid role parameter")
        return

    # ─────────────────────────────────────────────────────────────────────────
    # HANDLE USER SESSION SOCKET
    # ─────────────────────────────────────────────────────────────────────────
    if role == "user":
        await manager.connect_user(session_id, websocket)
        try:
            while True:
                # Receive message payload from the client
                try:
                    data = await websocket.receive_json()
                    user_query = data.get("message") or data.get("text") or ""
                except ValueError:
                    # Fallback to plain text string
                    user_query = await websocket.receive_text()

                if not user_query.strip():
                    continue

                # Wrap the entire processing logic inside a container try/except block
                # to prevent unexpected RAG/network exceptions from terminating the WebSocket
                try:
                    session_state = manager.get_session_state(session_id)

                    if session_state == "pending_human":
                        # Bot is silenced, bypass RAG entirely and forward payload to admins
                        await manager.broadcast_to_admins({
                            "event": "USER_MESSAGE",
                            "session_id": session_id,
                            "message": user_query
                        })
                    else:
                        # Session is 'bot_active'
                        bot_response = await query_support_rag(user_query)

                        if bot_response.strip() == "ROUTE_TO_HUMAN":
                            # Mutate state to pending_human, silencing the bot
                            manager.set_session_state(session_id, "pending_human")
                            
                            # Inform user of takeover request status
                            await websocket.send_json({
                                "sender": "system",
                                "status": "escalated",
                                "message": "CONNECTING_TO_HUMAN_AGENT"
                            })
                            
                            # Notify active admins of takeover request
                            await manager.broadcast_to_admins({
                                "event": "NEW_TICKET",
                                "session_id": session_id,
                                "preview": user_query
                            })
                        else:
                            # Return bot answer back to the user
                            await websocket.send_json({
                                "sender": "bot",
                                "message": bot_response
                            })
                except Exception as inner_err:
                    logger.error(f"Error handling message inside user loop: {str(inner_err)}")
                    logger.error(traceback.format_exc())
                    try:
                        await websocket.send_json({
                            "sender": "system",
                            "message": "Processing error..."
                        })
                    except Exception:
                        # If the socket is already broken, propagate exception to trigger disconnect cleanup
                        raise

        except WebSocketDisconnect:
            manager.disconnect_user(session_id)
            await manager.broadcast_to_admins({
                "event": "USER_DISCONNECTED",
                "session_id": session_id
            })

    # ─────────────────────────────────────────────────────────────────────────
    # HANDLE ADMIN INTERCEPT SOCKET
    # ─────────────────────────────────────────────────────────────────────────
    elif role == "admin":
        await manager.connect_admin(session_id, websocket)
        try:
            while True:
                try:
                    data = await websocket.receive_json()
                except Exception:
                    # Handle structural format issues gracefully
                    continue
                
                target_session_id = data.get("target_session_id") or data.get("session_id")
                admin_text = data.get("message") or data.get("text")

                if target_session_id and admin_text:
                    user_socket = manager.user_connections.get(target_session_id)
                    if user_socket:
                        await user_socket.send_json({
                            "sender": "admin",
                            "message": admin_text
                        })
                        # Log administrative action
                        logger.info(f"Admin message forwarded successfully to session {target_session_id}")
                    else:
                        # Inform admin if target user went offline
                        await websocket.send_json({
                            "sender": "system",
                            "error": "USER_OFFLINE",
                            "session_id": target_session_id
                        })

        except WebSocketDisconnect:
            manager.disconnect_admin(session_id)
