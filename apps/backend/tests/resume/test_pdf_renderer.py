import pymupdf
import pytest

from app.modules.resume.pdf_renderer import PAGE_SIZES, PdfRenderer, document_html


@pytest.mark.asyncio
async def test_quoted_font_families_preserve_following_layout_declarations():
    html = document_html(
        '<h1 style="font-family: Georgia, &quot;Times New Roman&quot;, serif; font-size: 14px; color: #2563eb; text-transform: uppercase; width: 300px">Alex Morgan</h1>',
        {},
        "Typography",
    )
    assert "Times New Roman" in html
    pdf = await PdfRenderer().render(html)
    with pymupdf.open(stream=pdf, filetype="pdf") as document:
        assert "ALEX MORGAN" in document[0].get_text()
        spans = [
            span
            for block in document[0].get_text("dict")["blocks"]
            if "lines" in block
            for line in block["lines"]
            for span in line["spans"]
        ]
        assert spans[0]["size"] == pytest.approx(10.5, abs=0.1)
        assert spans[0]["color"] == 0x2563EB


@pytest.mark.asyncio
@pytest.mark.parametrize("size", list(PAGE_SIZES))
@pytest.mark.parametrize("orientation", ["portrait", "landscape"])
async def test_real_pdf_dimensions_selectable_text_links_and_extraction(
    size, orientation
):
    html = document_html(
        '<h1>Alex Morgan</h1><p>Resume text remains selectable.</p><a href="https://example.com">Portfolio</a>',
        {"pageSize": size, "pageOrientation": orientation},
        "Resume",
    )
    pdf = await PdfRenderer().render(html)
    width, height = PAGE_SIZES[size]
    if orientation == "landscape":
        width, height = height, width
    with pymupdf.open(stream=pdf, filetype="pdf") as document:
        assert document.page_count == 1
        assert document[0].rect.width == pytest.approx(width * 72 / 25.4, abs=0.1)
        assert document[0].rect.height == pytest.approx(height * 72 / 25.4, abs=0.1)
        assert "Alex Morgan" in document[0].get_text()
        assert any(
            link.get("uri") == "https://example.com" for link in document[0].get_links()
        )
    extracted, text = PdfRenderer.extract(pdf)
    assert "Alex Morgan" in extracted and "selectable" in text


@pytest.mark.asyncio
async def test_long_resume_flows_without_losing_final_text_and_sanitizes_html():
    fragment = (
        "<html><head><style>p { font-size: 12pt; color: #222; }</style></head><body><script>unsafe()</script>"
        + "<p>Long resume text and achievements.</p>" * 100
        + "<p>FINAL ACHIEVEMENT</p></body></html>"
    )
    html = document_html(fragment, {}, "Long resume")
    assert "unsafe()" not in html
    assert "font-size: 12pt" in html
    pdf = await PdfRenderer().render(html)
    with pymupdf.open(stream=pdf, filetype="pdf") as document:
        assert document.page_count > 1
        assert "FINAL ACHIEVEMENT" in document[-1].get_text()


def test_browser_css_shorthands_keep_layout_and_clipping():
    from app.modules.resume.pdf_renderer import sanitize_fragment

    html = sanitize_fragment(
        '<div style="display:flex;flex-flow:column nowrap;inset:0;grid-area:auto / span 2;overflow:hidden">content</div>'
    )
    for declaration in (
        "flex-flow:column nowrap",
        "inset:0",
        "grid-area:auto / span 2",
        "overflow:hidden",
    ):
        assert declaration in html
