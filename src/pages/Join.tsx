import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type ClaimInviteResult = { ok?: boolean; error?: string; workspace_id?: string };

export default function Join() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const { refresh } = useWorkspace();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || loading || !user || busy) return;
    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, loading]);

  if (loading) return <div className="min-h-screen bg-[#0b0b0b]" />;

  if (!user) {
    localStorage.setItem("forma.joinToken", token ?? "");
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] text-[#F0EAE0] p-6">
        <div className="max-w-md text-center">
          <h1
            className="text-3xl mb-3 text-[#C4A264]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Vous êtes invité·e
          </h1>
          <p className="text-[#F0EAE0]/60 mb-6 text-sm">
            Connectez-vous ou créez un compte pour rejoindre l'équipe.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
          >
            Se connecter / s'inscrire
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] text-[#F0EAE0]/60">
        {error}
      </div>
    );
  }

  async function accept() {
    if (!user || !token) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("claim_team_invite", { _token: token });
      if (error) throw error;
      const res = data as ClaimInviteResult | null;
      if (!res?.ok) throw new Error(res?.error ?? "invitation invalide");
      toast({ title: "Bienvenue dans l'équipe" });
      localStorage.removeItem("forma.joinToken");
      await refresh();
      navigate("/dashboard");
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : "Erreur inconnue";
      const message = rawMessage === "invalid_token" ? "Lien invalide ou expiré." : rawMessage;
      setError(message);
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] text-[#F0EAE0] p-6">
      <div className="max-w-md text-center">
        <div className="text-xs tracking-[0.3em] text-[#C4A264]/70 mb-2">INVITATION</div>
        <h1
          className="text-3xl mb-3"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Rejoindre le studio
        </h1>
        <p className="text-[#F0EAE0]/60 mb-2 text-sm">
          Votre compte est relié au cabinet existant. Aucun onboarding n'est nécessaire.
        </p>
        <p className="text-[#F0EAE0]/40 mb-8 text-xs">Redirection automatique…</p>
        <Button
          onClick={accept}
          disabled={busy}
          className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
        >
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Rejoindre le cabinet
        </Button>
      </div>
    </div>
  );
}
