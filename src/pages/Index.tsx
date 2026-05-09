import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Image as ImageIcon, Bot, Zap, Layers, Shield, Check } from "lucide-react";

const COLORS = {
  bg: "#0a0908",
  surface: "#13110f",
  ivory: "#F0EAE0",
  ivoryDim: "rgba(240,234,224,0.55)",
  gold: "#C4A264",
  goldSoft: "rgba(196,162,100,0.12)",
  border: "rgba(240,234,224,0.08)",
};

const fontSerif = "'Cormorant Garamond', 'Times New Roman', serif";
const fontSans = "'DM Sans', system-ui, sans-serif";

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  // Inject Google Fonts once
  useEffect(() => {
    if (document.getElementById("forma-fonts")) return;
    const link = document.createElement("link");
    link.id = "forma-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  // SEO
  useEffect(() => {
    document.title = "FORMA — L'IA des architectes";
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
      "FORMA — Studio IA pour architectes. Rendus photoréalistes, agent assistant, mémoire de cabinet, équipe en temps réel."
    );
    setMeta("og:title", "FORMA — L'IA des architectes", "property");
    setMeta(
      "og:description",
      "Rendus, écriture, gestion. Un studio IA conçu pour la pratique architecturale.",
      "property"
    );
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Subtle parallax on hero orbs
  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const y = window.scrollY;
      const orbs = heroRef.current.querySelectorAll<HTMLElement>("[data-orb]");
      orbs.forEach((o, i) => {
        o.style.transform = `translate3d(0, ${y * (i % 2 === 0 ? 0.15 : -0.1)}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.ivory,
        fontFamily: fontSans,
        fontWeight: 300,
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* Grain overlay */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.035,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay",
          zIndex: 1,
        }}
      />

      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(to bottom, rgba(10,9,8,0.85), transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: fontSerif,
            fontSize: 22,
            letterSpacing: "0.4em",
            color: COLORS.ivory,
            textDecoration: "none",
          }}
        >
          FORM<span style={{ color: COLORS.gold }}>A</span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          {[
            ["Render", "#render"],
            ["Agent", "#agent"],
            ["Tarifs", "#pricing"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              style={{
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: COLORS.ivoryDim,
                textDecoration: "none",
              }}
              className="hover:!text-[#F0EAE0] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
        <Link
          to="/auth"
          style={{
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: COLORS.ivory,
            border: `1px solid ${COLORS.gold}`,
            padding: "10px 22px",
            textDecoration: "none",
            transition: "all 0.3s",
          }}
          className="hover:!bg-[#C4A264] hover:!text-[#0a0908]"
        >
          Connexion
        </Link>
      </nav>

      {/* HERO */}
      <header
        ref={heroRef}
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 80px",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        {/* Animated orbs */}
        <div
          data-orb
          aria-hidden
          style={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: 500,
            height: 500,
            background: `radial-gradient(circle, ${COLORS.gold}30 0%, transparent 70%)`,
            filter: "blur(80px)",
            zIndex: 0,
          }}
        />
        <div
          data-orb
          aria-hidden
          style={{
            position: "absolute",
            bottom: "10%",
            right: "5%",
            width: 600,
            height: 600,
            background: `radial-gradient(circle, ${COLORS.gold}20 0%, transparent 70%)`,
            filter: "blur(100px)",
            zIndex: 0,
          }}
        />

        {/* Grid background */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1100 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              border: `1px solid ${COLORS.gold}40`,
              borderRadius: 999,
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: COLORS.gold,
              marginBottom: 40,
              background: COLORS.goldSoft,
            }}
          >
            <Sparkles size={12} /> Nouveau · Mémoire & Équipe
          </div>

          <h1
            style={{
              fontFamily: fontSerif,
              fontWeight: 300,
              fontSize: "clamp(44px, 9vw, 132px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              marginBottom: 32,
              color: COLORS.ivory,
            }}
          >
            L'IA qui dessine
            <br />
            <em style={{ color: COLORS.gold, fontWeight: 400 }}>avec vous.</em>
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 1.4vw, 20px)",
              lineHeight: 1.7,
              color: COLORS.ivoryDim,
              maxWidth: 640,
              margin: "0 auto 48px",
            }}
          >
            FORMA est le premier studio IA pensé pour les architectes. Rendus photoréalistes,
            agent assistant, mémoire de cabinet et collaboration d'équipe — au même endroit.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 32px",
                background: COLORS.gold,
                color: COLORS.bg,
                fontSize: 13,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.3s",
              }}
              className="hover:!bg-[#D4B87A] hover:scale-[1.02]"
            >
              Démarrer mon studio <ArrowRight size={16} />
            </Link>
            <a
              href="#render"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 32px",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.ivory,
                fontSize: 13,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "all 0.3s",
              }}
              className="hover:!border-[#C4A264]"
            >
              Voir une démo
            </a>
          </div>

          {/* Trust strip */}
          <div
            style={{
              marginTop: 100,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 48,
              opacity: 0.5,
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            <span>SketchUp</span>
            <span>·</span>
            <span>Revit</span>
            <span>·</span>
            <span>Rhino</span>
            <span>·</span>
            <span>Blender</span>
            <span>·</span>
            <span>ArchiCAD</span>
          </div>
        </div>
      </header>

      {/* STATS */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          padding: "80px 40px",
          borderTop: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.surface,
        }}
      >
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto"
        >
          {[
            ["4×", "Plus rapide"],
            ["< 30s", "Par rendu"],
            ["12+", "Intégrations"],
            ["98%", "Satisfaction"],
          ].map(([num, label], i) => (
            <div
              key={i}
              data-reveal
              style={{
                textAlign: "center",
                opacity: 0,
                transform: "translateY(20px)",
                transition: `opacity 0.7s ${i * 0.1}s, transform 0.7s ${i * 0.1}s`,
              }}
            >
              <div
                style={{
                  fontFamily: fontSerif,
                  fontSize: "clamp(40px, 5vw, 64px)",
                  fontWeight: 400,
                  color: COLORS.gold,
                  lineHeight: 1,
                }}
              >
                {num}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: COLORS.ivoryDim,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BENTO FEATURES */}
      <section
        id="render"
        style={{ position: "relative", zIndex: 2, padding: "120px 24px", maxWidth: 1280, margin: "0 auto" }}
      >
        <div
          data-reveal
          style={{
            opacity: 0,
            transform: "translateY(20px)",
            transition: "all 0.8s",
            textAlign: "center",
            marginBottom: 80,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: COLORS.gold,
              marginBottom: 20,
            }}
          >
            ◆ Une suite, pas un outil
          </div>
          <h2
            style={{
              fontFamily: fontSerif,
              fontSize: "clamp(36px, 5.5vw, 72px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            Tout ce dont votre <em style={{ color: COLORS.gold }}>cabinet</em> a besoin.
          </h2>
        </div>

        {/* Three primary tools — clearly explained */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <ToolCard
            number="01"
            tag="Render AI"
            icon={<ImageIcon size={20} />}
            title="Transformez vos maquettes 3D en rendus photoréalistes."
            what="Un moteur de rendu IA qui remplace 3ds Max, V-Ray, Lumion."
            steps={[
              "Importez une capture SketchUp, Revit, Rhino ou Blender",
              "Choisissez l'ambiance : jour, nuit, hiver, été, intérieur…",
              "Récupérez un visuel client en moins de 30 secondes",
            ]}
            outputs="JPG · PNG · 4K"
          />
          <ToolCard
            number="02"
            tag="Agent IA"
            icon={<Bot size={20} />}
            title="Un assistant qui connaît votre cabinet par cœur."
            what="Un ChatGPT spécialisé architecture, branché à vos projets."
            steps={[
              "Pose-lui une question sur n'importe quel projet en cours",
              "Il rédige emails, devis, comptes-rendus de chantier",
              "Il mémorise — clients, contraintes, décisions, normes",
            ]}
            outputs="Texte · Recherche web · Mémoire"
          />
          <ToolCard
            number="03"
            tag="Studio"
            icon={<Layers size={20} />}
            title="Mini-éditeurs Word, Excel et PDF boostés à l'IA."
            what="Génère et modifie vos livrables sans quitter FORMA."
            steps={[
              "L'agent crée un document, tableau ou présentation",
              "Vous l'ouvrez dans un éditeur natif intégré",
              "Vous éditez à la souris ou demandez une retouche IA",
            ]}
            outputs="DOCX · XLSX · PDF"
          />
        </div>

        {/* Secondary capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <BentoCard
            tag="Équipe"
            title="Travaillez à plusieurs, en temps réel."
            desc="Invitez associés, dessinateurs, assistants. Chacun son rôle, mentions et notifications instantanées."
            icon={<Zap size={20} />}
          />
          <BentoCard
            tag="Mémoire"
            title="Ce que l'agent retient, vous le contrôlez."
            desc="Outil remember() explicite — vous décidez ce qui entre dans la mémoire long terme du cabinet."
            icon={<Sparkles size={20} />}
          />
          <BentoCard
            tag="Sécurité"
            title="Vos données restent les vôtres."
            desc="Chiffrement, accès par rôle, hébergement européen. Aucun entraînement sur vos projets."
            icon={<Shield size={20} />}
          />
        </div>
      </section>

      {/* AGENT showcase */}
      <section
        id="agent"
        style={{
          position: "relative",
          zIndex: 2,
          padding: "120px 24px",
          background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.surface} 50%, ${COLORS.bg} 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div data-reveal style={{ opacity: 0, transform: "translateY(20px)", transition: "all 0.8s" }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: COLORS.gold,
                marginBottom: 20,
              }}
            >
              ◇ Agent Conversationnel
            </div>
            <h2
              style={{
                fontFamily: fontSerif,
                fontSize: "clamp(36px, 5vw, 64px)",
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                marginBottom: 28,
              }}
            >
              Votre bureau,<br />
              <em style={{ color: COLORS.gold }}>orchestré.</em>
            </h2>
            <p style={{ color: COLORS.ivoryDim, fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
              Emails, plannings, devis, suivi de chantier. FORMA Agent apprend vos habitudes,
              connaît vos projets et anticipe vos besoins.
            </p>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                "Recherche web & veille réglementaire",
                "Mémoire multi-projets & inter-équipe",
                "Génération d'images, documents, tableurs",
                "Mentions et notifications temps réel",
              ].map((t) => (
                <li key={t} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 15 }}>
                  <Check size={16} style={{ color: COLORS.gold, flexShrink: 0 }} />
                  <span style={{ color: COLORS.ivory }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat mock */}
          <div
            data-reveal
            style={{
              opacity: 0,
              transform: "translateY(20px)",
              transition: "all 0.8s 0.2s",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              overflow: "hidden",
              background: COLORS.surface,
              boxShadow: `0 30px 80px -20px ${COLORS.gold}25`,
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${COLORS.border}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#27c93f" }} />
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: COLORS.ivoryDim,
                }}
              >
                FORMA Agent · Villa Méditerranéenne
              </div>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <Bubble role="user">Résume les emails non lus et priorise les urgences clients.</Bubble>
              <Bubble role="ai">
                8 emails analysés. 2 prioritaires : <strong style={{ color: COLORS.gold }}>M. Dubois</strong> (délai
                permis) et <strong style={{ color: COLORS.gold }}>Cabinet Archi+</strong> (révision plans). Je rédige ?
              </Bubble>
              <Bubble role="user">Oui, et planifie une réunion Archi+ jeudi.</Bubble>
              <Bubble role="ai">
                Réponses prêtes. Réunion jeudi 14h proposée. <em style={{ color: COLORS.gold }}>Mémorisé dans ce projet.</em>
              </Bubble>
              <div style={{ display: "flex", gap: 4, paddingTop: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: COLORS.gold,
                      animation: `formaPulse 1.4s ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <style>{`@keyframes formaPulse { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }`}</style>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        style={{ position: "relative", zIndex: 2, padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          data-reveal
          style={{ opacity: 0, transform: "translateY(20px)", transition: "all 0.8s", textAlign: "center", marginBottom: 80 }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: COLORS.gold,
              marginBottom: 20,
            }}
          >
            ◈ Tarifs
          </div>
          <h2
            style={{
              fontFamily: fontSerif,
              fontSize: "clamp(36px, 5.5vw, 64px)",
              fontWeight: 300,
              lineHeight: 1.05,
            }}
          >
            Choisissez votre <em style={{ color: COLORS.gold }}>formule.</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Studio",
              price: "89",
              features: ["30 rendus / mois", "Agent illimité", "3 intégrations", "Résolution 2K", "1 utilisateur"],
              featured: false,
            },
            {
              name: "Cabinet",
              price: "249",
              features: [
                "Rendus illimités",
                "Agent + mémoire avancée",
                "12 intégrations",
                "Résolution 4K",
                "Jusqu'à 10 collaborateurs",
                "Support prioritaire",
              ],
              featured: true,
            },
            {
              name: "Agence",
              price: "Sur devis",
              features: [
                "Tout Cabinet, et plus",
                "Style signature dédié",
                "API & SSO",
                "Hébergement dédié",
                "Account manager",
              ],
              featured: false,
            },
          ].map((tier, i) => (
            <div
              key={tier.name}
              data-reveal
              style={{
                opacity: 0,
                transform: "translateY(20px)",
                transition: `all 0.7s ${i * 0.1}s`,
                position: "relative",
                padding: 40,
                border: `1px solid ${tier.featured ? COLORS.gold : COLORS.border}`,
                background: tier.featured
                  ? `linear-gradient(180deg, ${COLORS.goldSoft}, ${COLORS.surface})`
                  : COLORS.surface,
                borderRadius: 4,
              }}
            >
              {tier.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: 40,
                    background: COLORS.gold,
                    color: COLORS.bg,
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    padding: "5px 14px",
                    fontWeight: 600,
                  }}
                >
                  Recommandé
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: COLORS.gold,
                  marginBottom: 20,
                }}
              >
                {tier.name}
              </div>
              <div
                style={{
                  fontFamily: fontSerif,
                  fontSize: 56,
                  fontWeight: 400,
                  color: COLORS.ivory,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {tier.price !== "Sur devis" && (
                  <sup style={{ fontSize: 24, color: COLORS.ivoryDim, marginRight: 4 }}>€</sup>
                )}
                {tier.price}
                {tier.price !== "Sur devis" && (
                  <sub style={{ fontSize: 14, color: COLORS.ivoryDim, marginLeft: 6 }}>/mois</sub>
                )}
              </div>
              <div style={{ height: 1, background: COLORS.border, margin: "28px 0" }} />
              <ul style={{ listStyle: "none", padding: 0, marginBottom: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: COLORS.ivory }}>
                    <Check size={14} style={{ color: COLORS.gold, flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 24px",
                  background: tier.featured ? COLORS.gold : "transparent",
                  color: tier.featured ? COLORS.bg : COLORS.ivory,
                  border: `1px solid ${tier.featured ? COLORS.gold : COLORS.border}`,
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "all 0.3s",
                }}
                className={tier.featured ? "hover:!bg-[#D4B87A]" : "hover:!border-[#C4A264]"}
              >
                {tier.price === "Sur devis" ? "Nous contacter" : "Commencer"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          padding: "120px 24px",
          textAlign: "center",
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <div data-reveal style={{ opacity: 0, transform: "translateY(20px)", transition: "all 0.8s" }}>
          <h2
            style={{
              fontFamily: fontSerif,
              fontSize: "clamp(40px, 6vw, 88px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: 32,
            }}
          >
            Prêt à <em style={{ color: COLORS.gold }}>commencer ?</em>
          </h2>
          <p style={{ fontSize: 17, color: COLORS.ivoryDim, maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
            14 jours d'essai. Aucune carte requise. Conçu en France.
          </p>
          <Link
            to="/auth"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "18px 40px",
              background: COLORS.gold,
              color: COLORS.bg,
              fontSize: 13,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.3s",
            }}
            className="hover:!bg-[#D4B87A] hover:scale-[1.02]"
          >
            Créer mon studio <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          position: "relative",
          zIndex: 2,
          padding: "40px",
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          fontSize: 12,
          color: COLORS.ivoryDim,
        }}
      >
        <div style={{ fontFamily: fontSerif, letterSpacing: "0.4em", color: COLORS.ivory }}>
          FORM<span style={{ color: COLORS.gold }}>A</span>
        </div>
        <div>© {new Date().getFullYear()} FORMA. Conçu en France pour les architectes.</div>
      </footer>
    </div>
  );
};

const BentoCard = ({
  tag,
  title,
  desc,
  icon,
  big,
  className,
  children,
}: {
  tag: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  big?: boolean;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div
    data-reveal
    className={className}
    style={{
      opacity: 0,
      transform: "translateY(20px)",
      transition: "opacity 0.8s, transform 0.8s, border-color 0.3s",
      padding: big ? 40 : 32,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      background: COLORS.surface,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = COLORS.gold + "60";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = COLORS.border;
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: COLORS.gold,
        marginBottom: 20,
        fontSize: 11,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
      }}
    >
      {icon} {tag}
    </div>
    <h3
      style={{
        fontFamily: fontSerif,
        fontSize: big ? "clamp(28px, 3vw, 40px)" : 22,
        fontWeight: 400,
        lineHeight: 1.15,
        color: COLORS.ivory,
        marginBottom: 14,
        letterSpacing: "-0.01em",
      }}
    >
      {title}
    </h3>
    <p style={{ fontSize: big ? 16 : 14, lineHeight: 1.6, color: COLORS.ivoryDim }}>{desc}</p>
    {children}
  </div>
);

const ToolCard = ({
  number,
  tag,
  icon,
  title,
  what,
  steps,
  outputs,
}: {
  number: string;
  tag: string;
  icon: React.ReactNode;
  title: string;
  what: string;
  steps: string[];
  outputs: string;
}) => (
  <div
    data-reveal
    style={{
      opacity: 0,
      transform: "translateY(20px)",
      transition: "opacity 0.8s, transform 0.8s, border-color 0.3s",
      padding: 36,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      background: COLORS.surface,
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = COLORS.gold + "60";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = COLORS.border;
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: COLORS.gold,
          fontSize: 11,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
        }}
      >
        {icon} {tag}
      </div>
      <span style={{ fontFamily: fontSerif, color: COLORS.gold, fontSize: 28, opacity: 0.4 }}>
        {number}
      </span>
    </div>
    <h3
      style={{
        fontFamily: fontSerif,
        fontSize: 24,
        fontWeight: 400,
        lineHeight: 1.2,
        color: COLORS.ivory,
        letterSpacing: "-0.01em",
      }}
    >
      {title}
    </h3>
    <p style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.ivoryDim, fontStyle: "italic" }}>
      {what}
    </p>
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderTop: `1px solid ${COLORS.border}`,
        paddingTop: 18,
      }}
    >
      {steps.map((s, i) => (
        <li key={i} style={{ display: "flex", gap: 12, fontSize: 13.5, lineHeight: 1.5, color: COLORS.ivory }}>
          <span style={{ color: COLORS.gold, fontFamily: fontSerif, minWidth: 16 }}>{i + 1}.</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
    <div
      style={{
        marginTop: "auto",
        paddingTop: 16,
        fontSize: 10,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: COLORS.gold,
        opacity: 0.7,
      }}
    >
      → {outputs}
    </div>
  </div>
);

const Bubble = ({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) => (
  <div
    style={{
      alignSelf: role === "user" ? "flex-end" : "flex-start",
      maxWidth: "85%",
      padding: "12px 16px",
      borderRadius: 10,
      background: role === "user" ? COLORS.goldSoft : "rgba(255,255,255,0.04)",
      border: `1px solid ${role === "user" ? COLORS.gold + "40" : COLORS.border}`,
      fontSize: 14,
      lineHeight: 1.55,
      color: COLORS.ivory,
    }}
  >
    {children}
  </div>
);

export default Index;
