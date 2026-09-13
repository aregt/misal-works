import React from "react";
import { createRoot } from "react-dom/client";
import { content } from "./content";
import "./styles.css";

const Arrow = () => <span aria-hidden="true">→</span>;
const image = (path) => `${import.meta.env.BASE_URL}images/${path}`;

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

function Brand({ light = false }) {
  const toTop = (e) => { e.preventDefault(); try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { window.scrollTo(0, 0); } };
  return <a className={`brand ${light ? "brand-light" : ""}`} href="#top" aria-label="Sayfa başına dön" onClick={toTop}><Mark /><span><b>MISAL WORKS</b><small>FİLM &amp; POST-PRODÜKSİYON</small></span></a>;
}

function Hero() {
  const [activeNav, setActiveNav] = React.useState(null);
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
  return <section className="hero">
    <img src={image("hero-portal.png")} alt="Işıklı bir geçide bakan kişi" />
    <header><Brand /><nav>{content.nav.map(([label, href]) => {
      const active = activeNav === href;
      const cls = active ? "is-active" : undefined;
      const cur = active ? "true" : undefined;
      return href === "#showreel"
        ? <a key={label} href={href} className={cls} aria-current={cur} onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("misal:open-showreel")); }}><span>{label}</span></a>
        : <a key={label} href={href} className={cls} aria-current={cur}><span>{label}</span></a>;
    })}</nav><a className="top-cta" href="#contact">İşinizi Anlatın <Arrow /></a><button className="menu" aria-label="Menü">☰</button></header>
    <div className="hero-copy">
      <p className="eyebrow">{content.hero.kicker}</p>
      <h1>{content.hero.title}<br /><em>{content.hero.titleItalic}</em></h1>
      <span className="short-rule" />
      <p>{content.hero.body}</p>
      <a className="pill" href="#work">{content.hero.action} <Arrow /></a>
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
      <img src={image(item.poster)} alt="" loading="lazy" />
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
  const posterSrc = image(item.poster);
  const isGallery = item.kind === "gallery" && Array.isArray(item.gallery) && item.gallery.length > 0;
  return <div className="viewer-stage" ref={stageRef}>
    <div className="viewer-blurbg" aria-hidden="true" style={{ backgroundImage: `url("${posterSrc}")` }} />
    {isGallery ? <div className="viewer-gallery">
      {item.gallery.map((g, i) => <figure key={`${item.id}-${i}`}>
        <img src={image(g.src)} alt={g.caption || `${item.title} görsel ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />
        {g.caption ? <figcaption>{g.caption}</figcaption> : null}
      </figure>)}
    </div> : (!videoError ? <video
      key={item.id}
      ref={videoRef}
      className="viewer-video"
      src={item.video}
      poster={posterSrc}
      controls
      playsInline
      preload="metadata"
      onError={onVideoError}
      onDoubleClick={onDoubleClick}
    /> : <img className="viewer-fallback" src={posterSrc} alt={`${item.title} önizleme`} />)}
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
    <p className="viewer-related-title">Aynı kategoriden diğer çalışmalar</p>
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
              <img src={image(rel.poster)} alt="" loading="lazy" />
              <i aria-hidden="true">{rel.kind === "gallery" ? "▦" : "▶"}</i>
            </span>
            <span className="viewer-thumb-text"><b>{rel.title}</b><span>{rel.sub}</span></span>
          </button>
        </li>;
      })}
    </ul>
  </div>;
}

const TAB_LABELS = { "motion-sosyal": "MOTION · SOSYAL" };

function WorkViewer({ active, tabs, onSelectTab, related, onSelect, onClose, videoRef, stageRef, muted, onToggleMute, videoError, onVideoError, onFullscreen, onStageDoubleClick }) {
  if (!active) return null;
  return <React.Fragment>
    <div className="viewer-tabs" role="tablist" aria-label="Çalışma kategorileri">
      {tabs.map((t) => <button
        key={t.category}
        type="button"
        role="tab"
        aria-selected={active.category === t.category}
        className={`viewer-tab${active.category === t.category ? " is-active" : ""}`}
        onClick={() => onSelectTab(t.category)}
      >{t.label}</button>)}
    </div>
    <div className="selected-viewer-inner">
    <button type="button" className="viewer-close" onClick={onClose} aria-label="İzleyiciyi kapat">✕</button>
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
    <RelatedWorks items={related} activeId={active.id} onSelect={onSelect} />
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
  const tabs = React.useMemo(() => {
    const seen = new Map();
    content.works.forEach((w) => {
      if (!seen.has(w.category)) seen.set(w.category, TAB_LABELS[w.category] || w.categoryLabel);
    });
    return [...seen.entries()].map(([category, label]) => ({ category, label }));
  }, []);

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
    if (!viewerMounted || !viewerExpanded) return;
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
          <a href="#services">{content.selected.action} <Arrow /></a>
        </aside>
        <div className="work-grid">{content.works.map(item => <WorkCard
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
    <img src={image("showreel.jpg")} alt="Yağmur altında sinematik portre" />
    <div className="show-copy"><p className="eyebrow">{content.showreel.kicker}</p><h2>{content.showreel.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2><span className="short-rule" /><p>{content.showreel.body.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</p></div>
    <button className="play" aria-label="Showreel'i oynat" aria-expanded={expanded} onClick={start}>▶</button><p className="watch">{content.showreel.watch.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</p>
    <div className="script reel-script">{content.showreel.script.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</div>
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
    <div className="ph-image"><img src={image("portrait.jpg")} alt="Işığa bakan kadın" /><span className="script">{content.philosophy.script.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</span></div>
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
    <nav className="ph-menu" aria-label="Uzmanlık alanları">
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

function Shape({ src }) { return <img className="shape" src={image(`services/${src}`)} alt="" />; }

function Services() {
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const [viewIdx, setViewIdx] = React.useState(-1);
  const [phase, setPhase] = React.useState("first");
  const swapTimer = React.useRef(null);
  const sectionRef = React.useRef(null);
  const active = activeIdx >= 0;
  const view = viewIdx >= 0 ? {
    title: content.services[viewIdx][1],
    body: content.servicePanels[viewIdx].body,
    examples: content.servicePanels[viewIdx].examples.map((id) => content.works.find((w) => w.id === id)).filter(Boolean),
  } : null;

  React.useEffect(() => () => { if (swapTimer.current) clearTimeout(swapTimer.current); }, []);

  React.useEffect(() => {
    if (activeIdx === -1) return;
    const onDocClick = (e) => {
      if (e.target && e.target.closest && !e.target.closest("#services")) {
        if (swapTimer.current) clearTimeout(swapTimer.current);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [activeIdx]);

  const select = (i) => {
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
  return <section ref={sectionRef} className={`services${active ? " is-open" : ""}`} id="services">
    <div className="services-intro"><p className="eyebrow">{content.servicesIntro.kicker}</p><h2>{content.servicesIntro.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2><p>{content.servicesIntro.body.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</p><a href="#contact">{content.servicesIntro.action} <Arrow /></a></div>
    <div className="service-list" role="tablist" aria-label="Çalışma alanları">{content.services.map(([img, title, sub], i) => <button
      key={title}
      type="button"
      role="tab"
      aria-selected={activeIdx === i}
      className={`service-card${activeIdx === i ? " is-active" : ""}`}
      onClick={() => select(i)}
    ><Shape src={img} /><b>{title}</b><span>{sub}</span></button>)}</div>
    {active && view ? <React.Fragment key={viewIdx}>
      <div className={phase === "leaving" ? "service-detail-info is-leaving" : phase === "swap" ? "service-detail-info is-swap-info" : "service-detail-info is-first"} role="tabpanel"><h3>{view.title}</h3><p>{view.body}</p></div>
      <div className={phase === "leaving" ? "service-detail-row is-leaving" : "service-detail-row"}>{view.examples.map((w, fi) => <figure
        key={w.id}
        className={phase === "swap" ? "service-example is-swap-fig" : "service-example"}
        style={phase === "swap" ? { animationDelay: `${fi * 60}ms` } : undefined}
      >
        <img src={image(w.poster)} alt={w.title} loading="lazy" />
        <figcaption><b>{w.title}</b><span>{w.sub}</span></figcaption>
      </figure>)}</div>
    </React.Fragment> : null}
  </section>;
}

function Footer() {
  return <footer id="contact"><div className="footer-bg" /><Brand light /><h2>{content.footer.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2><div className="footer-message">{content.footer.message.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</div><a className="light-pill" href="#contact">{content.footer.action} <Arrow /></a><div className="social">◎ &nbsp;&nbsp; in &nbsp;&nbsp; ▶</div><small>© 2026 MISAL WORKS. TÜM HAKLARI SAKLIDIR.</small></footer>;
}

function App() { return <main id="top"><Hero /><SelectedWork /><Showreel /><Philosophy /><Services /><Footer /></main>; }

createRoot(document.getElementById("root")).render(<App />);
