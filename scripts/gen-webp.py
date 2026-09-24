"""FND-009: JPG/PNG -> WebP srcset. Orijinal silinmez. Yeni görsel WebP'siz eklenmez."""
from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "public" / "images"
OUT_JS = ROOT / "src" / "media.js"

PHOTO_WIDTHS = (480, 960, 1920)
HERO = {"hero-portal.png", "showreel.jpg"}


def save_webp(im: Image.Image, dest: Path, target_kb: int) -> int:
    q = 82
    used = q
    while q >= 48:
        im.save(dest, "WEBP", quality=q, method=6)
        used = q
        if dest.stat().st_size <= target_kb * 1024:
            break
        q -= 4
    return used


def process(path: Path, relative: str, kind: str) -> dict:
    im = Image.open(path)
    w, h = im.size
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.mode else "RGB")
    target = 40 if kind == "icon" else (200 if kind == "hero" else 150)
    widths = [w] if kind == "icon" else [min(tw, w) for tw in PHOTO_WIDTHS]
    widths = list(dict.fromkeys(widths))
    stem = relative.rsplit(".", 1)[0]
    rows = []
    for tw in widths:
        if tw < w:
            nh = max(1, round(h * tw / w))
            frame = im.resize((tw, nh), Image.Resampling.LANCZOS)
        else:
            frame = im
            tw = w
        dest = IMG / f"{stem}-{tw}.webp"
        dest.parent.mkdir(parents=True, exist_ok=True)
        q = save_webp(frame, dest, target)
        kb = round(dest.stat().st_size / 1024, 1)
        if kb > target and tw == widths[-1] and len(widths) > 1:
            dest.unlink()
            continue
        rows.append({"w": tw, "kb": kb, "q": q})
    return {"src": relative.replace("\\", "/"), "w": w, "h": h, "kind": kind, "srcset": [r["w"] for r in rows], "webp": rows}


def main() -> None:
    catalog = []
    # 1) Orijinal dosyalar (JPG/PNG) — FND-009.
    for path in sorted(IMG.rglob("*")):
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue
        if "-480." in path.name or "-960." in path.name:
            continue
        rel = str(path.relative_to(IMG))
        kind = "icon" if rel.startswith("services" + os.sep) or rel.startswith("services/") else ("hero" if path.name in HERO else "card")
        catalog.append(process(path, rel, kind))
    # 2) FND-011: orijinali olmayan webp-only görseller (ör. services).
    known = {row["src"] for row in catalog}
    for path in sorted(IMG.rglob("*.webp")):
        rel = str(path.relative_to(IMG))
        stem = path.stem
        if "-" not in stem:
            continue
        base, _, wstr = stem.rpartition("-")
        if not wstr.isdigit():
            continue
        # Orijinal dosya varsa (1) zaten işlendi.
        if any(rel.endswith(ext) and rel.startswith(base) for ext in (".png", ".jpg", ".jpeg")):
            continue
        for ext in (".png", ".jpg", ".jpeg"):
            if (IMG / f"{base}{ext}").exists():
                break
        else:
            src_rel = f"{base}.png"
            if src_rel in known:
                continue
            try:
                im = Image.open(path)
                w, h = im.size
            except OSError:
                continue
            catalog.append({"src": src_rel.replace("\\", "/"), "w": w, "h": h, "kind": "icon", "srcset": [int(wstr)], "webp": [{"w": int(wstr), "kb": round(path.stat().st_size / 1024, 1), "q": None}]})
            known.add(src_rel)
    js_rows = {row["src"]: {"w": row["w"], "h": row["h"], "srcset": row["srcset"]} for row in catalog}
    js = "/** FND-009 medya kataloğu — yeni görsel WebP'siz eklenmez. Üretim: python scripts/gen-webp.py */\nexport const MEDIA = " + json.dumps(js_rows, indent=2, ensure_ascii=False) + ";\n"
    OUT_JS.write_text(js, encoding="utf-8")
    (ROOT / "docs" / "checks" / "FND-009-WEBP.json").write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
