import React from "react";
import { createRoot } from "react-dom/client";
import { content } from "./content";
import { MEDIA } from "./media";
import "./styles.css";

const Arrow = () => <span aria-hidden="true">→</span>;
const CloseMark = () => <span className="close-mark" aria-hidden="true"><i /><i /></span>;
const image = (path) => `${import.meta.env.BASE_URL}images/${path}`;
const imageWebp = (path, width) => image(path.replace(/\.(png|jpe?g)$/i, `-${width}.webp`));

function Picture({ src, alt, sizes, className, priority = false, width, height }) {
  const meta = MEDIA[src];
  const w = width || meta?.w;
  const h = height || meta?.h;
  const srcSet = meta ? meta.srcset.map((vw) => `${imageWebp(src, vw)} ${vw}w`).join(", ") : "";
  // Fallback, en büyük webp varyantıdır (FND-011: orijinal dosya repo'da olmayabilir).
  const fallback = meta?.srcset?.length
    ? imageWebp(src, meta.srcset[meta.srcset.length - 1])
    : image(src);
  return <picture className={className}>
    {srcSet ? <source type="image/webp" srcSet={srcSet} sizes={sizes} /> : null}
    <img
      src={fallback}
      alt={alt}
      width={w}
      height={h}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
    />
  </picture>;
}

function trackCenter(ref, duration) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const startY = window.scrollY;
  const start = performance.now();
  let raf = requestAnimationFrame(function step(now) {
    const node = ref.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      const target = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
      if (reduce) {
        window.scrollTo(0, target);
      } else {
        const t = Math.min(1, (now - start) / duration);
        const e = 1 - Math.pow(1 - t, 3);
        window.scrollTo(0, startY + (target - startY) * e);
      }
    }
    raf = reduce ? 0 : now - start < duration ? requestAnimationFrame(step) : 0;
  });
  return () => {
    if (raf) cancelAnimationFrame(raf);
    html.style.scrollBehavior = prev;
  };
}

function Mark() {
  return <span className="mark" aria-hidden="true"><i /><i /></span>;
}

function Brand({ light = false, onNavigate, href = "#top" }) {
  const isHash = href.startsWith("#");
  const onClick = (e) => {
    if (!isHash) { onNavigate?.(); return; }
    e.preventDefault();
    onNavigate?.();
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { window.scrollTo(0, 0); }
  };
  return <a className={`brand ${light ? "brand-light" : ""}`} href={href} aria-label={isHash ? "Sayfa başına dön" : "Misal Works ana sayfa"} onClick={onClick}><Mark /><span><b>MISAL WORKS</b><small>FİLM &amp; POST-PRODÜKSİYON</small></span></a>;
}

function Hero() {
  const [activeNav, setActiveNav] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => {
    const hrefs = content.nav.map(([, href]) => href).filter((h) => h && h.startsWith("#") && h.length > 1);
    const onScroll = () => {
      const items = [];
      for (const href of hrefs) {
        const el = document.querySelector(href);
        if (!el) continue;
        items.push({ href, el });
      }
      items.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      const line = 120;
      let current = null;
      for (const { href, el } of items) {
        if (el.getBoundingClientRect().top <= line) current = href;
      }
      if (items.length && window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = items[items.length - 1].href;
      }
      setActiveNav((prev) => (prev === current ? prev : current));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    const onPointer = (e) => { if (!e.target.closest("header")) setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    document.body.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1101px)");
    const close = () => { if (mq.matches) setMenuOpen(false); };
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);
  const closeMenu = () => setMenuOpen(false);
  return <section className="hero">
    <Picture src="hero-portal.png" alt="Işıklı bir geçide bakan kişi" sizes="100vw" priority />
    <header className={menuOpen ? "is-open" : undefined}>
      <Brand onNavigate={closeMenu} />
      <div className="nav-sheet" id="site-nav">
        <nav>{content.nav.map(([label, href]) => {
          const active = activeNav === href;
          const cls = active ? "is-active" : undefined;
          const cur = active ? "true" : undefined;
          const isPath = href.startsWith("/") && !href.startsWith("/#");
          if (href === "#showreel") {
            return <a key={label} href={href} className={cls} aria-current={cur} onClick={(e) => { e.preventDefault(); closeMenu(); window.dispatchEvent(new CustomEvent("misal:open-showreel")); }}><span>{label}</span></a>;
          }
          return <a key={label} href={href} className={cls} aria-current={cur} onClick={isPath ? undefined : closeMenu}><span>{label}</span></a>;
        })}</nav>
        <a className="top-cta" href="#contact" onClick={closeMenu}>Projenizi Konuşalım <Arrow /></a>
      </div>
      <button
        type="button"
        className="menu"
        aria-label={menuOpen ? "Menüyü kapat" : "Menü"}
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >☰</button>
    </header>
    <div className="hero-copy">
      <p className="eyebrow">{content.hero.kicker}</p>
      <h1>{content.hero.title}<br /><em>{content.hero.titleItalic}</em></h1>
      <span className="short-rule" />
      <p>{content.hero.body}</p>
    </div>
  </section>;
}

function WorkCard({ item, onOpen, cardRef }) {
  return <article className={`work-card ${item.layout || ""}`}>
    <button
      type="button"
      className="work-card-btn"
      ref={cardRef}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${item.categoryLabel} — ${item.title} çalışmasını ${item.kind === "gallery" ? "incele" : "izle"}`}
    >
      <Picture src={item.poster} alt="" sizes="(max-width: 800px) 92vw, 42vw" width={item.width} height={item.height} />
      <span className="work-card-play" aria-hidden="true">{item.kind === "gallery" ? "▦" : "▶"}</span>
      <span className="work-card-text">
        <b>{item.categoryLabel}</b>
        <strong>{item.title}</strong>
        <span>{item.sub}</span>
      </span>
    </button>
  </article>;
}

function WorkStage({ item, videoRef, stageRef, muted, onToggleMute, videoError, onVideoError, onDoubleClick, onFullscreen }) {
  const [frameIdx, setFrameIdx] = React.useState(0);
  const posterWebp = imageWebp(item.poster, 960);
  const blurSrc = imageWebp(item.poster, 480);
  const isGallery = item.kind === "gallery" && Array.isArray(item.gallery) && item.gallery.length > 0;
  const frames = isGallery ? item.gallery : [];
  React.useEffect(() => { setFrameIdx(0); }, [item.id]);
  return <div className="viewer-stage" ref={stageRef}>
    <div className="viewer-blurbg" aria-hidden="true" style={{ backgroundImage: `url("${blurSrc}")` }} />
    {isGallery ? <div className={`viewer-gallery${frames.length > 1 ? " has-frames" : ""}`}>
      {frames.map((g, i) => <figure key={`${item.id}-${i}`} className={i === frameIdx ? "is-current" : undefined}>
        <Picture src={g.src} alt={g.caption || `${item.title} görsel ${i + 1}`} sizes="(max-width: 900px) 92vw, 70vw" priority={i === 0} />
        {g.caption ? <figcaption>{g.caption}</figcaption> : null}
      </figure>)}
      {frames.length > 1 ? <ul className="viewer-frame-thumbs" aria-label="Kareler">
        {frames.map((g, i) => <li key={`${item.id}-thumb-${i}`}>
          <button
            type="button"
            className={`viewer-frame-thumb${i === frameIdx ? " is-active" : ""}`}
            aria-label={g.caption || `${item.title} görsel ${i + 1}`}
            aria-current={i === frameIdx ? "true" : undefined}
            onClick={() => setFrameIdx(i)}
          >
            <Picture src={g.src} alt="" sizes="72px" />
          </button>
        </li>)}
      </ul> : null}
    </div> : (!videoError ? <video
      key={item.id}
      ref={videoRef}
      className="viewer-video"
      src={item.video}
      poster={posterWebp}
      controls
      playsInline
      preload="metadata"
      onError={onVideoError}
      onDoubleClick={onDoubleClick}
    /> : <Picture className="viewer-fallback" src={item.poster} alt={`${item.title} önizleme`} sizes="(max-width: 900px) 92vw, 70vw" priority width={item.width} height={item.height} />)}
    <span className="viewer-kind" aria-hidden="true">{isGallery ? "▦ Galeri" : "▶ Video"}</span>
    {muted && !videoError && !isGallery ? <button type="button" className="viewer-unmute" onClick={onToggleMute}>Sesi aç</button> : null}
    <button type="button" className="viewer-fullscreen" onClick={onFullscreen} aria-label="Tam ekran">⛶</button>
  </div>;
}

function WorkInfo({ item }) {
  return <div className="viewer-info">
    <p className="eyebrow">{item.categoryLabel}</p>
    <h3>{item.title}</h3>
    <p className="viewer-sub">{item.sub}</p>
    {item.description ? <p className="viewer-desc">{item.description}</p> : null}
  </div>;
}

function RelatedWorks({ items, activeId, onSelect }) {
  return <div className="viewer-related">
    <p className="viewer-related-title">Aynı kategorideki çalışmalar</p>
    <ul>
      {items.map((rel) => {
        const isActive = rel.id === activeId;
        const ratio = rel.width && rel.height ? `${rel.width} / ${rel.height}` : undefined;
        return <li key={rel.id}>
          <button
            type="button"
            className={`viewer-thumb${isActive ? " is-active" : ""}`}
            onClick={() => onSelect(rel.id)}
            aria-current={isActive ? "true" : undefined}
            aria-label={`${rel.title} çalışmasını ${rel.kind === "gallery" ? "incele" : "izle"}`}
          >
            <span className="viewer-thumb-img" style={ratio ? { aspectRatio: ratio } : undefined}>
              <Picture src={rel.poster} alt="" sizes="132px" width={rel.width} height={rel.height} />
              <i aria-hidden="true">{rel.kind === "gallery" ? "▦" : "▶"}</i>
            </span>
            <span className="viewer-thumb-text"><b>{rel.title}</b><span>{rel.sub}</span></span>
          </button>
        </li>;
      })}
    </ul>
  </div>;
}

function WorkViewer({ active, tabs, onSelectTab, related, onSelect, onClose, videoRef, stageRef, muted, onToggleMute, videoError, onVideoError, onFullscreen, onStageDoubleClick }) {
  if (!active) return null;
  const frameCount = active.kind === "gallery" && Array.isArray(active.gallery) ? active.gallery.length : 0;
  const stripCount = frameCount > 1 ? frameCount : (related.length > 1 ? related.length : 0);
  const stripRows = stripCount > 2 ? 2 : (stripCount > 0 ? 1 : 0);
  return <React.Fragment>
    {tabs.length > 0 ? <div className="viewer-tabs" role="tablist" aria-label="Çalışma kategorileri">
      {tabs.map((t) => <button
        key={t.category}
        type="button"
        role="tab"
        disabled={!t.available}
        title={t.available ? (t.full || t.label) : "Bu kategoride henüz çalışma yok"}
        aria-selected={active.category === t.category}
        aria-disabled={!t.available || undefined}
        className={`viewer-tab${active.category === t.category ? " is-active" : ""}${!t.available ? " is-disabled" : ""}`}
        onClick={() => onSelectTab(t.category)}
      >{t.label}</button>)}
    </div> : null}
    <div className={`selected-viewer-inner${related.length > 1 ? " has-rail" : ""}${frameCount > 1 ? " has-frames" : ""}${stripRows ? ` strip-rows-${stripRows}` : ""}`}>
    <button type="button" className="viewer-close" onClick={onClose} aria-label="İzleyiciyi kapat"><CloseMark /></button>
    <div className="viewer-main">
      <WorkInfo item={active} />
      <WorkStage
        item={active}
        videoRef={videoRef}
        stageRef={stageRef}
        muted={muted}
        onToggleMute={onToggleMute}
        videoError={videoError}
        onVideoError={onVideoError}
        onDoubleClick={onStageDoubleClick}
        onFullscreen={onFullscreen}
      />
    </div>
    {related.length > 1 ? <RelatedWorks items={related} activeId={active.id} onSelect={onSelect} /> : null}
    </div>
  </React.Fragment>;
}

function SelectedWork() {
  const [activeWorkId, setActiveWorkId] = React.useState(null);
  const [viewerMounted, setViewerMounted] = React.useState(false);
  const [viewerExpanded, setViewerExpanded] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);
  const videoRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const sectionRef = React.useRef(null);
  const openerRef = React.useRef(null);
  const closeTimer = React.useRef(null);
  const cardRefs = React.useRef(new Map());

  const active = content.works.find((w) => w.id === activeWorkId) || null;
  const related = React.useMemo(() => {
    if (!active) return [];
    return content.works.filter((w) => w.category === active.category);
  }, [active]);
  const tabs = React.useMemo(() => content.galleryTabs.map((tab) => ({
    ...tab,
    available: content.works.some((work) => work.category === tab.category),
  })), []);

  const openViewer = React.useCallback((id, openerEl) => {
    if (viewerMounted) {
      setActiveWorkId(id);
      setVideoError(false);
      setMuted(false);
      return;
    }
    openerRef.current = openerEl || document.activeElement;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveWorkId(id);
    setVideoError(false);
    setMuted(false);
    setViewerMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setViewerExpanded(true)));
  }, [viewerMounted]);

  const closeViewer = React.useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setViewerExpanded(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setViewerMounted(false);
      const opener = openerRef.current;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    }, 520);
  }, []);

  const selectWork = React.useCallback((id) => {
    setActiveWorkId(id);
    setVideoError(false);
    setMuted(false);
  }, []);

  const selectTab = React.useCallback((category) => {
    const first = content.works.find((w) => w.category === category);
    if (first) selectWork(first.id);
  }, [selectWork]);

  React.useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  React.useEffect(() => {
    if (!viewerMounted) return;
    const mq = window.matchMedia("(max-width: 1100px)");
    const sync = () => {
      document.body.classList.toggle("viewer-open", mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      document.body.classList.remove("viewer-open");
    };
  }, [viewerMounted]);

  React.useEffect(() => {
    if (!viewerMounted || !viewerExpanded) return;
    const mq = window.matchMedia("(max-width: 1100px)");
    let stopTrack = null;
    const center = () => {
      if (mq.matches || !sectionRef.current) return;
      try { sectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
    };
    const apply = () => {
      if (stopTrack) {
        stopTrack();
        stopTrack = null;
      }
      if (mq.matches) return;
      stopTrack = trackCenter(sectionRef, 600);
    };
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", center);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", center);
      if (stopTrack) stopTrack();
    };
  }, [viewerMounted, viewerExpanded]);

  React.useEffect(() => {
    if (!viewerMounted) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          return;
        }
        closeViewer();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewerMounted, closeViewer]);

  React.useEffect(() => {
    if (!viewerMounted || !viewerExpanded || !active) return;
    if (active.kind === "gallery") return;
    setVideoError(false);
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.currentTime = 0;
    const attempt = v.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        try {
          v.muted = true;
          setMuted(true);
          v.play().catch(() => {});
        } catch {}
      });
    }
  }, [viewerMounted, viewerExpanded, activeWorkId, active]);

  const handleFullscreen = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (stage.requestFullscreen) stage.requestFullscreen().catch(() => {});
  };

  const handleStageDoubleClick = (e) => {
    e.preventDefault();
    handleFullscreen();
  };

  const handleToggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {});
  };

  return <React.Fragment>
  {viewerMounted ? <div className="selected-scrim" aria-hidden="true" onClick={closeViewer} /> : null}
  <section ref={sectionRef} className={`selected${viewerMounted ? " is-open" : ""}${viewerExpanded ? " is-playing" : ""}`} id="work">
    <div className="selected-overview" aria-hidden={viewerMounted}>
      <div className="selected-overview-inner">
        <aside>
          <p className="eyebrow">{content.selected.kicker}</p>
          <h2>{content.selected.title.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</h2>
          <span className="short-rule" />
          <p className="selected-body">{content.selected.body}</p>
        </aside>
        <div className="work-grid">{content.works.filter((item) => !item.detailOnly).map(item => <WorkCard
          key={item.id}
          item={item}
          onOpen={(e) => openViewer(item.id, e.currentTarget)}
          cardRef={(el) => { if (el) cardRefs.current.set(item.id, el); }}
        />)}</div>
      </div>
    </div>
    {viewerMounted && active ? <div className="selected-viewer">
      <WorkViewer
        active={active}
        tabs={tabs}
        onSelectTab={selectTab}
        related={related}
        onSelect={selectWork}
        onClose={closeViewer}
        videoRef={videoRef}
        stageRef={stageRef}
        muted={muted}
        onToggleMute={handleToggleMute}
        videoError={videoError}
        onVideoError={() => setVideoError(true)}
        onFullscreen={handleFullscreen}
        onStageDoubleClick={handleStageDoubleClick}
      />
    </div> : null}
  </section>
  </React.Fragment>;
}

function Showreel() {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const sectionRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const closeTimer = React.useRef(null);
  const resumeTimer = React.useRef(null);
  const activeRef = React.useRef(false);

  const start = () => {
    if (open) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
  };

  const sendCommand = React.useCallback((func) => {
    const frame = frameRef.current;
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
    } catch (e) {}
  }, []);

  const playReel = React.useCallback(() => {
    if (!activeRef.current) return;
    sendCommand("playVideo");
  }, [sendCommand]);

  const stop = React.useCallback(() => {
    activeRef.current = false;
    setExpanded(false);
    if (resumeTimer.current) { clearTimeout(resumeTimer.current); resumeTimer.current = null; }
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 520);
  }, []);

  const onReelEnter = () => {
    if (!open || !expanded || !activeRef.current || resumeTimer.current) return;
    resumeTimer.current = setTimeout(() => {
      resumeTimer.current = null;
      playReel();
    }, 3000);
  };

  const onReelLeave = () => {
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  };

  React.useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  React.useEffect(() => {
    if (!open || !expanded) {
      activeRef.current = false;
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    activeRef.current = true;
    const startResumeCountdown = () => {
      if (resumeTimer.current) return;
      resumeTimer.current = setTimeout(() => {
        resumeTimer.current = null;
        if (!activeRef.current) return;
        sendCommand("playVideo");
      }, 3000);
    };
    const evaluate = () => {
      if (!activeRef.current) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      const ratio = rect.height > 0 ? visible / rect.height : 0;
      if (ratio <= 0.5) {
        sendCommand("pauseVideo");
        return;
      }
      if (section.matches && section.matches(":hover")) startResumeCountdown();
    };
    const onScroll = () => {
      if (resumeTimer.current) {
        clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
      evaluate();
    };
    evaluate();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", evaluate);
    return () => {
      activeRef.current = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", evaluate);
    };
  }, [open, expanded, sendCommand]);

  React.useEffect(() => {
    const onOpenEvent = () => {
      if (open) {
        try { sectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
      } else {
        start();
      }
    };
    window.addEventListener("misal:open-showreel", onOpenEvent);
    return () => window.removeEventListener("misal:open-showreel", onOpenEvent);
  }, [open]);

  React.useEffect(() => {
    if (!open || !expanded) return;
    const stopTrack = trackCenter(sectionRef, 600);
    const center = () => {
      if (!sectionRef.current) return;
      try { sectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
    };
    const onResize = () => center();
    window.addEventListener("resize", onResize);
    return () => {
      stopTrack();
      window.removeEventListener("resize", onResize);
    };
  }, [open, expanded]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") stop();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, stop]);

  return <React.Fragment>
  {open ? <div className="showreel-scrim" aria-hidden="true" onClick={stop} /> : null}
  <section ref={sectionRef} className={`showreel${open ? " is-open" : ""}${expanded ? " is-playing" : ""}`} id="showreel" onClick={() => { if (!open) start(); }} onMouseEnter={onReelEnter} onMouseLeave={onReelLeave}>
    <Picture src="showreel.jpg" alt="Yağmur altında sinematik portre" sizes="100vw" />
    <div className="show-copy"><p className="eyebrow">{content.showreel.kicker}</p><h2>{content.showreel.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2><span className="short-rule" /><p>{content.showreel.body.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</p></div>
    <button className="play" aria-label="Showreel'i oynat" aria-expanded={expanded} onClick={start}>▶</button><p className="watch">{content.showreel.watch.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</p>
    {open ? <div className="showreel-player" aria-hidden={!expanded}>
      <div className="showreel-player-inner">
        <aside className="showreel-side">
          <p className="showreel-brand">{content.showreel.sideBrand}</p>
          <h3>{content.showreel.sideTitle}</h3>
          <span className="short-rule" />
          <p>{content.showreel.sideBody}</p>
          <ul>{content.showreel.sideMeta.map((m) => <li key={m}>{m}</li>)}</ul>
        </aside>
        <div className="showreel-media">
          <button type="button" className="showreel-x" onClick={stop} aria-label="Showreel'i kapat">✕</button>
          {expanded ? <iframe
            ref={frameRef}
            className="showreel-video"
            src={`https://www.youtube-nocookie.com/embed/${content.showreel.youtubeId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&playsinline=1`}
            title="Misal Works Showreel"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          /> : null}
        </div>
      </div>
    </div> : null}
  </section>
  </React.Fragment>;
}

function Philosophy() {
  const chapters = content.philosophy.chapters;
  const cards = React.useMemo(() => [{ name: "", text: content.philosophy.lead }].concat(chapters.map(([name, text]) => ({ name, text }))), [chapters]);
  const [page, setPage] = React.useState(0);
  const pageRef = React.useRef(0);
  const scrollRef = React.useRef(null);
  const cardRefs = React.useRef([]);
  const touchY = React.useRef(0);
  const active = page - 1;

  React.useEffect(() => { pageRef.current = page; }, [page]);

  React.useEffect(() => {
    const node = cardRefs.current[page];
    if (node) node.scrollTop = 0;
  }, [page]);

  React.useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let lock = 0;
    const onWheel = (e) => {
      const now = performance.now();
      if (now - lock < 750) { e.preventDefault(); return; }
      const card = cardRefs.current[pageRef.current];
      if (card && card.scrollHeight > card.clientHeight + 2) {
        const atCardTop = card.scrollTop <= 1;
        const atCardBottom = card.scrollTop + card.clientHeight >= card.scrollHeight - 2;
        if ((e.deltaY < 0 && !atCardTop) || (e.deltaY > 0 && !atCardBottom)) return;
      }
      if (!e.deltaY) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const p = pageRef.current;
      const n = Math.min(cards.length - 1, Math.max(0, p + dir));
      if (n === p) return;
      e.preventDefault();
      lock = now;
      setPage(n);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [cards.length]);

  const step = (dir) => setPage((p) => Math.min(cards.length - 1, Math.max(0, p + dir)));

  const goTo = (i) => {
    setPage(i + 1);
  };

  const onTouchStart = (e) => { touchY.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    const dy = touchY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 42) step(dy > 0 ? 1 : -1);
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); step(-1); }
  };

  return <section
    className={`philosophy${page === 0 ? " at-top" : ""}`}
    id="about"
  >
    <div className="ph-image"><Picture src="portrait.jpg" alt="Işığa bakan kadın" sizes="(max-width: 900px) 100vw, 26vw" /></div>
    <div className="ph-title"><p className="eyebrow">{content.philosophy.kicker}</p><button type="button" className="ph-title-btn" onClick={() => setPage(0)} aria-label="Başa dön">{content.philosophy.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</button></div>
    <div className="ph-copy">
      <div className="ph-copy-scroll" ref={scrollRef} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Bayram Şimşekoğlu hakkında" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onKeyDown={onKey}>
        {cards.map((card, i) => <article
          key={card.name || "lead"}
          ref={(el) => { cardRefs.current[i] = el; }}
          className={`ph-card${i === page ? " is-in" : ""}`}
          aria-hidden={i === page ? undefined : "true"}
        >
          {card.name ? <h3>{card.name}</h3> : null}
          <p>{card.text}</p>
        </article>)}
      </div>
    </div>
    <nav className="ph-menu" aria-label="Çalışma biçimim">
      {chapters.map(([name], i) => <button
        key={name}
        type="button"
        className={`ph-menu-item${active === i ? " is-active" : ""}`}
        aria-current={active === i ? "true" : undefined}
        onClick={() => goTo(i)}
      >{name}</button>)}
    </nav>
  </section>;
}

function Shape({ src, title }) { return <Picture className="shape" src={`services/${src}`} alt={`[GEÇİCİ] ${title} ikonu`} sizes="160px" />; }

function serviceView(idx) {
  const [, title] = content.services[idx];
  const panel = content.servicePanels[idx];
  return {
    title,
    body: panel.body,
    examples: panel.examples.map((id) => content.works.find((w) => w.id === id)).filter(Boolean),
  };
}

function Services() {
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const [viewIdx, setViewIdx] = React.useState(-1);
  const [exampleIdx, setExampleIdx] = React.useState(0);
  const [phase, setPhase] = React.useState("first");
  const [viewerMounted, setViewerMounted] = React.useState(false);
  const [viewerExpanded, setViewerExpanded] = React.useState(false);
  const sectionRef = React.useRef(null);
  const openerRef = React.useRef(null);
  const closeTimer = React.useRef(null);
  const swapTimer = React.useRef(null);
  const panelIdx = viewerMounted ? activeIdx : viewIdx;
  const view = panelIdx >= 0 ? serviceView(panelIdx) : null;
  const frameCount = view ? view.examples.length : 0;
  const stripRows = frameCount > 2 ? 2 : (frameCount > 1 ? 1 : 0);
  const selectedExample = view && frameCount
    ? view.examples[Math.min(exampleIdx, frameCount - 1)]
    : null;
  const desktopOpen = activeIdx >= 0 && !viewerMounted;

  const isNarrow = () => window.matchMedia("(max-width: 1100px)").matches;

  const closeOverlay = React.useCallback(() => {
    setViewerExpanded(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setViewerMounted(false);
      setActiveIdx(-1);
      setViewIdx(-1);
      const opener = openerRef.current;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    }, 520);
  }, []);

  const openOverlay = (i, openerEl) => {
    openerRef.current = openerEl || document.activeElement;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (swapTimer.current) clearTimeout(swapTimer.current);
    setActiveIdx(i);
    setViewIdx(i);
    setExampleIdx(0);
    if (viewerMounted) return;
    setViewerMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setViewerExpanded(true)));
  };

  const selectDesktop = (i) => {
    if (i === activeIdx) {
      if (swapTimer.current) clearTimeout(swapTimer.current);
      setActiveIdx(-1);
      return;
    }
    if (activeIdx === -1) {
      setActiveIdx(i);
      setViewIdx(i);
      setPhase("first");
      trackCenter(sectionRef, 600);
    } else {
      if (swapTimer.current) clearTimeout(swapTimer.current);
      setActiveIdx(i);
      setPhase("leaving");
      swapTimer.current = setTimeout(() => {
        setViewIdx(i);
        setPhase("swap");
      }, 220);
    }
  };

  const onCardClick = (i, openerEl) => {
    if (isNarrow()) openOverlay(i, openerEl);
    else selectDesktop(i);
  };

  React.useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (swapTimer.current) clearTimeout(swapTimer.current);
  }, []);
  React.useEffect(() => { setExampleIdx(0); }, [viewIdx]);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)");
    const onChange = () => {
      if (mq.matches) {
        if (activeIdx >= 0 && !viewerMounted) {
          setViewerMounted(true);
          setViewerExpanded(true);
        }
      } else if (viewerMounted) {
        setViewerMounted(false);
        setViewerExpanded(false);
        document.body.classList.remove("viewer-open");
        if (activeIdx >= 0) {
          setViewIdx(activeIdx);
          setPhase("first");
        }
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [activeIdx, viewerMounted]);

  React.useEffect(() => {
    if (!viewerMounted) return;
    const mq = window.matchMedia("(max-width: 1100px)");
    const sync = () => {
      document.body.classList.toggle("viewer-open", mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      document.body.classList.remove("viewer-open");
    };
  }, [viewerMounted]);

  React.useEffect(() => {
    if (activeIdx === -1 || viewerMounted) return;
    const onDocClick = (e) => {
      if (e.target && e.target.closest && !e.target.closest("#services")) {
        if (swapTimer.current) clearTimeout(swapTimer.current);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [activeIdx, viewerMounted]);

  React.useEffect(() => {
    if (!viewerMounted) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeOverlay();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewerMounted, closeOverlay]);

  return <React.Fragment>
    {viewerMounted ? <div className="selected-scrim" aria-hidden="true" onClick={closeOverlay} /> : null}
    <section ref={sectionRef} className={`services${desktopOpen || viewerMounted ? " is-open" : ""}${viewerExpanded ? " is-playing" : ""}`} id="services">
      <div className="services-intro"><p className="eyebrow">{content.servicesIntro.kicker}</p><h2>{content.servicesIntro.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2><p>{content.servicesIntro.body.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</p><a href="#contact">{content.servicesIntro.action} <Arrow /></a></div>
      <div className="service-list" role="tablist" aria-label="Çalışma alanları">{content.services.map(([img, title, sub], i) => <button
        key={title}
        type="button"
        role="tab"
        aria-selected={activeIdx === i}
        aria-haspopup={viewerMounted ? "dialog" : undefined}
        className={`service-card${activeIdx === i ? " is-active" : ""}`}
        onClick={(e) => onCardClick(i, e.currentTarget)}
      ><Shape src={img} title={title} /><b>{title}</b><span>{sub}</span></button>)}</div>
      {desktopOpen && view ? <React.Fragment key={viewIdx}>
        <div className={phase === "leaving" ? "service-detail-info is-leaving" : phase === "swap" ? "service-detail-info is-swap-info" : "service-detail-info is-first"} role="tabpanel"><h3>{view.title}</h3><p>{view.body}</p></div>
        <div className={`${phase === "leaving" ? "service-detail-row is-leaving" : "service-detail-row"}${view.examples.length > 1 ? " has-thumbs" : ""}`}>
          {view.examples.length > 1 ? <ul className="service-thumbs" aria-label="Örnek kareler">
            {view.examples.map((w, fi) => <li key={w.id}>
              <button
                type="button"
                className={`service-thumb${fi === exampleIdx ? " is-active" : ""}`}
                aria-current={fi === exampleIdx ? "true" : undefined}
                aria-label={w.title}
                onClick={() => setExampleIdx(fi)}
              >
                <Picture src={w.poster} alt="" sizes="72px" width={w.width} height={w.height} />
              </button>
            </li>)}
          </ul> : null}
          {selectedExample ? <figure className={phase === "swap" ? "service-example is-swap-fig" : "service-example"}>
            <Picture src={selectedExample.poster} alt={`[GEÇİCİ] ${selectedExample.title} karesi`} sizes="(max-width: 1100px) 72vw, 420px" width={selectedExample.width} height={selectedExample.height} priority />
            <figcaption><b>{selectedExample.title}</b><span>{selectedExample.sub}</span></figcaption>
          </figure> : null}
        </div>
      </React.Fragment> : null}
      {viewerMounted && view ? <div className="selected-viewer">
        <div className={`selected-viewer-inner${frameCount > 1 ? " has-frames" : ""}${stripRows ? ` strip-rows-${stripRows}` : ""}`}>
          <button type="button" className="viewer-close" onClick={closeOverlay} aria-label="İzleyiciyi kapat"><CloseMark /></button>
          <div className="viewer-main">
            <div className="viewer-info">
              <h3>{view.title}</h3>
              <p className="viewer-desc">{view.body}</p>
            </div>
            {selectedExample ? <div className="viewer-stage">
              <div className={`viewer-gallery${frameCount > 1 ? " has-frames" : ""}`}>
                {view.examples.map((w, i) => <figure key={w.id} className={i === exampleIdx ? "is-current" : undefined}>
                  <Picture src={w.poster} alt={`[GEÇİCİ] ${w.title} karesi`} sizes="(max-width: 1100px) 92vw, 70vw" width={w.width} height={w.height} priority={i === 0} />
                  <figcaption><b>{w.title}</b> {w.sub}</figcaption>
                </figure>)}
                {frameCount > 1 ? <ul className="viewer-frame-thumbs" aria-label="Örnek kareler">
                  {view.examples.map((w, i) => <li key={`${w.id}-thumb`}>
                    <button
                      type="button"
                      className={`viewer-frame-thumb${i === exampleIdx ? " is-active" : ""}`}
                      aria-label={w.title}
                      aria-current={i === exampleIdx ? "true" : undefined}
                      onClick={() => setExampleIdx(i)}
                    >
                      <Picture src={w.poster} alt="" sizes="72px" width={w.width} height={w.height} />
                    </button>
                  </li>)}
                </ul> : null}
              </div>
            </div> : null}
          </div>
        </div>
      </div> : null}
    </section>
  </React.Fragment>;
}

function Footer() {
  return <footer id="contact">
    <div className="footer-bg" />
    <Brand light />
    <h2>{content.footer.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2>
    <div className="footer-message">
      <p>{content.footer.message}</p>
      <p className="footer-blog"><a href="/blog/">Yazılar</a></p>
      <address className="footer-contact">
        <a href={content.footer.phoneHref}>{content.footer.phone}</a>
        <a href={`mailto:${content.footer.email}`}>{content.footer.email}</a>
        <strong>{content.footer.location}</strong>
        <span>{content.footer.address}</span>
      </address>
    </div>
    <a className="light-pill" href={`mailto:${content.footer.email}`}>{content.footer.action} <Arrow /></a>
    <div className="social">◎ &nbsp;&nbsp; in &nbsp;&nbsp; <a href="https://www.youtube.com/@misalworks" rel="me" aria-label="YouTube">▶</a></div>
    <small>© 2026 MISAL WORKS. TÜM HAKLARI SAKLIDIR.</small>
  </footer>;
}

function App() { return <main id="top"><Hero /><SelectedWork /><Showreel /><Philosophy /><Services /><Footer /></main>; }

// Prerendered static HTML sits in #root until React mounts; clear it to avoid duplicate DOM.
const rootEl = document.getElementById("root");
rootEl.textContent = "";
createRoot(rootEl).render(<App />);
