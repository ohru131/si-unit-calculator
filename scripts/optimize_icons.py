from pathlib import Path

from PIL import Image


ASSET_NAMES = [
    "icon.png",
    "splash-icon.png",
    "favicon.png",
    "android-icon-foreground.png",
]
ASSET_DIRECTORY = Path("/home/ubuntu/si-unit-calculator/assets/images")


for asset_name in ASSET_NAMES:
    asset_path = ASSET_DIRECTORY / asset_name
    with Image.open(asset_path) as image:
        normalized = image.convert("RGBA")
        normalized.thumbnail((512, 512), Image.Resampling.LANCZOS)
        normalized.save(asset_path, format="PNG", optimize=True, compress_level=9)
    print(f"optimized {asset_name}")
