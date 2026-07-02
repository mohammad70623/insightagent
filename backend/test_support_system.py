#!/usr/bin/env python
"""
InsightAgent Enterprise AI Engine
Support System Integration Test Script (test_support_system.py)

This script automates testing of the FastAPI WebSocket handler and live human takeover layer.
It connects two concurrent client sockets:
  1. A client representing the User (role=user)
  2. A client representing the Admin (role=admin)
It runs automated scenarios verifying bot answers, takeover triggers, and direct admin chatting.

Author: Senior QA Automation Engineer
"""

import asyncio
import json
import sys
import argparse
import websockets


# Global queues to receive messages in background tasks
admin_messages = asyncio.Queue()
user_messages = asyncio.Queue()


async def admin_receiver(ws):
    """Listens in the background for payloads pushed to the Admin socket."""
    try:
        async for message in ws:
            data = json.loads(message)
            print(f"[Admin Socket Incoming] {data}")
            await admin_messages.put(data)
    except websockets.exceptions.ConnectionClosed:
        print("[Admin Socket Incoming] Connection closed.")
    except Exception as e:
        print(f"[Admin Socket Incoming] Error: {e}")


async def user_receiver(ws):
    """Listens in the background for payloads pushed to the User socket."""
    try:
        async for message in ws:
            data = json.loads(message)
            print(f"[User Socket Incoming] {data}")
            await user_messages.put(data)
    except websockets.exceptions.ConnectionClosed:
        print("[User Socket Incoming] Connection closed.")
    except Exception as e:
        print(f"[User Socket Incoming] Error: {e}")


async def run_tests():
    # 1. Parse Arguments
    parser = argparse.ArgumentParser(description="InsightAgent Live Takeover WebSocket Test Client.")
    parser.add_argument(
        "--host",
        type=str,
        default="localhost:8000",
        help="FastAPI running server host and port (default: localhost:8000)."
    )
    parser.add_argument(
        "--prefix",
        type=str,
        default="/api/v1",
        help="API version prefix. Use empty string '' if no prefix is set (default: /api/v1)."
    )
    args = parser.parse_args()

    session_id = "test_sync_session_99"
    admin_url = f"ws://{args.host}{args.prefix}/ws/support/{session_id}?role=admin"
    user_url = f"ws://{args.host}{args.prefix}/ws/support/{session_id}?role=user"

    print("================================================================================")
    print("                    STARTING SUPPORT WS INTEGRATION TESTS                       ")
    print("================================================================================")
    print(f"Connecting Support Admin socket to: {admin_url}")
    print(f"Connecting Client User socket to  : {user_url}")
    print("────────────────────────────────────────────────────────────────────────────────")

    try:
        async with websockets.connect(admin_url) as admin_ws, \
                   websockets.connect(user_url) as user_ws:

            # Start listener loops in the background
            admin_task = asyncio.create_task(admin_receiver(admin_ws))
            user_task = asyncio.create_task(user_receiver(user_ws))

            # Allow connections to negotiate handshake
            await asyncio.sleep(0.5)

            # =========================================================================
            # TEST CASE 1: Valid Bot Response
            # =========================================================================
            print("\n[TEST CASE 1] Testing static support RAG bot responses...")
            user_query_1 = "What file formats does InsightAgent support?"
            print(f"User sends: '{user_query_1}'")
            
            # Send message from user
            await user_ws.send(json.dumps({"message": user_query_1}))

            # Expect bot payload response
            try:
                user_res = await asyncio.wait_for(user_messages.get(), timeout=8.0)
                assert user_res.get("sender") == "bot", f"Expected 'bot' sender, got: {user_res.get('sender')}"
                assert "message" in user_res, "Expected 'message' field in bot payload response"
                assert len(user_res["message"].strip()) > 0, "Expected non-empty bot answer"
                print(f"-> User received Bot response: '{user_res['message'][:65]}...'")
            except asyncio.TimeoutError:
                print("❌ TEST CASE 1 FAILED: Timeout waiting for RAG bot response.")
                sys.exit(1)
            except AssertionError as ae:
                print(f"❌ TEST CASE 1 FAILED: Assertion failed: {str(ae)}")
                sys.exit(1)

            # Assert Admin received 0 messages
            if not admin_messages.empty():
                print("❌ TEST CASE 1 FAILED: Admin received unexpected messages.")
                sys.exit(1)
            print("-> Admin received: 0 alerts (Correct: Static Bot handled query successfully).")
            print("🟢 Test Case 1: PASSED (Bot Retrieval Active)")

            # =========================================================================
            # TEST CASE 2: Human Takeover Trigger
            # =========================================================================
            print("\n[TEST CASE 2] Testing escalations and takeover triggers...")
            user_query_2 = "I need a full financial refund immediately"
            print(f"User sends: '{user_query_2}'")

            # Send escalation prompt
            await user_ws.send(json.dumps({"message": user_query_2}))

            # Assert User receives system redirection event
            try:
                user_res = await asyncio.wait_for(user_messages.get(), timeout=8.0)
                assert user_res.get("sender") == "system", f"Expected 'system' sender, got: {user_res.get('sender')}"
                assert user_res.get("status") == "escalated", f"Expected 'escalated' status, got: {user_res.get('status')}"
                assert user_res.get("message") == "CONNECTING_TO_HUMAN_AGENT", f"Expected connecting text, got: {user_res.get('message')}"
                print("-> User received: Redirect payload 'CONNECTING_TO_HUMAN_AGENT' (Correct).")
            except asyncio.TimeoutError:
                print("❌ TEST CASE 2 FAILED: Timeout waiting for User escalation redirection.")
                sys.exit(1)
            except AssertionError as ae:
                print(f"❌ TEST CASE 2 FAILED: Assertion failed: {str(ae)}")
                sys.exit(1)

            # Assert Admin receives live ticket notification alert
            try:
                admin_res = await asyncio.wait_for(admin_messages.get(), timeout=8.0)
                assert admin_res.get("event") == "NEW_TICKET", f"Expected 'NEW_TICKET' event, got: {admin_res.get('event')}"
                assert admin_res.get("session_id") == session_id, f"Expected session '{session_id}', got: {admin_res.get('session_id')}"
                assert "preview" in admin_res, "Expected 'preview' field inside ticket event"
                print(f"-> Admin received: NEW_TICKET alert payload for session '{session_id}' (Correct).")
            except asyncio.TimeoutError:
                print("❌ TEST CASE 2 FAILED: Timeout waiting for Admin ticket alert.")
                sys.exit(1)
            except AssertionError as ae:
                print(f"❌ TEST CASE 2 FAILED: Assertion failed: {str(ae)}")
                sys.exit(1)

            print("🟢 Test Case 2: PASSED (Escalation Framework Active)")

            # =========================================================================
            # TEST CASE 3: Direct Admin Chat Takeover
            # =========================================================================
            print("\n[TEST CASE 3] Testing live Admin intercept takeover...")
            admin_msg_text = "Hello, I am a live support agent. I can help process your refund request."
            print(f"Admin sends target payload: '{admin_msg_text}'")

            # Admin sends chat message targeted at session user
            await admin_ws.send(json.dumps({
                "target_session_id": session_id,
                "message": admin_msg_text
            }))

            # Assert User receives this direct message from Admin (Bot should be silenced)
            try:
                user_res = await asyncio.wait_for(user_messages.get(), timeout=8.0)
                assert user_res.get("sender") == "admin", f"Expected 'admin' sender, got: {user_res.get('sender')}"
                assert user_res.get("message") == admin_msg_text, f"Expected message match, got: {user_res.get('message')}"
                print(f"-> User received direct Admin response: '{user_res['message']}' (Correct).")
            except asyncio.TimeoutError:
                print("❌ TEST CASE 3 FAILED: Timeout waiting for Admin takeover message on User channel.")
                sys.exit(1)
            except AssertionError as ae:
                print(f"❌ TEST CASE 3 FAILED: Assertion failed: {str(ae)}")
                sys.exit(1)

            print("🟢 Test Case 3: PASSED (Admin Direct Takeover Active)")

            # Cancel background threads cleanly
            admin_task.cancel()
            user_task.cancel()

            print("\n================================================================================")
            print("                       AUTOMATED WS TEST RUN SUMMARY                            ")
            print("================================================================================")
            print("  🟢 Test Case 1: PASSED (Bot Retrieval Active)")
            print("  🟢 Test Case 2: PASSED (Escalation Framework Active)")
            print("  🟢 Test Case 3: PASSED (Admin Direct Takeover Active)")
            print("================================================================================")

    except ConnectionRefusedError:
        print("\n❌ CRITICAL CONNECTION REFUSED")
        print(f"Ensure the FastAPI server is running on http://{args.host}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED TEST FAILURE: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_tests())
