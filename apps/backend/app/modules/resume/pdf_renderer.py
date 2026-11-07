"""HTML source + deterministic PDF derivatives. Structured data stays editable."""

import asyncio
import re
import subprocess
import sys
from html import escape, unescape
from pathlib import Path
from weakref import WeakKeyDictionary

import bleach
from bleach.css_sanitizer import CSSSanitizer

PAGE_SIZES = {
    "A4": (210, 297),
    "A3": (297, 420),
    "Executive": (184.15, 266.7),
    "Letter": (215.9, 279.4),
    "Legal": (215.9, 355.6),
    "A5": (148, 210),
    "B5": (176, 250),
    "Tabloid": (279.4, 431.8),
}
CSS_PROPERTIES = frozenset(
    [
        "color",
        "background",
        "background-color",
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "font-variant",
        "text-decoration",
        "text-align",
        "text-transform",
        "text-indent",
        "letter-spacing",
        "word-spacing",
        "line-height",
        "white-space",
        "overflow",
        "overflow-wrap",
        "word-break",
        "display",
        "width",
        "min-width",
        "max-width",
        "height",
        "min-height",
        "max-height",
        "margin",
        "margin-top",
        "margin-bottom",
        "margin-left",
        "margin-right",
        "padding",
        "padding-top",
        "padding-bottom",
        "padding-left",
        "padding-right",
        "border",
        "border-top",
        "border-bottom",
        "border-left",
        "border-right",
        "border-color",
        "border-style",
        "border-width",
        "border-radius",
        "box-sizing",
        "vertical-align",
        "list-style-type",
        "list-style-position",
        "flex",
        "flex-flow",
        "flex-direction",
        "flex-wrap",
        "flex-grow",
        "flex-shrink",
        "flex-basis",
        "align-items",
        "align-content",
        "align-self",
        "justify-content",
        "gap",
        "column-gap",
        "row-gap",
        "grid-template-columns",
        "grid-area",
        "grid-column",
        "grid-row",
        "break-before",
        "break-after",
        "break-inside",
        "page-break-before",
        "page-break-after",
        "page-break-inside",
        "inset",
        "position",
        "top",
        "bottom",
        "left",
        "right",
        "float",
        "clear",
        "object-fit",
        "transform",
        "transform-origin",
        "z-index",
    ]
)


class ResolvedCSSSanitizer(CSSSanitizer):
    def sanitize_css(self, style: str) -> str:
        # Bleach's HTML tokenizer retains entities in style attributes. CSS
        # parsers need the decoded quotes or a font-family string consumes the
        # following declarations, silently destroying layout and typography.
        return super().sanitize_css(unescape(style))


def sanitize_fragment(fragment: str) -> str:
    fragment = re.sub(
        r"<(script|iframe|object|embed)\b[^>]*>.*?</\1\s*>",
        "",
        fragment,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return bleach.clean(
        fragment,
        tags={
            "div",
            "span",
            "p",
            "h1",
            "h2",
            "h3",
            "h4",
            "section",
            "article",
            "header",
            "footer",
            "main",
            "aside",
            "ul",
            "ol",
            "li",
            "br",
            "hr",
            "strong",
            "em",
            "b",
            "i",
            "u",
            "s",
            "a",
            "img",
            "label",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
        },
        attributes={
            "*": ["style", "class"],
            "a": ["href"],
            "img": ["src", "alt", "width", "height"],
        },
        protocols={"http", "https", "mailto", "tel", "data"},
        strip=True,
        css_sanitizer=ResolvedCSSSanitizer(allowed_css_properties=CSS_PROPERTIES),
    )


def document_html(fragment: str, data: dict, title: str) -> str:
    import tinycss2

    sanitizer = ResolvedCSSSanitizer(allowed_css_properties=CSS_PROPERTIES)
    css = []
    for block in re.findall(
        r"<style\b[^>]*>(.*?)</style\s*>", fragment, re.IGNORECASE | re.DOTALL
    ):
        for rule in tinycss2.parse_stylesheet(
            block[:2_500_000], skip_comments=True, skip_whitespace=True
        ):
            if rule.type == "qualified-rule":
                css.append(
                    tinycss2.serialize(rule.prelude)
                    + "{"
                    + sanitizer.sanitize_css(tinycss2.serialize(rule.content))
                    + "}"
                )
            elif (
                rule.type == "at-rule"
                and rule.lower_at_keyword == "font-face"
                and rule.content
            ):
                declarations = tinycss2.parse_declaration_list(
                    rule.content, skip_comments=True, skip_whitespace=True
                )
                allowed = {"font-family", "font-style", "font-weight", "src"}
                safe = []
                for declaration in declarations:
                    if (
                        declaration.type != "declaration"
                        or declaration.lower_name not in allowed
                    ):
                        continue
                    value = tinycss2.serialize(declaration.value)
                    if declaration.lower_name == "src" and not re.fullmatch(
                        r"url\([\"\']?data:font/woff2;base64,[A-Za-z0-9+/=]+[\"\']?\)\s*format\([\"\']woff2[\"\']\)",
                        value.strip(),
                    ):
                        continue
                    safe.append(f"{declaration.lower_name}:{value}")
                if any(value.startswith("src:") for value in safe):
                    css.append("@font-face{" + ";".join(safe) + "}")
    fragment = re.sub(
        r"<style\b[^>]*>.*?</style\s*>", "", fragment, flags=re.IGNORECASE | re.DOTALL
    )
    fragment = re.sub(
        r"<head\b[^>]*>.*?</head\s*>", "", fragment, flags=re.IGNORECASE | re.DOTALL
    )
    width, height = PAGE_SIZES.get(data.get("pageSize", "A4"), PAGE_SIZES["A4"])
    if data.get("pageSize") == "Custom":
        width = max(50, min(1200, float(data.get("pageWidth") or 210)))
        height = max(50, min(1200, float(data.get("pageHeight") or 297)))
    if data.get("pageOrientation") == "landscape":
        width, height = height, width
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{escape(title)}</title>
<style>{"".join(css).replace("</", "< /")} @page {{ size: {width}mm {height}mm; margin: 0; }}
html,body {{ margin:0; padding:0; }} * {{ box-sizing:border-box; }}
.resume-page {{ break-after:page; height:{height}mm !important; min-height:{height}mm; max-height:{height}mm !important; overflow:hidden !important; }}
.resume-page:last-child {{ break-after:auto; }} h1,h2,h3 {{ break-after:avoid; }} p,li {{ orphans:2; widows:2; }}
img {{ max-width:100%; }} a {{ color:inherit; }} </style></head><body>{sanitize_fragment(fragment)}</body></html>"""


class PdfRenderer:
    _slots = WeakKeyDictionary()

    async def render(self, html: str) -> bytes:
        loop = asyncio.get_running_loop()
        slots = self._slots.setdefault(loop, asyncio.Semaphore(2))
        async with slots:
            return await self._render_process(html)

    async def _render_process(self, html: str) -> bytes:
        import json

        process = await asyncio.to_thread(
            subprocess.Popen,
            [sys.executable, "-m", "app.modules.resume.pdf_worker"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(Path(__file__).resolve().parents[3]),
        )
        try:
            stdout, _stderr = await asyncio.wait_for(
                asyncio.to_thread(
                    process.communicate,
                    json.dumps({"html": html}, ensure_ascii=False).encode(),
                ),
                timeout=40,
            )
        except BaseException:
            process.kill()
            await asyncio.to_thread(process.wait)
            raise
        if process.returncode or not stdout.startswith(b"%PDF-"):
            raise RuntimeError(
                "PDF rendering failed. Check WeasyPrint/Pango installation."
            )
        if len(stdout) > 10 * 1024 * 1024:
            raise ValueError("Generated PDF exceeds 10 MB.")
        return stdout

    @staticmethod
    def extract(pdf: bytes) -> tuple[str, str]:
        import base64
        import json

        result = subprocess.run(
            [sys.executable, "-m", "app.modules.resume.pdf_worker"],
            input=json.dumps(
                {"operation": "extract", "pdf": base64.b64encode(pdf).decode()}
            ).encode(),
            capture_output=True,
            timeout=40,
            cwd=str(Path(__file__).resolve().parents[3]),
            check=False,
        )
        if result.returncode:
            raise ValueError("The PDF could not be extracted.")
        extracted = json.loads(result.stdout)
        return sanitize_fragment(extracted["html"]), extracted["text"]
