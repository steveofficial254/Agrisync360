#!/usr/bin/env python3
"""Create simple valid PNG icons"""

def create_simple_png(size):
    """Create a simple green square PNG"""
    import struct
    import zlib
    
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # Create image data (green square)
    image_data = b''
    for y in range(size):
        row = b'\x00'  # Filter type (none)
        for x in range(size):
            row += b'\x2D\x6A\x4F'  # Green color RGB(45,106,79)
        image_data += row
    
    # Compress image data
    compressed = zlib.compress(image_data)
    idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png

# Create all required sizes
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for size in sizes:
    try:
        png_data = create_simple_png(size)
        with open(f'icon-{size}x{size}.png', 'wb') as f:
            f.write(png_data)
        print(f'Created icon-{size}x{size}.png')
    except Exception as e:
        print(f'Error creating {size}x{size}: {e}')

print('All icons created!')
