#!/usr/bin/env python3
"""Build tab icons: mark only, no rounded plate."""
from pathlib import Path
from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parent.parent / "public"
INK = (16, 38, 51, 255)
# Same geometry as the on-page mark (41 x 50).
LEFT = [(0, 0), (18, 9), (18, 50), (0, 41)]
RIGHT = [(41, 0), (23, 9), (23, 50), (41, 41)]
SRC_W, SRC_H = 41, 50


def draw_mark(size, pad=0.08):
    scale = 8
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    inset = canvas * pad
    usable = canvas - 2 * inset
    fit = min(usable / SRC_W, usable / SRC_H)
    w, h = SRC_W * fit, SRC_H * fit
    ox = (canvas - w) / 2
    oy = (canvas - h) / 2

    def mapped(points):
        return [(ox + x * fit, oy + y * fit) for x, y in points]

    draw.polygon(mapped(LEFT), fill=INK)
    draw.polygon(mapped(RIGHT), fill=INK)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def main():
    PUBLIC.mkdir(exist_ok=True)
    sizes = {
        "favicon-16.png": 16,
        "favicon-32.png": 32,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
        "icon-512-maskable.png": 512,
    }
    images = {name: draw_mark(size) for name, size in sizes.items()}
    for name, img in images.items():
        img.save(PUBLIC / name, "PNG")
    images["favicon-32.png"].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("favicon mark-only set written")


if __name__ == "__main__":
    main()
