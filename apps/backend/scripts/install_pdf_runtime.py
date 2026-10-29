"""Optional local Windows setup. Linux production installs Pango in Dockerfile."""

from pathlib import Path
from urllib.request import urlretrieve
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1] / ".runtime" / "weasyprint"
root.mkdir(parents=True, exist_ok=True)
archive = root.parent / "weasyprint-windows-onedir.zip"
urlretrieve(
    "https://github.com/Kozea/WeasyPrint/releases/download/v70.0/weasyprint-windows-onedir.zip",
    archive,
)
with ZipFile(archive) as source:
    for entry in source.infolist():
        target = (root / entry.filename).resolve()
        if root.resolve() not in target.parents and target != root.resolve():
            raise ValueError("Unsafe archive path")
    source.extractall(root)
print("Installed official WeasyPrint Windows runtime into .runtime/weasyprint.")
