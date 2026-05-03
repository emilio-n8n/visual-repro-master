import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileSpreadsheet, LayoutGrid, BarChart3, Globe, Loader2, FileText, Images } from "lucide-react";

type ArtifactType = "slideshow" | "spreadsheet" | "dataviz" | "website" | "document" | "moodboard";

type Artifact = {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  mime_type: string;
};

const ICONS: Record<ArtifactType, any> = {
  slideshow: LayoutGrid,
  spreadsheet: FileSpreadsheet,
  dataviz: BarChart3,
  website: Globe,
  document: FileText,
  moodboard: Images,
};

const LABELS: Record<ArtifactType, string> = {
  slideshow: "Diaporama",
  spreadsheet: "Tableur",
  dataviz: "Visualisation",
  website: "Site web",
  document: "Document",
  moodboard: "Moodboard",
};

export function ArtifactPreview({ artifactId }: { artifactId: string }) {
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
        if (active) {
          setA(data as Artifact | null);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [artifactId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#F0EAE0]/50 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" /> Chargement…
      </div>
    );
  }
  if (!a) return <div className="text-xs text-[#F0EAE0]/40">Artefact introuvable</div>;

  const Icon = ICONS[a.type];

  function download() {
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
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  return (
    <div className="mt-3 border border-[#C4A264]/25 rounded-sm overflow-hidden bg-black/30">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#C4A264]/15 bg-[#C4A264]/5">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-3.5 h-3.5 text-[#C4A264] shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#C4A264]">{LABELS[a.type]}</span>
          <span className="text-xs text-[#F0EAE0]/80 truncate">— {a.title}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[#F0EAE0]/70 hover:text-[#C4A264]" onClick={openInTab}>
            <ExternalLink className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[#F0EAE0]/70 hover:text-[#C4A264]" onClick={download}>
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {a.type === "spreadsheet" ? (
        <CsvTable csv={a.content} />
      ) : a.type === "moodboard" ? (
        <MoodboardView content={a.content} />
      ) : (
        <iframe
          srcDoc={a.content}
          title={a.title}
          sandbox="allow-scripts"
          className="w-full h-[420px] bg-white"
        />
      )}
    </div>
  );
}

function MoodboardView({ content }: { content: string }) {
  const [renders, setRenders] = useState<any[]>([]);
  let parsed: { renderIds: string[]; prompts: string[] } = { renderIds: [], prompts: [] };
  try { parsed = JSON.parse(content); } catch {}

  useEffect(() => {
    let active = true;
    async function load() {
      if (!parsed.renderIds.length) return;
      const { data } = await supabase
        .from("renders")
        .select("id, status, output_path, prompt")
        .in("id", parsed.renderIds);
      if (!active || !data) return;
      const withUrls = await Promise.all(
        data.map(async (r: any) => {
          if (r.output_path) {
            const { data: signed } = await supabase.storage
              .from("render-outputs")
              .createSignedUrl(r.output_path, 3600);
            return { ...r, url: signed?.signedUrl };
          }
          return r;
        })
      );
      setRenders(withUrls);
    }
    load();
    const ch = supabase
      .channel(`moodboard-${parsed.renderIds.join("-")}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "renders" }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [content]);

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
}

function CsvTable({ csv }: { csv: string }) {
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .slice(0, 50)
    .map((r) => parseCsvLine(r));
  if (!rows.length) return <div className="p-4 text-xs text-[#F0EAE0]/40">Vide</div>;
  const [head, ...body] = rows;
  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full text-xs">
        <thead className="bg-[#C4A264]/10 text-[#C4A264] sticky top-0">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-medium border-b border-[#C4A264]/15">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i} className="text-[#F0EAE0]/80 hover:bg-white/5">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-1.5 border-b border-white/5">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === ",") { out.push(cur); cur = ""; }
      else if (ch === '"') inQ = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}
