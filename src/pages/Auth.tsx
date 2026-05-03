import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import "@/styles/forma-landing.css";

export default function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = mode === "signin" ? "Connexion · FORMA" : "Créer un compte · FORMA";
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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16 relative"
      style={{ background: "var(--black, #0a0a0a)", color: "var(--ivory, #F0EAE0)" }}
    >
      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="block text-center mb-10 text-[var(--gold)] tracking-[0.4em] text-xs"
          style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.5em" }}
        >
          FORMA
        </Link>

        <div className="border border-[var(--gold)]/20 bg-black/40 backdrop-blur-sm p-10">
          <h1
            className="text-3xl text-[var(--ivory)] mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {mode === "signin" ? "Bon retour." : "Créer un studio."}
          </h1>
          <p className="text-sm text-[var(--ivory)]/60 mb-8">
            {mode === "signin"
              ? "Connectez-vous à votre espace FORMA."
              : "Quelques secondes pour commencer."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="w-full border-[var(--gold)]/30 bg-transparent text-[var(--ivory)] hover:bg-[var(--gold)]/10 hover:text-[var(--ivory)]"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continuer avec Google
          </Button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--gold)]/20" />
            <span className="text-[10px] tracking-[0.3em] text-[var(--ivory)]/40">OU</span>
            <div className="flex-1 h-px bg-[var(--gold)]/20" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[var(--ivory)]/70 text-xs tracking-wider">
                  Nom complet
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-transparent border-[var(--gold)]/30 text-[var(--ivory)]"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--ivory)]/70 text-xs tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-transparent border-[var(--gold)]/30 text-[var(--ivory)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--ivory)]/70 text-xs tracking-wider">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-transparent border-[var(--gold)]/30 text-[var(--ivory)]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--gold)] text-[var(--black)] hover:bg-[var(--gold)]/90"
            >
              {loading ? "…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[var(--ivory)]/50">
            {mode === "signin" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  className="text-[var(--gold)] hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Créer un studio
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <button
                  className="text-[var(--gold)] hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Se connecter
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
