import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

const C = {
  bg: "#0a0908",
  surface: "rgba(20, 18, 15, 0.6)",
  ivory: "#F0EAE0",
  ivoryDim: "rgba(240,234,224,0.55)",
  gold: "#C4A264",
  goldSoft: "rgba(196,162,100,0.1)",
  border: "rgba(240,234,224,0.1)",
  inputBg: "rgba(255,255,255,0.03)",
};

const fontSerif = "'Cormorant Garamond', serif";
const fontSans = "'DM Sans', system-ui, sans-serif";

export default function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document.getElementById("forma-fonts")) return;
    const link = document.createElement("link");
    link.id = "forma-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    document.title = mode === "signin" ? "Connexion · FORMA" : "Créer un studio · FORMA";
  }, [mode]);

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Bienvenue dans FORMA.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      toast.error("Connexion Google impossible");
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast.info("Saisis ton email d'abord.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Lien envoyé. Vérifie tes emails.");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.ivory,
        fontFamily: fontSans,
        fontWeight: 300,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        overflow: "hidden",
      }}
    >
      {/* Ambient orbs */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${C.gold}25 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: 700,
          height: 700,
          background: `radial-gradient(circle, ${C.gold}20 0%, transparent 70%)`,
          filter: "blur(120px)",
        }}
      />
      {/* Grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          opacity: 0.6,
        }}
      />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "block",
            textAlign: "center",
            marginBottom: 36,
            fontFamily: fontSerif,
            fontSize: 22,
            letterSpacing: "0.5em",
            color: C.ivory,
            textDecoration: "none",
          }}
        >
          FORM<span style={{ color: C.gold }}>A</span>
        </Link>

        {/* Card */}
        <div
          style={{
            border: `1px solid ${C.border}`,
            background: C.surface,
            backdropFilter: "blur(20px)",
            padding: "44px 36px",
            borderRadius: 4,
            boxShadow: `0 40px 100px -30px ${C.gold}30, 0 0 0 1px ${C.gold}15`,
          }}
        >
          <h1
            style={{
              fontFamily: fontSerif,
              fontSize: 36,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              color: C.ivory,
              marginBottom: 8,
            }}
          >
            {mode === "signin" ? "Bon retour." : "Créer un studio."}
          </h1>
          <p style={{ fontSize: 14, color: C.ivoryDim, marginBottom: 32 }}>
            {mode === "signin"
              ? "Connectez-vous à votre espace FORMA."
              : "Quelques secondes pour commencer."}
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 16px",
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.03)",
              color: C.ivory,
              fontSize: 14,
              fontFamily: fontSans,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderRadius: 4,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLElement).style.borderColor = C.gold + "60";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
            }}
          >
            <GoogleIcon /> Continuer avec Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 10, letterSpacing: "0.3em", color: C.ivoryDim }}>OU</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <Field
                id="fullName"
                label="Nom complet"
                value={fullName}
                onChange={setFullName}
                icon={<User size={15} />}
                required
                autoComplete="name"
              />
            )}
            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              icon={<Mail size={15} />}
              required
              autoComplete="email"
            />
            <div>
              <Field
                id="password"
                label="Mot de passe"
                type="password"
                value={password}
                onChange={setPassword}
                icon={<Lock size={15} />}
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={handleForgot}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.ivoryDim,
                    fontSize: 12,
                    cursor: "pointer",
                    padding: "8px 0 0",
                    marginLeft: "auto",
                    display: "block",
                    fontFamily: fontSans,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = C.gold)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = C.ivoryDim)}
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                padding: "14px 20px",
                background: C.gold,
                color: C.bg,
                border: "none",
                fontSize: 13,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                borderRadius: 4,
                fontFamily: fontSans,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.background = "#D4B87A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = C.gold;
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Se connecter" : "Créer mon compte"} <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: "center", fontSize: 13, color: C.ivoryDim }}>
            {mode === "signin" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.gold,
                    cursor: "pointer",
                    fontFamily: fontSans,
                    fontSize: 13,
                    padding: 0,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                  }}
                >
                  Créer un studio
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.gold,
                    cursor: "pointer",
                    fontFamily: fontSans,
                    fontSize: 13,
                    padding: 0,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                  }}
                >
                  Se connecter
                </button>
              </>
            )}
          </div>
        </div>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: C.ivoryDim, letterSpacing: "0.05em" }}>
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </div>
    </div>
  );
}

const Field = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  icon,
  required,
  minLength,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ReactNode;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) => (
  <div>
    <label
      htmlFor={id}
      style={{
        display: "block",
        fontSize: 11,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: C.ivoryDim,
        marginBottom: 8,
      }}
    >
      {label}
    </label>
    <div style={{ position: "relative" }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: C.ivoryDim,
            pointerEvents: "none",
          }}
        >
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        style={{
          width: "100%",
          padding: icon ? "13px 44px 13px 40px" : "13px 16px",
          background: C.inputBg,
          border: `1px solid ${C.border}`,
          color: C.ivory,
          fontSize: 14,
          fontFamily: fontSans,
          borderRadius: 4,
          outline: "none",
          transition: "all 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = C.gold;
          e.currentTarget.style.background = "rgba(196,162,100,0.05)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.background = C.inputBg;
        }}
      />
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);
