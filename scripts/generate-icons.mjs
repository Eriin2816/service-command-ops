/**
 * Generates icon-192.png and icon-512.png for the ServiceOps PWA manifest.
 * Run once: node scripts/generate-icons.mjs
 * Produces: public/icon-192.png, public/icon-512.png
 *
 * Design: navy background (#0C1E2E) with a cyan "S" glyph (#06B6D4)
 */
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

// ---- CRC-32 (needed for PNG chunks) ------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ---- Icon painter -------------------------------------------------------
// Simple "S" letterform drawn on a navy square using a pixel-art approach.
// We render at a base grid then scale up to target size via nearest-neighbor.

const NAVY  = [0x0c, 0x1e, 0x2e];
const CYAN  = [0x06, 0xb6, 0xd4];
const WHITE = [0xff, 0xff, 0xff];

// 16×16 pixel art "S" (1 = cyan, 0 = navy)
// prettier-ignore
const GLYPH_16 = [
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0],
  [0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0],
  [0,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

function buildPixels(size) {
  const pixels = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      // Map (x,y) back to 16×16 glyph with padding
      const pad = Math.round(size * 0.2); // 20% padding on each side
      const inner = size - pad * 2;
      const gx = Math.floor(((x - pad) / inner) * 16);
      const gy = Math.floor(((y - pad) / inner) * 16);
      if (gx >= 0 && gx < 16 && gy >= 0 && gy < 16 && GLYPH_16[gy][gx] === 1) {
        row.push(CYAN);
      } else {
        row.push(NAVY);
      }
    }
    pixels.push(row);
  }
  return pixels;
}

function encodePNG(size) {
  const pixels = buildPixels(size);
  const rows = pixels.map((row) => {
    const buf = Buffer.alloc(1 + row.length * 3);
    buf[0] = 0; // filter: None
    for (let x = 0; x < row.length; x++) {
      buf[1 + x * 3]     = row[x][0];
      buf[1 + x * 3 + 1] = row[x][1];
      buf[1 + x * 3 + 2] = row[x][2];
    }
    return buf;
  });
  const rawData = Buffer.concat(rows);
  const compressed = deflateSync(rawData);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8]  = 8; // bit depth
  ihdrData[9]  = 2; // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdrData),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Write files --------------------------------------------------------
mkdirSync("public", { recursive: true });

writeFileSync("public/icon-192.png", encodePNG(192));
writeFileSync("public/icon-512.png", encodePNG(512));

console.log("✅  public/icon-192.png  (192×192)");
console.log("✅  public/icon-512.png  (512×512)");
console.log("   Navy #0C1E2E background · Cyan #06B6D4 'S' letterform");
