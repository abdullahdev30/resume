# backend/app/integrations/brevo.py
import httpx

from app.core.config import settings


class BrevoEmailError(Exception):
    """Raised when Brevo rejects an email request."""


class BrevoEmailService:
    @staticmethod
    async def send_email(to_email: str, subject: str, html_content: str):
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": getattr(settings, "BREVO_API_KEY", ""),
            "content-type": "application/json",
        }
        payload = {
            "sender": {
                "name": getattr(settings, "EMAILS_FROM_NAME", "App"),
                "email": getattr(settings, "EMAILS_FROM_EMAIL", "no-reply@domain.com"),
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code >= 400:
                raise BrevoEmailError("Failed to send email via Brevo.")
            return response.json()
