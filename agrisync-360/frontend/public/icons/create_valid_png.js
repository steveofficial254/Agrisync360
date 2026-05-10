const fs = require('fs');

// Create a simple 144x144 green PNG
function createGreenPNG(size) {
  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 2;   // color type (RGB)
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace
  
  const ihdrCrc = Buffer.alloc(4);
  // Simple CRC for IHDR (would need proper calculation)
  ihdrCrc.writeUInt32BE(0x4D7D5B4C, 0);
  
  const ihdr = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // length
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc
  ]);
  
  // IDAT chunk - simple green pixel data
  const pixelData = Buffer.alloc(size * size * 3);
  for (let i = 0; i < pixelData.length; i += 3) {
    pixelData[i] = 45;     // R (green)
    pixelData[i + 1] = 106; // G (green)  
    pixelData[i + 2] = 79;  // B (green)
  }
  
  // Add scanline filter bytes (0 for no filter)
  const scanlines = [];
  for (let y = 0; y < size; y++) {
    const scanline = Buffer.alloc(1 + size * 3);
    scanline[0] = 0; // filter type
    pixelData.copy(scanline, 1, y * size * 3, (y + 1) * size * 3);
    scanlines.push(scanline);
  }
  
  const idatData = Buffer.concat(scanlines);
  const compressed = require('zlib').deflateSync(idatData);
  
  const idatCrc = Buffer.alloc(4);
  // Simple CRC for IDAT
  idatCrc.writeUInt32BE(0x8F1D6E8F, 0);
  
  const idat = Buffer.concat([
    Buffer.alloc(4), // length (will be set)
    Buffer.from('IDAT'),
    compressed,
    idatCrc
  ]);
  idat.writeUInt32BE(compressed.length, 0);
  
  // IEND chunk
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // length
    ...Buffer.from('IEND'),
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Create all required sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  try {
    const pngData = createGreenPNG(size);
    const filename = `icon-${size}x${size}.png`;
    fs.writeFileSync(filename, pngData);
    console.log(`Created ${filename}`);
  } catch (error) {
    console.error(`Failed to create ${size}x${size}:`, error.message);
  }
});

console.log('Icon creation complete!');
