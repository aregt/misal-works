#!/usr/bin/env node
/**
 * FND-010 — bağımlılıksız foundation bekçisi.
 * Çıkış: 0 sağlam / 1 kırık. Seviyeler: FAIL (kırmızı) · WARN · INFO.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const PUBLIC = path.join(ROOT, "public");
const IMAGES = path.join(PUBLIC, "images");
const VIDEOS = path.join(PUBLIC, "videos");
const INDEX = path.join(ROOT, "index.html");
const CSS = path.join(SRC, "styles.css");
const CONTENT = path.join(SRC, "content.js");
const MAIN = path.join(SRC, "main.jsx");

const fails = [];
const warns = [];
const infos = [];

const ok = (msg) => console.log(`OK    ${msg}`);
const fail = (msg) => {
  fails.push(msg);
  console.log(`FAIL  ${msg}`);
};
const warn = (msg) => {
  warns.push(msg);
  console.log(`WARN  ${msg}`);
};
const info = (msg) => {
  infos.push(msg);
  console.log(`INFO  ${msg}`);
};

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function extractQuotedAssets(text) {
  const imageRe = /["'`]([A-Za-z0-9_./-]+\.(?:png|jpe?g|webp))["'`]/g;
  const videoRe = /["'`](\/?videos\/[A-Za-z0-9_.-]+\.mp4)["'`]/g;
  const images = new Set();
  const videos = new Set();
  let m;
  while ((m = imageRe.exec(text))) images.add(m[1].replace(/^\.\//, ""));
  while ((m = videoRe.exec(text))) videos.add(m[1].replace(/^\//, ""));
  return { images, videos };
}

function resolveImage(rel) {
  const candidates = [
    path.join(IMAGES, rel),
    path.join(IMAGES, "services", path.basename(rel)),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

console.log("FND-010 check-foundation");
console.log(`root  ${ROOT}`);

// 1. Referanslanan görseller (content.js + main.jsx — sabit liste yok)
const srcText = `${read(CONTENT)}\n${read(MAIN)}`;
const assets = extractQuotedAssets(srcText);
const missingImages = [];
for (const rel of [...assets.images].sort()) {
  if (!resolveImage(rel)) missingImages.push(rel);
}
if (missingImages.length) {
  fail(`public/images/ eksik (${missingImages.length}): ${missingImages.join(", ")}`);
} else {
  ok(`görseller: ${assets.images.size} referans, hepsi public/images/ altında`);
}

// 2. Videolar — yoksa uyarı, hata değil
if (!fs.existsSync(VIDEOS)) {
  warn("public/videos/ yok (beklenen: dosyalar repo dışında, poster fallback)");
} else {
  const listed = [...assets.videos];
  const missingVideos = listed.filter((rel) => !fs.existsSync(path.join(PUBLIC, rel)));
  if (missingVideos.length) warn(`video dosyası yok: ${missingVideos.join(", ")}`);
  else ok(`public/videos/ var, ${listed.length} referans mevcut`);
}

// 3. robots + sitemap
for (const name of ["robots.txt", "sitemap.xml"]) {
  const p = path.join(PUBLIC, name);
  if (fs.existsSync(p)) ok(`public/${name}`);
  else fail(`public/${name} yok`);
}

// 4. CSS gerileme bekçisi (FND-001…004)
const css = read(CSS);
if (/font-weight\s*:\s*700\b/.test(css)) fail("styles.css içinde font-weight:700 (FND-001 gerileme)");
else ok("font-weight:700 yok");

const dead = [];
if (/(^|[^\w-])\.process\b/.test(css)) dead.push(".process");
if (/\.hero-note\b/.test(css)) dead.push(".hero-note");
if (/\.hero-bottom\b/.test(css)) dead.push(".hero-bottom");
if (dead.length) fail(`ölü CSS kalıntısı: ${dead.join(", ")}`);
else ok("ölü seçiciler (.process / .hero-note / .hero-bottom) yok");

const hexHits = [...css.matchAll(/#0a151c\b/gi)];
const strayHex = hexHits.filter((m) => {
  const line = css.slice(0, m.index).split("\n").pop() + css.slice(m.index).split("\n")[0];
  return !/--overlay\s*:\s*#0a151c/i.test(line);
});
if (strayHex.length) fail(`ham #0a151c tekrarı (${strayHex.length} satır, token dışında)`);
else ok("ham #0a151c yalnız --overlay tokenında");

// 5. index.html head (FND-007)
const html = read(INDEX);
const headChecks = [
  ["description", /<meta\s+name=["']description["']/i],
  ["canonical", /<link\s+rel=["']canonical["']/i],
  ["og", /<meta\s+property=["']og:(?:title|type|url)["']/i],
  ["json-ld", /<script\s+type=["']application\/ld\+json["']/i],
];
const missingHead = headChecks.filter(([, re]) => !re.test(html)).map(([n]) => n);
if (missingHead.length) fail(`index.html head eksik: ${missingHead.join(", ")}`);
else ok("index.html description + canonical + OG + JSON-LD");

// 6. GEÇİCİ sayımı — bilgi, hata değil
const scanRoots = [INDEX, ...walkFiles(SRC)];
const geciciFiles = [];
let geciciCount = 0;
for (const file of scanRoots) {
  if (!/\.(html|js|jsx|css)$/i.test(file)) continue;
  const text = read(file);
  const n = (text.match(/GEÇİCİ/g) || []).length;
  if (n) {
    geciciCount += n;
    geciciFiles.push(`${path.relative(ROOT, file).replaceAll("\\", "/")} (${n})`);
  }
}
info(`GEÇİCİ: ${geciciCount} işaret, ${geciciFiles.length} dosya — ${geciciFiles.join("; ") || "yok"}`);

// 7. 500KB üstü public dosyası — uyarı (FND-009: orijinaller duruyor)
const heavy = walkFiles(PUBLIC)
  .map((file) => ({ file, size: fs.statSync(file).size }))
  .filter((x) => x.size > 500 * 1024)
  .sort((a, b) => b.size - a.size);
if (heavy.length) {
  warn(
    `public/ ${heavy.length} dosya >500KB: ` +
      heavy
        .slice(0, 12)
        .map((x) => `${path.relative(PUBLIC, x.file).replaceAll("\\", "/")} ${(x.size / 1024).toFixed(0)}KB`)
        .join(", ")
  );
} else {
  ok("public/ içinde 500KB üstü dosya yok");
}

console.log("");
console.log(`${fails.length} FAIL · ${warns.length} WARN · ${infos.length} INFO`);
if (fails.length) {
  console.error("check-foundation: KIRIK");
  process.exit(1);
}
console.log("check-foundation: SAĞLAM");
process.exit(0);
