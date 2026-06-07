// Dependency-free PNG icon generator.
// Draws the Estimator mark (blue tile + white estimate sheet + green check)
// at the sizes the PWA manifest needs. No native deps — pure Node + zlib.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');

const BRAND = [29, 78, 216, 255]; // #1d4ed8
const SHEET = [255, 255, 255, 255];
const LINE = [191, 219, 254, 255]; // #bfdbfe
const CHECK = [34, 197, 94, 255]; // #22c55e

// ---- tiny raster canvas ----
function makeCanvas(size) {
  return { size, data: new Uint8Array(size * size * 4) };
}
function px(c, x, y, color) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  c.data[i] = color[0];
  c.data[i + 1] = color[1];
  c.data[i + 2] = color[2];
  c.data[i + 3] = color[3];
}
function fillRect(c, x0, y0, w, h, color) {
  for (let y = Math.round(y0); y < Math.round(y0 + h); y++)
    for (let x = Math.round(x0); x < Math.round(x0 + w); x++) px(c, x, y, color);
}
function fillRoundRect(c, x0, y0, w, h, r, color) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = Math.min(x, w - 1 - x);
      const dy = Math.min(y, h - 1 - y);
      if (dx < r && dy < r) {
        const ddx = r - dx;
        const ddy = r - dy;
        if (ddx * ddx + ddy * ddy > r * r) continue;
      }
      px(c, Math.round(x0) + x, Math.round(y0) + y, color);
    }
  }
}
function thickLine(c, x0, y0, x1, y1, thickness, color) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.ceil(dist);
  const half = thickness / 2;
  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 0 : s / steps;
    const cx = x0 + (x1 - x0) * t;
    const cy = y0 + (y1 - y0) * t;
    for (let yy = -half; yy <= half; yy++)
      for (let xx = -half; xx <= half; xx++)
        if (xx * xx + yy * yy <= half * half)
          px(c, Math.round(cx + xx), Math.round(cy + yy), color);
  }
}

function drawIcon(size, { maskPad = false } = {}) {
  const c = makeCanvas(size);
  // Background tile (full bleed so maskable masks cleanly).
  fillRoundRect(c, 0, 0, size, size, maskPad ? 0 : size * 0.18, BRAND);

  // Keep the mark inside the maskable safe area (~80%).
  const inset = maskPad ? size * 0.2 : size * 0.16;
  const sx = inset;
  const sy = inset * 0.95;
  const sw = size - inset * 2;
  const sh = size - inset * 1.9;

  // Estimate sheet.
  fillRoundRect(c, sx, sy, sw, sh, sw * 0.08, SHEET);

  // A couple of text lines near the top of the sheet.
  const lineH = sh * 0.06;
  fillRect(c, sx + sw * 0.16, sy + sh * 0.2, sw * 0.5, lineH, LINE);
  fillRect(c, sx + sw * 0.16, sy + sh * 0.34, sw * 0.42, lineH, LINE);

  // Bold green check across the lower half = "approved estimate".
  const th = Math.max(3, size * 0.06);
  thickLine(c, sx + sw * 0.2, sy + sh * 0.64, sx + sw * 0.4, sy + sh * 0.82, th, CHECK);
  thickLine(c, sx + sw * 0.4, sy + sh * 0.82, sx + sw * 0.78, sy + sh * 0.5, th, CHECK);

  return c;
}

// ---- PNG encoder ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(canvas) {
  const { size, data } = canvas;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // raw scanlines with filter byte 0
  const stride = 1 + size * 4;
  const raw = Buffer.alloc(size * stride);
  const src = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter type 0 (none)
    src.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
const targets = [
  ['icon-192.png', drawIcon(192)],
  ['icon-512.png', drawIcon(512)],
  ['icon-512-maskable.png', drawIcon(512, { maskPad: true })],
  ['apple-touch-icon.png', drawIcon(180)],
];
for (const [name, canvas] of targets) {
  writeFileSync(join(OUT_DIR, name), encodePNG(canvas));
  console.log('wrote', join('public', 'icons', name));
}
