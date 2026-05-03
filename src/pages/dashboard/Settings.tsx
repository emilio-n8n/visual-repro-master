import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, User, Building2, FileBox, Trash2, Download, ExternalLink } from "lucide-react";

type Profile = { id: string; full_name: string | null; avatar_url: string | null; locale: string | null };
type Workspace = { id: string; name: string; slug: string; plan: string };
type Artifact = { id: string; type: string; title: string; created_at: string; mime_type: string; content: string };

export default function Settings() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWs, setSavingWs] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url, locale").eq("id", user.id).maybeSingle(),
      supabase.from("workspaces").select("id, name, slug, plan").limit(1).maybeSingle(),
      supabase.from("artifacts").select("id, type, title, created_at, mime_type, content").order("created_at", { ascending: false }),
    ]).then(([p, w, a]) => {
      setProfile(p.data as Profile);
      setWorkspace(w.data as Workspace);
      setArtifacts((a.data ?? []) as Artifact[]);
    });
  }, [user]);

  async function saveProfile() {
    if (!profile || !user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, locale: profile.locale })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else toast({ title: "Profil mis à jour" });
  }

  async function saveWorkspace() {
    if (!workspace) return;
    setSavingWs(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name: workspace.name })
      .eq("id", workspace.id);
    setSavingWs(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else toast({ title: "Studio mis à jour" });
  }

  async function deleteArtifact(id: string) {
    if (!confirm("Supprimer ce livrable ?")) return;
    const { error } = await supabase.from("artifacts").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else setArtifacts((prev) => prev.filter((a) => a.id !== id));
  }

  function downloadArtifact(a: Artifact) {
    const ext = a.type === "spreadsheet" ? "csv" : "html";
    const blob = new Blob([a.content], { type: a.mime_type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${a.title.replace(/[^\w-]+/g, "_")}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openArtifact(a: Artifact) {
    const blob = new Blob([a.content], { type: a.mime_type });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  return (
    <div className="p-10 max-w-4xl">
      <h1 className="text-4xl mb-2 text-[#F0EAE0]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Paramètres
      </h1>
      <p className="text-[#F0EAE0]/60 mb-10">Gérez votre studio, votre profil et vos livrables.</p>

      {/* Profile */}
      <Section icon={User} title="Profil">
        <div className="space-y-4">
          <Field label="Email">
            <Input value={user?.email ?? ""} disabled className="bg-black/40 border-[#C4A264]/15 text-[#F0EAE0]/60" />
          </Field>
          <Field label="Nom complet">
            <Input
              value={profile?.full_name ?? ""}
              onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))}
              className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0]"
            />
          </Field>
          <Field label="Langue">
            <select
              value={profile?.locale ?? "fr"}
              onChange={(e) => setProfile((p) => (p ? { ...p, locale: e.target.value } : p))}
              className="w-full bg-black/40 border border-[#C4A264]/20 text-[#F0EAE0] rounded-sm px-3 py-2 text-sm"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Button
            onClick={saveProfile}
            disabled={savingProfile || !profile}
            className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
          >
            {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </Section>

      {/* Workspace */}
      <Section icon={Building2} title="Studio">
        <div className="space-y-4">
          <Field label="Nom du studio">
            <Input
              value={workspace?.name ?? ""}
              onChange={(e) => setWorkspace((w) => (w ? { ...w, name: e.target.value } : w))}
              className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0]"
            />
          </Field>
          <Field label="Identifiant">
            <Input value={workspace?.slug ?? ""} disabled className="bg-black/40 border-[#C4A264]/15 text-[#F0EAE0]/60" />
          </Field>
          <Field label="Plan">
            <div className="text-sm text-[#C4A264] uppercase tracking-[0.2em]">{workspace?.plan ?? "—"}</div>
          </Field>
          <Button
            onClick={saveWorkspace}
            disabled={savingWs || !workspace}
            className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
          >
            {savingWs && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </Section>

      {/* Artifacts library */}
      <Section icon={FileBox} title={`Livrables (${artifacts.length})`}>
        {artifacts.length === 0 ? (
          <div className="text-sm text-[#F0EAE0]/40 py-6 text-center border border-dashed border-[#C4A264]/15">
            Aucun livrable. Demandez à l'Agent IA de créer un diaporama, tableur, dataviz ou site.
          </div>
        ) : (
          <div className="divide-y divide-[#C4A264]/10 border border-[#C4A264]/15 rounded-sm">
            {artifacts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[#F0EAE0] truncate">{a.title}</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#C4A264]/70 mt-0.5">
                    {a.type} · {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-[#F0EAE0]/70 hover:text-[#C4A264]" onClick={() => openArtifact(a)}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-[#F0EAE0]/70 hover:text-[#C4A264]" onClick={() => downloadArtifact(a)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-[#F0EAE0]/70 hover:text-red-400" onClick={() => deleteArtifact(a.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Danger zone */}
      <Section icon={Trash2} title="Compte">
        <Button
          variant="outline"
          className="border-[#C4A264]/30 text-[#F0EAE0] hover:bg-[#C4A264]/10"
          onClick={() => signOut()}
        >
          Se déconnecter
        </Button>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#C4A264]/15">
        <Icon className="w-4 h-4 text-[#C4A264]" />
        <h2 className="text-sm uppercase tracking-[0.25em] text-[#C4A264]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
      <Label className="text-xs uppercase tracking-[0.15em] text-[#F0EAE0]/50">{label}</Label>
      <div>{children}</div>
    </div>
  );
}
