"""Build responsive gallery copies while preserving the 2400px viewer images."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "images" / "web"
OUTPUT_ROOT = ROOT / "assets" / "images" / "responsive"
WIDTHS = (480, 960)
JPEG_QUALITY = 90


def build_variant(source: Path, width: int) -> bool:
    destination = OUTPUT_ROOT / str(width) / source.name
    if destination.exists() and destination.stat().st_mtime_ns >= source.stat().st_mtime_ns:
        return False

    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        height = round(image.height * width / image.width)
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        if resized.mode not in ("RGB", "L"):
            resized = resized.convert("RGB")

        save_options = {
            "quality": JPEG_QUALITY,
            "optimize": True,
            "progressive": True,
        }
        icc_profile = original.info.get("icc_profile")
        if icc_profile:
            save_options["icc_profile"] = icc_profile
        resized.save(destination, "JPEG", **save_options)

    return True


def main() -> None:
    sources = sorted(SOURCE_DIR.glob("*.jpg"))
    generated = sum(build_variant(source, width) for source in sources for width in WIDTHS)
    print(f"Generated {generated} responsive files from {len(sources)} photographs.")


if __name__ == "__main__":
    main()
