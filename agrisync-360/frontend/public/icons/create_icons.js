const fs = require('fs');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Simple 1x1 green pixel PNG (base64)
const greenPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Create all icon files
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const buffer = Buffer.from(greenPixelBase64, 'base64');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
});

console.log('All icons created!');
