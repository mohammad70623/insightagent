import logging
import asyncio
from email.message import EmailMessage
from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_send(msg):
    """Sends email via Brevo HTTP API using robust environment variable loading."""
    import os
    import requests
    from pathlib import Path
    from dotenv import load_dotenv

    base_dir = Path(__file__).resolve().parent.parent.parent  # backend/
    env_path = base_dir / '.env'
    load_dotenv(dotenv_path=env_path)

    api_key = os.getenv("BREVO_API_KEY")

    # Debug line - remove once everything works
    print(f"DEBUG: env_path={env_path}, exists={env_path.exists()}, key_loaded={'YES (len=' + str(len(api_key)) + ')' if api_key else 'NO'}")

    if not api_key:
        error_msg = f"BREVO_API_KEY is missing! Path checked: {env_path}"
        print(f"🔴 SMTP Direct Failure: {error_msg}")
        raise Exception(error_msg)

    try:
        target_email = msg.get("To") or msg["to"]
        subject = msg.get("Subject") or msg["subject"]
    except Exception:
        target_email = getattr(msg, "to", "")
        subject = getattr(msg, "subject", "OTP Verification")

    # Extract HTML content safely
    html_content = ""
    try:
        if hasattr(msg, "is_multipart") and msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    html_content = part.get_payload(decode=True).decode()
        else:
            if hasattr(msg, "get_payload"):
                payload = msg.get_payload(decode=True)
                html_content = payload.decode() if payload else str(msg)
            else:
                html_content = str(msg)
    except Exception:
        html_content = "Your OTP Verification Code"

    # Brevo v3 REST API Setup
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key.strip(),
        "content-type": "application/json"
    }

    payload = {
        "sender": {
            "name": "InsightAgent",
            "email": "mohammad70623@gmail.com"
        },
        "to": [
            {
                "email": str(target_email).strip()
            }
        ],
        "subject": str(subject),
        "htmlContent": str(html_content)
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in [200, 201, 202]:
            print(f"✅ OTP Email successfully sent via Brevo to {target_email}")
        else:
            error_msg = f"Brevo API Failure: {response.status_code} - {response.text}"
            print(f"🔴 {error_msg}")
            raise Exception(error_msg)
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error connecting to Brevo API: {str(e)}"
        print(f"🔴 {error_msg}")
        raise Exception(error_msg)


async def send_otp_email(to_email: str, otp_code: str, purpose: str):
    """
    Sends a beautifully formatted HTML email containing the cryptographic OTP code.
    """
    async def _send_otp_email_authentic(email, generated_otp):
        msg = EmailMessage()
        msg["Subject"] = f"InsightAgent: Your {purpose.capitalize()} Verification Code"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #0B0F19;
                    color: #ffffff;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    background-color: #0B0F19;
                }}
                .header {{
                    text-align: left;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 30px;
                }}
                .title {{
                    font-size: 24px;
                    font-weight: 800;
                    margin: 0;
                    color: #ffffff;
                    letter-spacing: -0.5px;
                }}
                .subtitle {{
                    font-size: 10px;
                    color: #818CF8;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-family: monospace;
                    margin-top: 5px;
                }}
                .content {{
                    background-color: #111827;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 40px;
                    text-align: center;
                }}
                .text-body {{
                    font-size: 14px;
                    color: #9CA3AF;
                    line-height: 1.6;
                    margin-bottom: 25px;
                }}
                .otp-box {{
                    background-color: #000000;
                    border: 1px solid #818CF8;
                    border-radius: 8px;
                    padding: 20px;
                    display: inline-block;
                    margin-bottom: 20px;
                    box-shadow: 0 0 15px rgba(129,140,248,0.2);
                }}
                .otp-code {{
                    font-size: 32px;
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: 12px;
                    font-family: monospace;
                    margin: 0;
                    padding-left: 12px;
                }}
                .footer {{
                    margin-top: 40px;
                    text-align: center;
                    font-size: 11px;
                    color: #6B7280;
                }}
                .warning {{
                    color: #F87171;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">InsightAgent</h1>
                    <p class="subtitle">Enterprise AI Engine</p>
                </div>

                <div class="content">
                    <p class="text-body">
                        You have initiated a secure <strong>{purpose}</strong> request for your Enterprise AI workspace.<br>
                        Please use the following 6-digit cryptographic verification code to proceed:
                    </p>

                    <div class="otp-box">
                        <p class="otp-code">{generated_otp}</p>
                    </div>

                    <p class="text-body" style="font-size: 12px;">
                        This code will expire in 10 minutes. <br>
                        <span class="warning">If you did not request this, please contact your systems administrator immediately.</span>
                    </p>
                </div>

                <div class="footer">
                    <p>SOC2 Type II Certified Infrastructure • © 2026 InsightAgent AI Corp.</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.add_alternative(html_content, subtype="html")
        await asyncio.to_thread(_smtp_send, msg)
        logger.info(f"Successfully dispatched {purpose} OTP to {email}")

    try:
        email = to_email
        generated_otp = otp_code

        await _send_otp_email_authentic(email, generated_otp)
        print(f"🚀 [PRODUCTION] Real OTP email successfully fired to {email} via Brevo API.")
    except Exception as e:
        print(f"🔴 OTP Email Failure: {str(e)}")
        raise


async def send_password_reset_email(to_email: str, reset_token: str):
    """
    Sends an HTML email with a secure link to reset the user's password.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    try:
        msg = EmailMessage()
        msg["Subject"] = "🔑 Action Required: Reset Your InsightAgent Password"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #0B0F19;
                    color: #ffffff;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    background-color: #0B0F19;
                }}
                .header {{
                    text-align: left;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 30px;
                }}
                .title {{
                    font-size: 24px;
                    font-weight: 800;
                    margin: 0;
                    color: #ffffff;
                    letter-spacing: -0.5px;
                }}
                .subtitle {{
                    font-size: 10px;
                    color: #818CF8;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-family: monospace;
                    margin-top: 5px;
                }}
                .content {{
                    background-color: #111827;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 40px;
                    text-align: center;
                }}
                .text-body {{
                    font-size: 14px;
                    color: #9CA3AF;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }}
                .btn {{
                    background-color: #818CF8;
                    color: #000000;
                    padding: 14px 28px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 14px;
                    display: inline-block;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 15px rgba(129,140,248,0.3);
                }}
                .footer {{
                    margin-top: 40px;
                    text-align: center;
                    font-size: 11px;
                    color: #6B7280;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">InsightAgent</h1>
                    <p class="subtitle">Enterprise AI Engine</p>
                </div>

                <div class="content">
                    <p class="text-body">
                        We received a request to reset the password for your corporate identity channel.<br>
                        Click the secure button below to establish a new credential lock.
                    </p>

                    <a href="{reset_link}" class="btn">Reset Secure Password</a>

                    <p class="text-body" style="font-size: 12px; margin-bottom: 0;">
                        This link will safely expire in exactly 15 minutes.<br>
                        If you did not request a password reset, you can safely ignore this email.
                    </p>
                </div>

                <div class="footer">
                    <p>SOC2 Type II Certified Infrastructure • © 2026 InsightAgent AI Corp.</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.add_alternative(html_content, subtype="html")

        await asyncio.to_thread(_smtp_send, msg)
        logger.info(f"Successfully dispatched password reset email to {to_email}")
    except Exception as e:
        logger.error(f"Email failure – could not send password reset email to {to_email}: {e}", exc_info=True)
        raise