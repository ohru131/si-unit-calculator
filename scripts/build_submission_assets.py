from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path("/home/ubuntu/si-unit-calculator")
SOURCE = Path("/home/ubuntu/webdev-static-assets")
OUTPUT = ROOT / "submission-assets"
OUTPUT.mkdir(parents=True, exist_ok=True)

STORE_ICON = SOURCE / "unit-calculator-store-icon-1024.png"
SCREENSHOTS = {
    "calculation": SOURCE / "unit-calculator-portrait-calculation.png",
    "samples": SOURCE / "unit-calculator-portrait-samples.png",
    "pro": SOURCE / "unit-calculator-portrait-pro.png",
}


def save_store_icon():
    image = Image.open(STORE_ICON).convert("RGBA")
    image.resize((1024, 1024), Image.Resampling.LANCZOS).convert("RGB").save(
        OUTPUT / "unit-calculator-store-icon-1024.png", quality=96
    )


def save_vertical_screenshot(source: Path, destination: Path):
    target_width, target_height = 1179, 2556
    image = Image.open(source).convert("RGB")
    scaled_height = round(image.height * target_width / image.width)
    foreground = image.resize((target_width, scaled_height), Image.Resampling.LANCZOS)

    background = image.resize((target_width, target_height), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(radius=36))
    overlay = Image.new("RGBA", (target_width, target_height), (247, 249, 250, 196))
    canvas = Image.alpha_composite(background.convert("RGBA"), overlay)
    top = max(0, (target_height - scaled_height) // 2)
    canvas.alpha_composite(foreground.convert("RGBA"), (0, top))
    canvas.convert("RGB").save(destination, quality=95)


save_store_icon()
for name, source in SCREENSHOTS.items():
    save_vertical_screenshot(source, OUTPUT / f"unit-calculator-shipaton-{name}-1179x2556.png")

