import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Image as ImageIcon, Bot, Zap, Layers, Shield, Check,
  Quote, Users, Globe, MessageSquare, ChevronRight, Play,
  Download, BarChart3,
} from "lucide-react";

const COLORS = {
  bg: "#0a0908",
  surface: "#13110f",
  surfaceElevated: "#1a1816",
  ivory: "#F0EAE0",
  ivoryDim: "rgba(240,234,224,0.55)",
  gold: "#C4A264",
  goldLight: "rgba(196,162,100,0.15)",
  goldSoft: "rgba(196,162,100,0.12)",
  goldGlow: "rgba(196,162,100,0.25)",
  border: "rgba(240,234,224,0.08)",
  borderLight: "rgba(240,234,224,0.15)",
};

const fontSerif = "'Cormorant Garamond', 'Times New Roman', serif";
const fontSans = "'DM Sans', system-ui, sans-serif";

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, start = 0) {
  const [count, setCount] = useState(start);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const diff = end - start;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration, start]);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, count };
}

// Counter component
function StatCounter({ value, suffix = "", prefix = "", duration = 2000 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const { ref, count } = useAnimatedCounter(value, duration);
  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Inject Google Fonts
  useEffect(() => {
    if (document.getElementById("forma-fonts")) return;
    const link = document.createElement("link");
    link.id = "forma-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";
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
    setMeta("description", "FORMA — Studio IA pour architectes. Rendus photoréalistes, agent assistant, mémoire de cabinet, équipe en temps réel.");
    setMeta("og:title", "FORMA — L'IA des architectes", "property");
    setMeta("og:description", "Rendus, écriture, gestion. Un studio IA conçu pour la pratique architecturale.", "property");
  }, []);

  // Scroll reveal
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
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
      <style>{`
        @keyframes formaFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes formaPulse { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }
        @keyframes formaGlow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes formaSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        .hover-lift:hover { transform: translateY(-4px); }
        .hover-glow:hover { box-shadow: 0 0 40px ${COLORS.goldGlow}; }
      `}</style>

      {/* Grain overlay */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.03,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          mixBlendMode: "overlay", zIndex: 1,
        }}
      />

      {/* NAV */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(to bottom, rgba(10,9,8,0.9), transparent)", backdropFilter: "blur(12px)",
        }}
      >
        <Link to="/" style={{ fontFamily: fontSerif, fontSize: 22, letterSpacing: "0.4em", color: COLORS.ivory, textDecoration: "none" }}>
          FORM<span style={{ color: COLORS.gold }}>A</span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          {[["Render", "#render"], ["Agent", "#agent"], ["Tarifs", "#pricing"]].map(([label, href]) => (
            <a key={href} href={href} style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: COLORS.ivoryDim, textDecoration: "none" }} className="hover:!text-[#F0EAE0] transition-colors">
              {label}
            </a>
          ))}
        </div>
        <Link to="/auth" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: COLORS.ivory, border: `1px solid ${COLORS.gold}`, padding: "10px 22px", textDecoration: "none", transition: "all 0.3s" }} className="hover:!bg-[#C4A264] hover:!text-[#0a0908]">
          Connexion
        </Link>
      </nav>

      {/* HERO */}
      <header
        ref={heroRef}
        style={{
          position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", textAlign: "center", zIndex: 2,
        }}
      >
        {/* Animated orbs with mouse parallax */}
        <div data-orb aria-hidden style={{ position: "absolute", top: "10%", left: "10%", width: 500, height: 500, background: `radial-gradient(circle, ${COLORS.gold}30 0%, transparent 70%)`, filter: "blur(80px)", zIndex: 0, transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`, transition: "transform 0.3s ease-out" }} />
        <div data-orb aria-hidden style={{ position: "absolute", bottom: "10%", right: "5%", width: 600, height: 600, background: `radial-gradient(circle, ${COLORS.gold}20 0%, transparent 70%)`, filter: "blur(100px)", zIndex: 0, transform: `translate3d(${-mousePos.x}px, ${-mousePos.y}px, 0)`, transition: "transform 0.3s ease-out" }} />

        {/* Grid background */}
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`, backgroundSize: "80px 80px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1100 }}>
          {/* Badge with glow */}
          <div
            data-reveal
            className="reveal"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px",
              border: `1px solid ${COLORS.gold}50`, borderRadius: 999, fontSize: 11,
              letterSpacing: "0.2em", textTransform: "uppercase", color: COLORS.gold, marginBottom: 40,
              background: COLORS.goldSoft, animation: "formaGlow 3s ease-in-out infinite",
            }}
          >
            <Sparkles size={14} style={{ animation: "formaFloat 3s ease-in-out infinite" }} />
            <span style={{ marginLeft: 4 }}>Nouveau · Mémoire & Équipe</span>
          </div>

          <h1
            data-reveal
            className="reveal"
            style={{
              fontFamily: fontSerif, fontWeight: 300, fontSize: "clamp(48px, 9vw, 140px)", lineHeight: 1,
              letterSpacing: "-0.02em", marginBottom: 40, color: COLORS.ivory, transitionDelay: "0.1s",
            }}
          >
            L'IA qui dessine<br />
            <em style={{ color: COLORS.gold, fontWeight: 400 }}>avec vous.</em>
          </h1>

          <p
            data-reveal
            className="reveal"
            style={{
              fontSize: "clamp(16px, 1.4vw, 20px)", lineHeight: 1.7, color: COLORS.ivoryDim,
              maxWidth: 640, margin: "0 auto 48px", transitionDelay: "0.2s",
            }}
          >
            FORMA est le premier studio IA pensé pour les architectes. Rendus photoréalistes, agent assistant, mémoire de cabinet et collaboration d'équipe — au même endroit.
          </p>

          {/* Enhanced CTA buttons */}
          <div data-reveal className="reveal flex flex-wrap items-center justify-center gap-6" style={{ transitionDelay: "0.3s" }}>
            <Link
              to="/auth"
              className="group relative overflow-hidden"
              style={{
                display: "inline-flex", alignItems: "center", gap: 12, padding: "18px 36px",
                background: COLORS.gold, color: COLORS.bg, fontSize: 13, letterSpacing: "0.15em",
                textTransform: "uppercase", fontWeight: 500, textDecoration: "none", transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <span className="relative z-10">Démarrer mon studio</span>
              <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-1" />
              <div style={{ position: "absolute", inset: 0, background: "#D4B87A", transform: "translateX(-100%)", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }} className="group-hover:translate-x-0" />
            </Link>
            <a
              href="#render"
              className="group"
              style={{
                display: "inline-flex", alignItems: "center", gap: 12, padding: "18px 36px",
                border: `1px solid ${COLORS.border}`, color: COLORS.ivory, fontSize: 13, letterSpacing: "0.15em",
                textTransform: "uppercase", textDecoration: "none", transition: "all 0.3s",
              }}
            >
              <Play size={14} className="transition-transform group-hover:scale-110" />
              <span>Voir une démo</span>
            </a>
          </div>

          {/* Trust strip with subtle animation */}
          <div
            data-reveal
            className="reveal"
            style={{
              marginTop: 100, display: "flex", flexWrap: "wrap", justifyContent: "center",
              alignItems: "center", gap: 48, opacity: 0.4, fontSize: 11, letterSpacing: "0.3em",
              textTransform: "uppercase", transitionDelay: "0.4s",
            }}
          >
            <span style={{ opacity: 0.6 }}>Intègre avec</span>
            <span>SketchUp</span><span>·</span><span>Revit</span><span>·</span><span>Rhino</span><span>·</span><span>Blender</span><span>·</span><span>ArchiCAD</span>
          </div>
        </div>
      </header>

      {/* STATS WITH ANIMATED COUNTERS */}
      <section
        data-reveal
        className="reveal"
        style={{
          position: "relative", zIndex: 2, padding: "100px 40px",
          borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`,
          background: `linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.bg} 100%)`,
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            { num: 4, suffix: "×", label: "Plus rapide", prefix: "" },
            { num: 30, suffix: "s", label: "Par rendu", prefix: "< " },
            { num: 12, suffix: "+", label: "Intégrations", prefix: "" },
            { num: 98, suffix: "%", label: "Satisfaction", prefix: "" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontFamily: fontSerif, fontSize: "clamp(48px, 5vw, 72px)", fontWeight: 400, color: COLORS.gold, lineHeight: 1, marginBottom: 8 }}>
                {i === 0 ? <StatCounter value={stat.num} suffix={stat.suffix} /> : i === 1 ? <><sup>{stat.prefix}</sup><StatCounter value={stat.num} />{stat.suffix}</> : <StatCounter value={stat.num} suffix={stat.suffix} />}
              </div>
              <div style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: COLORS.ivoryDim }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        data-reveal
        className="reveal"
        style={{ position: "relative", zIndex: 2, padding: "140px 24px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: COLORS.gold, marginBottom: 20 }}>◆ Comment ça marche</div>
          <h2 style={{ fontFamily: fontSerif, fontSize: "clamp(40px, 5.5vw, 72px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Trois étapes pour<br /><em style={{ color: COLORS.gold }}>commencer.</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Connectez", desc: "Importez vos maquettes depuis SketchUp, Revit, Rhino ou Blender en un clic.", icon: <Globe size={24} /> },
            { step: "02", title: "Décrivez", desc: "Dites à l'IA l'ambiance souhaitée. Jour, nuit, été, hiver, interior…", icon: <MessageSquare size={24} /> },
            { step: "03", title: "Récupérez", desc: "Téléchargez un rendu photoréaliste en moins de 30 secondes.", icon: <Download size={24} /> },
          ].map((item, i) => (
            <div
              key={i}
              data-reveal
              className="reveal group"
              style={{
                padding: 40, background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                borderRadius: 4, transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                transitionDelay: `${i * 0.15}s`,
              }}
              className="hover-lift"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.2em", color: COLORS.gold, fontFamily: fontSerif }}>{item.step}</div>
                <div style={{ color: COLORS.ivoryDim, padding: 12, background: COLORS.goldSoft, borderRadius: 999 }} className="group-hover:bg-gold group-hover:text-bg transition-colors">{item.icon}</div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, color: COLORS.ivory }}>{item.title}</h3>
              <p style={{ fontSize: 15, color: COLORS.ivoryDim, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENTO FEATURES */}
      <section
        id="render"
        data-reveal
        className="reveal"
        style={{ position: "relative", zIndex: 2, padding: "120px 24px", maxWidth: 1280, margin: "0 auto", background: COLORS.surface }}
      >
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: COLORS.gold, marginBottom: 20 }}>◆ Une suite, pas un outil</div>
          <h2 style={{ fontFamily: fontSerif, fontSize: "clamp(40px, 5.5vw, 72px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: 800, margin: "0 auto" }}>
            Tout ce dont votre <em style={{ color: COLORS.gold }}>cabinet</em> a besoin.
          </h2>
        </div>

        {/* Primary tools - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            { number: "01", tag: "Render AI", icon: <ImageIcon size={24} />, title: "Rendus photoréalistes", desc: "Transformez vos maquettes 3D en visuels clients procéduraux. Format, lumière, style — tout paramétrable.", color: COLORS.gold },
            { number: "02", tag: "Agent IA", icon: <Bot size={24} />, title: "Assistant intelligent", desc: "Un ChatGPT qui connaît vos projets, vos clients, vos contraintes. Mémoire et recherche natives.", color: COLORS.ivory },
            { number: "03", tag: "Studio", icon: <Layers size={24} />, title: "Éditeurs boostés", desc: "Documents, tableurs, présentations — modifiés à la souris ou par l'IA.", color: COLORS.ivory },
          ].map((tool, i) => (
            <div
              key={i}
              data-reveal
              className="reveal hover-lift"
              style={{
                padding: 36, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                borderRadius: 4, cursor: "pointer", transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                transitionDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ color: tool.color, padding: 10, background: COLORS.goldSoft, borderRadius: 999 }}>{tool.icon}</div>
                  <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: COLORS.ivoryDim }}>{tool.tag}</span>
                </div>
                <ChevronRight size={16} style={{ color: COLORS.ivoryDim, opacity: 0.5 }} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, color: COLORS.ivory }}>{tool.title}</h3>
              <p style={{ fontSize: 14, color: COLORS.ivoryDim, lineHeight: 1.6 }}>{tool.desc}</p>
            </div>
          ))}
        </div>

        {/* Secondary tools - Smaller bento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { tag: "Équipe", icon: <Users size={18} />, title: "Collaboration", desc: "Temps réel, mentions, notifs" },
            { tag: "Mémoire", icon: <Sparkles size={18} />, title: "Mémoire longue", desc: "Contrôle total" },
            { tag: "Sécurité", icon: <Shield size={18} />, title: "Hébergement", desc: "EU, chiffrement" },
            { tag: "API", icon: <BarChart3 size={18} />, title: "Intégrations", desc: "12+ connecteurs" },
          ].map((item, i) => (
            <div
              key={i}
              data-reveal
              className="reveal"
              style={{
                padding: 24, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                borderRadius: 4, transition: "all 0.3s", transitionDelay: `${0.3 + i * 0.05}s`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: COLORS.gold }}>{item.icon}</span>
                <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.ivory }}>{item.tag}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: COLORS.ivory }}>{item.title}</div>
              <div style={{ fontSize: 12, color: COLORS.ivoryDim }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        data-reveal
        className="reveal"
        style={{ position: "relative", zIndex: 2, padding: "140px 24px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: COLORS.gold, marginBottom: 20 }}>◆ Témoignages</div>
          <h2 style={{ fontFamily: fontSerif, fontSize: "clamp(40px, 5.5vw, 72px)", fontWeight: 300, lineHeight: 1.05 }}>
            Ils nous font <em style={{ color: COLORS.gold }}>confiance.</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "FORMA a transformé notre workflow. Les clients sont bluffés par les rendus, et on économise des heures sur chaque projet.", author: "Marie T.", role: "Architecte, Bordeaux", size: "medium" },
            { quote: "L'agent retención nos échanges. Il connaît le nom des kids de nos clients, leurs préférences… c'est révolution.", author: "Philippe L.", role: "Directeur de cabinet, Lyon", size: "medium" },
            { quote: "Enfin un outil pensé par des architectes, pour des архитекторов. Pas de梯子, juste de la efficacité.", author: "Sophie M.", role: "Associée, Paris", size: "medium" },
          ].map((t, i) => (
            <div
              key={i}
              data-reveal
              className="reveal"
              style={{
                padding: 32, background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                borderRadius: 4, transitionDelay: `${i * 0.15}s`,
              }}
            >
              <Quote size={24} style={{ color: COLORS.gold, marginBottom: 20, opacity: 0.5 }} />
              <p style={{ fontSize: 16, lineHeight: 1.7, color: COLORS.ivory, marginBottom: 24, fontStyle: "italic" }}>"{t.quote}"</p>
              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.ivory }}>{t.author}</div>
                <div style={{ fontSize: 12, color: COLORS.ivoryDim }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AGENT SHOWCASE */}
      <section
        id="agent"
        data-reveal
        className="reveal"
        style={{
          position: "relative", zIndex: 2, padding: "140px 24px",
          background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.surface} 50%, ${COLORS.bg} 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: COLORS.gold, marginBottom: 20 }}>◇ Agent Conversationnel</div>
            <h2 style={{ fontFamily: fontSerif, fontSize: "clamp(40px, 5vw, 68px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 28 }}>
              Votre bureau,<br /><em style={{ color: COLORS.gold }}>orchestré.</em>
            </h2>
            <p style={{ color: COLORS.ivoryDim, fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
              Emails, plannings, devis, suivi de chantier. FORMA Agent apprend vos habitudes, connaît vos projets et anticipe vos besoins.
            </p>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {["Recherche web & veille réglementaire", "Mémoire multi-projets & inter-équipe", "Génération documents, images, tableurs", "Mentions temps réel"].map((t) => (
                <li key={t} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 15 }}>
                  <Check size={16} style={{ color: COLORS.gold, flexShrink: 0 }} />
                  <span style={{ color: COLORS.ivory }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat mock - enhanced */}
          <div
            style={{
              border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden",
              background: COLORS.surface, boxShadow: `0 40px 100px -30px ${COLORS.goldGlow}`,
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#27c93f" }} />
              <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: COLORS.ivoryDim }}>FORMA Agent · Villa Méditerranéenne</div>
            </div>
            <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ alignSelf: "flex-start", maxWidth: "85%", padding: "12px 16px", background: COLORS.bg, borderRadius: "0 12px 12px 12px", fontSize: 14, lineHeight: 1.5 }}>Résume les emails non lus et priorise les urgences clients.</div>
              <div style={{ alignSelf: "flex-end", maxWidth: "85%", padding: "12px 16px", background: COLORS.goldSoft, border: `1px solid ${COLORS.border}`, borderRadius: "12px 0 12px 12px", fontSize: 14, lineHeight: 1.5 }}>
                8 emails analysés. 2 prioritaires : <strong style={{ color: COLORS.gold }}>M. Dubois</strong> (délai permis) et <strong style={{ color: COLORS.gold }}>Cabinet Archi+</strong> (révision plans). Je rédige ?
              </div>
              <div style={{ alignSelf: "flex-start", maxWidth: "85%", padding: "12px 16px", background: COLORS.bg, borderRadius: "0 12px 12px 12px", fontSize: 14, lineHeight: 1.5 }}>Oui, et planifie une réunion Archi+ jeudi.</div>
              <div style={{ alignSelf: "flex-end", maxWidth: "85%", padding: "12px 16px", background: COLORS.goldSoft, border: `1px solid ${COLORS.border}`, borderRadius: "12px 0 12px 12px", fontSize: 14, lineHeight: 1.5 }}>
                Réponses prêtes. Réunion jeudi 14h proposée. <em style={{ color: COLORS.gold }}>Mémorisé dans ce projet.</em>
              </div>
              <div style={{ display: "flex", gap: 6, paddingTop: 8, alignSelf: "flex-start" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.gold, animation: `formaPulse 1.4s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING - Enhanced */}
      <section
        id="pricing"
        data-reveal
        className="reveal"
        style={{ position: "relative", zIndex: 2, padding: "140px 24px", maxWidth: 1200, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: COLORS.gold, marginBottom: 20 }}>◈ Tarifs</div>
          <h2 style={{ fontFamily: fontSerif, fontSize: "clamp(40px, 5.5vw, 68px)", fontWeight: 300, lineHeight: 1.05 }}>
            Choisissez votre <em style={{ color: COLORS.gold }}>formule.</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Studio", price: "89", features: ["30 rendus / mois", "Agent illimité", "3 intégrations", "Résolution 2K", "1 utilisateur"], featured: false },
            { name: "Cabinet", price: "249", features: ["Rendus illimités", "Agent + mémoire", "12 intégrations", "Résolution 4K", "Jusqu'à 10 utilisateurs", "Support prioritaire"], featured: true },
            { name: "Agence", price: "Sur devis", features: ["Tout Cabinet +", "Style signature", "API & SSO", "Hébergement dédié", "Account manager"], featured: false },
          ].map((tier, i) => (
            <div
              key={tier.name}
              data-reveal
              className="reveal"
              style={{
                position: "relative", padding: 40, border: `1px solid ${tier.featured ? COLORS.gold : COLORS.border}`,
                background: tier.featured ? `linear-gradient(180deg, ${COLORS.goldSoft}, ${COLORS.surface})` : COLORS.surface,
                borderRadius: 4, transitionDelay: `${i * 0.1}s`, transition: "all 0.3s",
              }}
              className="hover-lift"
            >
              {tier.featured && (
                <div style={{ position: "absolute", top: -12, left: 40, background: COLORS.gold, color: COLORS.bg, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "6px 16px", fontWeight: 600 }}>
                  Recommandé
                </div>
              )}
              <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: COLORS.gold, marginBottom: 20 }}>{tier.name}</div>
              <div style={{ fontFamily: fontSerif, fontSize: 56, fontWeight: 400, color: COLORS.ivory, lineHeight: 1, marginBottom: 4 }}>
                {tier.price !== "Sur devis" && <sup style={{ fontSize: 24, color: COLORS.ivoryDim, marginRight: 4 }}>€</sup>}{tier.price}{tier.price !== "Sur devis" && <sub style={{ fontSize: 14, color: COLORS.ivoryDim, marginLeft: 6 }}>/mois</sub>}
              </div>
              <div style={{ height: 1, background: COLORS.border, margin: "28px 0" }} />
              <ul style={{ listStyle: "none", padding: 0, marginBottom: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: COLORS.ivory }}>
                    <Check size={14} style={{ color: COLORS.gold, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                style={{
                  display: "block", textAlign: "center", padding: "16px 24px", background: tier.featured ? COLORS.gold : "transparent",
                  color: tier.featured ? COLORS.bg : COLORS.ivory, border: `1px solid ${tier.featured ? COLORS.gold : COLORS.border}`,
                  fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontWeight: 500,
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
        data-reveal
        className="reveal"
        style={{ position: "relative", zIndex: 2, padding: "140px 24px", textAlign: "center", borderTop: `1px solid ${COLORS.border}` }}
      >
        <h2
          style={{
            fontFamily: fontSerif, fontSize: "clamp(48px, 6vw, 96px)", fontWeight: 300, lineHeight: 1.05,
            letterSpacing: "-0.02em", marginBottom: 32,
          }}
        >
          Prêt à <em style={{ color: COLORS.gold }}>commencer ?</em>
        </h2>
        <p style={{ fontSize: 17, color: COLORS.ivoryDim, maxWidth: 540, margin: "0 auto 48px", lineHeight: 1.7 }}>
          14 jours d'essai. Aucune carte requise. Conçu en France.
        </p>
        <Link
          to="/auth"
          className="group"
          style={{
            display: "inline-flex", alignItems: "center", gap: 12, padding: "20px 48px",
            background: COLORS.gold, color: COLORS.bg, fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase",
            fontWeight: 500, textDecoration: "none", transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="hover:!bg-[#D4B87A] hover:scale-[1.02]"
        >
          Créer mon studio <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          position: "relative", zIndex: 2, padding: "40px", borderTop: `1px solid ${COLORS.border}`,
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20,
          fontSize: 12, color: COLORS.ivoryDim,
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

export default Index;