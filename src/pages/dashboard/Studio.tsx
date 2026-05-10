import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Download, Loader2, Save, Wand2, ChevronDown, ChevronRight,
  Sparkles, Plus, Trash2, Type, Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link2,
  Heading1, Heading2, Heading3, Table, Table2, Palette, Code, Eye,
  Copy, Check, X, FileSpreadsheet, FileText, FileImage,
} from "lucide-react";
import { saveAs } from "file-saver";

// Lazy load export libraries
const lazyJspdf = () => import("jspdf");
const lazyXlsx = () => import("xlsx");
const lazyDocx = () => import("docx").then(m => ({
  Document: m.Document,
  Packer: m.Packer,
  Paragraph: m.Paragraph,
  TextRun: m.TextRun,
  HeadingLevel: m.HeadingLevel,
});

type Artifact = {
  id: string;
  type: "slideshow" | "spreadsheet" | "dataviz" | "website" | "document" | "moodboard";
  title: string;
  content: string;
  mime_type: string;
};

export default function Studio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("artifacts").select("id, type, title, content, mime_type").eq("id", id).maybeSingle()
      .then(({ data }) => {
        setArtifact(data as Artifact | null);
        setEditedContent((data as Artifact | null)?.content ?? "");
        setLoading(false);
      });
  }, [id]);

  const persist = useCallback(async (content: string) => {
    if (!artifact) return;
    setSaving(true);
    const { error } = await supabase.from("artifacts").update({ content }).eq("id", artifact.id);
    setSaving(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { setArtifact({ ...artifact, content }); setEditedContent(content); }
  }, [artifact]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-[#F0EAE0]/60">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement…
      </div>
    );
  }
  if (!artifact) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-[#F0EAE0]/60">
        Livrable introuvable. <Link to="/dashboard/agent" className="ml-2 underline text-[#C4A264]">Retour</Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] text-[#F0EAE0]">
      {/* Header */}
      <StudioHeader
        artifact={artifact}
        onBack={() => navigate(-1)}
        saving={saving}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {artifact.type === "spreadsheet" && (
          <SpreadsheetStudio content={editedContent} onChange={setEditedContent} onSave={persist} artifact={artifact} />
        )}
        {artifact.type === "document" && (
          <DocumentStudio content={editedContent} onChange={setEditedContent} onSave={persist} artifact={artifact} />
        )}
        {(artifact.type === "slideshow" || artifact.type === "website" || artifact.type === "dataviz" || artifact.type === "moodboard") && (
          <HtmlStudio content={editedContent} onChange={setEditedContent} onSave={persist} artifact={artifact} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   HEADER
============================================================ */
function StudioHeader({ artifact, onBack, saving }: { artifact: Artifact; onBack: () => void; saving: boolean }) {
  const typeIcon = {
    spreadsheet: <FileSpreadsheet className="w-4 h-4" />,
    document: <FileText className="w-4 h-4" />,
    slideshow: <FileImage className="w-4 h-4" />,
    website: <FileImage className="w-4 h-4" />,
    dataviz: <FileImage className="w-4 h-4" />,
    moodboard: <FileImage className="w-4 h-4" />,
  }[artifact.type as keyof typeof typeIcon] || <FileText className="w-4 h-4" />;

  return (
    <header className="h-14 border-b border-[#C4A264]/15 px-4 flex items-center gap-3 bg-[#0a0a0a] shrink-0">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-[#F0EAE0]/70 hover:text-[#F0EAE0]">
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <div className="flex items-center gap-2 text-[#C4A264]">
        {typeIcon}
        <span className="text-xs uppercase tracking-wider">{artifact.type}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{artifact.title}</div>
      </div>
      {saving && (
        <span className="text-xs text-[#F0EAE0]/40 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Enregistrement...
        </span>
      )}
    </header>
  );
}

/* ============================================================
   DOCUMENT STUDIO - ChatGPT level
============================================================ */
function DocumentStudio({ artifact, content, onChange, onSave }: {
  artifact: Artifact;
  content: string;
  onChange: (s: string) => void;
  onSave: (c: string) => Promise<void>;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);

  // Initialize content once
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && editorRef.current) {
      editorRef.current.innerHTML = content ?? "";
      setInitialized(true);
    }
  }, []);

  // Word count
  useEffect(() => {
    const text = editorRef.current?.innerText || "";
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, [content]);

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      const text = editorRef.current.innerText || "";
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    }
  }

  async function runAi() {
    if (!aiPrompt.trim()) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-edit`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artifactId: artifact.id, instruction: aiPrompt.trim(), selection: null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "Erreur");
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
        onChange(data.content);
        await onSave(data.content);
      }
      setAiPrompt("");
      toast({ title: "Document mis à jour" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally { setBusy(false); }
  }

  // Export functions
  async function exportDocx() {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await lazyDocx();
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: artifact.title, bold: true, size: 48 })],
          }),
          ...parseHtmlToDocx(editorRef.current?.innerHTML || ""),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${artifact.title.replace(/[^\w]/g, "_")}.docx`);
  }

  async function exportPdf() {
    const jsPDF = (await lazyJspdf()).default;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text(artifact.title, 40, 50);
    pdf.setFont("times", "normal");
    pdf.setFontSize(12);
    const text = editorRef.current?.innerText || "";
    const lines = pdf.splitTextToSize(text, 500);
    let y = 80;
    lines.forEach((line: string) => {
      if (y > 780) { pdf.addPage(); y = 40; }
      pdf.text(line, 40, y);
      y += 16;
    });
    pdf.save(`${artifact.title.replace(/[^\w]/g, "_")}.pdf`);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-[#C4A264]/15 bg-[#0a0a0a]">
        <div className="flex items-center gap-1 px-3 py-2">
          <ToolbarButton icon={<Bold className="w-4 h-4" />} title="Gras (Ctrl+B)" onClick={() => document.execCommand("bold")} />
          <ToolbarButton icon={<Italic className="w-4 h-4" />} title="Italique (Ctrl+I)" onClick={() => document.execCommand("italic")} />
          <ToolbarButton icon={<UnderlineIcon className="w-4 h-4" />} title="Souligné (Ctrl+U)" onClick={() => document.execCommand("underline")} />
          <div className="w-px h-5 bg-[#C4A264]/20 mx-1" />
          <ToolbarButton icon={<Heading1 className="w-4 h-4" />} title="Titre 1" onClick={() => document.execCommand("formatBlock", "h1")} />
          <ToolbarButton icon={<Heading2 className="w-4 h-4" />} title="Titre 2" onClick={() => document.execCommand("formatBlock", "h2")} />
          <ToolbarButton icon={<Heading3 className="w-4 h-4" />} title="Titre 3" onClick={() => document.execCommand("formatBlock", "h3")} />
          <div className="w-px h-5 bg-[#C4A264]/20 mx-1" />
          <ToolbarButton icon={<List className="w-4 h-4" />} title="Liste à puces" onClick={() => document.execCommand("insertUnorderedList")} />
          <ToolbarButton icon={<ListOrdered className="w-4 h-4" />} title="Liste numérotée" onClick={() => document.execCommand("insertOrderedList")} />
          <div className="w-px h-5 bg-[#C4A264]/20 mx-1" />
          <ToolbarButton icon={<AlignLeft className="w-4 h-4" />} title="Aligner à gauche" onClick={() => document.execCommand("justifyLeft")} />
          <ToolbarButton icon={<AlignCenter className="w-4 h-4" />} title="Centrer" onClick={() => document.execCommand("justifyCenter")} />
          <ToolbarButton icon={<AlignRight className="w-4 h-4" />} title="Aligner à droite" onClick={() => document.execCommand("justifyRight")} />
          <div className="flex-1" />
          <span className="text-xs text-[#F0EAE0]/40">{wordCount} mots</span>
        </div>
      </div>

      {/* AI Input */}
      <div className="shrink-0 px-4 py-2 bg-[#0a0a0a] border-b border-[#C4A264]/15">
        <div className="flex items-center gap-2 max-w-2xl">
          <Sparkles className="w-4 h-4 text-[#C4A264]" />
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runAi(); } }}
            placeholder="Demander à l'IA de modifier le document..."
            className="flex-1 bg-[#151515] border border-[#C4A264]/20 rounded-lg px-3 py-2 text-sm text-[#F0EAE0] placeholder:text-[#F0EAE0]/30 focus:border-[#C4A264]/50 outline-none"
          />
          <Button size="sm" disabled={busy || !aiPrompt.trim()} onClick={runAi} className="bg-[#C4A264] text-black">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-[#111]">
        <div className="max-w-3xl mx-auto py-12 px-8">
          <h1 className="text-3xl font-bold text-[#F0EAE0] mb-8 font-serif">{artifact.title}</h1>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={() => onSave(editorRef.current?.innerHTML || "")}
            className="prose-editor min-h-[500px] outline-none text-[#d0d0d0] text-base leading-relaxed"
            style={{ fontFamily: "Georgia, serif" }}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 px-4 py-3 bg-[#0a0a0a] border-t border-[#C4A264]/15 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onSave(editorRef.current?.innerHTML || "")} className="border-[#C4A264]/30 text-[#F0EAE0]">
          <Save className="w-4 h-4 mr-2" /> Sauvegarder
        </Button>
        <DropdownMenu
          trigger={<Button size="sm" className="bg-[#C4A264] text-black"><Download className="w-4 h-4 mr-2" />Exporter</Button>}
          items={[
            { label: "Word (.docx)", onClick: exportDocx },
            { label: "PDF (.pdf)", onClick: exportPdf },
          ]}
        />
      </div>

      <style>{`
        .prose-editor h1 { font-size: 1.75rem; font-weight: 700; margin: 1.5em 0 0.5em; color: #fff; }
        .prose-editor h2 { font-size: 1.4rem; font-weight: 600; margin: 1.3em 0 0.4em; color: #fff; }
        .prose-editor h3 { font-size: 1.15rem; font-weight: 600; margin: 1.1em 0 0.3em; color: #eee; }
        .prose-editor p { margin: 0 0 1em; }
        .prose-editor ul, .prose-editor ol { padding-left: 1.5em; margin: 0 0 1em; }
        .prose-editor li { margin: 0.3em 0; }
        .prose-editor strong { font-weight: 700; color: #fff; }
        .prose-editor em { font-style: italic; }
        .prose-editor a { color: #C4A264; text-decoration: underline; }
        .prose-editor blockquote { border-left: 3px solid #C4A264; padding-left: 1em; margin: 1em 0; color: #888; }
      `}</style>
    </div>
  );
}

function ToolbarButton({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded hover:bg-[#C4A264]/10 text-[#F0EAE0]/60 hover:text-[#C4A264] transition-colors"
    >
      {icon}
    </button>
  );
}

function DropdownMenu({ trigger, items }: { trigger: React.ReactNode; items: { label: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 z-20 bg-[#1a1a1a] border border-[#C4A264]/20 rounded-lg shadow-xl py-1 min-w-[160px]">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => { item.onClick(); setOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-[#F0EAE0]/80 hover:bg-[#C4A264]/10 hover:text-[#C4A264]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function parseHtmlToDocx(html: string): Paragraph[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const paragraphs: Paragraph[] = [];

  doc.querySelectorAll("p, h1, h2, h3, li").forEach((el) => {
    const text = el.textContent || "";
    const tag = el.tagName.toLowerCase();
    let heading: HeadingLevel | undefined;
    if (tag === "h1") heading = HeadingLevel.HEADING_1;
    else if (tag === "h2") heading = HeadingLevel.HEADING_2;
    else if (tag === "h3") heading = HeadingLevel.HEADING_3;

    paragraphs.push(new Paragraph({
      heading,
      children: [new TextRun({ text, bold: el.querySelector("strong, b") !== null, italics: el.querySelector("em, i") !== null })],
    }));
  });

  return paragraphs.length ? paragraphs : [new Paragraph({ children: [new TextRun({ text: "" })] })];
}

/* ============================================================
   SPREADSHEET STUDIO - Excel-like
============================================================ */
function SpreadsheetStudio({ artifact, content, onChange, onSave }: {
  artifact: Artifact;
  content: string;
  onChange: (s: string) => void;
  onSave: (c: string) => Promise<void>;
}) {
  const [grid, setGrid] = useState<string[][]>(() => parseCsv(content));
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setGrid(parseCsv(content)); }, [content]);

  // Sync formula bar with selection
  useEffect(() => {
    if (selectedCell) {
      const value = grid[selectedCell.r]?.[selectedCell.c] || "";
      setFormulaBarValue(value);
    }
  }, [selectedCell, grid]);

  function updateCell(r: number, c: number, value: string) {
    const newGrid = grid.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? value : cell) : row);
    setGrid(newGrid);
    onChange(toCsv(newGrid));
  }

  function handleFormulaBarChange(value: string) {
    setFormulaBarValue(value);
    if (selectedCell) {
      updateCell(selectedCell.r, selectedCell.c, value);
    }
  }

  function addRow() {
    const newRow = new Array(grid[0]?.length || 3).fill("");
    setGrid([...grid, newRow]);
  }

  function addCol() {
    setGrid(grid.map(row => [...row, ""]));
  }

  async function runAi() {
    if (!aiPrompt.trim()) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-edit`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artifactId: artifact.id, instruction: aiPrompt.trim(), selection: null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "Erreur");
      const newGrid = parseCsv(data.content);
      setGrid(newGrid);
      onChange(toCsv(newGrid));
      await onSave(toCsv(newGrid));
      setAiPrompt("");
      toast({ title: "Tableur mis à jour" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function exportXlsx() {
    const XLSX = await lazyXlsx();
    const ws = XLSX.utils.aoa_to_sheet(grid);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Données");
    XLSX.writeFile(wb, `${artifact.title.replace(/[^\w]/g, "_")}.xlsx`);
  }

  const cols = Math.max(1, ...grid.map(r => r.length));

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border-b border-[#C4A264]/15">
        <Button size="sm" variant="ghost" onClick={addRow} className="text-[#F0EAE0]/70 hover:text-[#C4A264]">
          <Plus className="w-4 h-4 mr-1" /> Ligne
        </Button>
        <Button size="sm" variant="ghost" onClick={addCol} className="text-[#F0EAE0]/70 hover:text-[#C4A264]">
          <Plus className="w-4 h-4 mr-1" /> Colonne
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 max-w-md">
          <Sparkles className="w-4 h-4 text-[#C4A264]" />
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runAi(); }}
            placeholder="Demander à l'IA..."
            className="flex-1 bg-[#151515] border border-[#C4A264]/20 rounded px-2 py-1 text-sm text-[#F0EAE0] placeholder:text-[#F0EAE0]/30"
          />
          <Button size="sm" disabled={busy} onClick={runAi} className="bg-[#C4A264] text-black h-7">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          </Button>
        </div>
        <Button size="sm" onClick={() => onSave(toCsv(grid))} className="bg-[#C4A264] text-black">
          <Save className="w-4 h-4 mr-1" /> Sauvegarder
        </Button>
        <DropdownMenu
          trigger={<Button size="sm" variant="outline" className="border-[#C4A264]/30"><Download className="w-4 h-4" /></Button>}
          items={[{ label: "Excel (.xlsx)", onClick: exportXlsx }]}
        />
      </div>

      {/* Formula Bar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border-b border-[#C4A264]/15">
        <div className="w-20 text-xs text-[#F0EAE0]/50 font-mono">
          {selectedCell ? `${colLetter(selectedCell.c)}${selectedCell.r + 1}` : ""}
        </div>
        <div className="flex-1">
          <input
            value={formulaBarValue}
            onChange={(e) => handleFormulaBarChange(e.target.value)}
            className="w-full bg-[#151515] border border-[#C4A264]/20 rounded px-2 py-1 text-sm text-[#F0EAE0] font-mono"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-[#151515]">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-10 h-8 bg-[#1a1a1a] border border-[#333] sticky top-0 left-0 z-20" />
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className="min-w-[120px] h-8 bg-[#1a1a1a] border border-[#333] text-xs text-[#888] font-medium sticky top-0">
                  {colLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                <td className="w-10 h-8 bg-[#1a1a1a] border border-[#333] text-xs text-[#888] text-center">
                  {r + 1}
                </td>
                {Array.from({ length: cols }).map((_, c) => {
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  return (
                    <td
                      key={c}
                      onClick={() => setSelectedCell({ r, c })}
                      className={`border border-[#333] p-0 ${isSelected ? "ring-2 ring-[#C4A264] ring-inset" : ""}`}
                    >
                      <input
                        value={row[c] || ""}
                        onChange={(e) => updateCell(r, c, e.target.value)}
                        className="w-full h-8 px-2 text-sm bg-transparent text-[#d0d0d0] outline-none font-mono"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   HTML STUDIO - Code + Preview
============================================================ */
function HtmlStudio({ artifact, content, onChange, onSave }: {
  artifact: Artifact;
  content: string;
  onChange: (s: string) => void;
  onSave: (c: string) => Promise<void>;
}) {
  const [code, setCode] = useState(content);
  const [view, setView] = useState<"split" | "code" | "preview">("split");
  const [aiPrompt, setAiPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Update preview when code changes
    if (iframeRef.current && iframeRef.current.srcdoc !== code) {
      iframeRef.current.srcdoc = code;
    }
  }, [code]);

  async function runAi() {
    if (!aiPrompt.trim()) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-edit`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artifactId: artifact.id, instruction: aiPrompt.trim(), selection: null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? "Erreur");
      setCode(data.content);
      onChange(data.content);
      await onSave(data.content);
      setAiPrompt("");
      toast({ title: "Mis à jour" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally { setBusy(false); }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border-b border-[#C4A264]/15">
        {/* View Toggle */}
        <div className="flex items-center bg-[#151515] rounded-lg p-1">
          <button
            onClick={() => setView("split")}
            className={`px-3 py-1 text-xs rounded ${view === "split" ? "bg-[#C4A264] text-black" : "text-[#F0EAE0]/60"}`}
          >
            Split
          </button>
          <button
            onClick={() => setView("code")}
            className={`px-3 py-1 text-xs rounded ${view === "code" ? "bg-[#C4A264] text-black" : "text-[#F0EAE0]/60"}`}
          >
            Code
          </button>
          <button
            onClick={() => setView("preview")}
            className={`px-3 py-1 text-xs rounded ${view === "preview" ? "bg-[#C4A264] text-black" : "text-[#F0EAE0]/60"}`}
          >
            Aperçu
          </button>
        </div>

        <div className="flex-1" />

        {/* AI Input */}
        <div className="flex items-center gap-2 max-w-md">
          <Sparkles className="w-4 h-4 text-[#C4A264]" />
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runAi(); }}
            placeholder="Demander à l'IA de modifier..."
            className="flex-1 bg-[#151515] border border-[#C4A264]/20 rounded px-2 py-1 text-sm text-[#F0EAE0] placeholder:text-[#F0EAE0]/30"
          />
          <Button size="sm" disabled={busy} onClick={runAi} className="bg-[#C4A264] text-black h-7">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          </Button>
        </div>

        <Button size="sm" onClick={() => onSave(code)} className="bg-[#C4A264] text-black">
          <Save className="w-4 h-4 mr-1" /> Sauvegarder
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {view !== "preview" && (
          <div className={`${view === "split" ? "w-1/2" : "w-full"} flex flex-col border-r border-[#C4A264]/15`}>
            <div className="shrink-0 px-3 py-1 bg-[#0a0a0a] border-b border-[#C4A264]/15 text-xs text-[#888]">
              HTML / CSS / JS
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-[#0d0d0d] text-[#d0d0d0] p-4 font-mono text-sm resize-none outline-none"
              spellCheck={false}
            />
          </div>
        )}

        {view !== "code" && (
          <div className={`${view === "split" ? "w-1/2" : "w-full"} flex flex-col`}>
            <div className="shrink-0 px-3 py-1 bg-[#0a0a0a] border-b border-[#C4A264]/15 text-xs text-[#888]">
              Aperçu
            </div>
            <iframe
              ref={iframeRef}
              srcDoc={code}
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
              className="flex-1 bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */
function colLetter(n: number): string {
  let s = "";
  n = n + 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function parseCsv(text: string): string[][] {
  if (!text?.trim()) return [["", "", ""], ["", "", ""], ["", "", ""]];
  const rows: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip carriage return */ } else cur += c;
    }
  }
  row.push(cur); if (row.some(v => v)) rows.push(row);
  return rows;
}

function toCsv(g: string[][]) {
  return g.map(r => r.map(c => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(",")).join("\n");
}