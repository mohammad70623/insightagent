import smtplib
import logging
import asyncio
from email.message import EmailMessage
from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_send(msg: EmailMessage):
    """Blocking SMTP send – runs in a thread via asyncio.to_thread."""
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)

async def send_otp_email(to_email: str, otp_code: str, purpose: str):
    """
    Sends a beautifully formatted HTML email containing the cryptographic OTP code.
    In DEV_MODE the email is skipped and the OTP is printed to the console instead.
    """
    if settings.DEV_MODE:
        logger.warning(
            f"[DEV_MODE] Skipping real email. OTP for {to_email} ({purpose}): {otp_code}"
        )
        print(f"\n{'='*60}")
        print(f"  [DEV_MODE] OTP for {to_email} | purpose={purpose}")
        print(f"  Code: {otp_code}  (or use master OTP: {settings.MASTER_OTP})")
        print(f"{'='*60}\n")
        return

    try:
        msg = EmailMessage()
        msg["Subject"] = f"InsightAgent: Your {purpose.capitalize()} Verification Code"
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
                        <p class="otp-code">{otp_code}</p>
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
        logger.info(f"Successfully dispatched {purpose} OTP to {to_email}")
    except Exception as e:
        logger.error(f"SMTP failure – could not send OTP to {to_email}: {e}", exc_info=True)
        # Re-raise so the caller knows the email didn't go out.
        raise

async def send_password_reset_email(to_email: str, reset_token: str):
    """
    Sends an HTML email with a secure link to reset the user's password.
    In DEV_MODE the link is printed to the console instead.
    """
    reset_link = f"http://localhost:5173/reset-password?token={reset_token}"

    if settings.DEV_MODE:
        logger.warning(f"[DEV_MODE] Skipping real email. Password reset link for {to_email}: {reset_link}")
        print(f"\n{'='*60}")
        print(f"  [DEV_MODE] Reset link for {to_email}")
        print(f"  {reset_link}")
        print(f"{'='*60}\n")
        return

    try:
        msg = EmailMessage()
        msg["Subject"] = "🔑 Action Required: Reset Your InsightAgent Password"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"

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
        logger.error(f"SMTP failure – could not send password reset email to {to_email}: {e}", exc_info=True)
        raise
