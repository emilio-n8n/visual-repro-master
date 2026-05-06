import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Download, ExternalLink, Loader2, Sparkles, Save, Wand2,
  FileText, FileSpreadsheet, Image as ImageIcon, FileCode, FileType,
  ChevronDown, Redo2, Undo2, Bold, Italic, Type, Plus, X, Search, ChevronRight,
  History, Share2
} from "lucide-react";
import html2canvas from "html2canvas";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Artifact = {
  id: string;
  type: "slideshow" | "spreadsheet" | "dataviz" | "website" | "document" | "moodboard";
  title: string;
  content: string;
  mime_type: string;
};

const FORMATS: Record<Artifact["type"], { label: string; ext: string; mime: string }[]> = {
  slideshow: [
    { label: "Document PDF (.pdf)", ext: "pdf", mime: "application/pdf" },
    { label: "Document Microsoft Word (.docx)", ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    { label: "Document Markdown (.md)", ext: "md", mime: "text/markdown" },
  ],
  document: [
    { label: "Document PDF (.pdf)", ext: "pdf", mime: "application/pdf" },
    { label: "Document Microsoft Word (.docx)", ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    { label: "Document Markdown (.md)", ext: "md", mime: "text/markdown" },
  ],
  website: [
    { label: "Site Web (HTML)", ext: "html", mime: "text/html" },
    { label: "Capture Image (PNG)", ext: "png", mime: "image/png" },
    { label: "Document PDF (.pdf)", ext: "pdf", mime: "application/pdf" },
  ],
  dataviz: [
    { label: "Capture Image (PNG)", ext: "png", mime: "image/png" },
    { label: "Document PDF (.pdf)", ext: "pdf", mime: "application/pdf" },
  ],
  spreadsheet: [
    { label: "Document Excel (.xlsx)", ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { label: "Fichier CSV (.csv)", ext: "csv", mime: "text/csv" },
  ],
  moodboard: [
    { label: "Données JSON (.json)", ext: "json", mime: "application/json" },
    { label: "Document PDF (.pdf)", ext: "pdf", mime: "application/pdf" }
  ],
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
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Handle text selection in iframe
  useEffect(() => {
    const handleSelection = () => {
      if (!iframeRef.current) return;
      const doc = iframeRef.current.contentDocument;
      if (!doc) return;

      const sel = doc.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const iframeRect = iframeRef.current.getBoundingClientRect();

        setSelection(sel.toString());
        setSelectionRect({
          top: rect.top + iframeRect.top - 50,
          left: rect.left + iframeRect.left + (rect.width / 2)
        });
      } else {
        setSelection("");
        setSelectionRect(null);
      }
    };

    const interval = setInterval(() => {
        if (iframeRef.current?.contentDocument) {
            iframeRef.current.contentDocument.removeEventListener("mouseup", handleSelection);
            iframeRef.current.contentDocument.addEventListener("mouseup", handleSelection);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function applyAi(inst?: string) {
    const finalInst = inst || instruction;
    if (!a || !finalInst.trim()) return;
    setEditing(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-edit`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artifactId: a.id, instruction: finalInst, selection: selection || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "Erreur");
      setA({ ...a, content: data.content });
      setEditedContent(data.content);
      setInstruction("");
      setSelection("");
      setSelectionRect(null);
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
      const blob = new Blob([a.content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (w) {
          w.onload = () => {
              w.print();
          };
      }
      return;
    }

    if (fmt.ext === "md") {
        downloadBlob(new Blob([a.content], { type: fmt.mime }), `${baseName}.md`);
        return;
    }

    if (fmt.ext === "docx" || fmt.ext === "xlsx") {
        const blob = new Blob([a.content], { type: fmt.mime });
        downloadBlob(blob, `${baseName}.${fmt.ext}`);
        return;
    }

    if (fmt.ext === "png" || fmt.ext === "jpg") {
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

    downloadBlob(new Blob([a.content], { type: fmt.mime }), `${baseName}.${fmt.ext}`);
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

  // Document styling for iframe
  const documentStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body {
        font-family: 'Inter', -apple-system, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        max-width: 800px;
        margin: 0 auto;
        padding: 60px 40px;
        background: white;
      }
      h1, h2, h3, h4 { color: #000; font-weight: 600; line-height: 1.2; margin-top: 1.5em; margin-bottom: 0.5em; }
      h1 { font-size: 2.5em; border-bottom: 1px solid #eaeaea; padding-bottom: 0.3em; }
      h2 { font-size: 1.8em; }
      p { margin-bottom: 1.2em; }
      ul, ol { margin-bottom: 1.2em; padding-left: 1.5em; }
      li { margin-bottom: 0.4em; }
      blockquote { border-left: 4px solid #eaeaea; padding-left: 1em; color: #666; font-style: italic; margin: 1.5em 0; }
      table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 0.9em; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      th { background: #f8f8f8; font-weight: 600; }
      tr:nth-child(even) { background: #fafafa; }
    </style>
  `;

  const iframeContent = a.content.includes('<style>') ? a.content : documentStyles + a.content;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0] flex flex-col" ref={containerRef}>
      {/* Top bar */}
      <header className="border-b border-[#C4A264]/15 px-6 py-2 flex items-center gap-3 bg-[#0a0a0a]">
        <Link to="/dashboard" className="text-[#F0EAE0]/70 hover:text-[#C4A264] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 flex items-center gap-3 ml-2">
           <span className="text-sm font-medium truncate max-w-[300px]">{a.title}</span>
           <ChevronDown className="w-4 h-4 text-[#F0EAE0]/40" />
        </div>

        <div className="flex items-center gap-1 bg-white/5 rounded-md p-1 mr-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#F0EAE0]/60"><Undo2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#F0EAE0]/60"><Redo2 className="w-4 h-4" /></Button>
        </div>

        <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center bg-[#1a1a1a] rounded-md border border-white/10 overflow-hidden cursor-pointer h-9 shadow-lg">
                    <div className="px-3 py-1 flex items-center gap-2 text-white/60 hover:text-white border-r border-white/10 transition-colors">
                        <History className="w-4 h-4" />
                    </div>
                    <div className="px-3 py-1 flex items-center gap-2 text-white/60 hover:text-white border-r border-white/10 transition-colors">
                        <Share2 className="w-4 h-4" />
                    </div>
                    <div className="px-3 py-1 flex items-center gap-2 text-[#F0EAE0] hover:bg-white/5 transition-colors">
                        <Download className="w-4 h-4" />
                        <span className="text-xs font-medium">Télécharger</span>
                        <ChevronRight className="w-3 h-3 opacity-50" />
                    </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-[#1a1a1a] border-white/15 p-1 text-[#F0EAE0] shadow-2xl" align="end">
                <div className="px-3 py-2 flex items-center justify-between text-white/40 border-b border-white/5 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold">Options d'export</span>
                    <History className="w-3.5 h-3.5" />
                </div>
                <button className="flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-white/5 rounded-sm transition-colors text-white/60 group">
                    <div className="flex items-center gap-3">
                        <Undo2 className="w-4 h-4 opacity-50" />
                        <span>Version précédente</span>
                    </div>
                </button>
                <button className="flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-white/5 rounded-sm transition-colors text-white/60 mb-1">
                    <div className="flex items-center gap-3">
                        <Redo2 className="w-4 h-4 opacity-50" />
                        <span>Version suivante</span>
                    </div>
                </button>
                <div className="h-px bg-white/5 mx-2 my-1" />
                {formats.map((f) => (
                  <button
                    key={f.ext}
                    onClick={() => exportAs(f)}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm hover:bg-[#C4A264]/20 hover:text-[#C4A264] rounded-sm transition-colors"
                  >
                    <FormatIcon ext={f.ext} />
                    <span>{f.label}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <Button size="sm" className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black h-9 font-medium px-4 ml-1">
              Enregistrer
            </Button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0f0f0f] relative">
        <main className="flex-1 overflow-auto p-8 flex justify-center">
            {isCsv ? (
                <div className="w-full max-w-6xl bg-white shadow-2xl rounded-sm overflow-hidden flex flex-col border border-black/10">
                    <SpreadsheetGrid csv={editedContent} onChange={setEditedContent} />
                </div>
            ) : (
                <div className="w-full max-w-4xl bg-white shadow-2xl min-h-[1056px] relative overflow-hidden rounded-sm">
                    <iframe
                    ref={iframeRef}
                    srcDoc={iframeContent}
                    title={a.title}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-none"
                    />
                </div>
            )}
        </main>

        {/* Selection AI Menu */}
        {selectionRect && (
            <div
                className="fixed z-50 flex items-center gap-1 bg-[#1a1a1a] border border-white/20 rounded-full px-2 py-1 shadow-2xl animate-in fade-in zoom-in duration-200"
                style={{
                    top: `${selectionRect.top}px`,
                    left: `${selectionRect.left}px`,
                    transform: 'translateX(-50%)'
                }}
            >
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-white hover:bg-white/10 rounded-full transition-colors font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-[#C4A264]" />
                            Demander à FORMA
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-[#1a1a1a] border-white/20 p-3 shadow-2xl">
                        <div className="space-y-3">
                            <div className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Intelligence Artificielle</div>
                            <Textarea
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                placeholder="Que voulez-vous faire de ce texte ?"
                                className="bg-white/5 border-white/10 text-white text-sm min-h-[80px]"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setSelectionRect(null)} className="text-white/60">Annuler</Button>
                                <Button size="sm" onClick={() => applyAi()} disabled={editing || !instruction.trim()} className="bg-[#C4A264] text-black">
                                    {editing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wand2 className="w-3 h-3 mr-2" />}
                                    Appliquer
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-4 bg-white/20 mx-1" />

                <button className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><Bold className="w-4 h-4" /></button>
                <button className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><Italic className="w-4 h-4" /></button>
                <button className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><Type className="w-4 h-4" /></button>
            </div>
        )}

        {/* Global AI Assistant Button (Discrete) */}
        <div className="fixed bottom-8 right-8 z-40">
             <Popover>
                <PopoverTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full bg-[#1a1a1a] border border-[#C4A264]/40 text-[#C4A264] shadow-2xl hover:scale-105 transition-transform">
                        <Sparkles className="h-6 w-6" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 bg-[#1a1a1a] border-white/20 p-4 shadow-2xl mr-4 mb-4" side="top" align="end">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#C4A264]" />
                            <span className="text-sm font-semibold tracking-wide">ASSISTANT FORMA</span>
                        </div>
                        <span className="text-[10px] bg-[#C4A264]/20 text-[#C4A264] px-1.5 py-0.5 rounded-full uppercase">Alpha</span>
                    </div>
                    <Textarea
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="Modifiez l'ensemble du document (ex: change la police, réorganise le plan, traduit en anglais...)"
                        className="bg-white/5 border-white/10 text-white text-sm min-h-[120px] mb-3"
                    />
                    <div className="flex flex-wrap gap-1.5 mb-4">
                         {["Tout traduire", "Plus formel", "Plus concis", "Ajouter un résumé"].map(s => (
                             <button
                                key={s}
                                onClick={() => applyAi(s)}
                                className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-[#C4A264]/40 transition-colors"
                             >
                                {s}
                             </button>
                         ))}
                    </div>
                    <Button onClick={() => applyAi()} disabled={editing || !instruction.trim()} className="w-full bg-[#C4A264] text-black">
                        {editing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                        Mettre à jour le document
                    </Button>
                </PopoverContent>
             </Popover>
        </div>
      </div>
    </div>
  );
}

function SpreadsheetGrid({ csv, onChange }: { csv: string, onChange: (val: string) => void }) {
    const rows = useMemo(() => {
        const lines = csv.split(/\r?\n/).filter(l => l.trim() || l === "");
        return lines.map(line => line.split(','));
    }, [csv]);

    const maxCols = useMemo(() => Math.max(...rows.map(r => r.length), 10), [rows]);
    const displayRows = useMemo(() => {
        const r = [...rows];
        while(r.length < 50) r.push(new Array(maxCols).fill(""));
        return r;
    }, [rows, maxCols]);

    const handleCellBlur = (rIdx: number, cIdx: number, val: string) => {
        const newRows = [...rows];
        if (!newRows[rIdx]) newRows[rIdx] = new Array(maxCols).fill("");
        newRows[rIdx][cIdx] = val;
        onChange(newRows.map(row => row.join(',')).join('\n'));
    };

    return (
        <div className="w-full h-full overflow-auto bg-[#f0f0f0]">
            <table className="border-collapse bg-white min-w-full font-sans text-sm">
                <thead>
                    <tr className="bg-[#f8f9fa] sticky top-0 z-10">
                        <th className="w-10 border border-[#e0e0e0] p-1 text-[10px] text-gray-400 font-normal"></th>
                        {new Array(maxCols).fill(0).map((_, i) => (
                            <th key={i} className="border border-[#e0e0e0] px-4 py-1.5 text-xs text-gray-500 font-medium min-w-[120px]">
                                {String.fromCharCode(65 + i)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#f8f9fa] transition-colors">
                            <td className="bg-[#f8f9fa] border border-[#e0e0e0] p-1 text-center text-[10px] text-gray-400 select-none">
                                {rIdx + 1}
                            </td>
                            {new Array(maxCols).fill(0).map((_, cIdx) => (
                                <td
                                    key={cIdx}
                                    contentEditable
                                    onBlur={(e) => handleCellBlur(rIdx, cIdx, e.currentTarget.innerText)}
                                    className="border border-[#e0e0e0] px-3 py-2 outline-none focus:ring-2 focus:ring-inset focus:ring-[#C4A264] focus:z-20 whitespace-nowrap overflow-hidden"
                                >
                                    {row[cIdx] || ""}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
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

function FormatIcon({ ext }: { ext: string }) {
  if (ext === "pdf") return <FileType className="w-4 h-4 text-red-500" />;
  if (ext === "png" || ext === "jpg") return <ImageIcon className="w-4 h-4 text-blue-500" />;
  if (ext === "csv" || ext === "xlsx") return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  if (ext === "docx") return <FileText className="w-4 h-4 text-blue-600" />;
  if (ext === "md") return <FileType className="w-4 h-4 text-white/70" />;
  return <FileText className="w-4 h-4" />;
}
