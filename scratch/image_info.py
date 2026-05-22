import os
from PIL import Image

mockup_dir = "public/mockups"
for f in os.listdir(mockup_dir):
    if f.endswith('.png'):
        path = os.path.join(mockup_dir, f)
        try:
            with Image.open(path) as img:
                print(f"{f}: {img.size} {img.mode} {os.path.getsize(path)} bytes")
        except Exception as e:
            print(f"Error {f}: {e}")
