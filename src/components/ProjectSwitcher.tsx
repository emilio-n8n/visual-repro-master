import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, Plus, FolderOpen, Check } from "lucide-react";

type ProjectForm = {
  name: string;
  client: string;
  location: string;
  type: string;
  surface: string;
  budget: string;
  deadline: string;
  brief: string;
};

export function ProjectSwitcher() {
  const { user } = useAuth();
  const { workspace, projects, activeProjectId, setActiveProjectId, refresh } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ProjectForm>({
    name: "",
    client: "",
    location: "",
    type: "",
    surface: "",
    budget: "",
    deadline: "",
    brief: "",
  });
  const [busy, setBusy] = useState(false);

  const active = projects.find((p) => p.id === activeProjectId);

  async function create() {
    if (!user || !workspace || !form.name.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...form, workspace_id: workspace.id, owner_id: user.id })
        .select()
        .single();
      if (error) throw error;
      await refresh();
      setActiveProjectId(data.id);
      setCreating(false);
      setOpen(false);
      setForm({
        name: "",
        client: "",
        location: "",
        type: "",
        surface: "",
        budget: "",
        deadline: "",
        brief: "",
      });
      toast({ title: "Projet créé" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-[#C4A264]/15 hover:border-[#C4A264]/40 transition-colors text-left rounded-sm">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="w-3.5 h-3.5 text-[#C4A264] shrink-0" />
            <span className="text-xs text-[#F0EAE0]/80 truncate">
              {active?.name ?? "Aucun projet"}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-[#F0EAE0]/40" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#0b0b0b] border-[#C4A264]/20 text-[#F0EAE0] max-w-lg">
        {!creating ? (
          <>
            <DialogHeader>
              <DialogTitle
                className="text-[#C4A264]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Projets
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1 max-h-[50vh] overflow-auto">
              <button
                onClick={() => {
                  setActiveProjectId(null);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-sm text-[#F0EAE0]/60"
              >
                {!activeProjectId && <Check className="w-3.5 h-3.5 text-[#C4A264]" />}
                <span className={activeProjectId ? "ml-5" : ""}>Aucun projet</span>
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProjectId(p.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-sm"
                >
                  {activeProjectId === p.id && <Check className="w-3.5 h-3.5 text-[#C4A264]" />}
                  <div className={activeProjectId === p.id ? "" : "ml-5"}>
                    <div className="text-[#F0EAE0]">{p.name}</div>
                    {p.client && (
                      <div className="text-xs text-[#F0EAE0]/40">{p.client}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setCreating(true)}
              className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
            >
              <Plus className="w-4 h-4 mr-2" /> Nouveau projet
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle
                className="text-[#C4A264]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Nouveau projet
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {[
                { k: "name", l: "Nom du projet *", ph: "Villa M." },
                { k: "client", l: "Client", ph: "M. Martin" },
                { k: "location", l: "Lieu", ph: "Aix-en-Provence" },
                { k: "type", l: "Type", ph: "Résidentiel, hôtelier, retail…" },
                { k: "surface", l: "Surface", ph: "320 m²" },
                { k: "budget", l: "Budget", ph: "1.2 M€" },
                { k: "deadline", l: "Échéance", ph: "Livraison T3 2026" },
              ].map((f) => (
                <div key={f.k}>
                  <Label className="text-xs text-[#F0EAE0]/60 uppercase tracking-[0.1em]">
                    {f.l}
                  </Label>
                  <Input
                    value={form[f.k as keyof ProjectForm]}
                    onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                    placeholder={f.ph}
                    className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] mt-1"
                  />
                </div>
              ))}
              <div>
                <Label className="text-xs text-[#F0EAE0]/60 uppercase tracking-[0.1em]">
                  Brief
                </Label>
                <Textarea
                  value={form.brief}
                  onChange={(e) => setForm({ ...form, brief: e.target.value })}
                  placeholder="Contexte, contraintes, attentes…"
                  className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] mt-1 min-h-[100px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Annuler
              </Button>
              <Button
                onClick={create}
                disabled={busy || !form.name.trim()}
                className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
              >
                Créer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
