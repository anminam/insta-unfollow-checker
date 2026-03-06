#!/usr/bin/env node
// Generate icon PNGs for Insta Unfollow Checker
// Pure Node.js - no external dependencies
// Usage: node docs/generate-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ========== Minimal PNG encoder ==========
function createPNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA (width * height * 4)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const buf = Buffer.alloc(4 + type.length + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 4 + type.length);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeInt32BE(crc, buf.length - 4);
    return buf;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - raw pixel data with filter byte 0 per row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  const compressed = zlib.deflateSync(rawData);

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend)
  ]);
}

// CRC32 for PNG
const crcTable = (function() {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

// ========== Drawing primitives ==========
class Bitmap {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }

  setPixel(x, y, r, g, b, a) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (a < 255) {
      // Alpha blend
      const srcA = a / 255;
      const dstA = this.data[i + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA > 0) {
        this.data[i]     = Math.round((r * srcA + this.data[i] * dstA * (1 - srcA)) / outA);
        this.data[i + 1] = Math.round((g * srcA + this.data[i + 1] * dstA * (1 - srcA)) / outA);
        this.data[i + 2] = Math.round((b * srcA + this.data[i + 2] * dstA * (1 - srcA)) / outA);
        this.data[i + 3] = Math.round(outA * 255);
      }
    } else {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    for (let dy = -Math.ceil(radius) - 1; dy <= Math.ceil(radius) + 1; dy++) {
      for (let dx = -Math.ceil(radius) - 1; dx <= Math.ceil(radius) + 1; dx++) {
        const dist2 = dx * dx + dy * dy;
        if (dist2 <= r2) {
          // Anti-alias edge
          const dist = Math.sqrt(dist2);
          const edgeA = Math.min(1, Math.max(0, radius - dist + 0.5));
          this.setPixel(cx + dx, cy + dy, r, g, b, Math.round(a * edgeA));
        }
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, r, g, b, a = 255) {
    for (let dy = -Math.ceil(ry) - 1; dy <= Math.ceil(ry) + 1; dy++) {
      for (let dx = -Math.ceil(rx) - 1; dx <= Math.ceil(rx) + 1; dx++) {
        const dist = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        if (dist <= 1) {
          const edge = Math.min(1, Math.max(0, (1 - dist) * Math.min(rx, ry) + 0.5));
          const alpha = Math.min(1, edge);
          this.setPixel(cx + dx, cy + dy, r, g, b, Math.round(a * alpha));
        }
      }
    }
  }

  fillRoundRect(x, y, w, h, radius, r, g, b, a = 255) {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        let dist = 0;
        // Check corner distances
        if (px < radius && py < radius) {
          dist = Math.sqrt((radius - px) ** 2 + (radius - py) ** 2) - radius;
        } else if (px >= w - radius && py < radius) {
          dist = Math.sqrt((px - (w - radius - 1)) ** 2 + (radius - py) ** 2) - radius;
        } else if (px < radius && py >= h - radius) {
          dist = Math.sqrt((radius - px) ** 2 + (py - (h - radius - 1)) ** 2) - radius;
        } else if (px >= w - radius && py >= h - radius) {
          dist = Math.sqrt((px - (w - radius - 1)) ** 2 + (py - (h - radius - 1)) ** 2) - radius;
        } else {
          dist = -1;
        }
        if (dist < 0.5) {
          const edgeA = Math.min(1, Math.max(0, 0.5 - dist));
          this.setPixel(x + px, y + py, r, g, b, Math.round(a * edgeA));
        }
      }
    }
  }

  // Gradient rounded rect
  fillRoundRectGradient(x, y, w, h, radius, colors) {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        let dist = 0;
        if (px < radius && py < radius) {
          dist = Math.sqrt((radius - px) ** 2 + (radius - py) ** 2) - radius;
        } else if (px >= w - radius && py < radius) {
          dist = Math.sqrt((px - (w - radius - 1)) ** 2 + (radius - py) ** 2) - radius;
        } else if (px < radius && py >= h - radius) {
          dist = Math.sqrt((radius - px) ** 2 + (py - (h - radius - 1)) ** 2) - radius;
        } else if (px >= w - radius && py >= h - radius) {
          dist = Math.sqrt((px - (w - radius - 1)) ** 2 + (py - (h - radius - 1)) ** 2) - radius;
        } else {
          dist = -1;
        }
        if (dist < 0.5) {
          const edgeA = Math.min(1, Math.max(0, 0.5 - dist));
          // Diagonal gradient (bottom-left to top-right)
          const t = (px / w + (1 - py / h)) / 2;
          const [r, g, b] = lerpGradient(colors, t);
          this.setPixel(x + px, y + py, r, g, b, Math.round(255 * edgeA));
        }
      }
    }
  }

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        this.setPixel(x + px, y + py, r, g, b, a);
      }
    }
  }
}

function lerpGradient(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i], s1 = stops[i + 1];
    if (t >= s0[0] && t <= s1[0]) {
      const lt = (t - s0[0]) / (s1[0] - s0[0]);
      return [
        Math.round(s0[1] + (s1[1] - s0[1]) * lt),
        Math.round(s0[2] + (s1[2] - s0[2]) * lt),
        Math.round(s0[3] + (s1[3] - s0[3]) * lt),
      ];
    }
  }
  const last = stops[stops.length - 1];
  return [last[1], last[2], last[3]];
}

// ========== Icon drawing ==========
// Instagram gradient colors
const IG_GRADIENT = [
  [0.0,  240, 148, 51],   // #f09433
  [0.25, 230, 104, 60],   // #e6683c
  [0.5,  220, 39,  67],   // #dc2743
  [0.75, 204, 35,  102],  // #cc2366
  [1.0,  188, 24,  136],  // #bc1888
];

function drawIcon(size) {
  const bmp = new Bitmap(size, size);
  const s = size;

  // 1. Instagram gradient rounded square
  const cornerR = Math.max(2, Math.round(s * 0.22));
  bmp.fillRoundRectGradient(0, 0, s, s, cornerR, IG_GRADIENT);

  // 2. Inner darker rounded rect
  const inset = Math.max(1, Math.round(s * 0.08));
  const innerR = Math.max(1, Math.round(cornerR * 0.7));
  bmp.fillRoundRect(inset, inset, s - inset * 2, s - inset * 2, innerR, 0, 0, 0, 64);

  // 3. Person silhouette (shifted slightly left)
  const personCx = Math.round(s * 0.40);

  // Head
  const headR = Math.max(1, Math.round(s * 0.11));
  const headCy = Math.round(s * 0.30);
  bmp.fillCircle(personCx, headCy, headR, 255, 255, 255);

  // Body (half ellipse)
  const bodyCy = Math.round(headCy + headR + s * 0.16);
  const bodyRx = Math.max(2, Math.round(s * 0.16));
  const bodyRy = Math.max(2, Math.round(s * 0.14));

  // Draw upper half of ellipse only (body)
  for (let dy = -Math.ceil(bodyRy) - 1; dy <= 0; dy++) {
    for (let dx = -Math.ceil(bodyRx) - 1; dx <= Math.ceil(bodyRx) + 1; dx++) {
      const dist = (dx * dx) / (bodyRx * bodyRx) + (dy * dy) / (bodyRy * bodyRy);
      if (dist <= 1) {
        const edge = Math.min(1, Math.max(0, (1 - dist) * Math.min(bodyRx, bodyRy) + 0.5));
        bmp.setPixel(personCx + dx, bodyCy + dy, 255, 255, 255, Math.round(255 * Math.min(1, edge)));
      }
    }
  }

  // 4. Red badge circle with minus sign (bottom-right)
  const badgeCx = Math.round(s * 0.72);
  const badgeCy = Math.round(s * 0.68);
  const badgeR = Math.max(2, Math.round(s * 0.19));

  // Badge shadow
  bmp.fillCircle(badgeCx, badgeCy, badgeR + Math.max(1, Math.round(s * 0.015)), 0, 0, 0, 80);

  // Badge circle (red)
  bmp.fillCircle(badgeCx, badgeCy, badgeR, 237, 73, 86);

  // Minus sign
  const minusHalfW = Math.max(1, Math.round(badgeR * 0.55));
  const minusH = Math.max(1, Math.round(s * 0.04));
  const minusHH = Math.max(1, Math.floor(minusH / 2));

  for (let dy = -minusHH; dy <= minusHH; dy++) {
    for (let dx = -minusHalfW; dx <= minusHalfW; dx++) {
      bmp.setPixel(badgeCx + dx, badgeCy + dy, 255, 255, 255, 255);
    }
  }

  return bmp;
}

// ========== Generate and save ==========
const outDir = path.join(__dirname, '..', 'icons');

[16, 48, 128].forEach(size => {
  const bmp = drawIcon(size);
  const png = createPNG(size, size, bmp.data);
  const outPath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated: ${outPath} (${png.length} bytes)`);
});

console.log('\nDone! Icons saved to icons/ directory.');
console.log('Also open docs/icon-generator.html in browser for Canvas preview.');
