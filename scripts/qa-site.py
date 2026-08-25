from __future__ import annotations

import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
sys.stdout.reconfigure(encoding="utf-8")


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[str] = []
        self.title_parts: list[str] = []
        self.h1_parts: list[str] = []
        self.h1_count = 0
        self.tag_count = 0
        self.description = ""
        self.canonical = ""
        self.robots = ""
        self.schema_count = 0
        self._in_title = False
        self._in_h1 = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tag_count += 1
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        for key in ("href", "src"):
            if values.get(key):
                self.refs.append(values[key] or "")
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self._in_h1 = True
            self.h1_count += 1
        if tag == "meta" and values.get("name", "").lower() == "description":
            self.description = (values.get("content") or "").strip()
        if tag == "meta" and values.get("name", "").lower() == "robots":
            self.robots = (values.get("content") or "").strip().lower()
        if tag == "link" and values.get("rel", "").lower() == "canonical":
            self.canonical = (values.get("href") or "").strip()
        if tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self.schema_count += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        if tag == "h1":
            self._in_h1 = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if self._in_h1:
            self.h1_parts.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())

    @property
    def h1(self) -> str:
        return " ".join("".join(self.h1_parts).split())


def local_target(page: Path, raw: str) -> Path | None:
    if not raw or raw.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None
    split = urlsplit(raw)
    if split.scheme or split.netloc:
        return None
    clean = unquote(split.path)
    if not clean:
        return None
    target = (page.parent / clean).resolve()
    try:
        target.relative_to(DIST.resolve())
    except ValueError:
        return Path("__outside_dist__")
    return target


def main() -> int:
    failures: list[str] = []
    pages: dict[str, PageParser] = {}
    html_files = sorted(DIST.glob("*.html"))
    for page in html_files:
        parser = PageParser()
        markup = page.read_text(encoding="utf-8")
        parser.feed(markup)
        pages[page.name] = parser
        duplicate_ids = [value for value, count in Counter(parser.ids).items() if count > 1]
        if duplicate_ids:
            failures.append(f"{page.name}: duplicate ids {', '.join(duplicate_ids)}")
        if page.name != "404.html" and parser.h1_count != 1:
            failures.append(f"{page.name}: expected one h1, found {parser.h1_count}")
        if not parser.title:
            failures.append(f"{page.name}: missing title")
        if not parser.description:
            failures.append(f"{page.name}: missing description")
        if not parser.canonical:
            failures.append(f"{page.name}: missing canonical")
        if "noindex" not in parser.robots and parser.schema_count < 1:
            failures.append(f"{page.name}: indexable page missing JSON-LD")
        class_tokens = [
            token
            for class_attr in re.findall(r'class=["\']([^"\']*)["\']', markup)
            for token in class_attr.split()
        ]
        for class_name in (
            "site-header",
            "brand",
            "brand-mark",
            "brand-copy",
            "site-footer",
            "footer-brand-lockup",
            "footer-logo",
            "footer-brand-copy",
            "footer-contact-block",
            "footer-trust-badges",
        ):
            count = class_tokens.count(class_name)
            if count != 1:
                failures.append(f"{page.name}: expected one shared {class_name}, found {count}")
        if "verified-trust" in markup:
            failures.append(f"{page.name}: duplicate page-level trust strip remains")
        for raw in parser.refs:
            target = local_target(page, raw)
            if target is not None and not target.exists():
                failures.append(f"{page.name}: missing local reference {raw}")

    for field, values in {
        "title": [parser.title for parser in pages.values()],
        "h1": [parser.h1 for name, parser in pages.items() if name != "404.html"],
        "description": [parser.description for parser in pages.values()],
        "canonical": [parser.canonical for parser in pages.values() if "noindex" not in parser.robots],
    }.items():
        duplicates = [value for value, count in Counter(values).items() if value and count > 1]
        if duplicates:
            failures.append(f"duplicate {field}: {duplicates[:4]}")

    home_tags = pages.get("index.html").tag_count if "index.html" in pages else 0
    if home_tags >= 700:
        failures.append(f"index.html: {home_tags} source elements exceeds 699")
    raw_hero_pngs = list((DIST / "assets" / "hero").glob("*.png"))
    if raw_hero_pngs:
        failures.append(f"raw hero PNGs in production: {[item.name for item in raw_hero_pngs]}")
    if (DIST / ".lighthouseci").exists():
        failures.append("local Lighthouse artifacts copied to production")
    sector_pages = list(DIST.glob("sektor-*.html"))
    downloads = [item for item in (DIST / "assets" / "downloads").glob("*") if item.is_file()]
    result = {
        "ok": not failures,
        "failures": failures,
        "pages": len(html_files),
        "indexable": sum("noindex" not in parser.robots for parser in pages.values()),
        "sectorPages": len(sector_pages),
        "downloads": len(downloads),
        "homepageSourceElements": home_tags,
        "rawHeroPngs": len(raw_hero_pngs),
        "distBytes": sum(item.stat().st_size for item in DIST.rglob("*") if item.is_file()),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
