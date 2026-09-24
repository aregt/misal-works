#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coverSrc, absoluteUrl, BLOG_PATH } from "../src/blog/links.js";
import { renderIndexPage, renderPostPage, renderNotFoundPage, esc } from "../src/blog/templates.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG_SRC = path.join(ROOT, "src", "blog");
const POSTS_DIR = path.join(BLOG_SRC, "posts");
const TOKENS = path.join(BLOG_SRC, "tokens.css");
const STYLES = path.join(BLOG_SRC, "styles.css");
const SHARE = path.join(BLOG_SRC, "share.js");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\[.*\]$/.test(value)) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^['"]|['"]$/g, ""));
  }
  return value.replace(/^['"]|['"]$/g, "");
}

export function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith("---")) return { data: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end < 0) return { data: {}, body: text };
  const matter = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\s+/, "");
  const data = {};
  for (const line of matter.split(/\r?\n/)) {
    const sep = line.indexOf(":");
    if (sep < 1) continue;
    data[line.slice(0, sep).trim()] = parseScalar(line.slice(sep + 1));
  }
  return { data, body };
}

function escapeHtml(value) {
  return esc(value);
}

function inlineMarkdown(text) {
  const parts = [];
  const source = text;
  let i = 0;
  const pushText = (chunk) => {
    if (chunk) parts.push(escapeHtml(chunk));
  };
  while (i < source.length) {
    if (source.startsWith("**", i)) {
      const close = source.indexOf("**", i + 2);
      if (close > i) {
        parts.push(`<strong>${inlineMarkdown(source.slice(i + 2, close))}</strong>`);
        i = close + 2;
        continue;
      }
    }
    if (source[i] === "*" && source[i + 1] !== "*") {
      const close = source.indexOf("*", i + 1);
      if (close > i) {
        parts.push(`<em>${inlineMarkdown(source.slice(i + 1, close))}</em>`);
        i = close + 1;
        continue;
      }
    }
    if (source.startsWith("![", i)) {
      const altEnd = source.indexOf("](", i + 2);
      const urlEnd = altEnd > -1 ? source.indexOf(")", altEnd + 2) : -1;
      if (altEnd > -1 && urlEnd > -1) {
        const alt = source.slice(i + 2, altEnd);
        const url = source.slice(altEnd + 2, urlEnd);
        parts.push(`<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />`);
        i = urlEnd + 1;
        continue;
      }
    }
    if (source[i] === "[") {
      const labelEnd = source.indexOf("](", i + 1);
      const urlEnd = labelEnd > -1 ? source.indexOf(")", labelEnd + 2) : -1;
      if (labelEnd > -1 && urlEnd > -1) {
        const label = source.slice(i + 1, labelEnd);
        const url = source.slice(labelEnd + 2, urlEnd);
        parts.push(`<a href="${escapeHtml(url)}">${inlineMarkdown(label)}</a>`);
        i = urlEnd + 1;
        continue;
      }
    }
    const next = source.slice(i).search(/(\*\*|!\[|\*|\[)/);
    if (next === -1) {
      pushText(source.slice(i));
      break;
    }
    if (next === 0) {
      pushText(source[i]);
      i += 1;
      continue;
    }
    pushText(source.slice(i, i + next));
    i += next;
  }
  return parts.join("");
}

export function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const item = line.match(/^[-*]\s+(.+)$/);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return html.join("\n");
}

function dateLabel(iso) {
  const date = new Date(`${iso}T00:00:00+03:00`);
  return date.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

function slugFromFile(filename) {
  return filename.replace(/\.md$/i, "").toLowerCase();
}

export function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((name) => name.endsWith(".md")).sort();
  return files.map((name) => {
    const raw = read(path.join(POSTS_DIR, name));
    const { data, body } = parseFrontmatter(raw);
    if (!data.title || !data.description || !data.date) {
      throw new Error(`Blog yazısı eksik alan: ${name} (title, description, date zorunlu)`);
    }
    const slug = data.slug || slugFromFile(name);
    const cover = coverSrc(data.cover);
    return {
      slug,
      path: `${BLOG_PATH}${slug}/`,
      title: String(data.title),
      description: String(data.description),
      date: String(data.date),
      dateModified: data.dateModified ? String(data.dateModified) : String(data.date),
      dateLabel: dateLabel(String(data.date)),
      coverSrc: cover,
      tags: Array.isArray(data.tags) ? data.tags : [],
      relatedWorks: Array.isArray(data.relatedWorks) ? data.relatedWorks : [],
      relatedServices: Array.isArray(data.relatedServices) ? data.relatedServices : [],
      sample: Boolean(data.sample),
      bodyHtml: markdownToHtml(body),
    };
  }).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getBlogCss() {
  return `${read(TOKENS)}\n${read(STYLES)}\n`;
}

export function getShareJs() {
  return read(SHARE);
}

function rfc822(iso) {
  return new Date(`${iso}T09:00:00+03:00`).toUTCString();
}

export function renderRss(posts) {
  const items = posts.map((post) => {
    const url = absoluteUrl(post.path);
    return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${rfc822(post.date)}</pubDate>
      <description><![CDATA[${post.description}]]></description>
    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Misal Works Yazıları</title>
    <link>${esc(absoluteUrl(BLOG_PATH))}</link>
    <description>Stüdyo üretiminden notlar.</description>
    <language>tr</language>
    <atom:link href="${esc(absoluteUrl("/blog/rss.xml"))}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

export function matchBlogUrl(url) {
  const clean = (url || "").split("?")[0].split("#")[0];
  if (clean === "/blog" || clean === "/blog/") return { kind: "index" };
  if (clean === "/blog/rss.xml") return { kind: "rss" };
  if (clean === "/blog/assets/blog.css") return { kind: "css" };
  if (clean === "/blog/assets/share.js") return { kind: "js" };
  const post = clean.match(/^\/blog\/([^/]+)\/?$/);
  if (post && post[1] !== "assets") return { kind: "post", slug: post[1] };
  if (clean.startsWith("/blog/")) return { kind: "missing" };
  return null;
}

export function handleBlogUrl(url, posts = loadPosts()) {
  const match = matchBlogUrl(url);
  if (!match) return null;
  if (match.kind === "index") {
    return { status: 200, type: "text/html; charset=utf-8", body: renderIndexPage(posts) };
  }
  if (match.kind === "rss") {
    return { status: 200, type: "application/rss+xml; charset=utf-8", body: renderRss(posts) };
  }
  if (match.kind === "css") {
    return { status: 200, type: "text/css; charset=utf-8", body: getBlogCss() };
  }
  if (match.kind === "js") {
    return { status: 200, type: "text/javascript; charset=utf-8", body: getShareJs() };
  }
  if (match.kind === "post") {
    const post = posts.find((item) => item.slug === match.slug);
    if (!post) return { status: 404, type: "text/html; charset=utf-8", body: renderNotFoundPage() };
    return { status: 200, type: "text/html; charset=utf-8", body: renderPostPage(post) };
  }
  return { status: 404, type: "text/html; charset=utf-8", body: renderNotFoundPage() };
}

function writeFile(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

function patchSitemap(distDir, posts) {
  const file = path.join(distDir, "sitemap.xml");
  if (!fs.existsSync(file)) return;
  let xml = read(file);
  const urls = [absoluteUrl(BLOG_PATH), ...posts.filter((post) => !post.sample).map((post) => absoluteUrl(post.path))];
  for (const loc of urls) {
    if (xml.includes(`<loc>${loc}</loc>`)) continue;
    xml = xml.replace("</urlset>", `  <url><loc>${loc}</loc></url>\n</urlset>`);
  }
  fs.writeFileSync(file, xml);
}

export function writeBlog(distDir) {
  const posts = loadPosts();
  const out = path.join(distDir, "blog");
  writeFile(path.join(out, "index.html"), renderIndexPage(posts));
  writeFile(path.join(out, "rss.xml"), renderRss(posts));
  writeFile(path.join(out, "assets", "blog.css"), getBlogCss());
  writeFile(path.join(out, "assets", "share.js"), getShareJs());
  for (const post of posts) {
    writeFile(path.join(out, post.slug, "index.html"), renderPostPage(post));
  }
  patchSitemap(distDir, posts);
  return posts;
}

export function runCheck() {
  const posts = loadPosts();
  if (!posts.length) throw new Error("Blog yazısı yok");
  const index = renderIndexPage(posts);
  const article = renderPostPage(posts[0]);
  const rss = renderRss(posts);
  const css = getBlogCss();
  const need = [
    [index.includes('rel="canonical"'), "index canonical"],
    [index.includes("/blog/"), "index blog path"],
    [index.includes("Stüdyo"), "index stüdyo köprüsü"],
    [article.includes("og:title"), "yazı og:title"],
    [article.includes("og:image"), "yazı og:image"],
    [article.includes("BlogPosting"), "yazı BlogPosting"],
    [article.includes("Bağlantıyı kopyala"), "yazı kopyala"],
    [article.includes("linkedin.com"), "yazı LinkedIn"],
    [article.includes("twitter.com/intent/tweet"), "yazı X"],
    [article.includes("Instagram"), "yazı Instagram notu"],
    [article.includes('href="/"'), "yazı ana sayfa"],
    [rss.includes("<rss"), "rss"],
    [css.includes("--ink"), "css token"],
    [!css.includes("font-weight: 700") && !css.includes("font-weight:700"), "css 700 yok"],
  ];
  const failed = need.filter(([ok]) => !ok).map(([, label]) => label);
  if (failed.length) throw new Error(`Blog kontrolü kırık: ${failed.join(", ")}`);
  const tmp = path.join(ROOT, ".tmp-blog-check");
  fs.rmSync(tmp, { recursive: true, force: true });
  writeBlog(tmp);
  const sample = path.join(tmp, "blog", posts[0].slug, "index.html");
  if (!fs.existsSync(sample)) throw new Error("örnek yazı HTML yazılamadı");
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`check:blog SAĞLAM (${posts.length} yazı)`);
}

const launchedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (launchedDirectly) {
  try {
    if (process.argv.includes("--check")) runCheck();
    else {
      const dist = path.join(ROOT, "dist");
      const posts = writeBlog(dist);
      console.log(`blog: ${posts.length} yazı → ${path.join(dist, "blog")}`);
    }
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}
