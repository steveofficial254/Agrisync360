#!/usr/bin/env python3
"""Generate PNG icons from SVG for PWA"""
try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    icons_dir = os.path.dirname(os.path.abspath(__file__))
    
    for size in sizes:
        # Create image with transparent background
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Green rounded square background
        radius = size // 5
        draw.rounded_rectangle(
            [0, 0, size-1, size-1],
            radius=radius,
            fill='#2D6A4F'
        )
        
        # Try to add text
        try:
            # Use a simple font
            font_size = int(size * 0.5)
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            text = "🌾"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (size - text_width) // 2
            y = (size - text_height) // 2
            
            draw.text((x, y), text, font=font, fill='white')
        except:
            # If text fails, just create a simple design
            center = size // 2
            inner_size = size // 3
            draw.ellipse([center-inner_size, center-inner_size, 
                        center+inner_size, center+inner_size], 
                       fill='white')
        
        # Save
        path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
        img.save(path, 'PNG')
        print(f'Created: {size}x{size}')
    
    print('All icons created!')
    
except ImportError:
    print('PIL not available — creating placeholder icons')
    import os
    import struct
    import zlib
    
    def create_png(size, color=(45, 106, 79)):
        def make_png(w, h, r, g, b):
            raw = b'\x00' + bytes([r, g, b] * w)
            raw_data = raw * h
            compressed = zlib.compress(raw_data)
            
            chunks = []
            
            def chunk(ctype, data):
                c = struct.pack('>I', len(data)) + ctype + data
                crc = zlib.crc32(ctype + data) & 0xffffffff
                return c + struct.pack('>I', crc)
            
            header = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
            chunks.append(chunk(b'IHDR', header))
            chunks.append(chunk(b'IDAT', compressed))
            chunks.append(chunk(b'IEND', b''))
            
            return b'\x89PNG\r\n\x1a\n' + b''.join(chunks)
        
        return make_png(size, size, *color)
    
    icons_dir = os.path.dirname(os.path.abspath(__file__))
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    for size in sizes:
        path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
        with open(path, 'wb') as f:
            f.write(create_png(size))
        print(f'Created placeholder: icon-{size}x{size}.png')

if __name__ == '__main__':
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # Run the icon generation
