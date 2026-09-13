import React from "react";
import { createRoot } from "react-dom/client";
import { content } from "./content";
import "./styles.css";

const Arrow = () => <span aria-hidden="true">→</span>;
const image = (path) => `${import.meta.env.BASE_URL}images/${path}`;

function Mark() {
  return <span className="mark" aria-hidden="true"><i /><i /></span>;
}

function Brand({ light = false }) {
  return <div className={`brand ${light ? "brand-light" : ""}`}><Mark /><span><b>MISAL WORKS</b><small>FİLM &amp; POST-PRODÜKSİYON</small></span></div>;
}

function Hero() {
  return <section className="hero">
    <img src={image("hero-portal.png")} alt="Işıklı bir geçide bakan kişi" />
    <header><Brand /><nav>{content.nav.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav><a className="top-cta" href="#contact">İşinizi Anlatın <Arrow /></a><button className="menu" aria-label="Menü">☰</button></header>
    <div className="hero-copy">
      <p className="eyebrow">{content.hero.kicker}</p>
      <h1>{content.hero.title}<br /><em>{content.hero.titleItalic}</em></h1>
      <span className="short-rule" />
      <p>{content.hero.body}</p>
      <a className="pill" href="#work">{content.hero.action} <Arrow /></a>
    </div>
  </section>;
}

function WorkCard({ item }) {
  return <article className={`work-card ${item[3]}`}>
    <img src={image(item[0])} alt="" />
    <div><b>{item[1]}</b><span>{item[2]}</span></div>
  </article>;
}

function SelectedWork() {
  return <section className="selected" id="work">
    <aside>
      <p className="eyebrow">{content.selected.kicker}</p>
      <h2>{content.selected.title.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</h2>
      <span className="short-rule" />
      <a href="#services">{content.selected.action} <Arrow /></a>
    </aside>
    <div className="work-grid">{content.works.map(item => <WorkCard key={item[1]} item={item} />)}</div>
  </section>;
}

function Showreel() {
  return <section className="showreel" id="showreel">
    <img src={image("showreel.jpg")} alt="Yağmur altında sinematik portre" />
    <div className="show-copy"><p className="eyebrow">{content.showreel.kicker}</p><h2>{content.showreel.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2><span className="short-rule" /><p>{content.showreel.body.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</p></div>
    <button className="play" aria-label="Showreel'i oynat">▶</button><p className="watch">{content.showreel.watch.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</p>
    <div className="script reel-script">{content.showreel.script.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</div>
  </section>;
}

function Philosophy() {
  return <section className="philosophy" id="about">
    <div className="ph-image"><img src={image("portrait.jpg")} alt="Işığa bakan kadın" /><span className="script">{content.philosophy.script.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</span></div>
    <div className="ph-title"><p className="eyebrow">{content.philosophy.kicker}</p><h2>{content.philosophy.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2></div>
    <div className="ph-copy"><p>{content.philosophy.body}</p><a href="#contact">{content.philosophy.action} <Arrow /></a></div>
    <div className="ph-side">{content.philosophy.side.map(x => <React.Fragment key={x}>{x}<br /></React.Fragment>)}</div>
  </section>;
}

function Shape({ type, label }) { return <img className="shape" src={image(`services/${type}-v2.png`)} alt={`${label} için 3B heykel`} />; }

function Services() {
  return <section className="services" id="services">
    <div className="services-intro"><p className="eyebrow">{content.servicesIntro.kicker}</p><h2>{content.servicesIntro.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2><p>{content.servicesIntro.body.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</p><a href="#contact">{content.servicesIntro.action} <Arrow /></a></div>
    <div className="service-list">{content.services.map(([type, title, sub]) => <article key={title}><Shape type={type} label={title} /><b>{title}</b><span>{sub}</span></article>)}</div>
  </section>;
}

function Footer() {
  return <footer id="contact"><div className="footer-bg" /><Brand light /><h2>{content.footer.title.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h2><div className="footer-message">{content.footer.message.split("\n").map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</div><a className="light-pill" href="#contact">{content.footer.action} <Arrow /></a><div className="social">◎ &nbsp;&nbsp; in &nbsp;&nbsp; ▶</div><small>© 2026 MISAL WORKS. TÜM HAKLARI SAKLIDIR.</small></footer>;
}

function App() { return <main><Hero /><SelectedWork /><Showreel /><Philosophy /><Services /><Footer /></main>; }

createRoot(document.getElementById("root")).render(<App />);
