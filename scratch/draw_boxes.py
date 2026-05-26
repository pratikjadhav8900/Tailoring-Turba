import os
from PIL import Image, ImageDraw

def draw_customizer_box(base_img_path, output_path, top_pct, left_pct, width_pct, height_pct, label, color="blue"):
    img = Image.open(base_img_path)
    img_w, img_h = img.size
    
    # Mapping logic:
    # The image is scaled to fit 560x560 via object-fit: contain.
    # Aspect ratio of the image: img_w / img_h
    # For polo (2382x984), ratio is 2.4207.
    # Therefore, scaled image width is 560, and scaled height is 560 / 2.4207 = 231.34.
    # It is centered vertically. Y starts at (560 - 231.34) / 2 = 164.33, and ends at 395.67.
    
    container_w = 560.0
    container_h = 560.0
    
    img_ratio = img_w / img_h
    scaled_w = container_w
    scaled_h = container_w / img_ratio
    
    y_offset = (container_h - scaled_h) / 2.0
    
    # We want to find the pixel coordinates on the original image (img_w x img_h).
    # Container box parameters:
    box_left_container = (left_pct / 100.0) * container_w
    box_top_container = (top_pct / 100.0) * container_h
    box_w_container = (width_pct / 100.0) * container_w
    box_h_container = (height_pct / 100.0) * container_h
    
    # Convert container coordinates to image coordinates:
    # X: box_left_container maps to original image width.
    x1_img = (box_left_container / container_w) * img_w
    w_img = (box_w_container / container_w) * img_w
    x2_img = x1_img + w_img
    
    # Y: box_top_container - y_offset maps to original image height.
    y1_img = ((box_top_container - y_offset) / scaled_h) * img_h
    h_img = (box_h_container / scaled_h) * img_h
    y2_img = y1_img + h_img
    
    draw = ImageDraw.Draw(img)
    # Draw rectangle
    draw.rectangle([x1_img, y1_img, x2_img, y2_img], outline=color, width=8)
    
    # Add text label
    try:
        from PIL import ImageFont
        font = ImageFont.load_default()
    except:
        font = None
    draw.text((x1_img + 10, y1_img + 10), label, fill=color)
    
    img.save(output_path)
    print(f"Saved: {output_path}")

base_dir = "d:\\Tailoring Tourba\\Tailoring Turba\\public\\mockups"
out_dir = "C:\\Users\\vighnesh jadhav\\.gemini\\antigravity\\brain\\b0ee0bd0-6fcb-43df-a4ef-ae45a4ab419b"
os.makedirs(out_dir, exist_ok=True)

# Current coordinates: top: 32%, left: 48%, width: 22%, height: 30%
# Let's draw current and some candidates:
img_path = os.path.join(base_dir, "round_neck_left_sleeve_base.png")
if os.path.exists(img_path):
    img = Image.open(img_path)
    draw = ImageDraw.Draw(img)
    
    # Let's define boxes to draw:
    # 1. Current (Blue)
    # top: 32%, left: 48%, width: 22%, height: 30%
    # 2. Candidate 1 (Red) - Shifted down/right: top: 40%, left: 55%, width: 18%, height: 24%
    # 3. Candidate 2 (Green) - Shifted more: top: 48%, left: 65%, width: 10%, height: 15%
    # 4. Candidate 3 (Orange) - Let's do a wider sweep
    
    boxes = [
        {"top": 32, "left": 48, "width": 22, "height": 30, "color": "blue", "label": "Current (32, 48, 22x30)"},
        {"top": 45, "left": 60, "width": 12, "height": 18, "color": "red", "label": "Cand 1 (45, 60, 12x18)"},
        {"top": 48, "left": 65, "width": 10, "height": 15, "color": "green", "label": "Cand 2 (48, 65, 10x15)"},
        {"top": 42, "left": 55, "width": 15, "height": 22, "color": "orange", "label": "Cand 3 (42, 55, 15x22)"},
        {"top": 46, "left": 58, "width": 14, "height": 20, "color": "purple", "label": "Cand 4 (46, 58, 14x20)"}
    ]
    
    container_w = 560.0
    container_h = 560.0
    img_w, img_h = img.size
    img_ratio = img_w / img_h
    scaled_w = container_w
    scaled_h = container_w / img_ratio
    y_offset = (container_h - scaled_h) / 2.0
    
    for box in boxes:
        box_left_container = (box["left"] / 100.0) * container_w
        box_top_container = (box["top"] / 100.0) * container_h
        box_w_container = (box["width"] / 100.0) * container_w
        box_h_container = (box["height"] / 100.0) * container_h
        
        x1_img = (box_left_container / container_w) * img_w
        w_img = (box_w_container / container_w) * img_w
        x2_img = x1_img + w_img
        
        y1_img = ((box_top_container - y_offset) / scaled_h) * img_h
        h_img = (box_h_container / scaled_h) * img_h
        y2_img = y1_img + h_img
        
        draw.rectangle([x1_img, y1_img, x2_img, y2_img], outline=box["color"], width=8)
        draw.text((x1_img + 10, y1_img + 10), box["label"], fill=box["color"])
        
    img.save(os.path.join(out_dir, "round_candidates.png"))
    print("Saved candidates to round_candidates.png")
else:
    print("Round neck image not found")
