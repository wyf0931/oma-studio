"""Inspect authored Vue/TypeScript sources, never generated bundles."""

from pathlib import Path


def frontend_templates() -> str:
    return "\n".join(
        path.read_text(encoding="utf-8")
        for path in [
            Path("frontend/index.html"),
            *sorted(Path("frontend/src").rglob("*.vue")),
        ]
    )


def frontend_scripts() -> str:
    return "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted(Path("frontend/src").rglob("*.ts"))
        if "generated" not in path.parts
    )
