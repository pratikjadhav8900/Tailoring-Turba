import os
from PIL import Image, ImageEnhance, ImageChops

def test_blend_params(shadow_b_val, shadow_c_val, shadow_op, hl_b_val, hl_c_val, hl_op, filename):
    base_path = 'public/mockups/polo_neck_left_sleeve_base.png'
    mask_path = 'public/mockups/polo_neck_left_sleeve_mask.png'
    
    base = Image.open(base_path).convert('RGBA')
    mask = Image.open(mask_path).convert('RGBA')
    mask = mask.resize(base.size, Image.Resampling.LANCZOS)
    
    # 1. Color layer (Red #A52A2A)
    mask_alpha = mask.split()[-1]
    color_layer = Image.new('RGBA', base.size, (165, 42, 42, 255))
    color_masked = Image.new('RGBA', base.size)
    color_masked.paste(color_layer, (0, 0), mask_alpha)
    
    # Composite color layer over base image
    color_opacity = 0.94
    blended_base_color = Image.blend(base, Image.alpha_composite(base, color_masked), color_opacity)
    
    # 2. Shadows Layer (Multiply)
    shadow_img = mask.convert('L')
    enhancer_b = ImageEnhance.Brightness(shadow_img)
    shadow_b = enhancer_b.enhance(shadow_b_val)
    enhancer_c = ImageEnhance.Contrast(shadow_b)
    shadow_final = enhancer_c.enhance(shadow_c_val).convert('RGBA')
    
    multiplied = ImageChops.multiply(blended_base_color, shadow_final)
    shadows_applied = Image.blend(blended_base_color, multiplied, shadow_op)
    
    # 3. Highlights Layer (Screen)
    highlight_img = mask.convert('L')
    enhancer_hb = ImageEnhance.Brightness(highlight_img)
    highlight_b = enhancer_hb.enhance(hl_b_val)
    enhancer_hc = ImageEnhance.Contrast(highlight_b)
    highlight_final = enhancer_hc.enhance(hl_c_val).convert('RGBA')
    
    screened = ImageChops.screen(shadows_applied, highlight_final)
    final_img = Image.blend(shadows_applied, screened, hl_op)
    
    # Save image
    final_img.convert('RGB').save(f'public/mockups/{filename}')
    print(f"Saved {filename}")

if __name__ == '__main__':
    # Let's try 3 variations:
    # Var 1: High Contrast Shadows (c=2.0, b=0.7)
    test_blend_params(0.7, 2.0, 0.90, 1.3, 1.8, 0.40, 'blend_var1.png')
    
    # Var 2: Very High Contrast Shadows (c=2.5, b=0.6)
    test_blend_params(0.6, 2.5, 0.92, 1.5, 2.2, 0.45, 'blend_var2.png')
    
    # Var 3: Balanced but strong (c=1.8, b=0.8)
    test_blend_params(0.8, 1.8, 0.88, 1.2, 1.6, 0.38, 'blend_var3.png')
