import {
  SITE_HOME,
  SITE_CONTACT,
  BLOG_PATH,
  SITE_ABOUT,
  absoluteUrl,
  relatedLinks,
} from "./links.js";

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attr(value) {
  return esc(value);
}

function mark() {
  return `<span class="mark" aria-hidden="true"><i></i><i></i></span>`;
}

function brand(href = SITE_HOME) {
  return `<a class="brand" href="${attr(href)}" aria-label="Misal Works ana sayfa">${mark()}<span><b>MISAL WORKS</b><small>FİLM &amp; POST-PRODÜKSİYON</small></span></a>`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function chrome({ title, ogTitle, description, canonical, image, type = "website", robots, extraHead = "", bodyClass = "", main, active = "yazilar" }) {
  const ogImage = absoluteUrl(image || "/images/hero-portal.png");
  const shareTitle = ogTitle || title;
  const robotsTag = robots ? `<meta name="robots" content="${attr(robots)}" />` : `<meta name="robots" content="index, follow" />`;
  const bodyAttr = bodyClass ? ` class="${attr(bodyClass)}"` : "";
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${attr(description)}" />
    <link rel="canonical" href="${attr(canonical)}" />
    ${robotsTag}
    <meta property="og:type" content="${attr(type)}" />
    <meta property="og:locale" content="tr_TR" />
    <meta property="og:site_name" content="Misal Works" />
    <meta property="og:title" content="${attr(shareTitle)}" />
    <meta property="og:description" content="${attr(description)}" />
    <meta property="og:url" content="${attr(canonical)}" />
    <meta property="og:image" content="${attr(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${attr(shareTitle)}" />
    <meta name="twitter:description" content="${attr(description)}" />
    <meta name="twitter:image" content="${attr(ogImage)}" />
    <link rel="alternate" type="application/rss+xml" title="Misal Works Yazıları" href="${attr(absoluteUrl("/blog/rss.xml"))}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet" />
    <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml" />
    <link rel="icon" href="/favicon-32.png?v=3" sizes="32x32" type="image/png" />
    <link rel="icon" href="/favicon.ico?v=3" sizes="48x48" type="image/x-icon" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="stylesheet" href="/blog/assets/blog.css" />
    ${extraHead}
  </head>
  <body${bodyAttr}>
    <header class="blog-bar">
      ${brand(SITE_HOME)}
      <nav class="blog-nav" aria-label="Blog">
        <a href="${attr(BLOG_PATH)}"${active === "yazilar" ? ` aria-current="page"` : ""}>Yazılar</a>
        <a href="${attr(SITE_HOME)}">Stüdyo</a>
      </nav>
      <a class="blog-cta" href="${attr(SITE_CONTACT)}">Projenizi konuşalım</a>
    </header>
    ${main}
    <footer class="blog-foot">
      ${brand(SITE_HOME)}
      <nav aria-label="Stüdyo köprüsü">
        <a href="${attr(SITE_HOME)}">Stüdyo</a>
        <a href="${attr(BLOG_PATH)}">Yazılar</a>
        <a href="${attr(SITE_CONTACT)}">Projenizi konuşalım</a>
      </nav>
    </footer>
    <script src="/blog/assets/share.js" defer></script>
  </body>
</html>`;
}

function crumbs(items) {
  return `<nav class="crumb" aria-label="Sayfa yolu"><ol>${items.map((item, index) => {
    const last = index === items.length - 1;
    return `<li>${last || !item.href ? `<span>${esc(item.label)}</span>` : `<a href="${attr(item.href)}">${esc(item.label)}</a>`}</li>`;
  }).join("")}</ol></nav>`;
}

export function renderIndexPage(posts) {
  const canonical = absoluteUrl(BLOG_PATH);
  const title = "Yazılar — Misal Works";
  const description = "Stüdyo üretiminden notlar. Film, ekran ve teslim üzerine yazılar.";
  const cards = posts.map((post) => `
    <a class="feed-card" href="${attr(post.path)}">
      <img src="${attr(post.coverSrc)}" alt="" width="1200" height="630" />
      <div>
        ${post.sample ? `<span class="kicker">ÖRNEK YAZI</span>` : `<span class="kicker">YAZI</span>`}
        <h2>${esc(post.title)}</h2>
        <p>${esc(post.description)}</p>
        <time datetime="${attr(post.date)}">${esc(post.dateLabel)}</time>
      </div>
    </a>`).join("");
  const main = `<main class="blog-main">
      ${crumbs([{ label: "Misal Works", href: SITE_HOME }, { label: "Yazılar" }])}
      <header class="blog-intro">
        <p class="kicker">YAZILAR</p>
        <h1>Stüdyodan notlar.</h1>
        <p>Burası ana sayfadaki galeri değil. Okumak, paylaşmak ve stüdyoya dönmek için ayrı duruyor.</p>
      </header>
      <section class="feed" aria-label="Yazı listesi">${cards}</section>
    </main>`;
  return chrome({
    title,
    description,
    canonical,
    image: posts[0]?.coverSrc,
    type: "website",
    bodyClass: "blog-index",
    extraHead: jsonLd({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Misal Works Yazıları",
      url: canonical,
      inLanguage: "tr",
      publisher: { "@type": "Organization", name: "Misal Works", url: absoluteUrl("/") },
    }),
    main,
  });
}

export function renderPostPage(post) {
  const canonical = absoluteUrl(post.path);
  const related = relatedLinks(post);
  const shareUrl = encodeURIComponent(canonical);
  const shareText = encodeURIComponent(post.title);
  const robots = post.sample ? "noindex, follow" : "index, follow";
  const relatedHtml = (related.works.length || related.services.length) ? `
        <div>
          <h2>Stüdyoda ilgili yerler</h2>
          <ul>
            ${related.works.map((item) => `<li><a href="${attr(item.href)}">${esc(item.title)}</a></li>`).join("")}
            ${related.services.map((item) => `<li><a href="${attr(item.href)}">${esc(item.title)}</a></li>`).join("")}
          </ul>
        </div>` : "";
  const extraHead = [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.dateModified || post.date,
      inLanguage: "tr",
      image: absoluteUrl(post.coverSrc),
      mainEntityOfPage: canonical,
      author: { "@type": "Person", name: "Bayram Şimşekoğlu", url: absoluteUrl(SITE_ABOUT) },
      publisher: { "@type": "Organization", name: "Misal Works", url: absoluteUrl("/") },
    }),
    jsonLd({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Misal Works", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Yazılar", item: absoluteUrl(BLOG_PATH) },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical },
      ],
    }),
  ].join("\n    ");
  const main = `<main class="blog-main">
      ${crumbs([{ label: "Misal Works", href: SITE_HOME }, { label: "Yazılar", href: BLOG_PATH }, { label: post.title }])}
      <header class="article-head">
        <p class="kicker">${post.sample ? "ÖRNEK YAZI" : "YAZI"}</p>
        <h1>${esc(post.title)}</h1>
        <p class="deck">${esc(post.description)}</p>
        <p class="byline">
          <a href="${attr(SITE_ABOUT)}">Bayram Şimşekoğlu</a>
          <time datetime="${attr(post.date)}">${esc(post.dateLabel)}</time>
        </p>
        ${post.sample ? `<p class="sample-note">Bu sayfa blogun biçimini kanıtlar. Asıl konu havuzu dolduğunda örnek işareti kalkar.</p>` : ""}
      </header>
      <figure class="cover"><img src="${attr(post.coverSrc)}" alt="${attr(post.title)}" width="1200" height="630" /></figure>
      <article class="prose">${post.bodyHtml}</article>
      <div class="share" aria-label="Paylaş">
        <button type="button" data-copy="${attr(canonical)}" data-label="Bağlantıyı kopyala">Bağlantıyı kopyala</button>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" rel="noopener noreferrer" target="_blank">LinkedIn</a>
        <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}" rel="noopener noreferrer" target="_blank">X</a>
      </div>
      <p class="share-note">Instagram ve YouTube kart göstermez. Orada görseli hikâyeye veya kapağa koyup bağlantıyı bio, sticker ya da açıklamaya yazın.</p>
      <aside class="bridge">
        ${relatedHtml}
        <div class="bridge-actions">
          <a class="primary" href="${attr(SITE_HOME)}">Stüdyoya bakın</a>
          <a href="${attr(SITE_CONTACT)}">Projenizi konuşalım</a>
        </div>
      </aside>
    </main>`;
  return chrome({
    title: `${post.title} — Misal Works`,
    ogTitle: post.title,
    description: post.description,
    canonical,
    image: post.coverSrc,
    type: "article",
    robots,
    extraHead,
    main,
  });
}

export function renderNotFoundPage() {
  const main = `<main class="blog-main missing">
      ${crumbs([{ label: "Misal Works", href: SITE_HOME }, { label: "Yazılar", href: BLOG_PATH }])}
      <p class="kicker">YAZILAR</p>
      <h1>Bu yazı yok.</h1>
      <p><a href="${attr(BLOG_PATH)}">Yazı listesine dön</a> ya da <a href="${attr(SITE_HOME)}">stüdyoya geçin</a>.</p>
    </main>`;
  return chrome({
    title: "Yazı bulunamadı — Misal Works",
    description: "İstenen yazı yayında değil.",
    canonical: absoluteUrl(BLOG_PATH),
    robots: "noindex, follow",
    main,
  });
}
