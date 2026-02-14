"""
Email Provider Abstraction for HWH Player Advantage™
Supports: mock (default) and ses (AWS SES)
"""
import os
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

# Email provider configuration
EMAIL_PROVIDER = os.environ.get('EMAIL_PROVIDER', 'mock')  # mock | ses

# AWS SES configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
SES_FROM_ADDRESS = os.environ.get('SES_FROM_ADDRESS', 'noreply@hoopwithher.com')


class EmailProvider(ABC):
    """Abstract base class for email providers."""
    
    @abstractmethod
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Send an email and return result with status."""
        pass
    
    def get_provider_name(self) -> str:
        """Return the provider name."""
        return self.__class__.__name__


class MockEmailProvider(EmailProvider):
    """Mock email provider - logs emails without sending."""
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Log email without actually sending."""
        message_id = f"mock-{uuid.uuid4()}"
        
        logger.info(f"""
╔══════════════════════════════════════════════════════════════╗
║                    [MOCK EMAIL SENT]                         ║
╠══════════════════════════════════════════════════════════════╣
║ To: {to_email}
║ Subject: {subject}
║ Reply-To: {reply_to or 'N/A'}
║ Tags: {tags or {}}
║ Message ID: {message_id}
╠══════════════════════════════════════════════════════════════╣
║ Body Preview:
║ {text_body[:200] if text_body else html_body[:200]}...
╚══════════════════════════════════════════════════════════════╝
        """)
        
        return {
            "success": True,
            "message_id": message_id,
            "provider": "mock",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


class SESEmailProvider(EmailProvider):
    """AWS SES email provider."""
    
    def __init__(self):
        import boto3
        from botocore.config import Config
        
        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
            raise ValueError("AWS credentials not configured for SES")
        
        config = Config(
            region_name=AWS_REGION,
            retries={'max_attempts': 3, 'mode': 'standard'}
        )
        
        self.client = boto3.client(
            'ses',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            config=config
        )
        self.from_address = SES_FROM_ADDRESS
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Send email via AWS SES."""
        try:
            # Build message
            message = {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'}
                }
            }
            
            if text_body:
                message['Body']['Text'] = {'Data': text_body, 'Charset': 'UTF-8'}
            
            # Build request
            request = {
                'Source': self.from_address,
                'Destination': {'ToAddresses': [to_email]},
                'Message': message
            }
            
            if reply_to:
                request['ReplyToAddresses'] = [reply_to]
            
            if tags:
                request['Tags'] = [{'Name': k, 'Value': v} for k, v in tags.items()]
            
            # Send email
            response = self.client.send_email(**request)
            message_id = response.get('MessageId', '')
            
            logger.info(f"[SES] Email sent successfully to {to_email}, MessageId: {message_id}")
            
            return {
                "success": True,
                "message_id": message_id,
                "provider": "ses",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"[SES] Failed to send email to {to_email}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "provider": "ses",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }


def get_email_provider() -> EmailProvider:
    """Factory function to get the configured email provider."""
    if EMAIL_PROVIDER == 'ses':
        try:
            return SESEmailProvider()
        except Exception as e:
            logger.warning(f"Failed to initialize SES provider: {e}. Falling back to mock.")
            return MockEmailProvider()
    else:
        return MockEmailProvider()


# Email templates
class EmailTemplates:
    """HTML email templates for HWH Player Advantage™."""
    
    BRAND_BLUE = "#0134bd"
    BRAND_ORANGE = "#fb6c1d"
    
    @staticmethod
    def base_template(content: str, title: str = "Hoop With Her") -> str:
        """Base email template with HWH branding."""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b0b; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0b0b;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #121212; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(to right, {EmailTemplates.BRAND_BLUE}, {EmailTemplates.BRAND_ORANGE}); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                HOOP WITH HER®
                            </h1>
                            <p style="margin: 5px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                                Player Advantage™
                            </p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            {content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0b0b0b; padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                            <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px;">
                                © {datetime.now().year} Hoop With Her. All rights reserved.
                            </p>
                            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.3); font-size: 11px;">
                                This email was sent by Hoop With Her Player Advantage™
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """
    
    @staticmethod
    def intake_confirmation(player_name: str, package: str, parent_name: str) -> tuple:
        """Email template for intake form confirmation."""
        content = f"""
            <h2 style="margin: 0 0 20px; color: white; font-size: 24px;">
                Submission Received!
            </h2>
            <p style="margin: 0 0 20px; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6;">
                Hi {parent_name},
            </p>
            <p style="margin: 0 0 20px; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6;">
                Thank you for registering <strong style="color: {EmailTemplates.BRAND_ORANGE};">{player_name}</strong> with Hoop With Her Player Advantage™.
            </p>
            <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px; color: rgba(255,255,255,0.6); font-size: 14px; text-transform: uppercase;">Package Selected</p>
                <p style="margin: 0; color: {EmailTemplates.BRAND_ORANGE}; font-size: 20px; font-weight: bold; text-transform: uppercase;">
                    {package.replace('_', ' ')}
                </p>
            </div>
            <h3 style="margin: 30px 0 15px; color: white; font-size: 18px;">What Happens Next</h3>
            <ol style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.8); line-height: 2;">
                <li>Our team will review your submission</li>
                <li>We'll begin creating your recruiting materials</li>
                <li>You'll receive your deliverables via email</li>
            </ol>
            <p style="margin: 30px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                Questions? Reply to this email or contact us at support@hoopwithher.com
            </p>
        """
        
        html = EmailTemplates.base_template(content, f"Submission Received - {player_name}")
        text = f"""
Submission Received!

Hi {parent_name},

Thank you for registering {player_name} with Hoop With Her Player Advantage™.

Package Selected: {package.replace('_', ' ')}

What Happens Next:
1. Our team will review your submission
2. We'll begin creating your recruiting materials
3. You'll receive your deliverables via email

Questions? Contact us at support@hoopwithher.com

© {datetime.now().year} Hoop With Her. All rights reserved.
        """
        
        return html, text
    
    @staticmethod
    def staff_notification(player_name: str, package: str, parent_email: str) -> tuple:
        """Email template for staff notification of new submission."""
        content = f"""
            <h2 style="margin: 0 0 20px; color: white; font-size: 24px;">
                New Player Submission
            </h2>
            <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; color: rgba(255,255,255,0.8);">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <strong>Player:</strong>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right; color: {EmailTemplates.BRAND_ORANGE};">
                            {player_name}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <strong>Package:</strong>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                            {package.replace('_', ' ').title()}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0;">
                            <strong>Parent Email:</strong>
                        </td>
                        <td style="padding: 10px 0; text-align: right;">
                            {parent_email}
                        </td>
                    </tr>
                </table>
            </div>
            <p style="margin: 20px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                Log in to the admin dashboard to view the full submission and begin processing.
            </p>
        """
        
        html = EmailTemplates.base_template(content, f"New Submission - {player_name}")
        text = f"""
New Player Submission

Player: {player_name}
Package: {package.replace('_', ' ').title()}
Parent Email: {parent_email}

Log in to the admin dashboard to view the full submission.

© {datetime.now().year} Hoop With Her. All rights reserved.
        """
        
        return html, text
    
    @staticmethod
    def coach_message_notification(sender_name: str, sender_school: str, subject: str, preview: str) -> tuple:
        """Email template for coach message notification."""
        content = f"""
            <h2 style="margin: 0 0 20px; color: white; font-size: 24px;">
                New Message from Coach
            </h2>
            <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px; color: {EmailTemplates.BRAND_ORANGE}; font-size: 18px; font-weight: bold;">
                    {sender_name}
                </p>
                <p style="margin: 0 0 15px; color: rgba(255,255,255,0.6); font-size: 14px;">
                    {sender_school}
                </p>
                <p style="margin: 0 0 10px; color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase;">
                    Subject
                </p>
                <p style="margin: 0 0 15px; color: white; font-size: 16px;">
                    {subject}
                </p>
                <p style="margin: 0 0 10px; color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase;">
                    Message Preview
                </p>
                <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.6;">
                    {preview[:300]}{'...' if len(preview) > 300 else ''}
                </p>
            </div>
            <p style="margin: 20px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                Log in to the admin dashboard to view and respond to this message.
            </p>
        """
        
        html = EmailTemplates.base_template(content, f"New Coach Message - {subject}")
        text = f"""
New Message from Coach

From: {sender_name}
School: {sender_school}
Subject: {subject}

{preview[:300]}{'...' if len(preview) > 300 else ''}

Log in to respond to this message.

© {datetime.now().year} Hoop With Her. All rights reserved.
        """
        
        return html, text
    
    @staticmethod
    def coach_to_coach_message(sender_name: str, sender_school: str, subject: str, message: str, player_name: Optional[str] = None) -> tuple:
        """Email template for coach-to-coach message."""
        player_section = ""
        if player_name:
            player_section = f"""
                <div style="background-color: rgba(251,108,29,0.1); border-left: 3px solid {EmailTemplates.BRAND_ORANGE}; padding: 10px 15px; margin: 15px 0;">
                    <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px;">Regarding Player</p>
                    <p style="margin: 5px 0 0; color: {EmailTemplates.BRAND_ORANGE}; font-weight: bold;">{player_name}</p>
                </div>
            """

        content = f"""
            <h2 style="margin: 0 0 20px; color: white; font-size: 24px;">
                Message from {sender_name}
            </h2>
            <p style="margin: 0 0 5px; color: rgba(255,255,255,0.6); font-size: 14px;">
                {sender_school}
            </p>
            {player_section}
            <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 15px; color: white; font-size: 16px; font-weight: bold;">
                    {subject}
                </p>
                <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.8; white-space: pre-wrap;">
                    {message}
                </p>
            </div>
            <p style="margin: 20px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                Log in to the Coach Portal to respond.
            </p>
        """

        html = EmailTemplates.base_template(content, f"Message from {sender_name}")
        text = f"""
Message from {sender_name}
{sender_school}
{'Regarding: ' + player_name if player_name else ''}

Subject: {subject}

{message}

Log in to the Coach Portal to respond.

© {datetime.now().year} Hoop With Her. All rights reserved.
        """

        return html, text

    @staticmethod
    def password_reset(reset_url: str, user_name: Optional[str] = None) -> tuple:
        """Email template for password reset."""
        greeting = f"Hi {user_name}," if user_name else "Hi there,"

        content = f"""
            <h2 style="margin: 0 0 20px; color: white; font-size: 24px;">
                Reset Your Password
            </h2>
            <p style="margin: 0 0 20px; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6;">
                {greeting}
            </p>
            <p style="margin: 0 0 20px; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your Hoop With Her Player Advantage™ account.
                Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background: linear-gradient(to right, {EmailTemplates.BRAND_BLUE}, {EmailTemplates.BRAND_ORANGE}); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="margin: 20px 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                Or copy and paste this link into your browser:
            </p>
            <p style="margin: 0 0 20px; color: rgba(255,255,255,0.4); font-size: 12px; word-break: break-all;">
                {reset_url}
            </p>
            <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                    <strong style="color: rgba(255,255,255,0.8);">Didn't request this?</strong><br>
                    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
            </div>
            <p style="margin: 30px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">
                This link will expire in 1 hour for security reasons.
            </p>
        """

        html = EmailTemplates.base_template(content, "Reset Your Password - Hoop With Her")
        text = f"""
Reset Your Password

{greeting}

We received a request to reset your password for your Hoop With Her Player Advantage™ account.

Click the link below to set a new password:
{reset_url}

Didn't request this?
If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

This link will expire in 1 hour for security reasons.

© {datetime.now().year} Hoop With Her. All rights reserved.
        """

        return html, text


# Global email provider instance
_email_provider: Optional[EmailProvider] = None


def get_provider() -> EmailProvider:
    """Get or create the global email provider instance."""
    global _email_provider
    if _email_provider is None:
        _email_provider = get_email_provider()
    return _email_provider
