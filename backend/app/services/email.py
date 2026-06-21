import smtplib
import logging
import asyncio
from email.message import EmailMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_otp_email(to_email: str, otp_code: str, purpose: str):
    """
    Sends a beautifully formatted HTML email containing the cryptographic OTP code.
    """
    try:
        msg = EmailMessage()
        msg["Subject"] = f"InsightAgent: Your {purpose.capitalize()} Verification Code"
        msg["From"] = settings.SMTP_USER
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

        def _send():
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
                
        await asyncio.to_thread(_send)
        logger.info(f"Successfully dispatched {purpose} OTP to {to_email}")
    except Exception as e:
        logger.error(f"Failed to dispatch OTP email to {to_email}: {str(e)}")
