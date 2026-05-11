import { useEffect, useMemo, useState, memo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ShareButton";
import {
  Download, ExternalLink, Loader2, FileSpreadsheet, LayoutGrid, BarChart3,
  Globe, FileText, Images, Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ArtifactType = "slideshow" | "spreadsheet" | "dataviz" | "website" | "document" | "moodboard";
type Artifact = { id: string; type: ArtifactType; title: string; content: string; mime_type: string };

const ICONS: Record<ArtifactType, LucideIcon> = {
  slideshow: LayoutGrid, spreadsheet: FileSpreadsheet, dataviz: BarChart3,
  website: Globe, document: FileText, moodboard: Images,
};
const LABELS: Record<ArtifactType, string> = {
  slideshow: "Diaporama", spreadsheet: "Tableur", dataviz: "Visualisation",
  website: "Site web", document: "Document", moodboard: "Moodboard",
};

export const ArtifactPreview = memo(function ArtifactPreview({ artifactId }: { artifactId: string }) {
  const [a, setA] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("artifacts")
      .select("id, type, title, content, mime_type")
      .eq("id", artifactId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) { setA(data as Artifact | null); setLoading(false); }
      });
    return () => { active = false; };
  }, [artifactId]);

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-[#F0EAE0]/50 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" /> Chargement du livrable…
      </div>
    );
  }
  if (!a) return <div className="text-xs text-[#F0EAE0]/40 mt-3">Artefact introuvable</div>;

  const Icon = ICONS[a.type] ?? FileText;

  function quickDownload() {
    if (!a) return;
    const ext = a.type === "spreadsheet" ? "csv" : "html";
    const blob = new Blob([a.content], { type: a.mime_type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${a.title.replace(/[^\w-]+/g, "_")}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openInTab() {
    if (!a) return;
    const blob = new Blob([a.content], { type: a.mime_type });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  if (a.type === "moodboard") {
    return (
      <div className="mt-3 border border-[#C4A264]/25 rounded-sm overflow-hidden bg-black/30">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#C4A264]/15 bg-[#C4A264]/5">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-3.5 h-3.5 text-[#C4A264] shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#C4A264]">Moodboard</span>
            <span className="text-xs text-[#F0EAE0]/80 truncate">— {a.title}</span>
          </div>
        </div>
        <MoodboardView content={a.content} />
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3 p-3 border border-[#C4A264]/25 rounded-sm bg-gradient-to-br from-[#C4A264]/5 to-transparent">
      <div className="w-10 h-10 shrink-0 rounded-sm bg-[#C4A264]/10 flex items-center justify-center border border-[#C4A264]/25">
        <Icon className="w-5 h-5 text-[#C4A264]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.15em] text-[#C4A264]">{LABELS[a.type]}</div>
        <div className="text-sm text-[#F0EAE0] truncate">{a.title}</div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button asChild size="sm" className="h-8 bg-[#C4A264] hover:bg-[#C4A264]/90 text-black">
          <Link to={`/dashboard/studio/${a.id}`}>
            <Wand2 className="w-3.5 h-3.5 mr-1" /> Ouvrir
          </Link>
        </Button>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-[#F0EAE0]/70 hover:text-[#C4A264]" onClick={openInTab} title="Aperçu">
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-[#F0EAE0]/70 hover:text-[#C4A264]" onClick={quickDownload} title="Télécharger">
          <Download className="w-3.5 h-3.5" />
        </Button>
        <ShareButton entityType="artifact" entityId={a.id} entityTitle={a.title} />
      </div>
    </div>
  );
});

export const MoodboardView = memo(function MoodboardView({ content }: { content: string }) {
  type RenderRow = { id: string; status: string; output_path: string; prompt: string; url?: string };
  const [renders, setRenders] = useState<RenderRow[]>([]);
  const parsed = useMemo(() => {
    try { return JSON.parse(content) as { renderIds: string[]; prompts: string[] }; }
    catch { return { renderIds: [], prompts: [] }; }
  }, [content]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!parsed.renderIds.length) return;
      const { data } = await supabase.from("renders")
        .select("id, status, output_path, prompt").in("id", parsed.renderIds);
      if (!active || !data) return;
      const withUrls = await Promise.all(data.map(async (r) => {
        if (r.output_path) {
          const { data: signed } = await supabase.storage.from("render-outputs").createSignedUrl(r.output_path, 3600);
          return { ...r, url: signed?.signedUrl };
        }
        return r;
      }));
      setRenders(withUrls);
    }
    load();
    const ch = supabase.channel(`moodboard-${parsed.renderIds.join("-")}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "renders" }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [content, parsed.renderIds]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-black/40">
      {parsed.renderIds.map((id, i) => {
        const r = renders.find((x) => x.id === id);
        return (
          <div key={id} className="aspect-square bg-black/60 border border-[#C4A264]/15 overflow-hidden relative">
            {r?.url ? (
              <img src={r.url} alt={r.prompt} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#C4A264]/60 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-[#F0EAE0]/80 line-clamp-2">
              {parsed.prompts[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
});
