import os
from PIL import Image

def get_bbox_pct(img_path):
    img = Image.open(img_path)
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        width = right - left
        height = bottom - top
        img_w, img_h = img.size
        print(f"File: {os.path.basename(img_path)}")
        print(f"  Pixel Bbox: left={left}, top={top}, width={width}, height={height} (Image: {img_w}x{img_h})")
        print(f"  Percentages: left={left/img_w*100:.1f}%, top={top/img_h*100:.1f}%, width={width/img_w*100:.1f}%, height={height/img_h*100:.1f}%")
    else:
        print(f"File: {os.path.basename(img_path)} - No bounding box found")

base_dir = "d:\\Tailoring Tourba\\Tailoring Turba\\public\\mockups"
for f in ["polo_neck_left_sleeve_mask.png", "round_neck_left_sleeve_mask.png"]:
    path = os.path.join(base_dir, f)
    if os.path.exists(path):
        get_bbox_pct(path)
    else:
        print(f"Path does not exist: {path}")
