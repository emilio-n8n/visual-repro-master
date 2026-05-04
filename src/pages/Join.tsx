import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Join() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    supabase
      .from("team_members")
      .select("id, display_name, role_label, workspace_id, joined_user_id, status")
      .eq("invite_token", token)
      .maybeSingle()
      .then(({ data }) => setMember(data));
  }, [token]);

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

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] text-[#F0EAE0]/60">
        Lien invalide ou expiré.
      </div>
    );
  }

  async function accept() {
    if (!user || !token) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("claim_team_invite", { _token: token });
      if (error) throw error;
      const res = data as any;
      if (!res?.ok) throw new Error(res?.error ?? "invitation invalide");
      toast({ title: "Bienvenue dans l'équipe" });
      localStorage.removeItem("forma.joinToken");
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
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
          Vous avez été invité·e en tant que <b>{member.role_label}</b>.
        </p>
        <p className="text-[#F0EAE0]/40 mb-8 text-xs">({member.display_name})</p>
        <Button
          onClick={accept}
          disabled={busy}
          className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
        >
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Accepter et rejoindre
        </Button>
      </div>
    </div>
  );
}
