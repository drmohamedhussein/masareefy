import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

function svgFor(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#2f6fed"/>
  <rect x="112" y="176" width="288" height="208" rx="36" fill="#ffffff"/>
  <rect x="160" y="224" width="192" height="32" rx="16" fill="#2f6fed"/>
  <path d="M168 176v-24c0-40 32-72 72-72h32c40 0 72 32 72 72v24" fill="none" stroke="#ffffff" stroke-width="36" stroke-linecap="round"/>
</svg>`;
}

const jobs = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["maskable-512.png", 512],
];

for (const [name, size] of jobs) {
  await sharp(Buffer.from(svgFor(size)))
    .png()
    .toFile(path.join(outDir, name));
}

console.log("PWA icons generated in public/icons");
