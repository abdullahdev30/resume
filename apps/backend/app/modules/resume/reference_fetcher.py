import asyncio
import html
import ipaddress
import logging
import re
import socket
from urllib.parse import urljoin, urlsplit

import httpx

logger = logging.getLogger(__name__)

MAX_REFERENCE_BYTES = 200 * 1024
MAX_REDIRECTS = 3
ALLOWED_TEXT_TYPES = ("text/", "application/json", "application/xhtml+xml")


class UnsafeReferenceURL(ValueError):
    pass


async def fetch_reference_texts(urls: list[str]) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    async with httpx.AsyncClient(timeout=5.0) as client:
        for url in urls:
            try:
                text, resolved_url = await _fetch_one(client, url)
                results.append({"url": resolved_url, "text": text})
            except (UnsafeReferenceURL, httpx.HTTPError, ValueError) as exc:
                logger.warning("Reference fetch skipped url=%s reason=%s", url, exc)
    return results


async def _fetch_one(client: httpx.AsyncClient, url: str) -> tuple[str, str]:
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        await _validate_public_url(current)
        async with client.stream(
            "GET",
            current,
            follow_redirects=False,
            headers={"User-Agent": "ResumeBuilderReferenceFetcher/1.0"},
        ) as response:
            if response.status_code in {301, 302, 303, 307, 308}:
                location = response.headers.get("location")
                if not location:
                    raise ValueError("Redirect response has no location.")
                current = urljoin(current, location)
                continue
            response.raise_for_status()
            content_type = response.headers.get("content-type", "").lower()
            if not any(content_type.startswith(value) for value in ALLOWED_TEXT_TYPES):
                raise ValueError("Reference is not a text response.")
            body = bytearray()
            async for chunk in response.aiter_bytes():
                body.extend(chunk)
                if len(body) > MAX_REFERENCE_BYTES:
                    raise ValueError("Reference exceeds the 200 KB limit.")
            return _plain_text(bytes(body).decode(response.encoding or "utf-8", errors="replace")), current
    raise ValueError("Reference redirected too many times.")


async def _validate_public_url(url: str) -> None:
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise UnsafeReferenceURL("Only absolute HTTP and HTTPS URLs are allowed.")
    if parsed.username or parsed.password:
        raise UnsafeReferenceURL("URLs containing credentials are not allowed.")
    host = parsed.hostname.casefold()
    if host == "localhost" or host.endswith(".localhost"):
        raise UnsafeReferenceURL("Loopback hosts are not allowed.")
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    addresses = await asyncio.to_thread(
        socket.getaddrinfo,
        parsed.hostname,
        port,
        type=socket.SOCK_STREAM,
    )
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            raise UnsafeReferenceURL("Private, loopback, link-local, and reserved addresses are blocked.")


def _plain_text(value: str) -> str:
    value = re.sub(r"<(script|style|noscript)\b[^>]*>.*?</\1>", " ", value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()[:50_000]
