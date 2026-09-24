import { content } from "../content.js";

export const SITE_ORIGIN = "https://misalworks.com";
export const SITE_HOME = "/";
export const SITE_CONTACT = "/#contact";
export const SITE_ABOUT = "/#about";
export const SITE_WORK = "/#work";
export const SITE_SERVICES = "/#services";
export const BLOG_PATH = "/blog/";

const SERVICE_LABELS = {
  reklam: "Reklam Filmi",
  sosyal: "Sosyal Medya",
  tanitim: "Tanıtım",
  medikal: "Medikal",
  "acik-hava": "Açık Hava",
  "fuar-lansman": "Fuar ve Lansman",
  "urun-gorsellestirme": "Ürün Görselleştirme",
};

export function absoluteUrl(pathname) {
  if (!pathname) return SITE_ORIGIN + "/";
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_ORIGIN}${path}`;
}

export function coverSrc(cover) {
  if (!cover) return "/images/hero-portal.png";
  if (/^https?:\/\//i.test(cover) || cover.startsWith("/")) return cover;
  return `/images/${cover}`;
}

export function resolveWork(id) {
  const work = content.works.find((item) => item.id === id);
  if (!work) return null;
  return { id, title: work.title, href: SITE_WORK };
}

export function resolveService(id) {
  const title = SERVICE_LABELS[id];
  if (!title) return null;
  return { id, title, href: SITE_SERVICES };
}

export function relatedLinks(post) {
  const works = (post.relatedWorks || []).map(resolveWork).filter(Boolean);
  const services = (post.relatedServices || []).map(resolveService).filter(Boolean);
  return { works, services };
}
