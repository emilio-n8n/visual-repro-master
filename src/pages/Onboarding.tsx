import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Check, ArrowRight, Plus, Trash2, Copy, Sparkles } from "lucide-react";

type Level = "light" | "full" | "deep";

const LEVELS: { id: Level; title: string; pitch: string; bullets: string[] }[] = [
  {
    id: "light",
    title: "Express",
    pitch: "5 questions essentielles. ~3 min.",
    bullets: ["Identité du cabinet", "Style & ton", "Personnalisation de base"],
  },
  {
    id: "full",
    title: "Recommandé",
    pitch: "12 questions. ~8 min.",
    bullets: [
      "Tout l'Express",
      "Outils, livrables, clientèle, valeurs",
      "1 template email type",
      "Personnalisation marquée de l'agent",
    ],
  },
  {
    id: "deep",
    title: "Studio complet",
    pitch: "Questionnaire approfondi. ~15 min.",
    bullets: [
      "Tout le précédent",
      "Matériaux, fournisseurs, tarifs types",
      "Bibliothèque de templates emails (relance, devis, livraison)",
      "Agent quasi-jumeau de votre cabinet",
    ],
  },
];

const ROLE_OPTIONS = [
  "Architecte associé",
  "Architecte chef de projet",
  "Architecte d'intérieur",
  "Designer",
  "Stagiaire",
  "Assistant·e",
  "Direction commerciale",
  "Direction administrative",
  "Autre",
];

type TeamRow = { display_name: string; email: string; role_label: string };

export default function Onboarding() {
  const { user } = useAuth();
  const { workspace, onboardingCompleted, loading, refresh } = useWorkspace();
  const navigate = useNavigate();

  const [step, setStep] = useState<"choose" | "form" | "team" | "done">("choose");
  const [level, setLevel] = useState<Level>("full");

  type WorkspaceConfig = {
    name: string;
    style: string;
    project_types: string;
    tone: string;
    email_signature: string;
    tools: string;
    deliverables: string;
    clientele: string;
    brand_values: string;
    references_text: string;
    process: string;
    materials_pref: string;
    suppliers: string;
    typical_pricing: string;
  };

  const [form, setForm] = useState<WorkspaceConfig>({
    name: "",
    style: "",
    project_types: "",
    tone: "",
    email_signature: "",
    tools: "",
    deliverables: "",
    clientele: "",
    brand_values: "",
    references_text: "",
    process: "",
    materials_pref: "",
    suppliers: "",
    typical_pricing: "",
  });
  const [emailTemplates, setEmailTemplates] = useState({
    relance: "",
    devis: "",
    livraison: "",
  });

  const [team, setTeam] = useState<TeamRow[]>([]);
  const [createdLinks, setCreatedLinks] = useState<{ name: string; url: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && onboardingCompleted) navigate("/dashboard", { replace: true });
  }, [loading, onboardingCompleted, navigate]);

  async function saveAll() {
    if (!user || !workspace) return;
    if (!form.name.trim()) {
      toast({ title: "Nom du cabinet requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: WorkspaceConfig & { workspace_id: string; email_templates?: { relais: string } } = {
        workspace_id: workspace.id,
        name: form.name,
        style: form.style,
        project_types: form.project_types,
        tone: form.tone,
        email_signature: form.email_signature,
      };
      if (level !== "light") {
        Object.assign(payload, {
          tools: form.tools,
          deliverables: form.deliverables,
          clientele: form.clientele,
          brand_values: form.brand_values,
          references_text: form.references_text,
          email_templates: { relance: emailTemplates.relance },
        });
      }
      if (level === "deep") {
        Object.assign(payload, {
          process: form.process,
          materials_pref: form.materials_pref,
          suppliers: form.suppliers,
          typical_pricing: form.typical_pricing,
          email_templates: emailTemplates,
        });
      }

      const { error: upErr } = await supabase
        .from("cabinet_profile")
        .upsert(payload, { onConflict: "workspace_id" });
      if (upErr) throw upErr;

      // Update workspace name
      await supabase.from("workspaces").update({ name: form.name }).eq("id", workspace.id);

      setStep("team");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveTeam() {
    if (!user || !workspace) return;
    setSaving(true);
    try {
      const valid = team.filter((t) => t.display_name.trim());
      const created: { name: string; url: string }[] = [];
      for (const t of valid) {
        const { data, error } = await supabase
          .from("team_members")
          .insert({
            workspace_id: workspace.id,
            invited_by: user.id,
            display_name: t.display_name.trim(),
            email: t.email.trim() || null,
            role_label: t.role_label || "collaborateur",
          })
          .select("invite_token")
          .single();
        if (error) throw error;
        const url = `${window.location.origin}/join/${data.invite_token}`;
        created.push({ name: t.display_name, url });
      }
      setCreatedLinks(created);

      await supabase
        .from("profiles")
        .update({ onboarding_completed: true, onboarding_level: level })
        .eq("id", user.id);

      await refresh();
      setStep("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, key: keyof typeof form, opts?: { textarea?: boolean; ph?: string }) {
    return (
      <div className="space-y-2">
        <Label className="text-[#F0EAE0]/70 text-xs tracking-[0.15em] uppercase">{label}</Label>
        {opts?.textarea ? (
          <Textarea
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={opts?.ph}
            className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] min-h-[90px]"
          />
        ) : (
          <Input
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={opts?.ph}
            className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0]"
          />
        )}
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-[#0b0b0b]" />;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div
          className="text-[#C4A264] tracking-[0.4em] text-xs mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          FORMA · ONBOARDING
        </div>

        {step === "choose" && (
          <>
            <h1
              className="text-4xl mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Personnalisons votre studio.
            </h1>
            <p className="text-[#F0EAE0]/60 mb-2">
              Plus vous nous en dites sur votre cabinet, plus l'agent vous ressemble :
              ton, signatures, choix de matériaux, manière de répondre aux clients.
            </p>
            <p className="text-[#C4A264]/80 text-sm mb-10 italic">
              Nous recommandons la version <b>Recommandé</b> ou <b>Studio complet</b> pour
              libérer tout le potentiel de l'agent.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`text-left p-5 border transition-all ${
                    level === l.id
                      ? "border-[#C4A264] bg-[#C4A264]/5"
                      : "border-[#C4A264]/15 hover:border-[#C4A264]/40"
                  }`}
                >
                  <div
                    className="text-xl mb-1"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {l.title}
                  </div>
                  <div className="text-xs text-[#F0EAE0]/50 mb-3">{l.pitch}</div>
                  <ul className="space-y-1.5">
                    {l.bullets.map((b) => (
                      <li key={b} className="text-xs text-[#F0EAE0]/70 flex gap-2">
                        <Check className="w-3 h-3 text-[#C4A264] mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <Button
                onClick={() => setStep("form")}
                className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
              >
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === "form" && (
          <>
            <h1
              className="text-3xl mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Votre cabinet
            </h1>
            <p className="text-[#F0EAE0]/50 text-sm mb-8">
              Niveau : {LEVELS.find((l) => l.id === level)?.title}
            </p>

            <div className="space-y-5">
              {field("Nom du cabinet *", "name", { ph: "Studio Lumière" })}
              {field("Style architectural / signature", "style", {
                ph: "Minimalisme chaleureux, matériaux nobles…",
                textarea: true,
              })}
              {field("Types de projets", "project_types", {
                ph: "Hôtellerie, résidentiel haut de gamme, retail…",
              })}
              {field("Ton de communication", "tone", {
                ph: "Élégant, direct, vouvoiement, peu d'emojis…",
              })}
              {field("Signature email", "email_signature", {
                textarea: true,
                ph: "Cordialement,\nJean Dupont — Studio Lumière\n+33…",
              })}

              {(level === "full" || level === "deep") && (
                <>
                  {field("Outils utilisés", "tools", {
                    ph: "Archicad, Rhino, V-Ray, Photoshop…",
                  })}
                  {field("Livrables types", "deliverables", {
                    ph: "Plans, perspectives, notes de cadrage, books matières…",
                    textarea: true,
                  })}
                  {field("Clientèle cible", "clientele", { ph: "Promoteurs, particuliers…" })}
                  {field("Valeurs de marque", "brand_values", {
                    ph: "Pérennité, sobriété, sur-mesure…",
                  })}
                  {field("Références / inspirations", "references_text", {
                    textarea: true,
                    ph: "John Pawson, Vincent Van Duysen, Studio KO…",
                  })}
                  <div className="space-y-2">
                    <Label className="text-[#F0EAE0]/70 text-xs tracking-[0.15em] uppercase">
                      Template email — relance client
                    </Label>
                    <Textarea
                      value={emailTemplates.relance}
                      onChange={(e) =>
                        setEmailTemplates({ ...emailTemplates, relance: e.target.value })
                      }
                      placeholder="Bonjour {{client}}, je me permets de revenir vers vous concernant…"
                      className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] min-h-[90px]"
                    />
                  </div>
                </>
              )}

              {level === "deep" && (
                <>
                  {field("Processus de travail", "process", {
                    textarea: true,
                    ph: "Phase APS, APD, PRO, livrables associés, points clients…",
                  })}
                  {field("Matériaux préférés", "materials_pref", {
                    textarea: true,
                    ph: "Chêne fumé, travertin, lin écru, laiton brossé…",
                  })}
                  {field("Fournisseurs habituels", "suppliers", {
                    textarea: true,
                    ph: "Liste de fournisseurs / artisans de confiance…",
                  })}
                  {field("Tarifs types", "typical_pricing", {
                    textarea: true,
                    ph: "Mission complète : 12-15% du montant travaux. APS : forfait 4-8k€…",
                  })}
                  <div className="space-y-2">
                    <Label className="text-[#F0EAE0]/70 text-xs tracking-[0.15em] uppercase">
                      Template email — devis
                    </Label>
                    <Textarea
                      value={emailTemplates.devis}
                      onChange={(e) =>
                        setEmailTemplates({ ...emailTemplates, devis: e.target.value })
                      }
                      className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] min-h-[90px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#F0EAE0]/70 text-xs tracking-[0.15em] uppercase">
                      Template email — livraison
                    </Label>
                    <Textarea
                      value={emailTemplates.livraison}
                      onChange={(e) =>
                        setEmailTemplates({ ...emailTemplates, livraison: e.target.value })
                      }
                      className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] min-h-[90px]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-10 flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep("choose")}
                className="text-[#F0EAE0]/70"
              >
                Retour
              </Button>
              <Button
                onClick={saveAll}
                disabled={saving}
                className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
              >
                {saving ? "Enregistrement…" : "Continuer"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === "team" && (
          <>
            <h1
              className="text-3xl mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Votre équipe
            </h1>
            <p className="text-[#F0EAE0]/60 text-sm mb-8">
              Ajoutez les membres de votre cabinet et définissez leur rôle.
              Vous obtiendrez un lien unique à partager pour chacun.
            </p>

            <div className="space-y-3">
              {team.map((t, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-center border border-[#C4A264]/15 p-3"
                >
                  <Input
                    placeholder="Nom prénom"
                    value={t.display_name}
                    onChange={(e) => {
                      const c = [...team];
                      c[i].display_name = e.target.value;
                      setTeam(c);
                    }}
                    className="col-span-4 bg-black/40 border-[#C4A264]/20 text-[#F0EAE0]"
                  />
                  <Input
                    placeholder="email (optionnel)"
                    value={t.email}
                    onChange={(e) => {
                      const c = [...team];
                      c[i].email = e.target.value;
                      setTeam(c);
                    }}
                    className="col-span-4 bg-black/40 border-[#C4A264]/20 text-[#F0EAE0]"
                  />
                  <select
                    value={t.role_label}
                    onChange={(e) => {
                      const c = [...team];
                      c[i].role_label = e.target.value;
                      setTeam(c);
                    }}
                    className="col-span-3 bg-black/40 border border-[#C4A264]/20 text-[#F0EAE0] text-sm h-10 px-2"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTeam(team.filter((_, j) => j !== i))}
                    className="col-span-1 text-[#F0EAE0]/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="ghost"
                onClick={() =>
                  setTeam([
                    ...team,
                    { display_name: "", email: "", role_label: "Architecte chef de projet" },
                  ])
                }
                className="text-[#C4A264] hover:bg-[#C4A264]/10"
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter un membre
              </Button>
            </div>

            <div className="mt-10 flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep("form")}
                className="text-[#F0EAE0]/70"
              >
                Retour
              </Button>
              <Button
                onClick={saveTeam}
                disabled={saving}
                className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
              >
                {saving ? "Création…" : team.length === 0 ? "Passer cette étape" : "Terminer"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <div className="text-center mb-10">
              <Sparkles className="w-10 h-10 text-[#C4A264] mx-auto mb-4" />
              <h1
                className="text-4xl mb-3"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Votre studio est prêt.
              </h1>
              <p className="text-[#F0EAE0]/60">
                L'agent est désormais personnalisé pour votre cabinet.
              </p>
            </div>

            {createdLinks.length > 0 && (
              <div className="border border-[#C4A264]/20 p-5 mb-8">
                <div className="text-sm text-[#C4A264] mb-3 tracking-[0.15em] uppercase">
                  Liens d'invitation
                </div>
                <div className="space-y-2">
                  {createdLinks.map((l) => (
                    <div
                      key={l.url}
                      className="flex items-center justify-between gap-3 p-2 bg-black/40"
                    >
                      <div className="text-sm">
                        <div className="text-[#F0EAE0]">{l.name}</div>
                        <div className="text-xs text-[#F0EAE0]/40 truncate">{l.url}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(l.url);
                          toast({ title: "Lien copié" });
                        }}
                        className="text-[#C4A264]"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
              >
                Entrer dans le studio <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
