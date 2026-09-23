"""Executable contract for the Safari/iPadOS baseline (issue #161).

These invariants regress silently and cost hours on a device: a new `100vh`
without a `dvh` companion, an unprefixed `backdrop-filter`, a form control that
drops back below Safari's 16px focus-zoom floor, or the loss of the iOS/touch
block and the below-baseline notice. The scans stay substring/rule based on
purpose — the cheap style used by `test_deploy_config.py`.

Context and the device checklist live in `docs/safari-ipad-compatibility.md`.
"""

import json
import re
from pathlib import Path

STYLES = Path("static/styles.css")
INDEX = Path("static/index.html")
DOC = Path("docs/safari-ipad-compatibility.md")
LOCALES = (Path("static/locales/en.json"), Path("static/locales/zh-CN.json"))

# `height|min-height|max-height: <anything>100vh<anything>;`
HEIGHT_DECLARATION = re.compile(
    r"^(\s*)(height|min-height|max-height)\s*:\s*(.*?)100vh(.*?);(.*)$"
)
FONT_SIZE = re.compile(r"font-size:\s*([0-9.]+)(px|rem|em)")
LAST_SELECTOR_TOKEN = re.compile(r"([^\s,>+~]+)\s*$")

IOS_GATE = "@supports (-webkit-touch-callout: none) {"
NOTICE_GATE = "@supports not (color: color-mix(in oklab, red, blue)) {"
HOVER_REVEALED_ACTIONS = (
    ".trash-btn",
    ".agent-publish-btn",
    ".agent-market-update-action",
)


def _styles() -> str:
    return STYLES.read_text(encoding="utf-8")


def _declarations(styles: str):
    """Yield (selector, declaration line) for every line inside a rule block."""
    selector = ""
    for line in styles.splitlines():
        if "{" in line:
            selector = line.split("{", 1)[0].strip()
            body = line.split("{", 1)[1]
        else:
            body = line
        yield selector, body


def _block(styles: str, gate: str) -> str:
    """Return the text of a top-level @supports block (it closes with `\\n}`)."""
    after = styles.split(gate, 1)[1]
    return after.split("\n}\n", 1)[0]


def _declared_size_px(styles: str) -> list[tuple[str, float]]:
    """Sub-16px font sizes on rules whose selector ends in a form control."""
    offenders = []
    for selector, body in _declarations(styles):
        if selector.startswith("@") or not selector:
            continue
        token_match = LAST_SELECTOR_TOKEN.search(selector)
        if not token_match:
            continue
        token = token_match.group(1).lstrip(".").split(":")[0].lower()
        if not (
            token in {"input", "textarea", "select"}
            or token.endswith(("-input", "-select", "-textarea"))
        ):
            continue
        size = FONT_SIZE.search(body)
        if not size:
            continue
        value = float(size.group(1)) * (1 if size.group(2) == "px" else 16)
        if value < 16:
            offenders.append((selector, value))
    return offenders


def test_every_layout_height_pairs_vh_with_dvh():
    lines = _styles().splitlines()
    missing = []
    for index, line in enumerate(lines):
        match = HEIGHT_DECLARATION.match(line)
        if not match:
            continue
        indent, prop, before, after, tail = match.groups()
        companion = f"{indent}{prop}: {before}100dvh{after};{tail}"
        if companion not in lines[index + 1 : index + 3]:
            missing.append(line.strip())
    assert missing == [], "missing dvh companion after: " + "; ".join(missing)


def test_backdrop_filter_always_carries_the_webkit_prefix():
    lines = _styles().splitlines()
    for index, line in enumerate(lines):
        stripped = line.strip()
        if not stripped.startswith("backdrop-filter:"):
            continue
        assert lines[index - 1].strip() == "-webkit-" + stripped, (
            f"missing -webkit- companion before {stripped!r}"
        )


def test_form_controls_keep_the_sixteen_pixel_focus_zoom_floor():
    offenders = _declared_size_px(_styles())
    assert offenders == [], (
        "Safari auto-zooms a focused field below 16px; raise these: "
        + "; ".join(f"{selector} = {size}px" for selector, size in offenders)
    )


def test_ios_touch_block_keeps_its_declarations():
    block = _block(_styles(), IOS_GATE)
    assert "-webkit-text-size-adjust: 100%;" in block
    assert "-webkit-tap-highlight-color: transparent;" in block
    assert "touch-action: manipulation;" in block
    for selector in HOVER_REVEALED_ACTIONS:
        assert selector in block, f"{selector} must stay visible without hover"
    assert "opacity: 1;" in block


def test_below_baseline_notice_is_gated_and_dismissible():
    styles = _styles()
    notice = _block(styles, NOTICE_GATE)
    assert "display: flex;" in notice
    assert ".unsupported-browser:has(.unsupported-browser-dismiss:checked)" in notice
    assert "display: none;" in notice

    html = INDEX.read_text(encoding="utf-8")
    assert '<div class="unsupported-browser" role="status">' in html
    assert 'id="unsupported-browser-dismiss"' in html
    assert "t('common.unsupportedBrowser')" in html
    for locale in LOCALES:
        data = json.loads(locale.read_text(encoding="utf-8"))
        assert data["common"]["unsupportedBrowser"]


def test_compatibility_doc_exists():
    assert DOC.is_file()
    assert "16.4" in DOC.read_text(encoding="utf-8")
