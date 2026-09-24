// Build-time prerender: snapshot the client-rendered #root into dist/index.html
// so non-JS crawlers (GPTBot, ClaudeBot, PerplexityBot, Bingbot) see real content.
// Uses puppeteer-core + system Chrome/Chromium — no browser download in CI.
// Chrome lookup: PUPPETEER_EXECUTABLE_PATH > CHROME_PATH > OS defaults.
import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const MIN_HTML = 5000;
const SETTLE_MS = 1500;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
};

function findChrome() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url || "/", "http://127.0.0.1").pathname);
      const rel = urlPath.endsWith("/") ? `${urlPath}index.html` : urlPath;
      const filePath = path.join(DIST, path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
      if (!filePath.startsWith(DIST)) {
        res.writeHead(403).end();
        return;
      }
      const data = await readFile(filePath);
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  const executablePath = findChrome();
  if (!executablePath) {
    throw new Error(
      "prerender: no Chrome/Chromium found. Set PUPPETEER_EXECUTABLE_PATH or install Chrome."
    );
  }
  const { default: puppeteer } = await import("puppeteer-core");

  const indexFile = path.join(DIST, "index.html");
  const html = await readFile(indexFile, "utf8");
  const rootRe = /<div id="root">\s*<\/div>/;
  if (!rootRe.test(html)) {
    throw new Error('prerender: expected empty <div id="root"></div> in dist/index.html');
  }

  const server = await startServer();
  const { port } = server.address();
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--hide-scrollbars"],
    });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => {
      const main = document.querySelector("#root main#top");
      return main && main.querySelectorAll("section, footer").length >= 4;
    }, { timeout: 15000 });
    await new Promise((r) => setTimeout(r, SETTLE_MS));
    const rootHtml = await page.evaluate(() => document.getElementById("root").innerHTML);
    if (!rootHtml || rootHtml.length < MIN_HTML) {
      throw new Error(
        `prerender gate: captured ${rootHtml ? rootHtml.length : 0} chars (< ${MIN_HTML})`
      );
    }
    const next = html.replace(rootRe, () => `<div id="root">${rootHtml}</div>`);
    if (!next.includes(rootHtml.slice(0, 100))) {
      throw new Error("prerender: injection into dist/index.html failed");
    }
    for (const must of ["<title>", 'rel="canonical"', "application/ld+json", "meta name=\"description\""]) {
      if (!next.includes(must)) {
        throw new Error(`prerender: head signal missing after inject: ${must}`);
      }
    }
    await writeFile(indexFile, next, "utf8");
    console.log(`prerender: injected ${rootHtml.length} chars into dist/index.html`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    await new Promise((r) => server.close(r));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
