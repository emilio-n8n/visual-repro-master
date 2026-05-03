import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileSpreadsheet, LayoutGrid, BarChart3, Globe, Loader2 } from "lucide-react";

type Artifact = {
  id: string;
  type: "slideshow" | "spreadsheet" | "dataviz" | "website";
  title: string;
  content: string;
  mime_type: string;
};

const ICONS = {
  slideshow: LayoutGrid,
  spreadsheet: FileSpreadsheet,
  dataviz: BarChart3,
  website: Globe,
};

const LABELS = {
  slideshow: "Diaporama",
  spreadsheet: "Tableur",
  dataviz: "Visualisation",
  website: "Site web",
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
