"""Bounded subprocess entry point; never fetch network or local file resources."""

import base64
import json
import os
import sys
from pathlib import Path


def main():
    if os.name == "nt":
        runtime = Path(__file__).resolve().parents[3] / ".runtime" / "weasyprint"
        directories = set(
            os.environ.get("WEASYPRINT_DLL_DIRECTORIES", "").split(os.pathsep)
        ) - {""}
        if runtime.exists():
            directories.update(
                str(path.parent) for path in runtime.rglob("*pango*.dll")
            )
        _dll_handles = [
            os.add_dll_directory(path) for path in directories if Path(path).is_dir()
        ]
    else:
        import resource

        resource.setrlimit(resource.RLIMIT_CPU, (35, 35))
        resource.setrlimit(resource.RLIMIT_AS, (1024 * 1024 * 1024, 1024 * 1024 * 1024))

    import pymupdf

    request = json.loads(sys.stdin.buffer.read(18_000_000))
    if request.get("operation") == "extract":
        import pymupdf

        pdf = base64.b64decode(request["pdf"], validate=True)
        if len(pdf) > 10 * 1024 * 1024:
            raise ValueError("PDF exceeds 10 MB.")
        with pymupdf.open(stream=pdf, filetype="pdf") as document:
            if document.needs_pass or document.page_count > 50:
                raise ValueError("Only unencrypted PDFs up to 50 pages are supported.")
            html_parts, text_parts = [], []
            size = 0
            for page in document:
                html = page.get_text(
                    "html", flags=pymupdf.TEXTFLAGS_HTML & ~pymupdf.TEXT_PRESERVE_IMAGES
                )
                size += len(html)
                if size > 5_000_000:
                    raise ValueError("Extracted HTML is too large.")
                html_parts.append(html)
                text_parts.append(page.get_text(sort=True))
        sys.stdout.write(
            json.dumps(
                {"html": "".join(html_parts), "text": "\n".join(text_parts)[:100_000]}
            )
        )
        return

    from weasyprint import HTML
    from weasyprint.urls import URLFetcher, URLFetcherResponse

    class EmbeddedImagesOnly(URLFetcher):
        def fetch(self, url, headers=None):
            if not url.startswith(
                (
                    "data:image/png;base64,",
                    "data:image/jpeg;base64,",
                    "data:image/webp;base64,",
                    "data:font/woff2;base64,",
                )
            ):
                raise ValueError(
                    "Only embedded raster images and fonts are allowed in resume PDFs."
                )
            header, encoded = url.split(",", 1)
            data = base64.b64decode(encoded, validate=True)
            if len(data) > 2 * 1024 * 1024:
                raise ValueError("Embedded image is too large.")
            if header.startswith("data:font/") and not data.startswith(b"wOF2"):
                raise ValueError("Invalid embedded font.")
            return URLFetcherResponse(
                url, data, {"Content-Type": header[5:].split(";")[0]}
            )

    pdf = HTML(string=request["html"], url_fetcher=EmbeddedImagesOnly()).write_pdf(
        optimize_images=True,
        jpeg_quality=85,
        dpi=144,
    )
    with pymupdf.open(stream=pdf, filetype="pdf") as document:
        if document.page_count > 50:
            raise ValueError("Resume is limited to 50 pages.")
        pdf = document.tobytes(garbage=3, deflate=True, use_objstms=1)
    sys.stdout.buffer.write(pdf)


if __name__ == "__main__":
    main()
