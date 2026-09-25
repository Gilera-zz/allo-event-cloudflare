"""Gör dev-testbilder för den nya startsidan (bara för `bun run dev`).

Läser F:\\Allo\\Bilder\\testset-hemsidan, skriver webp (max 300 kB) till public/test-images/,
som är gitignorerat. Bilderna används bara när import.meta.env.DEV är sant och en riktig
bild saknas. Kör:

    python scripts/make-test-images.py [källmapp]

Kräver Pillow (pip install pillow).
"""
import os
import sys

from PIL import Image, ImageOps

SOURCE = sys.argv[1] if len(sys.argv) > 1 else r"F:\Allo\Bilder\testset-hemsidan"
TARGET = os.path.join(os.path.dirname(__file__), "..", "public", "test-images")
MAX_BYTES = 300 * 1024

# (källfil utan ändelse, målfil, maxbredd, beskärning som andel av bredden från högerkanten)
JOBS = [
    ("20260925_162616", "event-desktop.webp", 1800, 0.0),
    ("20260925_162337", "event-mobile.webp", 1100, 0.0),
    # Personen i högerkanten beskärs bort. Justera andelen om det behövs.
    ("20260925_162329", "staffing.webp", 1800, 0.18),
]


def find_source(stem: str) -> str | None:
    for name in os.listdir(SOURCE):
        if os.path.splitext(name)[0].lower() == stem.lower():
            return os.path.join(SOURCE, name)
    return None


def main() -> None:
    if not os.path.isdir(SOURCE):
        print(f"Källmappen finns inte: {SOURCE}")
        sys.exit(1)
    os.makedirs(TARGET, exist_ok=True)
    for stem, target, max_width, crop_right in JOBS:
        src = find_source(stem)
        if not src:
            print(f"Saknas: {stem}.* i {SOURCE}")
            continue
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        if crop_right > 0:
            w, h = im.size
            im = im.crop((0, 0, round(w * (1 - crop_right)), h))
        if im.width > max_width:
            im = im.resize((max_width, round(im.height * max_width / im.width)), Image.LANCZOS)
        out = os.path.join(TARGET, target)
        for quality in (82, 74, 66, 58, 50, 42):
            im.save(out, "WEBP", quality=quality, method=6)
            if os.path.getsize(out) <= MAX_BYTES:
                break
        print(f"{target}: {im.size[0]}x{im.size[1]}, {os.path.getsize(out) // 1024} kB (q={quality})")


if __name__ == "__main__":
    main()
