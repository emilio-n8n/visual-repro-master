import { useEffect, useRef } from "react";
import "@/styles/forma-landing.css";

const Index = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  // Custom cursor
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    const cursor = cursorRef.current!;
    const ring = ringRef.current!;
    let mx = 0, my = 0, rx = 0, ry = 0, raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + "px";
      cursor.style.top = my + "px";
    };
    const tick = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);

    const enter = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(2)";
      ring.style.width = "60px"; ring.style.height = "60px"; ring.style.opacity = "0.5";
    };
    const leave = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      ring.style.width = "36px"; ring.style.height = "36px"; ring.style.opacity = "1";
    };
    const targets = document.querySelectorAll(".forma-landing a, .forma-landing button, .slider-divider");
    targets.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".forma-landing .reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Before/after slider with auto-animation until first interaction
  useEffect(() => {
    const slider = sliderRef.current!;
    const after = afterRef.current!;
    const divider = dividerRef.current!;
    if (!slider || !after || !divider) return;

    let dragging = false;
    let interacted = false;
    let pos = 50;
    let dir = 1;
    let raf = 0;

    const setPos = (pct: number) => {
      pct = Math.max(5, Math.min(95, pct));
      pos = pct;
      after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      divider.style.left = pct + "%";
    };
    const setFromX = (x: number) => {
      const rect = slider.getBoundingClientRect();
      setPos(((x - rect.left) / rect.width) * 100);
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      interacted = true;
      e.preventDefault();
    };
    const onUp = () => { dragging = false; };
    const onMove = (e: MouseEvent) => { if (dragging) setFromX(e.clientX); };
    const onTouchMove = (e: TouchEvent) => { if (dragging) setFromX(e.touches[0].clientX); };

    divider.addEventListener("mousedown", onDown);
    divider.addEventListener("touchstart", onDown, { passive: false });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onTouchMove);

    const auto = () => {
      if (!interacted) {
        pos += dir * 0.15;
        if (pos > 75) dir = -1;
        if (pos < 25) dir = 1;
        setPos(pos);
      }
      raf = requestAnimationFrame(auto);
    };
    raf = requestAnimationFrame(auto);

    return () => {
      cancelAnimationFrame(raf);
      divider.removeEventListener("mousedown", onDown);
      divider.removeEventListener("touchstart", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // SEO
  useEffect(() => {
    document.title = "FORMA — Intelligence architecturale pour architectes";
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta(
      "description",
      "FORMA combine rendus 3D photoréalistes par IA et agent intelligent pour automatiser le quotidien des architectes."
    );
    setMeta("og:title", "FORMA — Intelligence architecturale", "property");
    setMeta(
      "og:description",
      "De la maquette 3D au rendu photoréaliste. De l'email à la gestion de projet. Conçu pour les architectes.",
      "property"
    );
    setMeta("og:type", "website", "property");
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/";
  }, []);

  return (
    <div className="forma-landing">
      <div className="forma-noise" />
      <div ref={cursorRef} className="forma-cursor" />
      <div ref={ringRef} className="forma-cursor-ring" />

      {/* JSON-LD SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "FORMA",
            applicationCategory: "DesignApplication",
            operatingSystem: "Web",
            description:
              "Plateforme IA pour architectes : rendus 3D photoréalistes et agent intelligent.",
            offers: { "@type": "Offer", price: "89", priceCurrency: "EUR" },
          }),
        }}
      />

      {/* NAV */}
      <nav>
        <a href="#" className="nav-logo">FORM<span>A</span></a>
        <div className="nav-links">
          <a href="#render">Render AI</a>
          <a href="#agent">Agent</a>
          <a href="#pricing">Tarifs</a>
          <a href="#about">À propos</a>
          <a href="#" className="nav-cta">Accès early</a>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-vignette" />
          <svg className="hero-shape" viewBox="0 0 700 700" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polygon points="350,50 650,200 650,500 350,650 50,500 50,200" fill="none" stroke="#C4A264" strokeWidth="1" />
            <polygon points="350,100 600,220 600,480 350,600 100,480 100,220" fill="none" stroke="#C4A264" strokeWidth="0.5" />
            <line x1="350" y1="50" x2="350" y2="650" stroke="#C4A264" strokeWidth="0.3" />
            <line x1="50" y1="200" x2="650" y2="500" stroke="#C4A264" strokeWidth="0.3" />
            <line x1="650" y1="200" x2="50" y2="500" stroke="#C4A264" strokeWidth="0.3" />
            <circle cx="350" cy="350" r="120" fill="none" stroke="#C4A264" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="hero-tag">Intelligence Architecturale</div>
        <h1 className="hero-title">
          L'IA qui<br />
          <em>comprend</em><br />
          l'architecture.
        </h1>
        <p className="hero-sub">
          De la maquette 3D au rendu photoréaliste. De l'email à la gestion de projet.
          Un seul outil conçu pour les architectes qui refusent le compromis.
        </p>
        <div className="hero-actions">
          <a href="#" className="btn-primary">Demander l'accès</a>
          <a href="#render" className="btn-ghost">Découvrir les outils</a>
        </div>

        <div className="hero-scroll">Scroll</div>
      </header>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stat-item reveal">
          <div className="stat-num">4<span>×</span></div>
          <div className="stat-label">Gain de temps moyen</div>
        </div>
        <div className="stat-item reveal">
          <div className="stat-num">98<span>%</span></div>
          <div className="stat-label">Précision des rendus</div>
        </div>
        <div className="stat-item reveal">
          <div className="stat-num">12<span>+</span></div>
          <div className="stat-label">Intégrations natives</div>
        </div>
        <div className="stat-item reveal">
          <div className="stat-num">{"<"} 30<span>s</span></div>
          <div className="stat-label">Temps de rendu moyen</div>
        </div>
      </div>

      {/* RENDER */}
      <section id="render">
        <div className="render-section">
          <div>
            <div className="section-tag reveal">Render AI</div>
            <h2 className="section-title reveal">
              Votre maquette 3D,<br /><em>transcendée.</em>
            </h2>
            <p className="section-desc reveal">
              Téléversez n'importe quel rendu 3D — SketchUp, Revit, Rhino, Blender —
              et obtenez en quelques secondes une image photoréaliste prête à présenter au client.
            </p>

            <div className="features-list reveal">
              {[
                ["✦", "Compatibilité universelle", "SketchUp, Revit, Rhino, Blender, ArchiCAD. Tous formats acceptés."],
                ["◈", "Contrôle de l'ambiance", "Heure du jour, météo, saison, intérieur ou extérieur. Prompt simple."],
                ["⬡", "Style architectural", "Brutalisme, minimalisme, contemporain, historique. L'IA adapte l'esthétique."],
                ["◎", "Cohérence de marque", "Entraînez le modèle sur vos propres projets pour un style signature."],
              ].map(([icon, name, desc]) => (
                <div className="feature-item" key={name}>
                  <div className="feature-icon">{icon}</div>
                  <div>
                    <div className="feature-name">{name}</div>
                    <div className="feature-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLIDER */}
          <div className="slider-wrap reveal" ref={sliderRef}>
            <div className="slider-before">
              <div className="img-before">
                <div className="wireframe" />
                <div className="wireframe-shape ws1" />
                <div className="wireframe-shape ws2" />
                <div className="wireframe-shape ws3" />
                <div className="wireframe-shape ws4" />
                <div className="wireframe-shape ws5" />
                <div className="ws-label">Rendu 3D — SketchUp</div>
              </div>
            </div>
            <div className="slider-after" ref={afterRef} style={{ clipPath: "inset(0 50% 0 0)" }}>
              <div className="img-after">
                <div className="photo-bg" />
                <div className="sky-glow" />
                <div className="building">
                  {[
                    [15, 10, 25, false], [15, 45, 25, true], [15, 70, 20, false],
                    [32, 10, 25, true], [32, 45, 25, false], [32, 70, 20, true],
                    [49, 10, 25, false], [49, 45, 25, true], [49, 70, 20, true],
                    [66, 10, 25, false], [66, 45, 25, false], [66, 70, 20, true],
                  ].map(([top, left, w, lit], i) => (
                    <div
                      key={i}
                      className={`building-win${lit ? " light" : ""}`}
                      style={{ top: `${top}%`, left: `${left}%`, width: `${w}%`, height: "12%" }}
                    />
                  ))}
                </div>
                <div className="reflection" />
                <div className="ground" />
                <div className="photo-label">FORMA Render AI</div>
              </div>
            </div>
            <div className="slider-divider" ref={dividerRef}>
              <div className="slider-handle">⟺</div>
            </div>
            <div className="slider-labels">
              <span className="slider-label">Rendu 3D</span>
              <span className="slider-label">Photoréaliste</span>
            </div>
          </div>
        </div>
      </section>

      <div className="sep-gold" />

      {/* AGENT */}
      <section id="agent" className="agent-section">
        <div className="agent-inner">
          <div className="reveal">
            <div className="agent-ui">
              <div className="agent-topbar">
                <div className="agent-dot" style={{ background: "#ff5f56" }} />
                <div className="agent-dot" style={{ background: "#ffbd2e" }} />
                <div className="agent-dot" style={{ background: "#27c93f" }} />
                <div className="agent-title-bar">FORMA Agent — Session active</div>
              </div>
              <div className="agent-body">
                <div className="agent-msg">
                  Résume les emails non lus de ce matin et priorise les demandes clients urgentes.
                </div>
                <div className="agent-msg ai">
                  J'ai trouvé 8 emails. 2 prioritaires : M. Dubois (délai permis) et Cabinet Archi+ (révision plans). Je rédige les réponses ?
                </div>
                <div className="agent-msg">
                  Oui, et planifie une réunion de suivi avec Archi+ cette semaine.
                </div>
                <div className="agent-msg ai">
                  Réponses rédigées. Réunion proposée jeudi 14h avec lien visio. Dois-je envoyer ?
                </div>
                <div className="agent-msg">
                  Parfait. Et vérifie les deadlines du projet Lyon.
                </div>
                <div className="agent-typing">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>

            <div className="integrations reveal">
              {[
                ["✉", "Gmail"],
                ["📅", "Calendrier"],
                ["📁", "Drive"],
                ["💬", "Slack"],
                ["📐", "Revit"],
                ["🔲", "Notion"],
              ].map(([icon, name]) => (
                <div className="integration-item" key={name}>
                  <span className="i-icon">{icon}</span>{name}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="section-tag reveal">Agent Généraliste</div>
            <h2 className="section-title reveal">
              Votre bureau,<br /><em>automatisé.</em>
            </h2>
            <p className="section-desc reveal">
              FORMA Agent orchestre votre workflow administratif : emails, plannings,
              devis, suivi de chantier. Il apprend vos habitudes et anticipe vos besoins.
            </p>

            <div className="capabilities reveal">
              {[
                ["Gestion emails & réponses automatiques", "live"],
                ["Planification et gestion agenda", "live"],
                ["Synthèse de réunions et comptes rendus", "live"],
                ["Suivi d'avancement de chantier", "live"],
                ["Génération de devis et factures", "soon"],
                ["Veille réglementaire (PLU, normes RT)", "soon"],
              ].map(([name, status]) => (
                <div className="cap-item" key={name}>
                  <span className="cap-name">{name}</span>
                  <span className={`cap-status ${status}`}>
                    {status === "live" ? "Disponible" : "Bientôt"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="section-tag reveal" style={{ justifyContent: "center" }}>Tarifs</div>
        <h2 className="section-title reveal" style={{ textAlign: "center", maxWidth: "none" }}>
          Choisissez votre <em>formule.</em>
        </h2>

        <div className="pricing-grid reveal">
          <div className="pricing-card">
            <div className="pricing-tier">Studio</div>
            <div className="pricing-price"><sup>€</sup>89<sub>/mois</sub></div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li>30 rendus photoréalistes / mois</li>
              <li>Agent email & agenda</li>
              <li>3 intégrations</li>
              <li>Résolution jusqu'à 2K</li>
              <li className="inactive">Style signature personnalisé</li>
              <li className="inactive">API access</li>
            </ul>
            <a href="#" className="pricing-cta">Commencer</a>
          </div>

          <div className="pricing-card featured">
            <div className="pricing-tier">Cabinet</div>
            <div className="pricing-price"><sup>€</sup>249<sub>/mois</sub></div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li>Rendus illimités</li>
              <li>Agent complet (email, agenda, devis)</li>
              <li>Intégrations illimitées</li>
              <li>Résolution jusqu'à 8K</li>
              <li>Style signature personnalisé</li>
              <li className="inactive">API access</li>
            </ul>
            <a href="#" className="pricing-cta">Commencer</a>
          </div>

          <div className="pricing-card">
            <div className="pricing-tier">Agence</div>
            <div className="pricing-price" style={{ fontSize: 36, paddingTop: 10 }}>Sur mesure</div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              <li>Volume illimité multi-utilisateurs</li>
              <li>Agent complet + veille réglementaire</li>
              <li>Intégrations sur-mesure</li>
              <li>Résolution 8K + batch processing</li>
              <li>Style signature & fine-tuning</li>
              <li>API access & webhooks</li>
            </ul>
            <a href="#" className="pricing-cta">Nous contacter</a>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <div className="testimonial-section reveal">
        <div className="sep-gold" style={{ marginBottom: 80 }} />
        <p className="testimonial-quote">
          "FORMA a transformé notre façon de présenter les projets. Les clients comprennent
          immédiatement l'espace — et les décisions vont deux fois plus vite."
        </p>
        <div className="testimonial-attr">
          <strong>Marie-Claire Fontaine</strong> — Associée, Fontaine & Beaumont Architectes
        </div>
        <div className="sep-gold" style={{ marginTop: 80 }} />
      </div>

      {/* FOOTER */}
      <footer className="forma-footer">
        <div>
          <div className="footer-brand">FORM<span>A</span></div>
          <div className="footer-tagline">
            Intelligence architecturale.<br />Conçu pour les esprits qui bâtissent.
          </div>
        </div>
        <div className="footer-col">
          <h4>Produit</h4>
          <a href="#">Render AI</a>
          <a href="#">Agent</a>
          <a href="#">Intégrations</a>
          <a href="#">Tarifs</a>
          <a href="#">Roadmap</a>
        </div>
        <div className="footer-col">
          <h4>Ressources</h4>
          <a href="#">Documentation</a>
          <a href="#">Galerie de rendus</a>
          <a href="#">Blog</a>
          <a href="#">Cas d'usage</a>
          <a href="#">API</a>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <a href="#">hello@forma.ai</a>
          <a href="#">LinkedIn</a>
          <a href="#">Instagram</a>
          <a href="#">Presse</a>
          <a href="#">Careers</a>
        </div>
      </footer>
      <div className="footer-bottom">
        <div className="footer-copy">© 2025 FORMA Technologies. Tous droits réservés.</div>
        <div className="footer-legal">
          <a href="#">Confidentialité</a>
          <a href="#">CGU</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </div>
  );
};

export default Index;
