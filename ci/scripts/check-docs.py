#!/usr/bin/env python3
"""
check-docs.py
Verificaciones ligeras sobre el repositorio documental.

Ejecucion:
    python ci/scripts/check-docs.py

Chequeos:
  1. Ningun archivo markdown debe tener BOM (UTF-8 BOM, 0xEF 0xBB 0xBF).
  2. Los enlaces markdown relativos deben resolver a archivos existentes.
  3. Las anclas internas `#...` referenciadas deben existir como
     `<a id="..."></a>` o como cabecera en el mismo documento.
  4. Los documentos bajo `docs/` deben contener el bloque
     `<!-- nav-guided:start --> ... <!-- nav-guided:end -->`
     y dentro de ese bloque, `Anterior:` y `Siguiente:` deben ser enlaces
     markdown navegables.
  5. Titulos, breadcrumbs y etiquetas `nav-guided` deben usar la forma ASCII
     para terminos reservados del estandar.

Salida:
  - Codigo 0 si no hay hallazgos.
  - Codigo 1 si encuentra al menos un hallazgo.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

MD_LINK_RE = re.compile(r"(?<!!)\[([^\]]+)\]\(([^)]+)\)")
HEADER_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
ANCHOR_ID_RE = re.compile(r'<a\s+id="([^"]+)"\s*></a>', re.IGNORECASE)
NAV_START = "<!-- nav-guided:start -->"
NAV_END = "<!-- nav-guided:end -->"

RESERVED_ASCII = [
    ("Indice", "Índice"),
    ("Operacion", "Operación"),
    ("Analisis", "Análisis"),
    ("Construccion", "Construcción"),
    ("Estimacion", "Estimación"),
    ("Adopcion", "Adopción"),
    ("Produccion", "Producción"),
    ("Decisiones tecnologicas", "Decisiones tecnológicas"),
    ("Vision", "Visión"),
]


def is_ignored(path: Path) -> bool:
    return any(part in {".git", "node_modules", ".venv", "__pycache__"} for part in path.parts)


def slugify(text: str) -> str:
    text = text.lower().strip()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ñ": "n",
        "ü": "u",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text


def collect_markdown_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*.md"):
        rel = path.relative_to(ROOT)
        if is_ignored(rel):
            continue
        files.append(path)
    return sorted(files)


def check_bom(path: Path, findings: list[str]) -> None:
    if path.read_bytes().startswith(b"\xef\xbb\xbf"):
        findings.append(f"{path.relative_to(ROOT)}:1: UTF-8 BOM presente al inicio del archivo")


def collect_anchors(text: str) -> set[str]:
    anchors: set[str] = set()
    for match in ANCHOR_ID_RE.finditer(text):
        anchors.add(match.group(1))
    for line in text.splitlines():
        match = HEADER_RE.match(line)
        if match:
            anchors.add(slugify(match.group(2)))
    return anchors


def validate_anchor_in_file(target_file: Path, anchor: str) -> bool:
    try:
        text = target_file.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = target_file.read_text(encoding="utf-8-sig")
    return anchor in collect_anchors(text)


def check_links_and_anchors(path: Path, text: str, findings: list[str]) -> None:
    own_anchors = collect_anchors(text)
    for line_number, line in enumerate(text.splitlines(), 1):
        for match in MD_LINK_RE.finditer(line):
            target = match.group(2).strip()
            if target.startswith(("http://", "https://", "mailto:")):
                continue
            if target.startswith("#"):
                anchor = target[1:]
                if anchor and anchor not in own_anchors:
                    findings.append(
                        f"{path.relative_to(ROOT)}:{line_number}: ancla interna `#{anchor}` no existe en este archivo"
                    )
                continue

            target_path, _, anchor = target.partition("#")
            if not target_path:
                continue

            full_path = (path.parent / target_path).resolve()
            try:
                full_path.relative_to(ROOT)
            except ValueError:
                continue

            if not full_path.exists():
                findings.append(f"{path.relative_to(ROOT)}:{line_number}: enlace roto a `{target_path}`")
                continue

            if anchor and full_path.suffix.lower() == ".md" and not validate_anchor_in_file(full_path, anchor):
                findings.append(
                    f"{path.relative_to(ROOT)}:{line_number}: ancla `#{anchor}` no existe en `{target_path}`"
                )


def check_nav_guided(path: Path, text: str, findings: list[str]) -> None:
    rel = path.relative_to(ROOT).as_posix()
    if not rel.startswith("docs/"):
        return
    if NAV_START not in text or NAV_END not in text:
        findings.append(f"{rel}:1: falta bloque nav-guided (start/end)")
        return

    start = text.index(NAV_START)
    end = text.index(NAV_END)
    block = text[start:end]
    for label in ("Anterior:", "Siguiente:"):
        if label not in block:
            findings.append(f"{rel}:1: bloque nav-guided sin `{label}`")
            continue
        line = next(candidate for candidate in block.splitlines() if label in candidate)
        if not MD_LINK_RE.search(line):
            findings.append(f"{rel}:1: `{label}` debe ser enlace markdown navegable")


def check_reserved_ascii(path: Path, text: str, findings: list[str]) -> None:
    for line_number, line in enumerate(text.splitlines(), 1):
        is_header = bool(HEADER_RE.match(line))
        is_breadcrumb = "[README principal]" in line and "[Indice" in line
        is_nav_label = line.lstrip("- ").startswith(("Anterior:", "Siguiente:"))
        if not (is_header or is_breadcrumb or is_nav_label):
            continue
        for ascii_form, unicode_form in RESERVED_ASCII:
            if unicode_form in line:
                findings.append(
                    f"{path.relative_to(ROOT)}:{line_number}: forma acentuada `{unicode_form}` en titulo/breadcrumb/nav; usar `{ascii_form}`"
                )


def main() -> int:
    findings: list[str] = []
    files = collect_markdown_files()
    for path in files:
        try:
            raw = path.read_bytes()
        except OSError as exc:
            findings.append(f"{path.relative_to(ROOT)}:0: no se pudo leer ({exc})")
            continue

        check_bom(path, findings)

        try:
            text = raw.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            findings.append(f"{path.relative_to(ROOT)}:0: no es UTF-8 valido ({exc})")
            continue

        check_links_and_anchors(path, text, findings)
        check_nav_guided(path, text, findings)
        check_reserved_ascii(path, text, findings)

    if findings:
        for finding in findings:
            print(finding)
        print(f"\nTotal hallazgos: {len(findings)}")
        return 1

    print(f"OK. {len(files)} archivos markdown revisados sin hallazgos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
