import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Download, ExternalLink, Loader2, Sparkles, Save, Wand2,
  FileText, FileSpreadsheet, Image as ImageIcon, FileCode, FileType,
} from "lucide-react";
import html2canvas from "html2canvas";

type Artifact = {
  id: string;
  type: "slideshow" | "spreadsheet" | "dataviz" | "website" | "document" | "moodboard";
  title: string;
  content: string;
  mime_type: string;
};

const FORMATS: Record<Artifact["type"], { label: string; ext: string; mime: string }[]> = {
  slideshow: [
    { label: "HTML", ext: "html", mime: "text/html" },
    { label: "PDF (impression)", ext: "pdf", mime: "application/pdf" },
    { label: "PNG (1ère slide)", ext: "png", mime: "image/png" },
  ],
  document: [
    { label: "HTML", ext: "html", mime: "text/html" },
    { label: "PDF (impression)", ext: "pdf", mime: "application/pdf" },
  ],
  website: [
    { label: "HTML", ext: "html", mime: "text/html" },
    { label: "PNG (capture)", ext: "png", mime: "image/png" },
  ],
  dataviz: [
    { label: "HTML", ext: "html", mime: "text/html" },
    { label: "PNG (capture)", ext: "png", mime: "image/png" },
  ],
  spreadsheet: [
    { label: "CSV", ext: "csv", mime: "text/csv" },
    { label: "Excel (xls)", ext: "xls", mime: "application/vnd.ms-excel" },
  ],
  moodboard: [{ label: "JSON", ext: "json", mime: "application/json" }],
};

export default function Studio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [a, setA] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedContent, setEditedContent] = useState<string>("");
  const [instruction, setInstruction] = useState("");
  const [selection, setSelection] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("artifacts")
      .select("id, type, title, content, mime_type")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setA(data as Artifact | null);
        setEditedContent((data as Artifact | null)?.content ?? "");
        setLoading(false);
      });
  }, [id]);

  async function applyAi() {
    if (!a || !instruction.trim()) return;
    setEditing(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-edit`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artifactId: a.id, instruction, selection: selection || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "Erreur");
      setA({ ...a, content: data.content });
      setEditedContent(data.content);
      setInstruction("");
      setSelection("");
      toast({ title: "Modifications appliquées" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setEditing(false);
    }
  }

  async function saveManual() {
    if (!a) return;
    setSaving(true);
    const { error } = await supabase.from("artifacts").update({ content: editedContent }).eq("id", a.id);
    setSaving(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      setA({ ...a, content: editedContent });
      toast({ title: "Enregistré" });
    }
  }

  async function exportAs(fmt: { ext: string; mime: string }) {
    if (!a) return;
    const baseName = a.title.replace(/[^\w-]+/g, "_") || "livrable";

    if (fmt.ext === "pdf") {
      // Open in new tab and trigger print → save as PDF
      const blob = new Blob([a.content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      setTimeout(() => { try { w?.print(); } catch {} }, 800);
      return;
    }

    if (fmt.ext === "png" || fmt.ext === "jpg") {
      // Render via offscreen iframe
      const tmp = document.createElement("iframe");
      tmp.style.position = "fixed";
      tmp.style.left = "-10000px";
      tmp.style.width = "1280px";
      tmp.style.height = "800px";
      document.body.appendChild(tmp);
      tmp.srcdoc = a.content;
      await new Promise((r) => (tmp.onload = () => r(null)));
      await new Promise((r) => setTimeout(r, 400));
      try {
        const doc = tmp.contentDocument!;
        const canvas = await html2canvas(doc.body, { backgroundColor: "#ffffff", scale: 1.5, useCORS: true });
        const data = canvas.toDataURL(fmt.mime);
        const link = document.createElement("a");
        link.href = data;
        link.download = `${baseName}.${fmt.ext}`;
        link.click();
      } catch (e: any) {
        toast({ title: "Export image impossible", description: e.message, variant: "destructive" });
      } finally {
        document.body.removeChild(tmp);
      }
      return;
    }

    if (fmt.ext === "xls") {
      // Wrap CSV in HTML table xls
      const rows = (a.content || "").split(/\r?\n/).map((l) => l.split(",").map((c) => `<td>${escapeHtml(c)}</td>`).join(""));
      const html = `<html><head><meta charset="utf-8"></head><body><table>${rows.map((r) => `<tr>${r}</tr>`).join("")}</table></body></html>`;
      downloadBlob(new Blob([html], { type: fmt.mime }), `${baseName}.xls`);
      return;
    }

    // Default: raw content
    downloadBlob(new Blob([a.content], { type: fmt.mime }), `${baseName}.${fmt.ext}`);
  }

  function openInTab() {
    if (!a) return;
    const blob = new Blob([a.content], { type: a.mime_type });
    window.open(URL.createObjectURL(blob), "_blank");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-[#F0EAE0]/60">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement du livrable…
      </div>
    );
  }
  if (!a) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-[#F0EAE0]/60">
        Livrable introuvable. <Link to="/dashboard/agent" className="ml-2 underline text-[#C4A264]">Retour</Link>
      </div>
    );
  }

  const formats = FORMATS[a.type] ?? [{ label: "Fichier", ext: "txt", mime: "text/plain" }];
  const isCsv = a.type === "spreadsheet";

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0] flex flex-col">
      {/* Top bar */}
      <header className="border-b border-[#C4A264]/15 px-6 py-3 flex items-center gap-3 bg-[#0a0a0a]">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-[#F0EAE0]/70">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C4A264]">{a.type}</div>
          <div className="text-sm truncate">{a.title}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={openInTab} className="text-[#F0EAE0]/80 hover:text-[#C4A264]">
          <ExternalLink className="w-4 h-4 mr-1" /> Aperçu plein écran
        </Button>
        <div className="relative group">
          <Button size="sm" className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black">
            <Download className="w-4 h-4 mr-1" /> Télécharger
          </Button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-30 min-w-[200px] bg-[#0a0a0a] border border-[#C4A264]/30 rounded-sm shadow-xl">
            {formats.map((f) => (
              <button
                key={f.ext}
                onClick={() => exportAs(f)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#F0EAE0]/80 hover:bg-[#C4A264]/10 hover:text-[#C4A264]"
              >
                <FormatIcon ext={f.ext} /> {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left: live preview / editor */}
        <main className="flex-1 p-4 min-w-0">
          {isCsv ? (
            <div className="h-full flex flex-col gap-2">
              <div className="text-xs text-[#F0EAE0]/50">Édition CSV directe — sélectionnez du texte pour cibler la modif IA.</div>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onSelect={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  setSelection(t.value.slice(t.selectionStart, t.selectionEnd));
                }}
                className="flex-1 font-mono text-xs bg-black/60 border-[#C4A264]/20 text-[#F0EAE0]"
              />
              <div className="flex justify-end">
                <Button onClick={saveManual} disabled={saving || editedContent === a.content} className="bg-[#C4A264] text-black">
                  <Save className="w-4 h-4 mr-1" /> {saving ? "…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={a.content}
              title={a.title}
              sandbox="allow-scripts"
              className="w-full h-full bg-white rounded-sm border border-[#C4A264]/15"
            />
          )}
        </main>

        {/* Right: AI edit panel */}
        <aside className="w-[360px] border-l border-[#C4A264]/15 p-5 bg-[#0a0a0a] overflow-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#C4A264]" />
            <h2 className="text-sm uppercase tracking-[0.2em] text-[#C4A264]">Édition IA</h2>
          </div>
          <p className="text-xs text-[#F0EAE0]/50 mb-4">
            Décrivez la modification. Mentionnez "uniquement la slide 2", "le titre", etc., ou collez la portion à reformuler.
          </p>

          <label className="text-[10px] uppercase tracking-[0.15em] text-[#F0EAE0]/60">Portion à modifier (optionnel)</label>
          <Textarea
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            placeholder="Collez ici le texte à modifier…"
            className="mt-1 mb-4 bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] text-xs min-h-[70px]"
          />

          <label className="text-[10px] uppercase tracking-[0.15em] text-[#F0EAE0]/60">Instruction</label>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ex : reformule de manière plus concise, ajoute une slide de conclusion, change la palette pour des tons chauds…"
            className="mt-1 mb-3 bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] text-sm min-h-[110px]"
          />
          <Button
            onClick={applyAi}
            disabled={editing || !instruction.trim()}
            className="w-full bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
          >
            {editing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            {editing ? "Modification…" : "Appliquer l'IA"}
          </Button>

          <div className="mt-6 pt-5 border-t border-[#C4A264]/15">
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#F0EAE0]/40 mb-2">Suggestions rapides</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Reformule plus concis",
                "Plus chaleureux",
                "Ajoute un titre fort",
                "Corrige les fautes",
                isCsv ? "Trie par valeur décroissante" : "Améliore la mise en page",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInstruction(q)}
                  className="text-[11px] px-2 py-1 border border-[#C4A264]/25 text-[#F0EAE0]/70 hover:bg-[#C4A264]/10 rounded-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function FormatIcon({ ext }: { ext: string }) {
  if (ext === "pdf") return <FileType className="w-3.5 h-3.5" />;
  if (ext === "png" || ext === "jpg") return <ImageIcon className="w-3.5 h-3.5" />;
  if (ext === "csv" || ext === "xls") return <FileSpreadsheet className="w-3.5 h-3.5" />;
  if (ext === "html") return <FileCode className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}
